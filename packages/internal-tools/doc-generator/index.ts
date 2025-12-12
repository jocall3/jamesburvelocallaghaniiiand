#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as commentParser from 'comment-parser';
import * as mkdirp from 'mkdirp';
import * as rimraf from 'rimraf';

interface DocEntry {
  name: string;
  description: string;
  params: { [key: string]: string };
  returns: string;
  filePath: string;
  lineNumber: number;
}

interface Config {
  sourceDir: string;
  outputDir: string;
  filePatterns: string[];
  excludePatterns: string[];
  templateFile: string;
  indexTemplateFile: string;
  assetsDir: string;
}

const defaultConfig: Config = {
  sourceDir: 'src',
  outputDir: 'docs',
  filePatterns: ['*.ts', '*.tsx'],
  excludePatterns: ['node_modules/**'],
  templateFile: 'template.md',
  indexTemplateFile: 'index.md',
  assetsDir: 'assets',
};

function loadConfig(configPath: string = 'doc-generator.config.js'): Config {
  try {
    const config = require(path.resolve(configPath));
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.warn(`Config file not found or invalid, using default configuration.`);
    return defaultConfig;
  }
}

function extractDocs(filePath: string): DocEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const comments = content.match(/\/\*\*[\s\S]*?\*\//g);

  if (!comments) {
    return [];
  }

  return comments.map(comment => {
    try {
      const parsed = commentParser(comment)[0];
      const name = parsed.tags.find(tag => tag.tag === 'function' || tag.tag === 'class' || tag.tag === 'method')?.name || 'Unknown';
      const description = parsed.description;
      const params: { [key: string]: string } = {};
      parsed.tags.filter(tag => tag.tag === 'param').forEach(tag => {
        params[tag.name] = tag.description;
      });
      const returns = parsed.tags.find(tag => tag.tag === 'returns')?.description || '';

      const lineNumber = content.substring(0, content.indexOf(comment)).split('\n').length;

      return {
        name,
        description,
        params,
        returns,
        filePath,
        lineNumber
      };
    } catch (error) {
      console.error(`Error parsing comment in ${filePath}: ${error}`);
      return null;
    }
  }).filter(entry => entry !== null) as DocEntry[];
}

function generateDocs(config: Config) {
  const files = config.filePatterns.reduce((acc, pattern) => {
    return [...acc, ...glob.sync(path.join(config.sourceDir, '**', pattern), { ignore: config.excludePatterns })];
  }, []);

  const allDocs: DocEntry[] = [];
  files.forEach(file => {
    allDocs.push(...extractDocs(file));
  });

  // Group docs by name for index generation
  const groupedDocs: { [key: string]: DocEntry[] } = {};
  allDocs.forEach(doc => {
    if (!groupedDocs[doc.name]) {
      groupedDocs[doc.name] = [];
    }
    groupedDocs[doc.name].push(doc);
  });


  // Clear and create output directory
  rimraf.sync(config.outputDir);
  mkdirp.sync(config.outputDir);

  // Copy assets
  if (config.assetsDir && fs.existsSync(config.assetsDir)) {
    copyDirSync(config.assetsDir, path.join(config.outputDir, 'assets'));
  }

  // Load templates
  const template = fs.readFileSync(config.templateFile, 'utf-8');
  const indexTemplate = fs.readFileSync(config.indexTemplateFile, 'utf-8');

  // Generate individual doc files
  allDocs.forEach(doc => {
    const docContent = template
      .replace(/{{name}}/g, doc.name)
      .replace(/{{description}}/g, doc.description)
      .replace(/{{params}}/g, Object.entries(doc.params).map(([name, desc]) => `- \`${name}\`: ${desc}`).join('\n'))
      .replace(/{{returns}}/g, doc.returns)
      .replace(/{{filePath}}/g, doc.filePath)
      .replace(/{{lineNumber}}/g, doc.lineNumber.toString());

    const fileName = `${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    fs.writeFileSync(path.join(config.outputDir, fileName), docContent);
  });

  // Generate index file
  const indexContent = indexTemplate.replace(
    '{{entries}}',
    Object.entries(groupedDocs)
      .map(([name, docs]) => {
        const fileName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
        return `- [${name}](${fileName})`;
      })
      .join('\n')
  );
  fs.writeFileSync(path.join(config.outputDir, 'index.md'), indexContent);

  console.log(`Documentation generated in ${config.outputDir}`);
}

function copyDirSync(src, dest) {
  mkdirp.sync(dest);
  fs.readdirSync(src).forEach(entry => {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}


// Main execution
const config = loadConfig();
generateDocs(config);