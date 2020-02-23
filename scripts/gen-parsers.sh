#!/usr/bin/env bash

# TODO this still doesn't work on my mac laptop :(
# fix it and delete parsers/*.wasm from git

set -e

function compile {
parser_c=`find $2 -name parser.c`
src_dir=`dirname $parser_c`
emcc \
    -o $1.wasm \
    -Os \
    -s WASM=1 \
    -s SIDE_MODULE=1 \
    -s TOTAL_MEMORY=65536000 \
    -s NODEJS_CATCH_EXIT=0 \
    -s ASSERTIONS=1 \
    -s 'EXPORTED_FUNCTIONS=["_$1"]' \
    -fno-exceptions \
    -I $src_dir $parser_c
}

# Build parsers
compile tree-sitter-go node_modules/tree-sitter-go
compile tree-sitter-cpp node_modules/tree-sitter-cpp
compile tree-sitter-ruby node_modules/tree-sitter-ruby
compile tree-sitter-rust node_modules/tree-sitter-rust
compile tree-sitter-typescript node_modules/tree-sitter-typescript/typescript
compile tree-sitter-javascript node_modules/tree-sitter-javascript
compile tree-sitter-verilog node_modules/tree-sitter-verilog

mv *.wasm parsers