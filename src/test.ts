// import Parser = require('web-tree-sitter')
// import colors = require('./colors')

// type Assert = [string, string|{not:string}]
// type TestCase = [string, ...Assert[]]

// const goTests: TestCase[] = [
//     [
//         `package p; func f() int { }`, 
//         ['f', 'entity.name.function'], ['int', 'entity.name.type']
//     ],
//     [
//         `package p; type Foo struct { x int }`, 
//         ['Foo', 'entity.name.type'], ['x', 'variable']
//     ],
//     [
//         `package p; type Foo interface { GetX() int }`, 
//         ['Foo', 'entity.name.type'], ['GetX', 'variable']
//     ],
//     [
//         `package p; func f() { x := 1; x := 2 }`, 
//         ['x', 'markup.underline']
//     ],
//     [
//         `package p; func f(foo T) { foo.Foo() }`, 
//         ['Foo', 'variable']
//     ],
//     [
//         `package p; import "foo"; func f() { foo.Foo() }`, 
//         ['Foo', {not:'variable'}]
//     ],
//     [
//         `package p; import "foo"; func f(foo T) { foo.Foo() }`, 
//         ['Foo', 'variable']
//     ],
// ]
// test(goTests, colors.colorGo)

// async function test(testCases: TestCase[], color: colors.ColorFunction) {
//     await Parser.init()
//     const parser = new Parser()
//     const wasm = 'parsers/tree-sitter-go.wasm'
//     const lang = await Parser.Language.load(wasm)
//     parser.setLanguage(lang)
//     for (const [src, ...expect] of testCases) {
//         const tree = parser.parse(src)
//         const foundList = color(tree.rootNode, [{start: 0, end: tree.rootNode.endPosition.row}])
//         const foundMap = new Map<string, Set<string>>()
//         for (const [node, scope] of foundList) {
//             const code = node.text
//             if (!foundMap.has(code)) {
//                 foundMap.set(code, new Set<string>())
//             }
//             foundMap.get(code)!.add(scope)
//         }
//         function printSrcAndTree() {
//             console.error('Source:\t' + src)
//             console.error('Parsed:\t' + tree.rootNode.toString())
//         }
//         for (const [code, assert] of expect) {
//             if (typeof assert == 'string') {
//                 const scope = assert
//                 if (!foundMap.has(code)) {
//                     console.error(`Error:\tcode (${code}) was not found in (${join(foundMap.keys())})`)
//                     printSrcAndTree()
//                     continue
//                 }
//                 const foundScopes = foundMap.get(code)!
//                 if (!foundScopes.has(scope)) {
//                     console.error(`Error:\tscope (${scope}) was not among the scopes for (${code}) (${join(foundScopes.keys())})`)
//                     printSrcAndTree()
//                     continue
//                 }
//             } else {
//                 const scope = assert.not
//                 if (!foundMap.has(code)) {
//                     continue
//                 }
//                 const foundScopes = foundMap.get(code)!
//                 if (foundScopes.has(scope)) {
//                     console.error(`Error:\tbanned scope (${scope}) was among the scopes for (${code}) (${join(foundScopes.keys())})`)
//                     printSrcAndTree()
//                     continue
//                 }
//             }
//         }
//     }
// }
// function join(strings: IterableIterator<string>) {
//     var result = ''
//     for (const s of strings) {
//         result = result + s + ', '
//     }
//     return result.substring(0, result.length - 2)
// }
