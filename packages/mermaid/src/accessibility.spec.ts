import { addSVGa11yTitleDescription, setA11yDiagramInfo } from './accessibility.js';
import { ensureNodeFromSelector, jsdomIt } from './tests/util.js';
import { expect } from 'vitest';
import mermaidAPI from './mermaidAPI.js';

describe('accessibility', () => {
  describe('setA11yDiagramInfo', () => {
    jsdomIt('should set svg element role to "graphics-document document"', ({ svg }) => {
      setA11yDiagramInfo(svg, 'flowchart');
      const svgNode = ensureNodeFromSelector('svg');
      expect(svgNode.getAttribute('role')).toBe('graphics-document document');
    });

    jsdomIt('should set aria-roledescription to the diagram type', ({ svg }) => {
      setA11yDiagramInfo(svg, 'flowchart');
      const svgNode = ensureNodeFromSelector('svg');
      expect(svgNode.getAttribute('aria-roledescription')).toBe('flowchart');
    });

    jsdomIt('should not set aria-roledescription if the diagram type is empty', ({ svg }) => {
      setA11yDiagramInfo(svg, '');
      const svgNode = ensureNodeFromSelector('svg');
      expect(svgNode.getAttribute('aria-roledescription')).toBeNull();
    });
  });

  describe('addSVGa11yTitleDescription', () => {
    const givenId = 'theBaseId';

    describe('with svg d3 object', () => {
      it('should do nothing if there is no insert defined', () => {
        const noInsertSvg = {
          attr: vi.fn(),
        };
        const noInsertAttrSpy = vi.spyOn(noInsertSvg, 'attr').mockReturnValue(noInsertSvg);
        addSVGa11yTitleDescription(noInsertSvg, 'some title', 'some desc', givenId);
        expect(noInsertAttrSpy).not.toHaveBeenCalled();
      });

      describe('with a11y title', () => {
        const a11yTitle = 'a11y title';

        describe('with a11y description', () => {
          const a11yDesc = 'a11y description';

          jsdomIt('should set aria-labelledby to the title id inserted as a child', ({ svg }) => {
            addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-labelledby')).toBe(`chart-title-${givenId}`);
          });

          jsdomIt(
            'should set aria-describedby to the description id inserted as a child',
            ({ svg }) => {
              addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
              const svgNode = ensureNodeFromSelector('svg');
              expect(svgNode.getAttribute('aria-describedby')).toBe(`chart-desc-${givenId}`);
            }
          );

          jsdomIt(
            'should insert title tag as the first child with the text set to the accTitle given',
            ({ svg }) => {
              addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
              const svgNode = ensureNodeFromSelector('svg');
              const titleNode = ensureNodeFromSelector('title', svgNode);
              expect(titleNode?.innerHTML).toBe(a11yTitle);
            }
          );

          jsdomIt(
            'should insert desc tag as the 2nd child with the text set to accDescription given',
            ({ svg }) => {
              addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
              const svgNode = ensureNodeFromSelector('svg');
              const descNode = ensureNodeFromSelector('desc', svgNode);
              expect(descNode?.innerHTML).toBe(a11yDesc);
            }
          );
        });

        describe(`without a11y description`, {}, () => {
          const a11yDesc = undefined;

          jsdomIt('should set aria-labelledby to the title id inserted as a child', ({ svg }) => {
            addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-labelledby')).toBe(`chart-title-${givenId}`);
          });

          jsdomIt('should not set aria-describedby', ({ svg }) => {
            addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-describedby')).toBeNull();
          });

          jsdomIt(
            'should insert title tag as the first child with the text set to the accTitle given',
            ({ svg }) => {
              addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
              const svgNode = ensureNodeFromSelector('svg');
              const titleNode = ensureNodeFromSelector('title', svgNode);
              expect(titleNode?.innerHTML).toBe(a11yTitle);
            }
          );

          jsdomIt('should not insert description tag', ({ svg }) => {
            addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            const descNode = svgNode.querySelector('desc');
            expect(descNode).toBeNull();
          });
        });
      });

      describe('without a11y title', () => {
        const a11yTitle = undefined;

        describe('with a11y description', () => {
          const a11yDesc = 'a11y description';

          jsdomIt('should not set aria-labelledby', ({ svg }) => {
            addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-labelledby')).toBeNull();
          });

          jsdomIt('should not insert title tag', ({ svg }) => {
            addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            const titleNode = svgNode.querySelector('title');
            expect(titleNode).toBeNull();
          });

          jsdomIt(
            'should set aria-describedby to the description id inserted as a child',
            ({ svg }) => {
              addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
              const svgNode = ensureNodeFromSelector('svg');
              expect(svgNode.getAttribute('aria-describedby')).toBe(`chart-desc-${givenId}`);
            }
          );

          jsdomIt(
            'should insert desc tag as the 2nd child with the text set to accDescription given',
            ({ svg }) => {
              addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
              const svgNode = ensureNodeFromSelector('svg');
              const descNode = ensureNodeFromSelector('desc', svgNode);
              expect(descNode?.innerHTML).toBe(a11yDesc);
            }
          );
        });

        describe('without a11y description', () => {
          const a11yDesc = undefined;

          jsdomIt('should not set aria-labelledby', ({ svg }) => {
            addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-labelledby')).toBeNull();
          });

          jsdomIt('should not set aria-describedby', ({ svg }) => {
            addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-describedby')).toBeNull();
          });

          jsdomIt('should not insert title tag', ({ svg }) => {
            addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            const titleNode = svgNode.querySelector('title');
            expect(titleNode).toBeNull();
          });

          jsdomIt('should not insert  description tag', ({ svg }) => {
            addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            const descNode = svgNode.querySelector('desc');
            expect(descNode).toBeNull();
          });
        });
      });
    });
  });

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
});
