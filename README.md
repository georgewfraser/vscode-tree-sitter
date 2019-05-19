# Tree Sitter for VSCode

This extension gives VSCode support for [tree-sitter](http://tree-sitter.github.io/tree-sitter/) syntax coloring. Examples with tree-sitter coloring on the right:

## Typescript

![Typescript](./screenshots/typescript.png)

## Go

![Go](./screenshots/go.png)

## C++

![Go](./screenshots/cpp.png)

## Implementation

For each supported language `$lang`, vscode-tree-sitter replaces VSCode's builtin grammar with a simplified grammar `./lib/$lang.tmLanguage.json`.
On each edit, `./lib/extension.ts` runs the tree-sitter incremental parser, and uses VSCode's [setDecorations](https://code.visualstudio.com/api/references/vscode-api#workspace) API to apply the advanced syntax coloring produced by tree-sitter to the file.

## Customizing colors

The colors are defined in package.json (`treeSitter.field`, `treeSitter.type`, `treeSitter.function`), and are [themable](https://code.visualstudio.com/api/extension-guides/color-theme).