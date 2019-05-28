import * as Parser from 'web-tree-sitter'
import { Colorizer } from './colorizer-base'

export class ColorizerRust extends Colorizer {
    
    color(node: Parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) {
        const colors: [Parser.SyntaxNode, string][] = []
        const isVisible = super.isVisible
        function looksLikeType(id: string) {
            if (id.length == 0) return false
            if (id[0] != id[0].toUpperCase()) return false
            for (const c of id) {
                if (c.toLowerCase() == c) return true
            }
            return false
        }

        function scanUse(node: Parser.SyntaxNode) {
            if (node.type == 'identifier' && looksLikeType(node.text)) {
                colors.push([node, 'entity.name.type'])
            }
            for (const child of node.children) {
                scanUse(child)
            }
        }

        function scan(node: Parser.SyntaxNode) {
            if (!isVisible(node, visibleRanges)) return
            if (node.type == 'identifier' && node.parent != null && node.parent.type == 'function_item' && node.parent.parent != null && node.parent.parent.type == 'declaration_list') {
                colors.push([node, 'variable'])
            } else if (node.type == 'identifier' && node.parent != null && node.parent.type == 'function_item') {
                colors.push([node, 'entity.name.function'])
            } else if (node.type == 'identifier' && node.parent != null && node.parent.type == 'scoped_identifier' && node.parent.parent != null && node.parent.parent.type == 'function_declarator') {
                colors.push([node, 'entity.name.function'])
            } else if (node.type == 'use_declaration') {
                scanUse(node)
                return
            } else if (node.type == 'type_identifier' || node.type == 'primitive_type') {
                colors.push([node, 'entity.name.type'])
            } else if (node.type == 'field_identifier') {
                colors.push([node, 'variable'])
            }
            for (const child of node.children) {
                scan(child)
            }
        }
        scan(node)

        return colors
    }
}