import * as vscode from 'vscode'
import * as Parser from 'web-tree-sitter'
import * as path from 'path'
import * as scopes from './scopes'

// Parse of all visible documents
const trees = new Map<string, Parser.Tree>()

export function tree(uri: vscode.Uri) {
	return trees.get(uri.toString())
}

// Create decoration types from scopes lazily
const decorationCache = new Map<string, vscode.TextEditorDecorationType>()
const warnedScopes = new Set<string>()
export function decoration(scope: string): vscode.TextEditorDecorationType|undefined {
	// If we've already created a decoration for `scope`, use it
	if (decorationCache.has(scope)) {
		return decorationCache.get(scope)
	}
	// If `scope` is defined in the current theme, create a decoration for it
	const textmate = scopes.find(scope)
	if (textmate) {
		const decoration = createDecorationFromTextmate(textmate)
		decorationCache.set(scope, decoration)
		return decoration
	}
	// Otherwise, give up, there is no color available for this scope
	if (!warnedScopes.has(scope)) {
		console.warn(scope, 'was not found in the current theme')
		warnedScopes.add(scope)
	}
	return undefined
}
function createDecorationFromTextmate(themeStyle: scopes.TextMateRuleSettings): vscode.TextEditorDecorationType {
	let options: vscode.DecorationRenderOptions = {}
	options.rangeBehavior = vscode.DecorationRangeBehavior.OpenOpen
	if (themeStyle.foreground) {
		options.color = themeStyle.foreground
	}
	if (themeStyle.background) {
		options.backgroundColor = themeStyle.background
	}
	if (themeStyle.fontStyle) {
		let parts: string[] = themeStyle.fontStyle.split(" ")
		parts.forEach((part) => {
			switch (part) {
				case "italic":
					options.fontStyle = "italic"
					break
				case "bold":
					options.fontWeight = "bold"
					break
				case "underline":
					options.textDecoration = "underline"
					break
				default:
					break
			}
		})
	}
	return vscode.window.createTextEditorDecorationType(options)
}

// Load styles from the current active theme
async function loadStyles() {
	await scopes.load()
	// Clear old styles
	for (const style of decorationCache.values()) {
		style.dispose()
	}
	decorationCache.clear()
}

// For some reason this crashes if we put it inside activate
const initParser = Parser.init() // TODO this isn't a field, suppress package member coloring like Go

// Called when the extension is first activated by user opening a file with the appropriate language
export async function activate(context: vscode.ExtensionContext, languages: {[id: string]: {wasm: string, parser?: Parser}}) {
	console.log("Activating tree-sitter...")
	async function open(editor: vscode.TextEditor) {
		const language = languages[editor.document.languageId]
		if (language == null) return
		if (language.parser == null) {
			const wasm = path.relative(process.cwd(), language.wasm)
			const lang = await Parser.Language.load(wasm)
			const parser = new Parser()
			parser.setLanguage(lang)
			language.parser = parser
		}
		const t = language.parser.parse(editor.document.getText()) // TODO don't use getText, use Parser.Input
		trees.set(editor.document.uri.toString(), t)
	}
	// NOTE: if you make this an async function, it seems to cause edit anomalies
	function edit(edit: vscode.TextDocumentChangeEvent) {
		const language = languages[edit.document.languageId]
		if (language == null || language.parser == null) return
		updateTree(language.parser, edit)
	}
	function updateTree(parser: Parser, edit: vscode.TextDocumentChangeEvent) {
		if (edit.contentChanges.length == 0) return
		const old = trees.get(edit.document.uri.toString())!
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
		trees.set(edit.document.uri.toString(), t)
	}
	function asPoint(pos: vscode.Position): Parser.Point {
		return {row: pos.line, column: pos.character}
	}
	function close(doc: vscode.TextDocument) {
		trees.delete(doc.uri.toString())
	}
	async function openAll() {
		for (const editor of vscode.window.visibleTextEditors) {
			await open(editor)
		}
	}
	// Load active color theme
	async function onChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
        let colorizationNeedsReload: boolean = event.affectsConfiguration("workbench.colorTheme")
			|| event.affectsConfiguration("editor.tokenColorCustomizations")
		if (colorizationNeedsReload) {
			await loadStyles()
		}
	}
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(onChangeConfiguration))
	context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(openAll))
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(edit))
	context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(close))
	// Don't wait for the initial color, it takes too long to inspect the themes and causes VSCode extension host to hang
	await loadStyles()
	await initParser
	await openAll()
}

export function range(x: Parser.SyntaxNode): vscode.Range {
	return new vscode.Range(x.startPosition.row, x.startPosition.column, x.endPosition.row, x.endPosition.column)
}

// this method is called when your extension is deactivated
export function deactivate() {}
