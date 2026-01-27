import { describe, expect } from 'vitest';
import { draw } from './flowRenderer-v3-unified.js';
import { Diagram } from '../../Diagram.js';
import { addDetector } from '../../diagram-api/detectType.js';
import { setConfig } from '../../config.js';
import flowDetectorV2 from './flowDetector-v2.js';
import { jsdomIt } from '../../tests/util.js';

const { id, detector, loader } = flowDetectorV2;

addDetector(id, detector, loader);

describe('flowchart-v3-unified renderer', () => {
  jsdomIt('should render a simple flowchart and wrapping links', async () => {
    setConfig({ htmlLabels: false, flowchart: { htmlLabels: false } });
    const diagramText = `
flowchart TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Do Something]
  B -->|No| D[Do Nothing]
  click A href "https://example.com"`;

    const diagram = await Diagram.fromText(diagramText);

    // jsdomIt sets up a body with <svg id="svg"/>
    await draw(diagramText, 'svg', '1.0.0', diagram);

    const svg = document.getElementById('svg');
    expect(svg).not.toBeNull();

    // Check nodes
    // In flowcharts, nodes typically have IDs like "A", "B", etc. or "flowchart-A-...", depending on the renderer and ID generation.
    // The unified renderer uses dagre/dagre-wrapper which usually preserves IDs or appends to diagram ID.
    // However, looking at architecture spec, they search by id.

    // Let's check for content first.
    const nodes = svg!.querySelectorAll('.node');
    expect(nodes.length).toBeGreaterThan(0);

    // Check if "Start", "Decision", "Do Something" texts are present
    const textContent = svg!.textContent;
    expect(textContent).toContain('Start');
    expect(textContent).toContain('Decision');
    expect(textContent).toContain('Do Something');

    // Check edges
    const edges = svg!.querySelectorAll('.edgePaths path');
    // We have 3 edges: A->B, B->C, B->D
    expect(edges.length).toBeGreaterThanOrEqual(3);

    // Check link wrapping
    // Node A has a click event with href, so it should be wrapped in an <a> tag.
    // We need to find the node for A.
    // Assuming the node ID logic produces something containing 'A'.
    // Let's look for the anchor tag.
    const anchor = svg!.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toBe('https://example.com/');

    // Verify the anchor contains the node content (like the label)
    expect(anchor?.textContent).toContain('Start');
  });
});
