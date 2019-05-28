import * as Parser from 'web-tree-sitter'
import { Colorizer } from './colorizer-base'

export class ColorizerRuby extends Colorizer {
    public color(node: Parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) {
        const colors: [Parser.SyntaxNode, string][] = []
        const control = ['while', 'until', 'if', 'unless', 'for', 'begin', 'elsif', 'else', 'ensure', 'when', 'case', 'do_block']
        const variables = ['instance_variable', 'class_variable', 'global_variable']
        const isVisible = super.isVisible
        function scan(x: Parser.SyntaxNode) {
            if (!isVisible(node, visibleRanges)) return
            if (node.type == 'method') {
                colors.push([node.children[1]!, 'entity.name.function'])
            } else if (node.type == 'singleton_method') {
                colors.push([node.children[3], 'entity.name.function'])
            } else if (variables.includes(node.type)) {
                colors.push([node, 'variable'])
            } else if (node.type == 'call' && node.lastChild && node.lastChild.type == 'identifier') {
                colors.push([node.lastChild, 'entity.name.function'])
            } else if (node.type == 'method_call' && node.firstChild && node.firstChild.type == 'identifier') {
                colors.push([node.firstChild, 'entity.name.function'])
            } else if (node.type == 'end') {
                if (node.parent && control.includes(node.parent.type)) {
                    colors.push([node, 'keyword.control'])
                } else {
                    colors.push([node, 'keyword'])
                }
            } else if (node.type == 'constant') {
                colors.push([node, 'entity.name.type'])
            } else if (node.type == 'symbol') {
                colors.push([node, 'constant.language'])
            }
            for (const child of node.children) {
                scan(child)
            }
        }
        scan(node)

        return colors
    }
}