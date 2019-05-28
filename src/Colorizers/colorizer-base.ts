import * as Parser from 'web-tree-sitter'
export type ColorFunction = (x: Parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) => [Parser.SyntaxNode, string][]

export class Colorizer {
    constructor() { }

    public color(root: Parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) { 
        const colors: [Parser.SyntaxNode, string][] = []
        return colors
    }

    protected isVisible(x: Parser.SyntaxNode, visibleRanges: { start: number, end: number }[]) {
        for (const { start, end } of visibleRanges) {
            const overlap = x.startPosition.row <= end + 1 && start - 1 <= x.endPosition.row
            if (overlap) return true
        }
        return false
    }
}