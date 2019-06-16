import * as Parser from 'web-tree-sitter'

export type ColorFunction = (x: Parser.SyntaxNode, visibleRanges: {start: number, end: number}[]) => [Parser.SyntaxNode, string][]

export function colorGo(root: Parser.SyntaxNode, visibleRanges: {start: number, end: number}[]) {
	// Guess package names based on paths
	var packages: {[id: string]: boolean} = {}
	function scanImport(x: Parser.SyntaxNode) {
		if (x.type == 'import_spec') {
			let str = x.firstChild!.text
			if (str.startsWith('"')) {
				str = str.substring(1, str.length - 1)
			}
			const parts = str.split('/')
			const last = parts[parts.length - 1]
			packages[last] = true
		}
		for (const child of x.children) {
			scanImport(child)
		}
	}
	// Keep track of local vars that shadow packages
	const allScopes: Scope[] = []
	class Scope {
		private locals = new Map<string, {modified: boolean, references: Parser.SyntaxNode[]}>()
		private parent: Scope|null
	
		constructor(parent: Scope|null) {
			this.parent = parent
			allScopes.push(this)
		}

		declareLocal(id: string) {
			if (this.isRoot()) return
			if (this.locals.has(id)) {
				this.locals.get(id)!.modified = true
			} else {
				this.locals.set(id, {modified: false, references: []})
			}
		}

		modifyLocal(id: string) {
			if (this.isRoot()) return
			if (this.locals.has(id)) this.locals.get(id)!.modified = true
			else if (this.parent) this.parent.modifyLocal(id)
		}

		referenceLocal(x: Parser.SyntaxNode) {
			if (this.isRoot()) return
			const id = x.text
			if (this.locals.has(id)) this.locals.get(id)!.references.push(x)
			else if (this.parent) this.parent.referenceLocal(x)
		}
	
		isLocal(id: string): boolean {
			if (this.locals.has(id)) return true
			if (this.parent) return this.parent.isLocal(id)
			return false
		}

		isUnknown(id: string): boolean {
			if (packages[id]) return false
			if (this.locals.has(id)) return false
			if (this.parent) return this.parent.isUnknown(id)
			return true
		}

		isModified(id: string): boolean {
			if (this.locals.has(id)) return this.locals.get(id)!.modified
			if (this.parent) return this.parent.isModified(id)
			return false
		}

		modifiedLocals(): Parser.SyntaxNode[] {
			const all = []
			for (const {modified, references} of this.locals.values()) {
				if (modified) {
					all.push(...references)
				}
			}
			return all
		}

		isPackage(id: string): boolean {
			return packages[id] && !this.isLocal(id)
		}

		isRoot(): boolean {
			return this.parent == null
		}
	}
	const colors: [Parser.SyntaxNode, string][] = []
	const rootScope = new Scope(null)
	function scanSourceFile() {
		for (const top of root.namedChildren) {
			scanTopLevelDeclaration(top)
		}
	}
	function scanTopLevelDeclaration(x: Parser.SyntaxNode) {
		switch (x.type) {
			case 'import_declaration':
				scanImport(x)
				break
			case 'function_declaration':
			case 'method_declaration':
				if (!isVisible(x, visibleRanges)) return
				scanFunctionDeclaration(x)
				break
			case 'const_declaration':
			case 'var_declaration':
				if (!isVisible(x, visibleRanges)) return
				scanVarDeclaration(x)
				break
			case 'type_declaration':
				if (!isVisible(x, visibleRanges)) return
				scanTypeDeclaration(x)
				break
		}
	}
	function scanFunctionDeclaration(x: Parser.SyntaxNode) {
		const scope = new Scope(rootScope)
		for (const child of x.namedChildren) {
			switch (child.type) {
				case 'identifier':
					if (isVisible(child, visibleRanges)) {
						colors.push([child, 'entity.name.function'])
					}
					break
				default:
					scanExpr(child, scope)
			}
		}
	}
	function scanVarDeclaration(x: Parser.SyntaxNode) {
		for (const varSpec of x.namedChildren) {
			for (const child of varSpec.namedChildren) {
				switch (child.type) {
					case 'identifier':
						if (isVisible(child, visibleRanges)) {
							colors.push([child, 'variable'])
						}
						break
					default:
						scanExpr(child, rootScope)
				}
			}
		}
	}
	function scanTypeDeclaration(x: Parser.SyntaxNode) {
		for (const child of x.namedChildren) {
			scanExpr(child, rootScope)
		}
	}
	function scanExpr(x: Parser.SyntaxNode, scope: Scope) {
		switch (x.type) {
			case 'func_literal':
			case 'block':
			case 'expression_case_clause':
			case 'type_case_clause':
			case 'for_statement':
			case 'if_statement':
			case 'type_switch_statement':
				scope = new Scope(scope)
				break
			case 'parameter_declaration':
			case 'var_spec':
			case 'const_spec':
				for (const id of x.namedChildren) {
					if (id.type == 'identifier') {
						scope.declareLocal(id.text)
					}
				}
				break
			case 'short_var_declaration': 
			case 'range_clause':
				for (const id of x.firstChild!.namedChildren) {
					if (id.type == 'identifier') {
						scope.declareLocal(id.text)
					}
				}
				break
			case 'type_switch_guard':
				if (x.firstChild!.type == 'expression_list') {
					for (const id of x.firstChild!.namedChildren) {
						scope.declareLocal(id.text)
					}
				}
				break
			case 'inc_statement':
			case 'dec_statement':
				scope.modifyLocal(x.firstChild!.text)
				break
			case 'assignment_statement':
				for (const id of x.firstChild!.namedChildren) {
					if (id.type == 'identifier') {
						scope.modifyLocal(id.text)
					}
				}
				break
			case 'call_expression':
				scanCall(x.firstChild!, scope)
				scanExpr(x.lastChild!, scope)
				return
			case 'identifier':
				scope.referenceLocal(x)
				if (isVisible(x, visibleRanges) && scope.isUnknown(x.text)) {
					colors.push([x, 'variable'])
				}
				return
			case 'selector_expression':
				if (isVisible(x, visibleRanges) && scope.isPackage(x.firstChild!.text)) {
					colors.push([x.lastChild!, 'variable'])
				}
				scanExpr(x.firstChild!, scope)
				scanExpr(x.lastChild!, scope)
				return
			case 'type_identifier':
				if (isVisible(x, visibleRanges)) {
					colors.push([x, 'entity.name.type'])
				}
				return
		}
		for (const child of x.namedChildren) {
			scanExpr(child, scope)
		}
	}
	function scanCall(x: Parser.SyntaxNode, scope: Scope) {
		switch (x.type) {
			case 'identifier':
				if (isVisible(x, visibleRanges) && scope.isUnknown(x.text)) {
					colors.push([x, 'entity.name.function'])
				}
				scope.referenceLocal(x)
				return
			case 'selector_expression':
				if (isVisible(x, visibleRanges) && scope.isPackage(x.firstChild!.text)) {
					colors.push([x.lastChild!, 'entity.name.function'])
				}
				scanExpr(x.firstChild!, scope)
				scanExpr(x.lastChild!, scope)
				return
			case 'unary_expression':
				scanCall(x.firstChild!, scope)
				return
			default:
				scanExpr(x, scope)
		}
	}
	scanSourceFile()
	for (const scope of allScopes) {
		for (const local of scope.modifiedLocals()) {
			colors.push([local, 'markup.underline'])
		}
	}

	return colors
}

