// import extension = require('./extension')
import Parser = require('web-tree-sitter')
import fs = require('fs')

testRust()

async function testRust() {
    await Parser.init()
    const parser = new Parser()
    const wasm = 'parsers/tree-sitter-rust.wasm'
    const lang = await Parser.Language.load(wasm)
    parser.setLanguage(lang)
    const text = fs.readFileSync('examples/rust/scratch.rs', {encoding: 'utf-8'})
    const tree = parser.parse(text)
    const lines = text.split('\n')
    const maxLine = maxWidth(lines)
    for (let line = 0; line < lines.length; line++) {
        const types: string[] = []
        collectTypes(tree.rootNode, line, types)
        let acc = lines[line]
        for (let i = acc.length; i < maxLine + 1; i++) {
            acc = acc + ' '
        }
        for (const t of types) {
            acc = acc + ' ' + t
        }
        console.log(acc)
    }
}

function maxWidth(lines: string[]): number {
    let max = 0
    for (const line of lines) {
        if (line.length > max) max = line.length
    }
    return max
}

function collectTypes(node: Parser.SyntaxNode, line: number, types: string[]) {
    if (node.startPosition.row == line) {
        if (node.endPosition.row == line) {
            types.push(node.toString())
        } else {
            types.push(node.type)
            for (const child of node.children) {
                collectTypes(child, line, types)
            }
        }
    } else {
        for (const child of node.children) {
            collectTypes(child, line, types)
        }
    }
}