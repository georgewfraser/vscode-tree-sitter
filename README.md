# Tree Sitter for VSCode

This extension gives VSCode support for [tree-sitter](http://tree-sitter.github.io/tree-sitter/) syntax coloring. Examples with tree-sitter coloring on the right:

## Go

![Go](./screenshots/go.png)

## Rust

![Rust](./screenshots/rust.png)

## C++

![C++](./screenshots/cpp.png)

## Ruby

![Ruby](./screenshots/ruby.png)

## Javascript / Typescript

![Typescript](./screenshots/typescript.png)

## Verilog

![Verilog](./screenshots/typescript.png)

## Contributing

### Fixing colorization of an existing language

If you see something getting colored wrong, or something that should be colored but isn't, you can help! The simplest way to help is to create an issue with a simple example, a screenshot, and an explanation of what is wrong. 

You are also welcome to fix the problem yourself and submit a PR. Colorization is performed by the various `colorLanguage(x, editor)` functions in `src/colors.ts`. When working on the colorization rules, please keep in mind two core principles:

1. Good colorization is *consistent*. It's better to not color at all than to color inconsistently.
2. Good colorization is *selective*. The fewer things that we color, the more emphasis the color gives.

### Adding a new language

It's straightforward to add any [language with a tree-sitter grammar](https://tree-sitter.github.io/tree-sitter/).

1. Add a dependency on the npm package for that language: `npm install tree-sitter-yourlang`.
2. Add a color function to `./lib/colors.ts`
3. Add a language to the dictionary at the top of `./lib/extension.ts`
4. Add a **simplified** TextMate grammar to `./textmate/yourlang.tmLanguage.json`. The job of this textmate grammar is just to color keywords and simple literals; anything tricky should be left white and colored by your color function.
5. Add a reference to the grammar to the [contributes.grammars section of package.json](https://github.com/georgewfraser/vscode-tree-sitter/blob/fb4400b78481845c6a8497d079508d28aea25c19/package.json#L26). `yourlang` must be a [VSCode language identifier](https://code.visualstudio.com/docs/languages/identifiers).
6. Add a reference to `onLanguage:yourlang` to the [activationEvents section of package.json](https://github.com/georgewfraser/vscode-tree-sitter/blob/fb4400b78481845c6a8497d079508d28aea25c19/package.json#L18). `yourlang` must be a [VSCode language identifier](https://code.visualstudio.com/docs/languages/identifiers).
7. Add an example to `examples/yourlang`.
8. Hit `F5` in VSCode, with this project open, to test your changes.
9. Take a screenshot comparing before-and-after and add it to the above list.
10. Submit a PR!