import { build } from 'pkg'; // Assuming 'pkg' is installed as a dependency
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Configuration options for generating a single binary.
 */
export interface SingleBinaryOptions {
  /**
   * The entry point of the application (e.g., 'dist/index.js').
   * This should be the compiled JavaScript file that `pkg` will bundle.
   */
  entryPoint: string;
  /**
   * The output directory for the generated binaries.
   * Defaults to 'bin'.
   */
  outputDir?: string;
  /**
   * An array of target platforms for the binary (e.g., ['node18-win-x64', 'node18-linux-x64']).
   * See `pkg` documentation for valid targets: https://github.com/vercel/pkg#targets
   * Defaults to the current platform if not specified.
   */
  targets?: string[];
  /**
   * Additional assets to include in the binary (e.g., 'views/**\/*', 'config.json').
   * These are passed to `pkg`'s `assets` option. Supports glob patterns.
   */
  assets?: string[];
  /**
   * Additional files to include in the binary (e.g., 'node_modules/some-package/native.node').
   * These are passed to `pkg`'s `files` option. Supports glob patterns.
   */
  files?: string[];
  /**
   * Whether to compress the binary. Defaults to true.
   */
  compress?: boolean;
  /**
   * Verbose output from the underlying `pkg` tool. Defaults to false.
   */
  verbose?: boolean;
  /**
   * The base name for the output binary files (e.g., 'my-app').
   * If not provided, it will be derived from the `entryPoint` (e.g., 'index' from 'dist/index.js').
   * `pkg` will append platform-specific suffixes (e.g., 'my-app-win.exe', 'my-app-linux').
   */
  outputBaseName?: string;
}

/**
 * Result of the single binary generation process.
 */
export interface SingleBinaryResult {
  /**
   * True if the binary generation was successful for all targets.
   */
  success: boolean;
  /**
   * Paths to the generated binaries.
   */
  binaryPaths: string[];
  /**
   * Error message if the process failed.
   */
  error?: string;
}

/**
 * Tooling for generating single-binary outputs for applications using `pkg`.
 * This simplifies deployment and distribution by bundling Node.js applications
 * into a single executable file, making them runnable without a Node.js installation.
 */
export class SingleBinaryOutputTool {
  constructor() {
    // No specific initialization needed for programmatic 'pkg' usage.
  }

