# Documentation Generation Tool

A powerful TypeScript CLI tool that uses LangGraph.js to generate comprehensive documentation from codebases.

## Features

- Language-agnostic code analysis
- Automatic documentation generation with LangGraph
- Markdown formatting with cross-references
- Template-based output customization
- Configuration file support
- CLI interface with various options

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Usage

### Basic Usage

```bash
# Generate documentation for a file
pnpm document path/to/file.ts

# Generate documentation for a directory
pnpm document path/to/directory

# Generate documentation with custom output directory
pnpm document path/to/directory -o path/to/output
```

### Advanced Options

```bash
# Use a specific template
pnpm document path/to/directory -t custom-template

# Include only specific file patterns
pnpm document path/to/directory -i "*.ts" "*.js"

# Exclude specific patterns
pnpm document path/to/directory -e "node_modules" "dist"

# Use a configuration file
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
