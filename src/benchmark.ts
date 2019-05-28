// // import extension = require('./extension')
// import Parser = require('web-tree-sitter')
// import fs = require('fs')
// import colors = require('./colors')

// benchmarkGo()

// async function benchmarkGo() {
//     await Parser.init()
//     const parser = new Parser()
//     const wasm = 'parsers/tree-sitter-go.wasm'
//     const lang = await Parser.Language.load(wasm)
//     parser.setLanguage(lang)
//     const text = fs.readFileSync('examples/go/proc.go', {encoding: 'utf-8'})
//     const tree = parser.parse(text)
//     for (let i = 0; i < 10; i++) {
//         console.time('colorGo')
//         colors.colorGo(tree.rootNode, [{start: 0, end: tree.rootNode.endPosition.row}])
//         console.timeEnd('colorGo')
//     }
// }