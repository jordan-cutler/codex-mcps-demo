# Documentation Generation Tool - Prompt Generation Guide

This document contains prompts for implementing the documentation generation tool, organized by implementation phase and component. Each prompt is designed to be comprehensive and maintain alignment with the spec and plan.

## Phase 1: Core Infrastructure

### 1. Project Setup
```prompt
You are an expert TypeScript developer with deep knowledge of LangGraph.js. Create a TypeScript project with pnpm that will serve as a documentation generation tool. The project should:

1. Use the same structure as the agent-loop folder but adapted for documentation generation
2. Include proper TypeScript configuration with strict mode enabled
3. Set up ESLint with recommended TypeScript settings
4. Configure Jest for testing
5. Initialize with core dependencies:
   - @langgraph/core
   - chalk
   - commander
   - fs-extra
   - glob
   - marked

The project should be modular and follow the structure shown in the plan.md file. Ensure all code is properly typed and follows best practices for maintainability and scalability.
```

### 2. File System Utilities
```prompt
Create a robust file system utility module that will:

1. Handle reading both files and directories
2. Support recursive directory traversal
3. Filter files based on patterns
4. Handle file path normalization
5. Support streaming for large files
6. Implement proper error handling

The implementation should be optimized for performance and memory usage, especially when dealing with large codebases. Use TypeScript interfaces to define the expected structure of file operations.
```

### 3. Code Analysis Core
```prompt
Design and implement a language-agnostic code analysis system that:

1. Can process any type of code file
2. Extracts semantic understanding of code relationships
3. Handles both synchronous and asynchronous patterns
4. Maintains context across related code sections
5. Supports code example extraction with consideration for future-proofing

The system should be extensible and not rely on specific language parsers. Focus on understanding code structure and relationships rather than syntax.
```

## Phase 2: Documentation Generation

### 1. LangGraph Integration
```prompt
Implement LangGraph integration that:

1. Uses LangGraph.js for documentation generation
2. Maintains state between code sections
3. Handles streaming of large codebases
4. Supports proper context management
5. Includes error handling for LLM responses

The implementation should be optimized for performance and reliability, with proper caching of LLM responses when appropriate.
```

### 2. Markdown Generation
```prompt
Create a Markdown generation system that:

1. Converts code analysis results to Markdown format
2. Implements proper code block formatting
3. Handles cross-referencing between documentation sections
4. Includes last updated date functionality
5. Supports custom template formatting

The system should maintain semantic understanding of the code while generating clear and readable documentation.
```

## Phase 3: CLI Interface

### 1. Command Implementation
```prompt
Implement a CLI command system that:

1. Supports both file and directory inputs
2. Handles template selection
3. Manages output directory configuration
4. Provides progress reporting
5. Includes comprehensive error handling

The command should be user-friendly and provide clear feedback during execution. Use commander.js for the CLI framework.
```

### 2. Template System
```prompt
Design and implement a template system that:

1. Supports custom template loading
2. Includes a default DeepWiki-style template
3. Handles template inheritance
4. Validates template structure
5. Supports template configuration

The system should be extensible and allow users to customize the documentation output format while maintaining core functionality.
```

## Phase 4: Testing and Validation

### 1. Unit Tests
```prompt
Create comprehensive unit tests for:

1. File system utilities
2. Code analysis components
3. LangGraph integration
4. Template engine
5. CLI command handling

Tests should cover edge cases and error conditions, with proper mocking of external dependencies.
```

### 2. Integration Tests
```prompt
Implement integration tests that:

1. Verify complete documentation generation flow
2. Test file processing pipeline
3. Validate output format
4. Check cross-referencing functionality
5. Test template application

Tests should use real code examples to ensure the system works end-to-end.
```

## Key Implementation Notes

1. Performance Considerations
```prompt
Optimize the implementation for:
1. Large codebase processing
2. Memory usage
3. Streaming operations
4. Parallel processing where appropriate
5. Caching of intermediate results
```

2. Error Handling
```prompt
Implement comprehensive error handling that:
1. Provides clear error messages
2. Handles file system errors gracefully
3. Manages LLM API failures
4. Validates template syntax
5. Reports progress during long operations
```

3. Configuration Management
```prompt
Design a configuration system that:
1. Supports environment variables
2. Handles CLI arguments
3. Manages template settings
4. Validates configuration values
5. Provides default values where appropriate
```

## Implementation Order

1. Start with core infrastructure (Phase 1)
2. Build documentation generation capabilities (Phase 2)
3. Implement CLI interface (Phase 3)
4. Add testing and validation (Phase 4)

Each phase should be thoroughly tested before moving to the next phase.

## Additional Resources

- Reference the spec.md file for core requirements
- Reference the plan.md file for implementation details
- Use the agent-loop folder as a reference for project structure
- Follow TypeScript best practices throughout implementation

Would you like me to start implementing the project based on these prompts?