  /**
   * Generates single-binary executables for the specified application entry point.
   * @param options Configuration options for the binary generation.
   * @returns A promise that resolves to the result of the generation process.
   */
  public async generateBinary(options: SingleBinaryOptions): Promise<SingleBinaryResult> {
    const {
      entryPoint,
      outputDir = 'bin',
      targets,
      assets = [],
      files = [],
      compress = true,
      verbose = false,
      outputBaseName,
    } = options;

    const absoluteEntryPoint = path.resolve(entryPoint);
    const absoluteOutputDir = path.resolve(outputDir);
    const baseName = outputBaseName || path.basename(entryPoint, path.extname(entryPoint));
    const outputPrefix = path.join(absoluteOutputDir, baseName);

    try {
      await fs.access(absoluteEntryPoint, fs.constants.F_OK);
    } catch (err) {
      return {
        success: false,
        binaryPaths: [],
        error: `Entry point '${entryPoint}' not found. Please ensure the path is correct and the application is built.`,
      };
    }

    await fs.mkdir(absoluteOutputDir, { recursive: true });

    // pkg's build function expects an array of files/globs for the input.
    // The first element is typically the entry point.
    const pkgFiles = [absoluteEntryPoint, ...assets, ...files];

    const actualTargets = targets && targets.length > 0 ? targets : [this.getDefaultTarget()];

    const pkgOptions: Parameters<typeof build>[1] = {
      targets: actualTargets,
      output: outputPrefix, // pkg will append platform-specific suffixes
      compress,
      debug: verbose, // pkg uses 'debug' for verbose output
    };

    console.log(`[SingleBinaryOutputTool] Starting binary generation for entry point: ${entryPoint}`);
    console.log(`[SingleBinaryOutputTool] Targets: ${pkgOptions.targets?.join(', ')}`);
    console.log(`[SingleBinaryOutputTool] Output prefix: ${pkgOptions.output}`);
    if (verbose) {
      console.log(`[SingleBinaryOutputTool] Files to include: ${pkgFiles.join(', ')}`);
      console.log(`[SingleBinaryOutputTool] Pkg options: ${JSON.stringify(pkgOptions, null, 2)}`);
    }

    try {
      // The 'build' function from 'pkg' logs its progress directly to stdout/stderr.
      // We don't need to capture it unless we want to parse it for specific information.
      await build(pkgFiles, pkgOptions);

      // After successful build, infer the generated binary paths based on targets and output prefix.
      const generatedBinaryPaths: string[] = [];

      for (const target of actualTargets) {
        const platform = this.getPlatformFromTarget(target);
        const ext = platform === 'win' ? '.exe' : '';
        const expectedBinaryName = `${baseName}-${platform}${ext}`;
        const expectedBinaryPath = path.join(absoluteOutputDir, expectedBinaryName);

        try {
          await fs.access(expectedBinaryPath, fs.constants.F_OK);
          generatedBinaryPaths.push(expectedBinaryPath);
        } catch (e) {
          console.warn(`[SingleBinaryOutputTool] Could not find expected binary at: ${expectedBinaryPath}. This might indicate an issue with pkg or an unexpected naming convention.`);
        }
      }

      // Fallback: if specific paths weren't found, list files in output directory
      // This can happen if pkg's naming convention changes or is unexpected.
      if (generatedBinaryPaths.length === 0 && actualTargets.length > 0) {
        console.warn(`[SingleBinaryOutputTool] No specific binaries found based on targets. Listing files in output directory '${absoluteOutputDir}' as a fallback.`);
        const filesInOutputDir = await fs.readdir(absoluteOutputDir);
        const potentialBinaries = filesInOutputDir.filter(f =>
          f.startsWith(baseName) && !f.endsWith('.map') && !f.endsWith('.node') && !f.endsWith('.txt') // Heuristic to exclude non-executables
        );
        potentialBinaries.forEach(f => generatedBinaryPaths.push(path.join(absoluteOutputDir, f)));
      }

      return {
        success: true,
        binaryPaths: generatedBinaryPaths,
      };
    } catch (err: any) {
      console.error(`[SingleBinaryOutputTool] Binary generation failed: ${err.message}`);
      return {
        success: false,
        binaryPaths: [],
        error: err.message || 'Unknown error during binary generation.',
      };
    }
  }

  /**
   * Determines a default target string for `pkg` based on the current operating system
   * and Node.js version. This is a simplified heuristic.
   * @returns A default target string (e.g., 'node18-win-x64').
   */
  private getDefaultTarget(): string {
    const nodeVersion = `node${process.versions.node.split('.')[0]}`;
    const platform = this.getPlatformFromNodeProcess(process.platform);
    const arch = process.arch === 'x64' ? 'x64' : 'arm64'; // pkg often uses x64/arm64

    return `${nodeVersion}-${platform}-${arch}`;
  }

  /**
   * Maps Node.js `process.platform` names to `pkg`'s platform names.
   * @param nodePlatform The platform string from `process.platform`.
   * @returns The corresponding `pkg` platform string.
   */
  private getPlatformFromNodeProcess(nodePlatform: NodeJS.Platform): string {
    switch (nodePlatform) {
      case 'win32':
        return 'win';
      case 'darwin':
        return 'macos';
      case 'linux':
        return 'linux';
      default:
        console.warn(`[SingleBinaryOutputTool] Unsupported platform '${nodePlatform}'. Defaulting to 'linux'.`);
        return 'linux'; // Fallback for unknown platforms
    }
  }

  /**
   * Extracts the platform name from a `pkg` target string.
   * E.g., 'node18-win-x64' -> 'win'
   * @param target The `pkg` target string.
   * @returns The platform name (e.g., 'win', 'linux', 'macos').
   */
  private getPlatformFromTarget(target: string): string {
    const parts = target.split('-');
    if (parts.length >= 2) {
      return parts[1];
    }
    return 'unknown'; // Fallback if target format is unexpected
  }
}