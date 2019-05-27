#!/bin/bash

set -e

npm run compile
node out/test.js
