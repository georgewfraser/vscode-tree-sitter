#!/bin/bash

set -e

# Build vsix
vsce package -o build.vsix

code --install-extension build.vsix --force

echo 'Reload VSCode to update extension'
