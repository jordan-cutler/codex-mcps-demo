import { FileSystem } from '@/utils/fileSystem';
import { CodeBlock } from '@/models/types';

export interface CodeAnalysisResult {
  path: string;
  content: string;
  blocks: CodeBlock[];
  dependencies: string[];
  exports: string[];
  imports: string[];
  functions: string[];
  classes: string[];
  patterns: {
    async: boolean;
    functional: boolean;
    objectOriented: boolean;
  };
}

export class CodeAnalyzer {
  private static instance: CodeAnalyzer;
  private fileSystem: FileSystem;

  private constructor() {
    this.fileSystem = FileSystem.getInstance();
  }

  public static getInstance(): CodeAnalyzer {
    if (!CodeAnalyzer.instance) {
      CodeAnalyzer.instance = new CodeAnalyzer();
    }
    return CodeAnalyzer.instance;
  }

  /**
   * Analyze a code file
   * @param filePath Path to the file
   * @returns Analysis result
   */
  public async analyzeFile(filePath: string): Promise<CodeAnalysisResult> {
    // Read file content
    const content = await this.fileSystem.readFile(filePath);
    
    // Extract code blocks
    const blocks = this.extractCodeBlocks(content, filePath);
    
    // Detect patterns
    const patterns = this.detectPatterns(content);
    
    // Extract dependencies
    const { imports, exports, dependencies } = this.extractDependencies(content);
    
    // Extract functions and classes
    const { functions, classes } = this.extractFunctionsAndClasses(content);
    
    return {
      path: filePath,
      content,
      blocks,
      dependencies,
      exports,
      imports,
      functions,
      classes,
      patterns
    };
  }

  /**
   * Extract code blocks from content
   * @param content File content
   * @param filePath File path
   * @returns Array of code blocks
   */
  private extractCodeBlocks(content: string, filePath: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const lines = content.split('\n');
    
    // Simple heuristic to identify code blocks
    let blockStart = -1;
    let currentIndentation = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect start of a block (function, class, etc.)
      if (line.includes('{') && blockStart === -1) {
        blockStart = i;
        currentIndentation = line.search(/\S/);
      }
      
      // Detect end of a block
      if (line.includes('}') && blockStart !== -1) {
        const indentation = line.search(/\S/);
        
        // Only end block if we're back at the same indentation level
        if (indentation === currentIndentation) {
          blocks.push({
            content: lines.slice(blockStart, i + 1).join('\n'),
            language: this.detectLanguage(filePath),
            path: filePath,
            lineStart: blockStart,
            lineEnd: i
          });
          
          blockStart = -1;
        }
      }
    }
    
    return blocks;
  }

  /**
   * Detect programming language from file extension
   * @param filePath File path
   * @returns Language identifier
   */
  private detectLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'rs': 'rust',
      'sh': 'bash',
      'md': 'markdown',
      'json': 'json',
      'yml': 'yaml',
      'yaml': 'yaml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'xml': 'xml',
      'sql': 'sql'
    };
    
    return languageMap[extension] || 'plaintext';
  }

  /**
   * Detect code patterns
   * @param content File content
   * @returns Pattern detection result
   */
  private detectPatterns(content: string): { async: boolean; functional: boolean; objectOriented: boolean } {
    return {
      async: content.includes('async') || content.includes('await') || content.includes('Promise'),
      functional: content.includes('=>') || content.includes('map(') || content.includes('reduce(') || content.includes('filter('),
      objectOriented: content.includes('class ') || content.includes('extends ') || content.includes('implements ') || content.includes('interface ')
    };
  }

  /**
   * Extract dependencies, imports and exports
   * @param content File content
   * @returns Extracted dependencies
   */
  private extractDependencies(content: string): { imports: string[]; exports: string[]; dependencies: string[] } {
    const imports: string[] = [];
    const exports: string[] = [];
    const dependencies: string[] = [];
    
    // Extract imports
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^\s;]+|[^\s;{]*)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const dependency = match[1];
      imports.push(match[0]);
      dependencies.push(dependency);
    }
    
    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([^\s(=]+)/g;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return { imports, exports, dependencies };
  }

  /**
   * Extract functions and classes
   * @param content File content
   * @returns Extracted functions and classes
   */
  private extractFunctionsAndClasses(content: string): { functions: string[]; classes: string[] } {
    const functions: string[] = [];
    const classes: string[] = [];
    
    // Extract functions
    const functionRegex = /(?:function\s+([^\s(]+)|(?:const|let|var)\s+([^\s=]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1] || match[2];
      if (functionName) {
        functions.push(functionName);
      }
    }
    
    // Extract classes
    const classRegex = /class\s+([^\s{]+)/g;
    
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    
    return { functions, classes };
  }
}
