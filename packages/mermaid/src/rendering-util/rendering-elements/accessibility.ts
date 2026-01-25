import type { D3Selection } from '../../types.js';

interface Edge {
  v: string;
  w: string;
  name?: string;
  label?: string;
}

interface Node {
  id: string;
  label: string;
}

/**
 * Adds an accessible list of edges to a node container.
 *
 * @param nodeContainer - The container for the node (usually with role="listitem").
 * @param edges - The list of edges to display.
 * @param edgeType - 'outbound' or 'inbound'.
 * @param labelText - The label for the list of edges.
 * @param getNodeLabel - A function to retrieve the label of a node given its ID.
 */
export function addAccessibleEdgeList(
  nodeContainer: D3Selection<SVGGElement>,
  edges: { id: string; label?: string }[],
  edgeType: 'outbound' | 'inbound',
  labelText: string
) {
  if (!edges || edges.length === 0) {
    return;
  }

  const list = nodeContainer
    .insert('g')
    .attr('class', 'visually-hidden')
    .attr('role', 'list')
    .attr('aria-label', labelText);

  edges.forEach((edge) => {
    const listItem = list.insert('g').attr('role', 'listitem');
    listItem
      .insert('a')
      .attr('href', `#${edge.id}`)
      .attr('aria-label', edge.label || edge.id);
  });
}
