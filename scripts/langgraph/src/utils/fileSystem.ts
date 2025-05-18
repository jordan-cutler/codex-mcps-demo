import { promises as fs } from 'fs';
import { join, normalize, relative } from 'path';
import { glob } from 'glob';
import { FileConfig } from '../models/types';

export class FileSystem {
  private static instance: FileSystem;
  private constructor() {}

  public static getInstance(): FileSystem {
    if (!FileSystem.instance) {
      FileSystem.instance = new FileSystem();
    }
    return FileSystem.instance;
  }

  /**
   * Read a file's contents
   * @param filePath Path to the file
   * @returns File contents as string
   */
  public async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  /**
   * Write content to a file
   * @param filePath Path to write to
   * @param content Content to write
   */
  public async writeFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(join(filePath, '..'), { recursive: true });
    await fs.writeFile(filePath, content);
  }

  /**
   * Get all files matching the given patterns
   * @param patterns Glob patterns to match
   * @param cwd Current working directory
   * @returns Array of matched file paths
   */
  public async getFiles(patterns: string[], cwd: string): Promise<string[]> {
    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, { cwd });
      files.push(...matches);
    }
    return files;
  }

  /**
   * Normalize a file path
   * @param path Path to normalize
   * @returns Normalized path
   */
  public normalizePath(path: string): string {
    return normalize(path);
  }

  /**
   * Get relative path from base
   * @param base Base directory
   * @param target Target path
   * @returns Relative path
   */
  public getRelativePath(base: string, target: string): string {
    return relative(base, target);
  }

  /**
   * Filter files based on configuration
   * @param files Files to filter
   * @param config File configuration
   * @returns Filtered files
   */
  public filterFiles(files: string[], config: FileConfig): string[] {
    const included = files.filter(file => {
      return config.include.some(pattern => file.includes(pattern));
    });

    return included.filter(file => {
      return !config.exclude.some(pattern => file.includes(pattern));
    });
  }
}
