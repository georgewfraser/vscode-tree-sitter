import * as Parser from 'web-tree-sitter'
import { Colorizer } from './colorizer-base'

export class ColorizerTS extends Colorizer {

    color(node: Parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) {
        const isVisible = super.isVisible
        const colors: [Parser.SyntaxNode, string][] = []
        function scan(node: Parser.SyntaxNode) {
            if (!isVisible(node, visibleRanges)) return
            if (node.type == 'identifier' && node.parent != null && node.parent.type == 'function') {
                colors.push([node, 'entity.name.function'])
            } else if (node.type == 'type_identifier' || node.type == 'predefined_type') {
                colors.push([node, 'entity.name.type'])
            } else if (node.type == 'property_identifier') {
                colors.push([node, 'variable'])
            } else if (node.type == 'method_definition' && ['get', 'set'].includes(node.firstChild!.text)) {
                colors.push([node.firstChild!, 'keyword'])
            }
            for (const child of node.children) {
                scan(child)
            }
        }
        scan(node)

        return colors
    }
}