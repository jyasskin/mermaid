import type { D3Selection } from '../../types.js';
/**
 * Adds an accessible list of edges to a node container.
 *
 * @param nodeContainer - The container for the node (usually with role="listitem").
 * @param edges - The list of edges to display.
 * @param edgeType - 'outbound' or 'inbound'.
 * @param labelText - The label for the list of edges.
 * @param getNodeLabel - A function to retrieve the label of a node given its ID.
 */
export declare function addAccessibleEdgeList(nodeContainer: D3Selection<SVGGElement>, edges: {
    id: string;
    label?: string;
}[], edgeType: 'outbound' | 'inbound', labelText: string): void;
