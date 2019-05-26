import * as vscode from 'vscode'
import * as Parser from 'web-tree-sitter'
import * as path from 'path'
import * as colors from './colors'

type ColorFunction = (x: Parser.SyntaxNode, editor: vscode.TextEditor) => [Parser.SyntaxNode, string][]

function colorGo(root: Parser.SyntaxNode, editor: vscode.TextEditor) {
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
	function scan(x: Parser.SyntaxNode, scope: Scope) {
		const visible = isVisible(x, editor)
		switch (x.type) {
			case 'import_declaration':
				scanImport(x)
				break
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
				scanChildren(x, new Scope(scope))
				break
			case 'inc_statement':
			case 'dec_statement':
				if (!scope.isRoot()) {
					scope.modifyLocal(x.firstChild!.text)
				}
				scanChildren(x, new Scope(scope))
				break
			case 'assignment_statement':
				if (!scope.isRoot()) {
					for (const id of x.firstChild!.children) {
						if (id.type == 'identifier') {
							scope.modifyLocal(id.text)
						}
					}
				}
				scanChildren(x, new Scope(scope))
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
				// Skip top-level declarations that aren't visible
				if (visible || !scope.isRoot()) {
					scanChildren(x, new Scope(scope))
				}
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
			default:
				// Skip top-level declarations that aren't visible
				if (visible || !scope.isRoot()) {
					scanChildren(x, scope)
				}
		}
	}
	function scanChildren(x: Parser.SyntaxNode, scope: Scope) {
		for (const child of x.children) {
			scan(child, scope)
		}
	}
	scan(root, new Scope(null))
	for (const scope of allScopes) {
		for (const local of scope.modifiedLocals()) {
			colors.push([local, 'markup.underline'])
		}
	}

	return colors
}

function colorTypescript(x: Parser.SyntaxNode, editor: vscode.TextEditor) {
	const colors: [Parser.SyntaxNode, string][] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function') {
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

function colorRuby(x: Parser.SyntaxNode, editor: vscode.TextEditor) {
	const colors: [Parser.SyntaxNode, string][] = []
	const control = ['while', 'until', 'if', 'unless', 'for', 'begin', 'elsif', 'else', 'ensure', 'when', 'case', 'do_block']
	const variables = ['instance_variable', 'class_variable', 'global_variable']
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'method') {
			colors.push([x.children[1]!, 'entity.name.function'])
		} else if (x.type == 'singleton_method') {
			colors.push([x.children[3], 'entity.name.function'])
		} else if (variables.includes(x.type)) {
			colors.push([x, 'variable'])
		} else if (x.type == 'call' && x.lastChild!.type == 'identifier') {
			colors.push([x.lastChild!, 'entity.name.function'])
		} else if (x.type == 'method_call' && x.firstChild!.type == 'identifier') {
			colors.push([x.firstChild!, 'entity.name.function'])
		} else if (x.type == 'end') {
			if (control.includes(x.parent!.type)) {
				colors.push([x, 'keyword.control'])
			} else {
				colors.push([x, 'keyword'])
			}
		} else if (x.type == 'constant') {
			colors.push([x, 'entity.name.type'])
		} else if (x.type == 'symbol') {
			colors.push([x, 'constant.numeric'])
		}
		for (const child of x.children) {
			scan(child)
		}
	}
	scan(x)

	return colors
}

