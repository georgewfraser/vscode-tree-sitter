#!/bin/bash

set -e

# Build vsix
npm run-script build

code --install-extension build.vsix --force

echo 'Reload VSCode to update extension'
