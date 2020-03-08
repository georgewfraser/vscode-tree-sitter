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
    [
        `package p; func f(x other.T) { }`,
        ['T', 'entity.name.type'],
    ],
    [
        `package p; var _ = f(Foo{})`,
        ['Foo', 'entity.name.type'],
    ],
    [
        `package p; import (foo "foobar"); var _ = foo.Bar()`,
        ['foo', {not:'variable'}], ['Bar', 'entity.name.function'],
    ],
    [
        `package p
        func f(a int) int {
            switch a {
            case 1: 
                x := 1
                return x
            case 2:
                x := 2
                return x
            }
        }`,
        ['x', {not:'markup.underline'}]
    ],
    [
        `package p
        func f(a interface{}) int {
            switch a.(type) {
            case *int: 
                x := 1
                return x
            case *int:
                x := 2
                return x
            }
        }`,
        ['x', {not:'markup.underline'}]
    ],
    [
        `package p
        func f(a interface{}) int {
            for i := range 10 {
                print(i)
            }
            for i := range 10 {
                print(i)
            }
        }`,
        ['i', {not:'markup.underline'}]
    ],
    [
        `package p
        func f(a interface{}) int {
            if i := 1; i < 10 {
                print(i)
            }
            if i := 1; i < 10 {
                print(i)
            }
        }`,
        ['i', {not:'markup.underline'}]
    ],
    [
        `package p
        func f(a interface{}) {
            if aa, ok := a.(*type); ok {
                print(aa)
            }
        }`,
        ['aa', {not:'variable'}]
    ],
    [
        `package p
        func f(a interface{}) {
            switch aa := a.(type) {
                case *int:
                    print(aa)
            }
        }`,
        ['aa', {not:'variable'}]
    ],
    [
        `package p
        func f() {
            switch aa.(type) {
                case *int:
                    print(aa)
            }
        }`,
        ['aa', 'variable']
    ],
    [
        `package p
        func f(a interface{}) {
            switch aa := a.(type) {
                case *int:
                    print(aa)
            }
            switch aa := a.(type) {
                case *int:
                    print(aa)
            }
        }`,
        ['aa', {not:'markup.underline'}]
    ],
    [
        `package p
        func f(a ...int) {
            print(a)
        }`,
        ['a', {not:'variable'}]
    ],
    [
        `package p
        type Foo interface {
            foo(i int)
        }`,
        ['i', {not: 'variable'}]
    ],
    [
        `package p
        type Foo interface {
            foo(i int)
            bar(i int)
        }`,
        ['i', {not: 'markup.underline'}]
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
        `let x = Foo::bar(x)`, 
        ['Foo', 'entity.name.type'], ['bar', {not:'entity.name.type'}]
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
        const scope2ranges = color(tree, [{start: 0, end: tree.rootNode.endPosition.row}])
        const code2scopes = new Map<string, Set<string>>()
        for (const [scope, ranges] of scope2ranges) {
            for (const range of ranges) {
                const start = index(src, range.start)
                const end = index(src, range.end)
                const code = src.substring(start, end)
                if (!code2scopes.has(code)) {
                    code2scopes.set(code, new Set<string>())
                }
                code2scopes.get(code)!.add(scope)
            }
        }
        function printSrcAndTree() {
            console.error('Source:\t' + src)
            console.error('Parsed:\t' + tree.rootNode.toString())
        }
        for (const [code, assert] of expect) {
            if (typeof assert == 'string') {
                const scope = assert
                if (!code2scopes.has(code)) {
                    console.error(`Error:\tcode (${code}) was not found in (${join(code2scopes.keys())})`)
                    printSrcAndTree()
                    continue
                }
                const foundScopes = code2scopes.get(code)!
                if (!foundScopes.has(scope)) {
                    console.error(`Error:\tscope (${scope}) was not among the scopes for (${code}) (${join(foundScopes.keys())})`)
                    printSrcAndTree()
                    continue
                }
            } else {
                const scope = assert.not
                if (!code2scopes.has(code)) {
                    continue
                }
                const foundScopes = code2scopes.get(code)!
                if (foundScopes.has(scope)) {
                    console.error(`Error:\tbanned scope (${scope}) was among the scopes for (${code}) (${join(foundScopes.keys())})`)
                    printSrcAndTree()
                    continue
                }
            }
        }
    }
}
function index(code: string, point: Parser.Point): number {
    let row = 0
    let column = 0
    for (let i = 0; i < code.length; i++) {
        if (row == point.row && column == point.column) {
            return i
        }
        if (code[i] == '\n') {
            row++
            column = 0
        } else {
            column++
        }
    }
    return code.length
}
function join(strings: IterableIterator<string>) {
    var result = ''
    for (const s of strings) {
        result = result + s + ', '
    }
    return result.substring(0, result.length - 2)
}