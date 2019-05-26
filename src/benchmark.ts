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
        console.time('colorGoWithMutable')
        colorGoWithMutable(tree.rootNode)
        console.timeEnd('colorGoWithMutable')
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
	class Scope {
		locals: {[id: string]: boolean} = {}
		parent: Scope|null
	
		constructor(parent: Scope|null) {
			this.parent = parent
		}
	
		isLocal(id: string): boolean {
			if (this.locals[id]) return true
			if (this.parent != null) return this.parent.isLocal(id)
			return false
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
		// Add colors
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_declaration') {
			// func f() { ... }
			colors.push([x, 'entity.name.function'])
		} else if (x.type == 'type_identifier') {
			// x: type
			colors.push([x, 'entity.name.type'])
		} else if (x.type == 'selector_expression' && x.firstChild!.type == 'identifier' && scope.isPackage(x.firstChild!.text)) {
			// pkg.member
			return
		} else if (x.type == 'field_identifier') {
			// obj.member
			colors.push([x, 'variable'])
		}
		// Add locals to scope
		if (!scope.isRoot() && ['parameter_declaration', 'var_spec', 'const_spec'].includes(x.type)) {
			for (const id of x.children) {
				if (id.type == 'identifier') {
					scope.locals[id.text] = true
				}
			}
		} else if (!scope.isRoot() && ['short_var_declaration', 'range_clause'].includes(x.type)) {
			for (const id of x.firstChild!.children) {
				if (id.type == 'identifier') {
					scope.locals[id.text] = true
				}
			}
		}
		// Define new scope
		if (['function_declaration', 'method_declaration', 'func_literal', 'block'].includes(x.type)) {
			scope = new Scope(scope)
		}
		// Recurse
		scanChildren(x, scope)
	}
	function scanChildren(x: Parser.SyntaxNode, scope: Scope) {
		for (const child of x.children) {
			scan(child, scope)
		}
	}
	scanRoot(root)

	return colors
}

export function colorGoWithMutable(root: Parser.SyntaxNode) {
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
		// Add colors
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_declaration') {
			// func f() { ... }
			colors.push([x, 'entity.name.function'])
		} else if (x.type == 'type_identifier') {
			// x: type
			colors.push([x, 'entity.name.type'])
		} else if (x.type == 'selector_expression' && x.firstChild!.type == 'identifier' && scope.isPackage(x.firstChild!.text)) {
			// pkg.member
			return
		} else if (x.type == 'field_identifier') {
			// obj.member
			colors.push([x, 'variable'])
		}
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
			scope = new Scope(scope)
		}
		// Recurse
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