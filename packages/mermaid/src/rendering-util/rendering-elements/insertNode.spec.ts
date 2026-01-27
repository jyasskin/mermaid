import { describe, expect, vi } from 'vitest';
import { jsdomIt, ensureNodeFromSelector } from '../../tests/util.js';
import { insertNode, clear } from './nodes.js';
import type { NonClusterNode, ShapeRenderOptions } from '../types.js';

describe('insertNode', () => {
  const mockRenderOptions: ShapeRenderOptions = {
    config: { securityLevel: 'strict' },
    dir: 'TB',
    // @ts-expect-error - partial mock
    layout: {},
  };

  const createMockNode = (id: string, overrides: Partial<NonClusterNode> = {}): NonClusterNode => ({
    id,
    type: 'round',
    label: 'Test Node',
    shape: 'rect',
    ...overrides,
  });

  jsdomIt('should create a node without link correctly', async ({ svg }) => {
    const parent = svg.append('g');
    const node = createMockNode('node1');

    await insertNode(parent, node, mockRenderOptions);

    const outerG = ensureNodeFromSelector('g#node1', parent.node()!);
    expect(outerG.tagName.toLowerCase()).toBe('g');
    expect(outerG.getAttribute('id')).toBe('node1');

    // Check that there is no <a> tag
    expect(outerG.querySelector('a')).toBeNull();

    // Check that shape (rect) is inside outerG
    expect(outerG.querySelector('rect')).not.toBeNull();
  });

  jsdomIt('should create a node with link correctly', async ({ svg }) => {
    const parent = svg.append('g');
    const node = createMockNode('node2', { link: 'http://example.com' });

    await insertNode(parent, node, mockRenderOptions);

    const outerG = ensureNodeFromSelector('g#node2', parent.node()!);
    const linkEl = outerG.querySelector('a');
    expect(linkEl).not.toBeNull();
    expect(linkEl?.getAttribute('href')).toBe('http://example.com');

    // Check that shape (rect) is inside <a>
    expect(linkEl?.querySelector('rect')).not.toBeNull();

    // Check that <a> has clickable class
    expect(linkEl?.classList.contains('clickable')).toBe(true);
  });

  jsdomIt('should handle clickable class for callbacks (no link)', async ({ svg }) => {
    const parent = svg.append('g');
    const node = createMockNode('node3', { haveCallback: true });

    await insertNode(parent, node, mockRenderOptions);

    const outerG = ensureNodeFromSelector('g#node3', parent.node()!);
    expect(outerG.classList.contains('clickable')).toBe(true);
  });

  jsdomIt('should handle tooltips on outer G', async ({ svg }) => {
    const parent = svg.append('g');
    const node = createMockNode('node4', { tooltip: 'This is a tooltip' });

    await insertNode(parent, node, mockRenderOptions);

    const outerG = ensureNodeFromSelector('g#node4', parent.node()!);
    expect(outerG.getAttribute('title')).toBe('This is a tooltip');
  });

  jsdomIt('should not duplicate ID on inner elements', async ({ svg }) => {
    const parent = svg.append('g');
    const node = createMockNode('node5', { link: 'http://example.com' });

    await insertNode(parent, node, mockRenderOptions);

    const outerG = ensureNodeFromSelector('g#node5', parent.node()!);
    const linkEl = outerG.querySelector('a')!;

    // Inner <a> should not have the ID
    expect(linkEl.getAttribute('id')).toBeNull();

    // Shape inside should not have the ID (labelHelper usually applies it to container)
    // labelHelper now applies ID to container.
    // If container is outerG, then ID is on outerG.
    // Inner elements should NOT have ID.
    const rect = linkEl.querySelector('rect')!;
    expect(rect.getAttribute('id')).toBeNull();
  });
});
