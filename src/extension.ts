import * as VS from 'vscode'
import * as Parser from 'tree-sitter'

// Be sure to declare the language in package.json and include a minimalist grammar.
const languages: {[id: string]: {parser: Parser, color: ColorFunction}} = {
	'go': createParser('tree-sitter-go', colorGo),
	'typescript': createParser('tree-sitter-typescript', colorTypescript),
	'cpp': createParser('tree-sitter-cpp', colorCpp),
	'rust': createParser('tree-sitter-rust', colorRust),
}

type ColorFunction = (x: Parser.SyntaxNode, editor: VS.TextEditor) => {types: Parser.SyntaxNode[], fields: Parser.SyntaxNode[], functions: Parser.SyntaxNode[]}


function colorGo(x: Parser.SyntaxNode, editor: VS.TextEditor) {
	// Guess package names based on paths
	var packages: {[id: string]: boolean} = {}
	for (const decl of x.children) {
		if (decl.type == 'const_declaration' || decl.type == 'var_declaration' || decl.type == 'function_declaration') {
			console.log('encountered', decl.type)
			break
		}
		if (decl.type == 'import_declaration') {
			for (const i of decl.descendantsOfType('import_spec')) {
				const str = i.firstChild!.text
				const path = str.substring(1, str.length - 1)
				const parts = path.split('/')
				const last = parts[parts.length - 1]
				packages[last] = true
			}
			continue
		}
	}
	var types: Parser.SyntaxNode[] = []
	var fields: Parser.SyntaxNode[] = []
	var functions: Parser.SyntaxNode[] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_declaration') {
			// func f() { ... }
			functions.push(x)
		} else if (x.type == 'type_identifier') {
			// x: type
			types.push(x)
		} else if (x.type == 'selector_expression' && x.firstChild!.type == 'identifier' && packages[x.firstChild!.text]) {
			// pkg.member
			return
		} else if (x.type == 'field_identifier') {
			// obj.member
			fields.push(x)
		}
		for (const child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return {types, fields, functions}
}

function colorTypescript(x: Parser.SyntaxNode, editor: VS.TextEditor) {
	var types: Parser.SyntaxNode[] = []
	var fields: Parser.SyntaxNode[] = []
	var functions: Parser.SyntaxNode[] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function') {
			functions.push(x)
		} else if (x.type == 'type_identifier' || x.type == 'predefined_type') {
			types.push(x)
		} else if (x.type == 'property_identifier') {
			fields.push(x)
		}
		for (const child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return {types, fields, functions}
}

function colorRust(x: Parser.SyntaxNode, editor: VS.TextEditor) {
	var types: Parser.SyntaxNode[] = []
	var fields: Parser.SyntaxNode[] = []
	var functions: Parser.SyntaxNode[] = []
	function looksLikeType(id: string) {
		if (id.length == 0) return false
		if (id[0] != id[0].toUpperCase()) return false
		for (const c of id) {
			if (c.toLowerCase() == c) return true
		}
		return false
	}
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_item' && x.parent.parent != null && x.parent.parent.type == 'declaration_list') {
			fields.push(x)
		} else if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_item') {
			functions.push(x)
		} else if (x.type == 'identifier' && x.parent != null && x.parent.type == 'scoped_identifier' && x.parent.parent != null && x.parent.parent.type == 'function_declarator') {
			functions.push(x)
		} else if (x.type == 'use_declaration') {
			for (const id of x.descendantsOfType('identifier')) {
				if (looksLikeType(id.text)) {
					types.push(id)
				}
			}
			return
		} else if (x.type == 'type_identifier' || x.type == 'primitive_type') {
			types.push(x)
		} else if (x.type == 'field_identifier') {
			fields.push(x)
		}
		for (const child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return {types, fields, functions}
}

function colorCpp(x: Parser.SyntaxNode, editor: VS.TextEditor) {
	var types: Parser.SyntaxNode[] = []
	var fields: Parser.SyntaxNode[] = []
	var functions: Parser.SyntaxNode[] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_declarator') {
			functions.push(x)
		} else if (x.type == 'identifier' && x.parent != null && x.parent.type == 'scoped_identifier' && x.parent.parent != null && x.parent.parent.type == 'function_declarator') {
			functions.push(x)
		} else if (x.type == 'type_identifier') {
			types.push(x)
		} else if (x.type == 'field_identifier') {
			fields.push(x)
		}
		for (const child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return {types, fields, functions}
}

