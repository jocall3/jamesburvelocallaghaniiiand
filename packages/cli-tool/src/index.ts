#!/usr/bin/env node
import { Command } from 'commander';
import { init } from './commands/init';
import { build } from './commands/build';
import { deploy } from './commands/deploy';
import { test } from './commands/test';
import { lint } from './commands/lint';
import { format } from './commands/format';
import { version } from '../package.json';
import { add } from './commands/add';
import { remove } from './commands/remove';
import { update } from './commands/update';
import { doctor } from './commands/doctor';
import { generate } from './commands/generate';
import { analyze } from './commands/analyze';
import { optimize } from './commands/optimize';
import { monitor } from './commands/monitor';
import { debug } from './commands/debug';
import { docs } from './commands/docs';
import { search } from './commands/search';
import { config } from './commands/config';

const program = new Command();

program
  .name('cli-tool')
  .description('A CLI tool to streamline development workflows.')
  .version(version);

program.command('init')
  .description('Initialize a new project.')
  .argument('[projectName]', 'Project name')
  .option('-t, --template <templateName>', 'Template to use')
  .action(init);

program.command('build')
  .description('Build the project.')
  .option('-w, --watch', 'Watch for changes')
  .action(build);

program.command('deploy')
  .description('Deploy the project.')
  .option('-e, --environment <env>', 'Environment to deploy to')
  .action(deploy);

program.command('test')
  .description('Run tests.')
  .option('-u, --updateSnapshot', 'Update snapshots')
  .action(test);

program.command('lint')
  .description('Lint the project.')
  .option('--fix', 'Automatically fix linting errors')
  .action(lint);

program.command('format')
  .description('Format the project.')
  .action(format);

program.command('add')
  .description('Add a new feature or module.')
  .argument('<name>', 'Name of the feature/module')
  .option('-t, --type <type>', 'Type of the feature/module')
  .action(add);

program.command('remove')
  .description('Remove a feature or module.')
  .argument('<name>', 'Name of the feature/module')
  .action(remove);

program.command('update')
  .description('Update dependencies.')
  .option('-a, --all', 'Update all dependencies')
  .action(update);

program.command('doctor')
  .description('Check the project for potential issues.')
  .action(doctor);

program.command('generate')
  .description('Generate code based on a template.')
  .argument('<templateName>', 'Name of the template')
  .argument('[outputFile]', 'Output file path')
  .action(generate);

program.command('analyze')
  .description('Analyze the project for performance bottlenecks.')
  .action(analyze);

program.command('optimize')
  .description('Optimize the project for performance.')
  .action(optimize);

program.command('monitor')
  .description('Monitor the project for errors and performance issues.')
  .action(monitor);

program.command('debug')
  .description('Debug the project.')
  .option('-p, --port <port>', 'Port to use for debugging')
  .action(debug);

program.command('docs')
  .description('Generate documentation for the project.')
  .action(docs);

program.command('search')
  .description('Search for specific code or files.')
  .argument('<query>', 'Search query')
  .action(search);

program.command('config')
  .description('Configure the project settings.')
  .argument('[key]', 'Configuration key')
  .argument('[value]', 'Configuration value')
  .action(config);

program.parse(process.argv);