# Tree Sitter for VSCode

**WINDOWS AND LINUX USERS:** Please download the appropriate .vsix file from [here](https://github.com/georgewfraser/vscode-tree-sitter/releases) and install manually until https://github.com/microsoft/vscode/issues/23251 is complete.

This extension gives VSCode support for [tree-sitter](http://tree-sitter.github.io/tree-sitter/) syntax coloring. Examples with tree-sitter coloring on the right:

## Go

![Go](./screenshots/go.png)

## Rust

![Rust](./screenshots/rust.png)

## C++

![C++](./screenshots/cpp.png)

## Typescript

![Typescript](./screenshots/typescript.png)

## Adding a new language

It's straightforward to add any [language with a tree-sitter grammar](https://tree-sitter.github.io/tree-sitter/).

1. Add a dependency on the npm package for that language: `npm install tree-sitter-yourlang`.
2. Rebuild the dependency for electron `./scripts/electron-rebuild.sh`.
3. Add the language and color function to the [dictionary at the top of ./lib/extension.ts](https://github.com/georgewfraser/vscode-tree-sitter/blob/232c28e3708bb8f1913d5d067f1c9668f263d5b2/src/extension.ts#L5).
4. Add a **simplified** TextMate grammar to `./src/yourlang.tmLanguage.json`. The job of this textmate grammar is just to color keywords and literals.
5. Add a reference to the grammar to the [contributes.grammars section of package.json](https://github.com/georgewfraser/vscode-tree-sitter/blob/fb4400b78481845c6a8497d079508d28aea25c19/package.json#L26). `yourlang` must be a [VSCode language identifier](https://code.visualstudio.com/docs/languages/identifiers).
6. Add a reference to `onLanguage:yourlang` to the [activationEvents section of package.json](https://github.com/georgewfraser/vscode-tree-sitter/blob/fb4400b78481845c6a8497d079508d28aea25c19/package.json#L18). `yourlang` must be a [VSCode language identifier](https://code.visualstudio.com/docs/languages/identifiers).
7. Add an example to `examples/yourlang`.
8. Hit `F5` in VSCode, with this project open, to test your changes.
9. Take a screenshot comparing before-and-after and add it to the above list.
10. Submit a PR!

## Customizing colors

The colors are defined in package.json (`treeSitter.field`, `treeSitter.type`, `treeSitter.function`), and are [themable](https://code.visualstudio.com/api/extension-guides/color-theme).