import * as VS from 'vscode'
import * as Parser from 'tree-sitter'

// Be sure to declare the language in package.json and include a minimalist grammar.
const languages: {[id: string]: {parser: Parser, color: ColorFunction}} = {
	'go': createParser('tree-sitter-go', colorGo),
	'typescript': createParser('tree-sitter-typescript', colorTypescript),
	'cpp': createParser('tree-sitter-cpp', colorCpp),
	'rust': createParser('tree-sitter-rust', colorRust),
}

function colorGo(x: Parser.SyntaxNode, editor: VS.TextEditor) {
	var types: VS.Range[] = []
	var fields: VS.Range[] = []
	var functions: VS.Range[] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_declaration') {
			functions.push(range(x))
		} else if (x.type == 'type_identifier') {
			types.push(range(x))
		} else if (x.type == 'field_identifier') {
			fields.push(range(x))
		}
		for (let child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return {types, fields, functions}
}

function colorTypescript(x: Parser.SyntaxNode, editor: VS.TextEditor) {
	var types: VS.Range[] = []
	var fields: VS.Range[] = []
	var functions: VS.Range[] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function') {
			functions.push(range(x))
		} else if (x.type == 'type_identifier' || x.type == 'predefined_type') {
			types.push(range(x))
		} else if (x.type == 'property_identifier') {
			fields.push(range(x))
		}
		for (let child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return {types, fields, functions}
}

function colorRust(x: Parser.SyntaxNode, editor: VS.TextEditor) {
	var types: VS.Range[] = []
	var fields: VS.Range[] = []
	var functions: VS.Range[] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_item' && x.parent.parent != null && x.parent.parent.type == 'declaration_list') {
			fields.push(range(x))
		} else if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_item') {
			functions.push(range(x))
		} else if (x.type == 'identifier' && x.parent != null && x.parent.type == 'scoped_identifier' && x.parent.parent != null && x.parent.parent.type == 'function_declarator') {
			functions.push(range(x))
		} else if (x.type == 'type_identifier' || x.type == 'primitive_type') {
			types.push(range(x))
		} else if (x.type == 'field_identifier') {
			fields.push(range(x))
		}
		for (let child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return {types, fields, functions}
}

function colorCpp(x: Parser.SyntaxNode, editor: VS.TextEditor) {
	var types: VS.Range[] = []
	var fields: VS.Range[] = []
	var functions: VS.Range[] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_declarator') {
			functions.push(range(x))
		} else if (x.type == 'identifier' && x.parent != null && x.parent.type == 'scoped_identifier' && x.parent.parent != null && x.parent.parent.type == 'function_declarator') {
			functions.push(range(x))
		} else if (x.type == 'type_identifier') {
			types.push(range(x))
		} else if (x.type == 'field_identifier') {
			fields.push(range(x))
		}
		for (let child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return {types, fields, functions}
}

function isVisible(x: Parser.SyntaxNode, editor: VS.TextEditor) {
	for (let visible of editor.visibleRanges) {
		const overlap = x.startPosition.row <= visible.end.line+1 && visible.start.line-1 <= x.endPosition.row
		if (overlap) return true
	}
	return false
}

function range(x: Parser.SyntaxNode): VS.Range {
	return new VS.Range(x.startPosition.row, x.startPosition.column, x.endPosition.row, x.endPosition.column)
}

type ColorFunction = (x: Parser.SyntaxNode, editor: VS.TextEditor) => {types: VS.Range[], fields: VS.Range[], functions: VS.Range[]}

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
		const {parser} = languages[editor.document.languageId]
		if (parser != null) {
			const t = parser.parse(editor.document.getText()) // TODO don't use getText, use Parser.Input
			trees[editor.document.uri.toString()] = t
			colorUri(editor.document.uri)
		}
	}
	function edit(edit: VS.TextDocumentChangeEvent) {
		const {parser} = languages[edit.document.languageId]
		if (parser != null) {
			updateTree(parser, edit)
			colorUri(edit.document.uri)
		}
	}
	function updateTree(parser: Parser, edit: VS.TextDocumentChangeEvent) {
		if (edit.contentChanges.length == 0) return
		const old = trees[edit.document.uri.toString()]
		const startIndex = Math.min(...edit.contentChanges.map(getStartIndex))
		const oldEndIndex = Math.max(...edit.contentChanges.map(getOldEndIndex))
		const newEndIndex = Math.max(...edit.contentChanges.map(getNewEndIndex))
		const startPos = edit.document.positionAt(startIndex)
		const oldEndPos = edit.document.positionAt(oldEndIndex)
		const newEndPos = edit.document.positionAt(newEndIndex)
		const startPosition = asPoint(startPos)
		const oldEndPosition = asPoint(oldEndPos)
		const newEndPosition = asPoint(newEndPos)
		const delta = {startIndex, oldEndIndex, newEndIndex, startPosition, oldEndPosition, newEndPosition}
		// console.log(edit.document.uri.toString(), delta)
		old.edit(delta)
		const t = parser.parse(edit.document.getText(), old) // TODO don't use getText, use Parser.Input
		trees[edit.document.uri.toString()] = t
	}
	function getStartIndex(edit: VS.TextDocumentContentChangeEvent): number {
		return edit.rangeOffset
	}
	function getOldEndIndex(edit: VS.TextDocumentContentChangeEvent): number {
		return edit.rangeOffset + edit.rangeLength
	}
	function getNewEndIndex(edit: VS.TextDocumentContentChangeEvent): number {
		return edit.rangeOffset + edit.text.length
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
		for (let editor of VS.window.visibleTextEditors) {
			if (editor.document.uri == uri) {
				colorEditor(editor)
			}
		}
	}
	function colorEditor(editor: VS.TextEditor) {
		const t = trees[editor.document.uri.toString()]
		if (t == null) return;
		const {color} = languages[editor.document.languageId]
		if (color == null) return;
		const {types, fields, functions} = color(t.rootNode, editor)
		editor.setDecorations(typeStyle, types)
		editor.setDecorations(fieldStyle, fields)
		editor.setDecorations(functionStyle, functions)
		// console.log(t.rootNode.toString())
	}
	VS.window.visibleTextEditors.forEach(open)
	context.subscriptions.push(VS.window.onDidChangeVisibleTextEditors(editors => editors.forEach(open)))
	context.subscriptions.push(VS.workspace.onDidChangeTextDocument(edit))
	context.subscriptions.push(VS.workspace.onDidCloseTextDocument(close))
	context.subscriptions.push(VS.window.onDidChangeTextEditorVisibleRanges(change => colorEditor(change.textEditor)))
}

// this method is called when your extension is deactivated
export function deactivate() {}
