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

  it('should have visually hidden links for edges', async () => {
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

    // Check for hidden link
    const link = nodeAWrapper?.querySelector('a.visually-hidden');
    expect(link).not.toBeNull();
    expect(link?.textContent).toContain('Link to B');

    // Verify target ID
    const href = link?.getAttribute('href');
    expect(href?.startsWith('#')).toBe(true);
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
});