export function colorTypescript(x: Parser.SyntaxNode, visibleRanges: {start: number, end: number}[]) {
	const colors: [Parser.SyntaxNode, string][] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, visibleRanges)) return
		if (x.type == 'identifier' && x.parent && x.parent.type == 'function') {
			colors.push([x, 'entity.name.function'])
		} else if (x.type == 'type_identifier' || x.type == 'predefined_type') {
			colors.push([x, 'entity.name.type'])
		} else if (x.type == 'property_identifier') {
			colors.push([x, 'variable'])
		} else if (x.type == 'method_definition' && ['get', 'set'].includes(x.firstChild!.text)) {
			colors.push([x.firstChild!, 'keyword'])
		}
		for (const child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return colors
}

export function colorRuby(x: Parser.SyntaxNode, visibleRanges: {start: number, end: number}[]) {
	const colors: [Parser.SyntaxNode, string][] = []
	const controlKeywords = ['while', 'until', 'if', 'unless', 'for', 'begin', 'elsif', 'else', 'ensure', 'when', 'case', 'do_block']
	const classKeywords = ['include', 'prepend', 'extend', 'private', 'protected', 'public', 'attr_reader', 'attr_writer', 'attr_accessor', 'attr', 'private_class_method', 'public_class_method']
	const moduleKeywords = ['module_function', ...classKeywords]
	function isChildOf(x: Parser.SyntaxNode, parent: string) {
		// class Foo; bar; end
		if (x.parent && x.parent.type == parent) {
			return true
		}
		// class Foo; bar :thing; end
		if (x.parent && x.parent.type == 'method_call' && x.parent.parent && x.parent.parent.type == parent) {
			return true
		}
		return false
	}
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, visibleRanges)) return
		switch (x.type) {
			case 'method':
				colors.push([x.children[1]!, 'entity.name.function'])
				break
			case 'singleton_method':
				colors.push([x.children[3], 'entity.name.function'])
				break
			case 'instance_variable':
			case 'class_variable':
			case 'global_variable':
				colors.push([x, 'variable'])
				break
			case 'end':
				if (controlKeywords.includes(x.parent!.type)) {
					colors.push([x, 'keyword.control'])
				} else {
					colors.push([x, 'keyword'])
				}
				break
			case 'constant':
				colors.push([x, 'entity.name.type'])
				break
			case 'symbol':
				colors.push([x, 'constant.language'])
				break
			case 'identifier':
				if (classKeywords.includes(x.text) && isChildOf(x, 'class')) {
					colors.push([x, 'keyword'])
				} else if (moduleKeywords.includes(x.text) && isChildOf(x, 'module')) {
					colors.push([x, 'keyword'])
				} else if (x.parent!.type == 'method_call' && x.parent!.firstChild!.equals(x)) {
					colors.push([x, 'entity.name.function'])
				} else if (x.parent!.type == 'call' && x.parent!.lastChild!.equals(x)) {
					colors.push([x, 'entity.name.function'])
				}
				break
		}
		for (const child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return colors
}

