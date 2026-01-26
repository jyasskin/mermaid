import { describe, it, expect, beforeEach } from 'vitest';
import mermaid from '../../mermaid.js';

describe('Flowchart Accessibility', () => {
  beforeEach(() => {
    mermaid.initialize({
      startOnLoad: false,
    });
    document.body.innerHTML = '';
    // Mock getBBox for SVG elements
    Object.defineProperty(SVGElement.prototype, 'getBBox', {
      writable: true,
      value: () => ({
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        top: 0,
        right: 10,
        bottom: 10,
        left: 0,
      }),
    });
  });

  const renderDiagram = async (code: string) => {
    const { svg } = await mermaid.render('diagram', code);
    const div = document.createElement('div');
    div.innerHTML = svg;
    document.body.appendChild(div);
    return div;
  };

  it('should have role="list" on nodes container', async () => {
    await renderDiagram(`
      flowchart TD
        A
    `);
    const nodesGroup = document.querySelector('.nodes');
    expect(nodesGroup?.getAttribute('role')).toBe('list');
  });

  it('should have role="listitem" on node containers', async () => {
    await renderDiagram(`
      flowchart TD
        A
    `);
    // The list item is the wrapper around the .node element
    const nodeItem = document.querySelector('g[role="listitem"] > .node');
    expect(nodeItem).not.toBeNull();
    const listItem = nodeItem?.parentElement;
    expect(listItem?.getAttribute('role')).toBe('listitem');
  });

  it('should have aria-labelledby on node pointing to label', async () => {
    await renderDiagram(`
      flowchart TD
        A
    `);
    const nodeItem = document.querySelector('g[role="listitem"] > .node');
    const listItem = nodeItem?.parentElement;
    const labelId = listItem?.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();

    const labelGroup = document.getElementById(labelId!);
    expect(labelGroup).not.toBeNull();
    expect(labelGroup?.textContent).toContain('A');
    expect(labelGroup?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should have visually hidden edge lists for outbound edges', async () => {
    await renderDiagram(`
      flowchart TD
        A --> B
    `);

    // Find node A
    const listItems = document.querySelectorAll('g[role="listitem"]');
    let nodeAWrapper;
    for (const item of listItems) {
      if (item.textContent?.includes('A')) {
        nodeAWrapper = item;
        break;
      }
    }

    expect(nodeAWrapper).toBeDefined();

    // Check for hidden list
    const list = nodeAWrapper?.querySelector('g.visually-hidden[role="list"]');
    expect(list).not.toBeNull();
    expect(list?.getAttribute('aria-label')).toBe('Outbound edges');

    const listItem = list?.querySelector('g[role="listitem"]');
    const link = listItem?.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('aria-label')).toBe('B');

    // Verify target ID
    const href = link?.getAttribute('href');
    expect(href?.startsWith('#')).toBe(true);
  });

  it('should support custom outbound edge labels', async () => {
    mermaid.initialize({
      flowchart: {
        accessibility: {
          outboundEdgesLabel: "Going to"
        }
      }
    });
    await renderDiagram(`
      flowchart TD
        A --> B
    `);

    const nodeAWrapper = Array.from(document.querySelectorAll('g[role="listitem"]'))
      .find(item => item.textContent?.includes('A'));

    const list = nodeAWrapper?.querySelector('g.visually-hidden[role="list"]');
    expect(list?.getAttribute('aria-label')).toBe('Going to');
  });

  it('should include inbound edges when configured', async () => {
    mermaid.initialize({
      flowchart: {
        accessibility: {
          listInboundEdges: true,
          inboundEdgesLabel: "Coming from"
        }
      }
    });
    await renderDiagram(`
      flowchart TD
        A --> B
    `);

    // Check node B for inbound edges
    const nodeBWrapper = Array.from(document.querySelectorAll('g[role="listitem"]'))
      .find(item => item.textContent?.includes('B'));

    const lists = nodeBWrapper?.querySelectorAll('g.visually-hidden[role="list"]');
    // B has no outbound edges, so it should have 1 list (inbound)
    expect(lists?.length).toBe(1);
    const list = lists![0];
    expect(list.getAttribute('aria-label')).toBe('Coming from');

    const link = list.querySelector('a');
    expect(link?.getAttribute('aria-label')).toBe('A');
  });

  it('should handle subgraphs correctly', async () => {
     await renderDiagram(`
      flowchart TD
        subgraph S1
          A
        end
    `);

    // In Dagre, clusters are siblings to nodes, but both are inside role="list"
    // The cluster itself has role="listitem" in our implementation
    const cluster = document.querySelector('.cluster[role="listitem"]');
    expect(cluster).not.toBeNull();

    const labelId = cluster?.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const label = document.getElementById(labelId!);
    expect(label?.textContent).toContain('S1');
    expect(label?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should hide edges from accessibility tree', async () => {
    await renderDiagram(`
      flowchart TD
        A --> B
    `);
    const edgePaths = document.querySelector('.edgePaths');
    const edgeLabels = document.querySelector('.edgeLabels');

    expect(edgePaths?.getAttribute('aria-hidden')).toBe('true');
    expect(edgeLabels?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should have correct nodes in subgraphs', async () => {
    await renderDiagram(`
      flowchart TD
        subgraph S1
          A
        end
        subgraph S2
          B
        end
    `);

    const s1 = document.getElementById('S1');
    const s2 = document.getElementById('S2');

    expect(s1).not.toBeNull();
    expect(s2).not.toBeNull();

    // Find S1's list of nodes
    const nodeA = Array.from(document.querySelectorAll('.node')).find(n => n.textContent?.includes('A'));
    const nodeB = Array.from(document.querySelectorAll('.node')).find(n => n.textContent?.includes('B'));

    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();

    // Traverse up from A to find the list that contains it
    const listA = nodeA!.closest('[role="list"]');
    // Traverse up from B
    const listB = nodeB!.closest('[role="list"]');

    expect(listA).not.toBeNull();
    expect(listB).not.toBeNull();

    expect(listA).not.toBe(listB);

    // Verify A is not in list B and vice versa
    expect(listA!.contains(nodeB!)).toBe(false);
    expect(listB!.contains(nodeA!)).toBe(false);
  });
});
