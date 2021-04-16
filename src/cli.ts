#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import * as y from 'yargs';
import { invariant } from './utils';
import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import { toComponent } from './main';

export interface CliProps {
  in: string;
  out: string;
}

const cli = async () => {
  const { argv } = yargs(hideBin(process.argv)) as y.Argv<CliProps>;

  invariant(argv.in, 'You have to set --in. Tip: Can be set to **/*.svg');
  invariant(argv.out, 'You have to set --out.');

  console.log({
    in: argv.in,
    out: argv.out,
  });

  const entries = await fg(argv.in);

  for (const entry of entries) {
    const fileName = entry.split('/').pop();
    invariant(fileName, 'expect fileName');
    const [name] = fileName.split('.');
    invariant(name, 'expect name');
    const fileContent = fs.readFileSync(entry, 'utf-8');
    const code = await toComponent(name, fileContent);
    fs.writeFileSync(path.resolve(argv.out, `${name}.tsx`), code);
  }
};

cli()
  .then(console.log)
  .catch((e) => console.log(`ERROR: ${e.message}`));
