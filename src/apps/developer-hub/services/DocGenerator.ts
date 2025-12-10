```typescript
import { OpenAPIV3 } from 'openapi-types';
import { parse as commentParser } from 'comment-parser';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);

export interface DocGeneratorOptions {
  sourceCodePaths: string[];
  openApiSchemaPaths: string[];
  outputDir: string;
}

export interface ParsedComment {
  tags: { tag: string; name: string; description: string }[];
  description: string;
}

export class DocGenerator {
  private options: DocGeneratorOptions;

  constructor(options: DocGeneratorOptions) {
    this.options = options;
  }

  async generate(): Promise<void> {
    const codeDocs = await this.parseSourceCodeComments();
    const apiDocs = await this.loadOpenApiSchemas();

    const mergedDocs = this.mergeDocumentation(codeDocs, apiDocs);

    await this.writeDocumentation(mergedDocs);
  }

  private async parseSourceCodeComments(): Promise<{ [filePath: string]: ParsedComment[] }> {
    const allComments: { [filePath: string]: ParsedComment[] } = {};

    for (const filePath of this.options.sourceCodePaths) {
      try {
        const fileContent = await readFileAsync(filePath, 'utf-8');
        const comments = this.extractComments(fileContent);
        const parsedComments = comments.map((comment) => this.parseComment(comment));

        allComments[filePath] = parsedComments;
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }

    return allComments;
  }

  private extractComments(fileContent: string): string[] {
    const commentRegex = /\/\*\*[\s\S]*?\*\//g;
    const comments = fileContent.match(commentRegex) || [];
    return comments;
  }

  private parseComment(comment: string): ParsedComment {
    const parsed = commentParser(comment)[0];

    const tags = parsed.tags.map((tag) => ({
      tag: tag.tag,
      name: tag.name,
      description: tag.description,
    }));

    return {
      tags: tags,
      description: parsed.description,
    };
  }

  private async loadOpenApiSchemas(): Promise<{ [filePath: string]: OpenAPIV3.Document }> {
    const allSchemas: { [filePath: string]: OpenAPIV3.Document } = {};

    for (const filePath of this.options.openApiSchemaPaths) {
      try {
        const fileContent = await readFileAsync(filePath, 'utf-8');
        const schema = JSON.parse(fileContent) as OpenAPIV3.Document;
        allSchemas[filePath] = schema;
      } catch (error) {
        console.error(`Error loading OpenAPI schema from ${filePath}:`, error);
      }
    }

    return allSchemas;
  }

  private mergeDocumentation(
    codeDocs: { [filePath: string]: ParsedComment[] },
    apiDocs: { [filePath: string]: OpenAPIV3.Document },
  ): any {
    // This is a placeholder for a more sophisticated merging logic.
    // In a real-world scenario, this function would intelligently combine
    // the information from code comments and OpenAPI schemas, potentially
    // linking code documentation to API endpoints, parameters, etc.

    const merged: any = {
      codeDocs: codeDocs,
      apiDocs: apiDocs,
    };

    return merged;
  }

  private async writeDocumentation(mergedDocs: any): Promise<void> {
    const outputPath = path.join(this.options.outputDir, 'documentation.json'); // Changed to json for simplicity
    const outputContent = JSON.stringify(mergedDocs, null, 2); // Make it readable

    try {
      await fs.promises.mkdir(this.options.outputDir, { recursive: true });
      await fs.promises.writeFile(outputPath, outputContent, 'utf-8');
      console.log(`Documentation written to ${outputPath}`);
    } catch (error) {
      console.error('Error writing documentation:', error);
    }
  }
}
```