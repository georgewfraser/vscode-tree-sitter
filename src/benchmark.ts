// import extension = require('./extension')
import Parser = require('web-tree-sitter')
import fs = require('fs')

benchmarkGo()

async function benchmarkGo() {
    await Parser.init()
    const parser = new Parser()
    const wasm = 'parsers/tree-sitter-go.wasm'
    const lang = await Parser.Language.load(wasm)
    parser.setLanguage(lang)
    const text = fs.readFileSync('examples/go/proc.go', {encoding: 'utf-8'})
    const tree = parser.parse(text)
    for (let i = 0; i < 10; i++) {
        console.time('colorGo')
        colorGo(tree.rootNode)
        console.timeEnd('colorGo')
    }
    for (let i = 0; i < 10; i++) {
        console.time('colorGoSwitch')
        colorGoSwitch(tree.rootNode)
        console.timeEnd('colorGoSwitch')
    }
}

function colorGo(root: Parser.SyntaxNode) {
	// Guess package names based on paths
	var packages: {[id: string]: boolean} = {}
	function scanImport(x: Parser.SyntaxNode) {
		if (x.type == 'import_spec') {
			const str = x.firstChild!.text
			const full = str.substring(1, str.length - 1)
			const parts = full.split('/')
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
			this.locals.set(id, {modified: false, references: []})
		}

		modifyLocal(id: string) {
			if (this.locals.has(id)) this.locals.get(id)!.modified = true
			else if (this.parent != null) this.parent.modifyLocal(id)
		}

		referenceLocal(x: Parser.SyntaxNode) {
			const id = x.text
			if (this.locals.has(id)) this.locals.get(id)!.references.push(x)
			else if (this.parent != null) this.parent.referenceLocal(x)
		}
	
		isLocal(id: string): boolean {
			if (this.locals.has(id)) return true
			if (this.parent != null) return this.parent.isLocal(id)
			return false
		}

		isModified(id: string): boolean {
			if (this.locals.has(id)) return this.locals.get(id)!.modified
			if (this.parent != null) return this.parent.isModified(id)
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
	function scanRoot(root: Parser.SyntaxNode) {
		const scope = new Scope(null)
		for (const decl of root.children) {
			if (decl.type == 'import_declaration') {
				scanImport(decl)
			}
			scan(decl, scope)
		}
	}
	function scan(x: Parser.SyntaxNode, scope: Scope) {
		scope = updateScope(x, scope)
		addColors(x, scope)
		scanChildren(x, scope)
	}
	function addColors(x: Parser.SyntaxNode, scope: Scope) {
		// Add colors
		if (x.type == 'identifier' && x.parent!.type == 'function_declaration') {
			// func f() { ... }
			colors.push([x, 'entity.name.function'])
		} else if (x.type == 'type_identifier') {
			// x: type
			colors.push([x, 'entity.name.type'])
		} else if (x.type == 'field_identifier') {
			// pkg.member
			const isPackage = x.parent!.type == 'selector_expression' && scope.isPackage(x.parent!.firstChild!.text)
			// obj.member
			if (!isPackage) colors.push([x, 'variable'])
		}
	}
	function updateScope(x: Parser.SyntaxNode, scope: Scope) {
		// Add locals to scope
		if (!scope.isRoot() && ['parameter_declaration', 'var_spec', 'const_spec'].includes(x.type)) {
			for (const id of x.children) {
				if (id.type == 'identifier') {
					scope.declareLocal(id.text)
				}
			}
		} else if (!scope.isRoot() && ['short_var_declaration', 'range_clause'].includes(x.type)) {
			for (const id of x.firstChild!.children) {
				if (id.type == 'identifier') {
					scope.declareLocal(id.text)
				}
			}
		}
		// Keep track of whether locals are modified or not
		if (!scope.isRoot() && ['inc_statement', 'dec_statement'].includes(x.type)) {
			scope.modifyLocal(x.firstChild!.text)
		} else if (!scope.isRoot() && x.type == 'assignment_statement') {
			for (const id of x.firstChild!.children) {
				if (id.type == 'identifier') {
					scope.modifyLocal(id.text)
				}
			}
		} else if (!scope.isRoot() && x.type == 'identifier') {
			scope.referenceLocal(x)
		}
		// Define new scope
		if (['function_declaration', 'method_declaration', 'func_literal', 'block'].includes(x.type)) {
			return new Scope(scope)
		}
		return scope
	}
	function scanChildren(x: Parser.SyntaxNode, scope: Scope) {
		for (const child of x.children) {
			scan(child, scope)
		}
	}
	scanRoot(root)
	for (const scope of allScopes) {
		for (const local of scope.modifiedLocals()) {
			colors.push([local, 'markup.underline'])
		}
	}

	return colors
}

function colorGoSwitch(root: Parser.SyntaxNode) {
	// Guess package names based on paths
	var packages: {[id: string]: boolean} = {}
	function scanImport(x: Parser.SyntaxNode) {
		if (x.type == 'import_spec') {
			const str = x.firstChild!.text
			const full = str.substring(1, str.length - 1)
			const parts = full.split('/')
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
			this.locals.set(id, {modified: false, references: []})
		}

		modifyLocal(id: string) {
			if (this.locals.has(id)) this.locals.get(id)!.modified = true
			else if (this.parent != null) this.parent.modifyLocal(id)
		}

		referenceLocal(x: Parser.SyntaxNode) {
			const id = x.text
			if (this.locals.has(id)) this.locals.get(id)!.references.push(x)
			else if (this.parent != null) this.parent.referenceLocal(x)
		}
	
		isLocal(id: string): boolean {
			if (this.locals.has(id)) return true
			if (this.parent != null) return this.parent.isLocal(id)
			return false
		}

		isModified(id: string): boolean {
			if (this.locals.has(id)) return this.locals.get(id)!.modified
			if (this.parent != null) return this.parent.isModified(id)
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
	function scanRoot(root: Parser.SyntaxNode) {
		const scope = new Scope(null)
		for (const decl of root.children) {
			scan(decl, scope)
		}
	}
	function scan(x: Parser.SyntaxNode, scope: Scope) {
		const visible = true
		switch (x.type) {
			case 'import_declaration':
				scanImport(x)
			case 'parameter_declaration':
			case 'var_spec':
			case 'const_spec':
				if (!scope.isRoot()) {
					for (const id of x.children) {
						if (id.type == 'identifier') {
							scope.declareLocal(id.text)
						}
					}
				}
				break
			case 'inc_statement':
			case 'dec_statement':
				if (!scope.isRoot()) {
					scope.modifyLocal(x.firstChild!.text)
				}
				break
			case 'assignment_statement':
				if (!scope.isRoot()) {
					for (const id of x.firstChild!.children) {
						if (id.type == 'identifier') {
							scope.modifyLocal(id.text)
						}
					}
				}
				break
			case 'identifier':
				if (!scope.isRoot()) {
					scope.referenceLocal(x)
				}
				break
			case 'function_declaration':
			case 'method_declaration':
			case 'func_literal':
			case 'block':
				scope = new Scope(scope)
				break
			case 'identifier':
				if (visible && x.parent!.type == 'function_declaration') {
					// func f() { ... }
					colors.push([x, 'entity.name.function'])
				}
				break
			case 'type_identifier':
				if (visible) {
					// x: type
					colors.push([x, 'entity.name.type'])
				}
				break
			case 'field_identifier':
				if (visible) {
					// pkg.member
					const isPackage = x.parent!.type == 'selector_expression' && scope.isPackage(x.parent!.firstChild!.text)
					// obj.member
					if (!isPackage) colors.push([x, 'variable'])
				}
				break
		}
		scanChildren(x, scope)
	}
	function scanChildren(x: Parser.SyntaxNode, scope: Scope) {
		for (const child of x.children) {
			scan(child, scope)
		}
	}
	scanRoot(root)
	for (const scope of allScopes) {
		for (const local of scope.modifiedLocals()) {
			colors.push([local, 'markup.underline'])
		}
	}

	return colors
}