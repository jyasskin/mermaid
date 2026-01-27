import { log } from '../../logger.js';
import { shapes } from './shapes.js';
import type { Node, NonClusterNode, ShapeRenderOptions } from '../types.js';
import type { SVGGroup } from '../../mermaid.js';
import type { D3Selection } from '../../types.js';
import type { graphlib } from 'dagre-d3-es';

type ShapeHandler = (typeof shapes)[keyof typeof shapes];
type NodeElement = D3Selection<SVGAElement> | Awaited<ReturnType<ShapeHandler>>;

const nodeElems = new Map<string, NodeElement>();

export async function insertNode(
  elem: SVGGroup,
  node: NonClusterNode,
  renderOptions: ShapeRenderOptions
) {
  //special check for rect shape (with or without rounded corners)
  if (node.shape === 'rect') {
    if (node.rx && node.ry) {
      node.shape = 'roundedRect';
    } else {
      node.shape = 'squareRect';
    }
  }

  const shapeHandler = node.shape ? shapes[node.shape] : undefined;

  if (!shapeHandler) {
    throw new Error(`No such shape: ${node.shape}. Please check your syntax.`);
  }

  // Create the outer G element that will act as the node container
  const outerG = elem.insert('g').attr('id', node.id);

  if (node.tooltip) {
    outerG.attr('title', node.tooltip);
  }

  let innerParent: D3Selection<SVGGElement> | D3Selection<SVGAElement> = outerG;
  let linkEl;

  if (node.link) {
    // Add link when appropriate
    let target;
    if (renderOptions.config.securityLevel === 'sandbox') {
      target = '_top';
    } else if (node.linkTarget) {
      target = node.linkTarget ?? '_blank';
    }

    linkEl = outerG
      .insert<SVGAElement>('svg:a')
      .attr('xlink:href', node.link)
      .attr('target', target ?? null);

    innerParent = linkEl;

    // Add clickable class to link element
    linkEl.attr('class', 'clickable');
  }

  // Draw the shape into the inner parent
  await shapeHandler(innerParent, node, renderOptions);

  // Clickable logic for non-link cases
  if (node.haveCallback && !node.link) {
    const currentClass = outerG.attr('class');
    outerG.attr('class', (currentClass ? currentClass + ' ' : '') + 'clickable');
  }

  // Update nodeElems with the container element
  const newEl = outerG as NodeElement;
  nodeElems.set(node.id, newEl);

  return newEl;
}

export const setNodeElem = (elem: NodeElement, node: Pick<Node, 'id'>) => {
  nodeElems.set(node.id, elem);
};

export const clear = () => {
  nodeElems.clear();
};

export const positionNode = (node: ReturnType<graphlib.Graph['node']>) => {
  const el = nodeElems.get(node.id)!;
  log.trace(
    'Transforming node',
    node.diff,
    node,
    'translate(' + (node.x - node.width / 2 - 5) + ', ' + node.width / 2 + ')'
  );
  const padding = 8;
  const diff = node.diff || 0;
  if (node.clusterNode) {
    el.attr(
      'transform',
      'translate(' +
        (node.x + diff - node.width / 2) +
        ', ' +
        (node.y - node.height / 2 - padding) +
        ')'
    );
  } else {
    el.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
  }
  return diff;
};