function colorRust(x: Parser.SyntaxNode, editor: vscode.TextEditor) {
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
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_item' && x.parent.parent != null && x.parent.parent.type == 'declaration_list') {
			colors.push([x, 'variable'])
		} else if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_item') {
			colors.push([x, 'entity.name.function'])
		} else if (x.type == 'identifier' && x.parent != null && x.parent.type == 'scoped_identifier' && x.parent.parent != null && x.parent.parent.type == 'function_declarator') {
			colors.push([x, 'entity.name.function'])
		} else if (x.type == 'use_declaration') {
			scanUse(x)
			return
		} else if (x.type == 'type_identifier' || x.type == 'primitive_type') {
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

function colorCpp(x: Parser.SyntaxNode, editor: vscode.TextEditor) {
	const colors: [Parser.SyntaxNode, string][] = []
	function scan(x: Parser.SyntaxNode) {
		if (!isVisible(x, editor)) return
		if (x.type == 'identifier' && x.parent != null && x.parent.type == 'function_declarator') {
			colors.push([x, 'entity.name.function'])
		} else if (x.type == 'identifier' && x.parent != null && x.parent.type == 'scoped_identifier' && x.parent.parent != null && x.parent.parent.type == 'function_declarator') {
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

function isVisible(x: Parser.SyntaxNode, editor: vscode.TextEditor) {
	for (const visible of editor.visibleRanges) {
		const overlap = x.startPosition.row <= visible.end.line+1 && visible.start.line-1 <= x.endPosition.row
		if (overlap) return true
	}
	return false
}

// Create decoration types from scopes lazily
const decorationCache = new Map<string, vscode.TextEditorDecorationType>()
function decoration(scope: string): vscode.TextEditorDecorationType|undefined {
	// If we've already created a decoration for `scope`, use it
	if (decorationCache.has(scope)) {
		return decorationCache.get(scope)
	}
	// If `scope` is defined in the current theme, create a decoration for it
	const textmate = colors.find(scope)
	if (textmate) {
		const decoration = createDecorationFromTextmate(textmate)
		decorationCache.set(scope, decoration)
		return decoration
	}
	// Otherwise, give up, there is no color available for this scope
	return undefined
}
function createDecorationFromTextmate(themeStyle: colors.TextMateRuleSettings): vscode.TextEditorDecorationType {
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
	await colors.load()
	// Clear old styles
	for (const style of decorationCache.values()) {
		style.dispose()
	}
	decorationCache.clear()
}

// For some reason this crashes if we put it inside activate
const initParser = Parser.init() // TODO this isn't a field, suppress package member coloring like Go

// Called when the extension is first activated by user opening a file with the appropriate language
export async function activate(context: vscode.ExtensionContext) {
	console.log("Activating tree-sitter...")
	// Load parser from `parsers/module.wasm`
	async function createParser(module: string, color: ColorFunction) {
		const absolute = path.join(context.extensionPath, 'parsers', module + '.wasm')
		const wasm = path.relative(process.cwd(), absolute)
		const lang = await Parser.Language.load(wasm)
		const parser = new Parser()
		parser.setLanguage(lang)
		return {parser, color}
	}
	// Be sure to declare the language in package.json and include a minimalist grammar.
	const languages: {[id: string]: {parser: Parser, color: ColorFunction}} = {
		'go': await createParser('tree-sitter-go', colorGo),
		'cpp': await createParser('tree-sitter-cpp', colorCpp),
		'rust': await createParser('tree-sitter-rust', colorRust),
		'ruby': await createParser('tree-sitter-ruby', colorRuby),
		'typescript': await createParser('tree-sitter-typescript', colorTypescript),
		'javascript': await createParser('tree-sitter-javascript', colorTypescript),
	}
	// Parse of all visible documents
	const trees: {[uri: string]: Parser.Tree} = {}
	function open(editor: vscode.TextEditor) {
		const language = languages[editor.document.languageId]
		if (language == null) return
		const t = language.parser.parse(editor.document.getText()) // TODO don't use getText, use Parser.Input
		trees[editor.document.uri.toString()] = t
		colorUri(editor.document.uri)
	}
	function edit(edit: vscode.TextDocumentChangeEvent) {
		const language = languages[edit.document.languageId]
		if (language == null) return
		updateTree(language.parser, edit)
		colorUri(edit.document.uri)
	}
	function updateTree(parser: Parser, edit: vscode.TextDocumentChangeEvent) {
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
	function asPoint(pos: vscode.Position): Parser.Point {
		return {row: pos.line, column: pos.character}
	}
	function close(doc: vscode.TextDocument) {
		delete trees[doc.uri.toString()]
	}
	function colorUri(uri: vscode.Uri) {
		for (const editor of vscode.window.visibleTextEditors) {
			if (editor.document.uri == uri) {
				colorEditor(editor)
			}
		}
	}
	const warnedScopes = new Set<string>()
	function colorEditor(editor: vscode.TextEditor) {
		const t = trees[editor.document.uri.toString()]
		if (t == null) return
		const language = languages[editor.document.languageId]
		if (language == null) return
		const colors = language.color(t.rootNode, editor)
		const nodes = new Map<string, Parser.SyntaxNode[]>()
		for (const [x, scope] of colors) {
			if (!nodes.has(scope)) nodes.set(scope, [])
			nodes.get(scope)!.push(x)
		}
		for (const scope of nodes.keys()) {
			const dec = decoration(scope)
			if (dec) {
				const ranges = nodes.get(scope)!.map(range)
				editor.setDecorations(dec, ranges)
			} else if (!warnedScopes.has(scope)) {
				console.warn(scope, 'was not found in the current theme')
				warnedScopes.add(scope)
			}
		}
		for (const scope of decorationCache.keys()) {
			if (!nodes.has(scope)) {
				const dec = decorationCache.get(scope)!
				editor.setDecorations(dec, [])
			}
		}
	}
	function colorAllOpen() {
		vscode.window.visibleTextEditors.forEach(open)
	}
	// Load active color theme
	async function onChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
        let colorizationNeedsReload: boolean = event.affectsConfiguration("workbench.colorTheme")
			|| event.affectsConfiguration("editor.tokenColorCustomizations")
		if (colorizationNeedsReload) {
			await loadStyles()
			colorAllOpen()
		}
	}
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(onChangeConfiguration))
	context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(editors => editors.forEach(open)))
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(edit))
	context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(close))
	context.subscriptions.push(vscode.window.onDidChangeTextEditorVisibleRanges(change => colorEditor(change.textEditor)))
	// Don't wait for the initial color, it takes too long to inspect the themes and causes VSCode extension host to hang
	async function activateLazily() {
		await loadStyles()
		await initParser
		colorAllOpen()
	}
	activateLazily()
}

function range(x: Parser.SyntaxNode): vscode.Range {
	return new vscode.Range(x.startPosition.row, x.startPosition.column, x.endPosition.row, x.endPosition.column)
}

// this method is called when your extension is deactivated
export function deactivate() {}
