import * as Parser from 'web-tree-sitter'
import { Colorizer } from './colorizer-base'

export class ColorizerGo extends Colorizer {
    public color(root: Parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) {
        // Guess package names based on paths
        var packages: { [id: string]: boolean } = {}
        function scanImport(x: Parser.SyntaxNode) {
            if (x.type == 'import_spec') {
                const str = x.firstChild!.text
                const full = str.substring(1, str.length - 1)
                const parts = full.split('/')
                const last = parts[parts.length - 1]
                packages[last] = true
            }
            for (const child of x.children) {
                scanImport(child)
            }
        }
        // Keep track of local vars that shadow packages
        const allScopes: Scope[] = []
        class Scope {
            private locals = new Map<string, { modified: boolean, references: Parser.SyntaxNode[] }>()
            private parent: Scope | null

            constructor(parent: Scope | null) {
                this.parent = parent
                allScopes.push(this)
            }

            declareLocal(id: string) {
                if (this.locals.has(id)) {
                    this.locals.get(id)!.modified = true
                } else {
                    this.locals.set(id, { modified: false, references: [] })
                }
            }

            modifyLocal(id: string) {
                if (this.locals.has(id)) this.locals.get(id)!.modified = true
                else if (this.parent != null) this.parent.modifyLocal(id)
            }

            referenceLocal(x: Parser.SyntaxNode) {
                const id = x.text
                if (this.locals.has(id)) this.locals.get(id)!.references.push(x)
                else if (this.parent != null) this.parent.referenceLocal(x)
            }

            isLocal(id: string): boolean {
                if (this.locals.has(id)) return true
                if (this.parent != null) return this.parent.isLocal(id)
                return false
            }

            isModified(id: string): boolean {
                if (this.locals.has(id)) return this.locals.get(id)!.modified
                if (this.parent != null) return this.parent.isModified(id)
                return false
            }

            modifiedLocals(): Parser.SyntaxNode[] {
                const all = []
                for (const { modified, references } of this.locals.values()) {
                    if (modified) {
                        all.push(...references)
                    }
                }
                return all
            }

            isPackage(id: string): boolean {
                return packages[id] && !this.isLocal(id)
            }

            isRoot(): boolean {
                return this.parent == null
            }
        }
        const colors: [Parser.SyntaxNode, string][] = []
        const isVisible = super.isVisible
        function scan(x: Parser.SyntaxNode, scope: Scope) {
            const visible = isVisible(x, visibleRanges)
            switch (x.type) {
                case 'import_declaration':
                    scanImport(x)
                    break
                case 'parameter_declaration':
                case 'var_spec':
                case 'const_spec':
                    if (!scope.isRoot()) {
                        for (const id of x.children) {
                            if (id.type == 'identifier') {
                                scope.declareLocal(id.text)
                            }
                        }
                    }
                    scanChildren(x, scope)
                    break
                case 'short_var_declaration':
                    if (!scope.isRoot()) {
                        for (const id of x.firstChild!.children) {
                            if (id.type == 'identifier') {
                                scope.declareLocal(id.text)
                            }
                        }
                    }
                    scanChildren(x, scope)
                    break
                case 'inc_statement':
                case 'dec_statement':
                    if (!scope.isRoot()) {
                        scope.modifyLocal(x.firstChild!.text)
                    }
                    scanChildren(x, scope)
                    break
                case 'assignment_statement':
                    if (!scope.isRoot()) {
                        for (const id of x.firstChild!.children) {
                            if (id.type == 'identifier') {
                                scope.modifyLocal(id.text)
                            }
                        }
                    }
                    scanChildren(x, scope)
                    break
                case 'identifier':
                    if (!scope.isRoot()) {
                        scope.referenceLocal(x)
                    }
                    if (visible && x.parent!.type == 'function_declaration') {
                        // func f() { ... }
                        colors.push([x, 'entity.name.function'])
                    }
                    break
                case 'function_declaration':
                case 'method_declaration':
                case 'func_literal':
                case 'block':
                    // Skip top-level declarations that aren't visible
                    if (visible || !scope.isRoot()) {
                        scanChildren(x, new Scope(scope))
                    }
                    break
                case 'type_identifier':
                    if (visible) {
                        // x: type
                        colors.push([x, 'entity.name.type'])
                    }
                    break
                case 'field_identifier':
                    if (visible) {
                        // pkg.member
                        const isPackage = x.parent!.type == 'selector_expression' && scope.isPackage(x.parent!.firstChild!.text)
                        // obj.member
                        if (!isPackage) colors.push([x, 'variable'])
                    }
                    break
                default:
                    // Skip top-level declarations that aren't visible
                    if (visible || !scope.isRoot()) {
                        scanChildren(x, scope)
                    }
            }
        }
        function scanChildren(x: Parser.SyntaxNode, scope: Scope) {
            for (const child of x.children) {
                scan(child, scope)
            }
        }
        scan(root, new Scope(null))
        for (const scope of allScopes) {
            for (const local of scope.modifiedLocals()) {
                colors.push([local, 'markup.underline'])
            }
        }

        return colors
    }
}