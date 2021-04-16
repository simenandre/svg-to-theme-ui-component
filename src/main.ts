import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';
import * as prettier from 'prettier';
import { optimize, OptimizeOptions } from 'svgo';
import { h2x } from './transform/h2x';

export interface SvgThemeUIConfig {
  prettierConfig?: prettier.Options;
  svgoConfig?: OptimizeOptions;
}

const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'icon.tsx-template');

export async function toComponent(
  name: string,
  fileContent: string,
  config: SvgThemeUIConfig = {},
): Promise<string> {
  const {
    prettierConfig = await prettier.resolveConfig(process.cwd()),
    svgoConfig,
  } = config;

  const optimized = optimize(fileContent, svgoConfig);
  const { svg, state } = await h2x(optimized.data, {});
  let {width, height, viewBox} = state;
  const [, , w, h] = viewBox.split(' ');

  if (!width) { width = w; }
  if (!height) { height = h; }

  const templateData = {
    name,
    svg,
    viewBox,
    width: width || 0,
    height: height || 0,
  };

  const r = await ejs.renderFile(TEMPLATE_PATH, templateData);

  return prettier.format(r, { parser: 'typescript', ...prettierConfig });
}
