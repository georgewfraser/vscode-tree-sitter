import * as VS from 'vscode'
import * as Parser from 'tree-sitter'

// Be sure to declare the language in package.json,
// and include a minimalist grammar.
const languages: {[id: string]: Parser} = {
	'go': createParser('tree-sitter-go'),
	'typescript': createParser('tree-sitter-typescript'),
	// TODO function declaration names aren't coloring in c and c++
	'cpp': createParser('tree-sitter-cpp'),
	'c': createParser('tree-sitter-c'),
}

function createParser(module: string) {
	const lang = require(module)
	const parser = new Parser()
	parser.setLanguage(lang)
	return parser
}

// Called when the extension is first activated by user opening a file with the appropriate language
export function activate(context: VS.ExtensionContext) {
	// Parse of all visible documents
	const trees: {[uri: string]: Parser.Tree} = {}
	function open(editor: VS.TextEditor) {
		const parser = languages[editor.document.languageId]
		if (parser != null) {
			const t = parser.parse(editor.document.getText()) // TODO don't use getText, use Parser.Input
			trees[editor.document.uri.toString()] = t
			colorUri(editor.document.uri)
		}
	}
	function edit(edit: VS.TextDocumentChangeEvent) {
		const parser = languages[edit.document.languageId]
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
		old.edit({startIndex, oldEndIndex, newEndIndex, startPosition, oldEndPosition, newEndPosition})
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
        color: new VS.ThemeColor('treeSitterType')
	})
	const fieldStyle = VS.window.createTextEditorDecorationType({
        color: new VS.ThemeColor('treeSitterField')
	})
	const functionStyle = VS.window.createTextEditorDecorationType({
        color: new VS.ThemeColor('treeSitterFunction')
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
		var types: VS.Range[] = []
		var fields: VS.Range[] = []
		var functions: VS.Range[] = []
		function isVisible(x: Parser.SyntaxNode) {
			for (let visible of editor.visibleRanges) {
				const overlap = x.startPosition.row <= visible.end.line+1 && visible.start.line-1 <= x.endPosition.row
				if (overlap) return true
			}
			return false
		}
		function scan(x: Parser.SyntaxNode) {
			if (!isVisible(x)) return
			switch (x.type) {
				case 'identifier':
					if (x.parent == null) return
					switch (x.parent.type) {
						case 'function_declaration':
								const r = range(x)
								functions.push(r)
								return
					}
					return
				case 'primitive_type':
				case 'type_identifier':
				case 'predefined_type':{
					const r = range(x)
					types.push(r)
					return
				}
				case 'property_identifier':
				case 'field_identifier':{
					const r = range(x)
					fields.push(r)
					return
				}
			}
			for (let child of x.children) {
				scan(child)
			}
		}
		scan(t.rootNode)
		editor.setDecorations(typeStyle, types)
		editor.setDecorations(fieldStyle, fields)
		editor.setDecorations(functionStyle, functions)
		console.log(t.rootNode.toString())
	}
	function range(x: Parser.SyntaxNode): VS.Range {
		return new VS.Range(x.startPosition.row, x.startPosition.column, x.endPosition.row, x.endPosition.column)
	}
	VS.window.visibleTextEditors.forEach(open)
	context.subscriptions.push(VS.window.onDidChangeVisibleTextEditors(editors => editors.forEach(open)))
	context.subscriptions.push(VS.workspace.onDidChangeTextDocument(edit))
	context.subscriptions.push(VS.workspace.onDidCloseTextDocument(close))
	context.subscriptions.push(VS.window.onDidChangeTextEditorVisibleRanges(change => colorEditor(change.textEditor)))
}

// this method is called when your extension is deactivated
export function deactivate() {}
