import Parser = require('web-tree-sitter')
import colors = require('./colors')

type Assert = [string, string|{not:string}]
type TestCase = [string, ...Assert[]]

const goTests: TestCase[] = [
    [
        `package p; func f() int { }`, 
        ['f', 'entity.name.function'], ['int', 'entity.name.type']
    ],
    [
        `package p; type Foo struct { x int }`, 
        ['Foo', 'entity.name.type'], ['x', {not: 'variable'}]
    ],
    [
        `package p; type Foo interface { GetX() int }`, 
        ['Foo', 'entity.name.type'], ['int', 'entity.name.type'], ['GetX', {not: 'variable'}]
    ],
    [
        `package p; func f() { x := 1; x := 2 }`, 
        ['x', 'markup.underline']
    ],
    [
        `package p; func f(foo T) { foo.Foo() }`, 
        ['Foo', {not: 'entity.name.function'}]
    ],
    [
        `package p; func f() { Foo() }`, 
        ['Foo', 'entity.name.function']
    ],
    [
        `package p; import "foo"; func f() { foo.Foo() }`, 
        ['Foo', 'entity.name.function']
    ],
    [
        `package p; import "foo"; func f(foo T) { foo.Foo() }`, 
        ['Foo', {not: 'entity.name.function'}]
    ],
]
test(goTests, 'parsers/tree-sitter-go.wasm', colors.colorGo)

const rubyTests: TestCase[] = [
    [
        `def x.f
            1
        end`,
        ['f', 'entity.name.function'],
    ],
    [
        `def f
            1
        end`,
        ['f', 'entity.name.function'],
    ],
    [
        `class C
            def f
                @x = 1
            end
        end`,
        ['@x', 'variable'],
    ],
    [
        `class C
            private
            def f
                1
            end
        end`,
        ['C', 'entity.name.type'], ['private', 'keyword'], ['f', 'entity.name.function'], ['end', 'keyword'],
    ],
    [
        `class C
            private :f
            def f
                1
            end
        end`,
        ['C', 'entity.name.type'], ['private', 'keyword'], [':f', 'constant.language'], ['private', {not:'entity.name.function'}], ['f', 'entity.name.function'], ['end', 'keyword'],
    ],
    [
        `module M
            private
            def f
                1
            end
        end`,
        ['M', 'entity.name.type'], ['private', 'keyword'], ['f', 'entity.name.function'], ['end', 'keyword'],
    ],
    [
        `module M
            private :f
            def f
                1
            end
        end`,
        ['M', 'entity.name.type'], ['private', 'keyword'], ['private', {not:'entity.name.function'}], [':f', 'constant.language'], ['f', 'entity.name.function'], ['end', 'keyword'],
    ],
    [
        `while true
            puts "Hi"
        end`,
        ['end', 'keyword.control'], ['end', {not: 'keyword'}],
    ],
    [
        `foo 1`,
        ['foo', 'entity.name.function'],
    ],
    [
        `foo.bar`,
        ['bar', 'entity.name.function'],
    ],
]
test(rubyTests, 'parsers/tree-sitter-ruby.wasm', colors.colorRuby)

const rustTests: TestCase[] = [
    [
        `use foo::{Bar}`,
        ['Bar', 'entity.name.type',]
    ],
    [
        `let x = Foo::Bar(x)`, 
        ['Foo', 'entity.name.type'], ['Bar', {not:'entity.name.type'}]
    ],
    [
        `impl Foo {
            pub fn bar() { }
        }`,
        ['Foo', 'entity.name.type'], ['bar', 'variable'], ['bar', {not:'entity.name.function'}]
    ],
    [
        `fn foo() { }`,
        ['foo', 'entity.name.function']
    ],
    [
        `struct Foo {
            bar: int
        }`,
        ['Foo', 'entity.name.type'], ['bar', 'variable']
    ],
    // TODO more coverage
]
test(rustTests, 'parsers/tree-sitter-rust.wasm', colors.colorRust)

const typescriptTests: TestCase[] = [
    [
        `function foo() { }`,
        ['foo', 'entity.name.function'],
    ],
    [
        `let x: number = 1`,
        ['number', 'entity.name.type'],
    ],
    [
        `let x: Foo = 1`,
        ['Foo', 'entity.name.type'],
    ],
    [
        `let x = {y:1}`,
        ['y', 'variable'],
    ],
    [
        `class Foo {
            bar() { return 1 }
        }`,
        ['Foo', 'entity.name.type'], ['bar', 'variable']
    ],
    [
        `class Foo {
            get bar() { return 1 }
        }`,
        ['Foo', 'entity.name.type'], ['get', 'keyword'], ['bar', 'variable']
    ],
    [
        `class Foo {
            set bar(bar: number) { }
        }`,
        ['Foo', 'entity.name.type'], ['set', 'keyword'], ['bar', 'variable']
    ],
]
test(typescriptTests, 'parsers/tree-sitter-typescript.wasm', colors.colorTypescript)

async function test(testCases: TestCase[], wasm: string, color: colors.ColorFunction) {
    await Parser.init()
    const parser = new Parser()
    const lang = await Parser.Language.load(wasm)
    parser.setLanguage(lang)
    for (const [src, ...expect] of testCases) {
        const tree = parser.parse(src)
        const foundList = color(tree.rootNode, [{start: 0, end: tree.rootNode.endPosition.row}])
        const foundMap = new Map<string, Set<string>>()
        for (const [node, scope] of foundList) {
            const code = node.text
            if (!foundMap.has(code)) {
                foundMap.set(code, new Set<string>())
            }
            foundMap.get(code)!.add(scope)
        }
        function printSrcAndTree() {
            console.error('Source:\t' + src)
            console.error('Parsed:\t' + tree.rootNode.toString())
        }
        for (const [code, assert] of expect) {
            if (typeof assert == 'string') {
                const scope = assert
                if (!foundMap.has(code)) {
                    console.error(`Error:\tcode (${code}) was not found in (${join(foundMap.keys())})`)
                    printSrcAndTree()
                    continue
                }
                const foundScopes = foundMap.get(code)!
                if (!foundScopes.has(scope)) {
                    console.error(`Error:\tscope (${scope}) was not among the scopes for (${code}) (${join(foundScopes.keys())})`)
                    printSrcAndTree()
                    continue
                }
            } else {
                const scope = assert.not
                if (!foundMap.has(code)) {
                    continue
                }
                const foundScopes = foundMap.get(code)!
                if (foundScopes.has(scope)) {
                    console.error(`Error:\tbanned scope (${scope}) was among the scopes for (${code}) (${join(foundScopes.keys())})`)
                    printSrcAndTree()
                    continue
                }
            }
        }
    }
}
function join(strings: IterableIterator<string>) {
    var result = ''
    for (const s of strings) {
        result = result + s + ', '
    }
    return result.substring(0, result.length - 2)
}