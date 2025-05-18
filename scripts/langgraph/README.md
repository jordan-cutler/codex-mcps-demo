# LangGraph Documentation Generator

A powerful TypeScript CLI tool that uses LangGraph.js to generate comprehensive documentation from codebases. This tool leverages AI to analyze code and generate detailed documentation with cross-references and intelligent structure.

## Features

- AI-powered code analysis using LangGraph
- Automatic documentation generation for files and directories
- Markdown formatting with cross-references
- Support for multiple programming languages
- Memory management for cross-file references
- CLI interface with various options
- MCP (Model Context Protocol) integration for file operations

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Link the CLI tool globally (optional)
npm link
```

## Usage

### CLI Usage

```bash
# Generate documentation for a file
npm run cli generate path/to/file.ts

# Generate documentation for a directory
npm run cli generate path/to/directory

# Generate documentation with custom output directory
npm run cli generate path/to/directory -o path/to/output
```

### Advanced Options

```bash
# Specify file extensions to include
npm run cli generate path/to/directory -e ".ts,.js,.tsx"

# Exclude specific directories
npm run cli generate path/to/directory -x "node_modules,dist,build"

# Limit the maximum number of files to process
npm run cli generate path/to/directory -m 100
```

### Programmatic Usage

```typescript
import { DocumentationGenerator } from '@/core/documentationGenerator';

async function generateDocs() {
  const generator = DocumentationGenerator.getInstance();
  await generator.initialize();
  
  // Generate documentation for a single file
  const sections = await generator.generateDocumentation('path/to/file.ts');
  console.log(sections);
  
  // Generate documentation for a directory
  const results = await generator.generateProjectDocumentation('path/to/directory', {
    extensions: ['.ts', '.js'],
    excludeDirs: ['node_modules', 'dist'],
    maxFiles: 50
  });
  console.log(results);
}
```
pnpm document path/to/directory -c config.json

# Force overwrite of existing files
pnpm document path/to/directory -f

# Enable verbose output
pnpm document path/to/directory -v
```

## Configuration

You can create a configuration file to customize the documentation generation. Here's an example:

```json
{
  "input": "./src",
  "output": "./docs",
  "template": {
    "name": "default",
    "path": "",
    "variables": {
      "title": "Documentation",
      "lastUpdated": "2025-05-18"
    }
  },
  "fileConfig": {
    "include": ["*.ts", "*.js"],
    "exclude": ["node_modules", ".git", "dist", "build", "test"]
  }
}
```

## Custom Templates

You can create custom templates in the `templates` directory. Templates use a simple variable substitution system:

- `{{title}}` - The title of the documentation
- `{{content}}` - The main content of the documentation
- `{{sections}}` - The sections of the documentation
- `{{lastUpdated}}` - The last updated date

## Architecture

The tool is built with a modular architecture:

1. **Core Components**
   - `CodeAnalyzer`: Analyzes code files to extract semantic information
   - `DocumentationGenerator`: Generates documentation using LangGraph
   - `TemplateEngine`: Applies templates to documentation

2. **Utilities**
   - `FileSystem`: Handles file system operations
   - `MarkdownFormatter`: Formats documentation as Markdown
   - `ConfigLoader`: Loads and saves configuration files

3. **CLI Interface**
   - `document`: Main CLI command for generating documentation

## Development

### Project Structure

```
langgraph/
├── src/
│   ├── cli/
│   │   └── commands/
│   │       └── document.ts
│   ├── core/
│   │   ├── codeAnalyzer.ts
│   │   ├── documentationGenerator.ts
│   │   └── templateEngine.ts
│   ├── models/
│   │   └── types.ts
│   └── utils/
│       ├── fileSystem.ts
│       ├── markdown.ts
│       └── configLoader.ts
├── templates/
│   └── default.md
├── package.json
├── tsconfig.json
└── README.md
```

### Running Tests

```bash
# Run unit tests
pnpm test

# Run documentation generation test
pnpm test:doc
```

## License

MIT