function isVisible(x: Parser.SyntaxNode, editor: VS.TextEditor) {
	for (const visible of editor.visibleRanges) {
		const overlap = x.startPosition.row <= visible.end.line+1 && visible.start.line-1 <= x.endPosition.row
		if (overlap) return true
	}
	return false
}

function createParser(module: string, color: ColorFunction): {parser: Parser, color: ColorFunction} {
	const lang = require(module)
	const parser = new Parser()
	parser.setLanguage(lang)
	return {parser, color}
}

// Called when the extension is first activated by user opening a file with the appropriate language
export function activate(context: VS.ExtensionContext) {
	console.log("Activating tree-sitter...")
	// Parse of all visible documents
	const trees: {[uri: string]: Parser.Tree} = {}
	function open(editor: VS.TextEditor) {
		const language = languages[editor.document.languageId]
		if (language == null) return
		const t = language.parser.parse(editor.document.getText()) // TODO don't use getText, use Parser.Input
		trees[editor.document.uri.toString()] = t
		colorUri(editor.document.uri)
	}
	function edit(edit: VS.TextDocumentChangeEvent) {
		const language = languages[edit.document.languageId]
		if (language == null) return
		updateTree(language.parser, edit)
		colorUri(edit.document.uri)
	}
	function updateTree(parser: Parser, edit: VS.TextDocumentChangeEvent) {
		if (edit.contentChanges.length == 0) return
		const old = trees[edit.document.uri.toString()]
		for (const e of edit.contentChanges) {
			const startIndex = e.rangeOffset
			const oldEndIndex = e.rangeOffset + e.rangeLength
			const newEndIndex = e.rangeOffset + e.text.length
			const startPos = edit.document.positionAt(startIndex)
			const oldEndPos = edit.document.positionAt(oldEndIndex)
			const newEndPos = edit.document.positionAt(newEndIndex)
			const startPosition = asPoint(startPos)
			const oldEndPosition = asPoint(oldEndPos)
			const newEndPosition = asPoint(newEndPos)
			const delta = {startIndex, oldEndIndex, newEndIndex, startPosition, oldEndPosition, newEndPosition}
			old.edit(delta)
		}
		const t = parser.parse(edit.document.getText(), old) // TODO don't use getText, use Parser.Input
		trees[edit.document.uri.toString()] = t
	}
	function asPoint(pos: VS.Position): Parser.Point {
		return {row: pos.line, column: pos.character}
	}
	function close(doc: VS.TextDocument) {
		if (doc.languageId == 'go') {
			delete trees[doc.uri.toString()]
		}
	}
	// Apply themeable colors
	const typeStyle = VS.window.createTextEditorDecorationType({
        color: new VS.ThemeColor('treeSitter.type')
	})
	const fieldStyle = VS.window.createTextEditorDecorationType({
        color: new VS.ThemeColor('treeSitter.field')
	})
	const functionStyle = VS.window.createTextEditorDecorationType({
        color: new VS.ThemeColor('treeSitter.function')
	})
	function colorUri(uri: VS.Uri) {
		for (const editor of VS.window.visibleTextEditors) {
			if (editor.document.uri == uri) {
				colorEditor(editor)
			}
		}
	}
	function colorEditor(editor: VS.TextEditor) {
		const t = trees[editor.document.uri.toString()]
		if (t == null) return
		const language = languages[editor.document.languageId]
		if (language == null) return
		const {types, fields, functions} = language.color(t.rootNode, editor)
		editor.setDecorations(typeStyle, types.map(range))
		editor.setDecorations(fieldStyle, fields.map(range))
		editor.setDecorations(functionStyle, functions.map(range))
		// console.log(t.rootNode.toString())
	}
	VS.window.visibleTextEditors.forEach(open)
	context.subscriptions.push(VS.window.onDidChangeVisibleTextEditors(editors => editors.forEach(open)))
	context.subscriptions.push(VS.workspace.onDidChangeTextDocument(edit))
	context.subscriptions.push(VS.workspace.onDidCloseTextDocument(close))
	context.subscriptions.push(VS.window.onDidChangeTextEditorVisibleRanges(change => colorEditor(change.textEditor)))
}

function range(x: Parser.SyntaxNode): VS.Range {
	return new VS.Range(x.startPosition.row, x.startPosition.column, x.endPosition.row, x.endPosition.column)
}

// this method is called when your extension is deactivated
export function deactivate() {}
