import * as Parser from 'web-tree-sitter'
import { Colorizer } from './colorizer-base'

export class ColorizerCpp extends Colorizer {

    color(node: Parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) {
        const isVisible = super.isVisible
        const colors: [Parser.SyntaxNode, string][] = []
        function scan(node: Parser.SyntaxNode) {
            if (!isVisible(node, visibleRanges)) return
            if (node.type == 'identifier' && node.parent != null && node.parent.type == 'function_declarator') {
                colors.push([node, 'entity.name.function'])
            }
            else if (node.type == 'identifier' &&
                     node.parent != null && node.parent.type == 'scoped_identifier' &&
                     node.parent.parent != null && node.parent.parent.type == 'function_declarator') {
                colors.push([node, 'entity.name.function'])
            }
            else if (node.type == 'type_identifier') {
                colors.push([node, 'entity.name.type'])
            }
            else if (node.type == 'field_identifier') {
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