export function colorRust(x: Parser.SyntaxNode, visibleRanges: {start: number, end: number}[]) {
	const colors: [Parser.SyntaxNode, string][] = []
	function looksLikeType(id: string) {
		if (id.length == 0) return false
		if (id[0] != id[0].toUpperCase()) return false
		for (const c of id) {
			if (c.toLowerCase() == c) return true
		}
		return false
	}
	function scanUse(x: Parser.SyntaxNode) {
		if (x.type == 'identifier' && looksLikeType(x.text)) {
			colors.push([x, 'entity.name.type'])
		}
		for (const child of x.children) {
			scanUse(child)
		}
	}
	function scanQualifier(x: Parser.SyntaxNode) {
		if (x.type == 'identifier' && looksLikeType(x.text)) {
			colors.push([x, 'entity.name.type'])
		}
		for (const child of x.children) {
			scanQualifier(child)
		}
	}
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, visibleRanges)) return
		switch (x.type) {
			case 'scoped_identifier':
				for (const child of x.children) {
					if (!child.equals(x.lastChild!)) {
						scanQualifier(child)
					}
				}
				return
			case 'identifier':
				if (x.parent!.type == 'function_item') {
					if (x.parent!.parent!.type == 'declaration_list') {
						colors.push([x, 'variable'])
					} else {
						colors.push([x, 'entity.name.function'])
					}
				} else if (x.parent!.type == 'scoped_identifier' && x.parent!.parent!.type == 'function_declarator') {
					colors.push([x, 'entity.name.function'])
				}
				return
			case 'use_declaration':
				scanUse(x)
				return
			case 'type_identifier':
			case 'primitive_type':
				colors.push([x, 'entity.name.type'])
				break
			case 'field_identifier':
				colors.push([x, 'variable'])
				break
		}
		for (const child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return colors
}

export function colorCpp(x: Parser.SyntaxNode, visibleRanges: {start: number, end: number}[]) {
	const colors: [Parser.SyntaxNode, string][] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, visibleRanges)) return
		if (x.type == 'identifier' && x.parent && x.parent.type == 'function_declarator') {
			colors.push([x, 'entity.name.function'])
		} else if (x.type == 'identifier' && x.parent && x.parent.type == 'scoped_identifier' && x.parent.parent && x.parent.parent.type == 'function_declarator') {
			colors.push([x, 'entity.name.function'])
		} else if (x.type == 'type_identifier') {
			colors.push([x, 'entity.name.type'])
		} else if (x.type == 'field_identifier') {
			colors.push([x, 'variable'])
		}
		for (const child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return colors
}

function isVisible(x: Parser.SyntaxNode, visibleRanges: {start: number, end: number}[]) {
	for (const {start, end} of visibleRanges) {
		const overlap = x.startPosition.row <= end+1 && start-1 <= x.endPosition.row
		if (overlap) return true
	}
	return false
}