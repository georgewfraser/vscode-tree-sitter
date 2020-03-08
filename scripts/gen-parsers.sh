#!/usr/bin/env bash

# TODO this still doesn't work on my mac laptop :(
# fix it and delete parsers/*.wasm from git

set -e

# Build parsers
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-go
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-cpp
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-ruby
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-rust
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-typescript/typescript
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-javascript

mv *.wasm parsers