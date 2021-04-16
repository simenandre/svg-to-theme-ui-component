import { transform } from 'h2x-core';
import { fromHtmlElement } from 'h2x-types';
import jsx from 'h2x-plugin-jsx';

const extractChildren = () => ({
  visitor: {
    HTMLElement: {
      enter(path: any, state: any) {
        if (path.node.originalNode.tagName !== 'svg') return;
        state.children = Array.from(path.node.originalNode.childNodes);
      },
    },
  },
});

const replaceChildren = () => ({
  visitor: {
    HTMLElement: {
      enter(path: any, state: any) {
        if (path.node.originalNode.tagName !== 'svg') return;
        path.replace(fromHtmlElement(state.replacement));
      },
    },
  },
});

const stripAttribute = (attribute: any) => () => ({
  visitor: {
    JSXAttribute: {
      enter(path: any) {
        if (path.node.name === attribute) {
          path.remove();
        }
      },
    },
  },
});

const removeComments = () => ({
  visitor: {
    JSXComment: {
      enter(path: any) {
        path.remove();
      },
    },
  },
});

const removeStyle = () => ({
  visitor: {
    JSXElement: {
      enter(path: any) {
        if (path.node.name === 'style') {
          path.remove();
        }
      },
    },
  },
});

const processSVG = () => ({
  visitor: {
    HTMLElement: {
      enter(path: any, state: any) {
        if (path.node.originalNode.tagName === 'svg') {
          const attributes = Array.from(path.node.originalNode.attributes);

          state.attrs = attributes.reduce(
            (attrs: any, attr: any) => ({ ...attrs, [attr.name]: attr.value }),
            {},
          );

          const heightAttribute: any = attributes.find(
            (attr: any) => attr.name === 'height',
          );
          const widthAttribute: any = attributes.find(
            (attr: any) => attr.name === 'width',
          );
          const viewBoxAttribute: any = attributes.find(
            (attr: any) => attr.name === 'viewBox',
          );

          state.height = heightAttribute ? heightAttribute.value : null;
          state.width = widthAttribute ? widthAttribute.value : null;
          state.viewBox = viewBoxAttribute ? viewBoxAttribute.value : null;

          state.children = Array.from(path.node.originalNode.children);
        }
      },
    },
  },
});

export const h2x = (code: string, state: any) => {
  // First pass to extract out attributes and children
  transform(code, { plugins: [extractChildren, processSVG], state });

  // Second pass over the extracted children
  return {
    state,
    svg: state.children
      .map((replacement: any) =>
        transform('<svg />', {
          plugins: [
            replaceChildren,
            jsx,
            stripAttribute('xmlns'),
            stripAttribute('path'),
            removeComments,
            removeStyle,
          ],
          state: { replacement },
        }),
      )
      .join('\n'),
  };
};
