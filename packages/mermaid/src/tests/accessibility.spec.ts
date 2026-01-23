import mermaidAPI from '../mermaidAPI.js';
import { jsdomIt, ensureNodeFromSelector } from './util.js';
import { expect, describe } from 'vitest';

describe('Accessibility Links', () => {
  jsdomIt('should add links for outbound edges in flowcharts', async ({ body }) => {
    const data = `
    flowchart TD
      A --> B
      A --> C
      click A "http://google.com" "Tooltip"
    `;

    const { svg } = await mermaidAPI.render('test-id', data);
    body.html(svg);

    // Find Node A. It should be wrapped in .node-wrapper because it has outbound edges.
    // The ID logic seems to generate IDs like flowchart-A-0
    const nodeWrapper = ensureNodeFromSelector('.node-wrapper', body.node());

    // Check for outbound links
    const links = nodeWrapper.querySelectorAll('a[aria-label^="Link to"]');
    expect(links.length).toBe(2);

    // Check one of them points to B or C
    const hrefs = Array.from(links).map(
      (l) => l.getAttribute('xlink:href') || l.getAttribute('href')
    );
    expect(hrefs.some((h) => h && h.includes('B'))).toBe(true);
    expect(hrefs.some((h) => h && h.includes('C'))).toBe(true);

    // Check existing explicit link is still there and correct
    // Use a more robust selector that doesn't rely on exact attribute string matching if possible
    const explicitLinkX = nodeWrapper.querySelector(
      'a[href*="google.com"], a[xlink\\:href*="google.com"]'
    );

    // The explicit link wraps the visual node
    const nodeVisual = nodeWrapper.querySelector('.node');
    expect(nodeVisual).not.toBeNull();

    // Check nesting: explicit link should contain nodeVisual
    expect(explicitLinkX).not.toBeNull();
    expect(explicitLinkX?.contains(nodeVisual)).toBe(true);

    // Check wrapper contains outbound links
    expect(nodeWrapper.contains(links[0])).toBe(true);

    // Check outbound links are NOT nested inside explicit link
    expect(explicitLinkX?.contains(links[0])).toBe(false);
  });
});
