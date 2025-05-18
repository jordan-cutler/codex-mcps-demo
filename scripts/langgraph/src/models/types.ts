export interface FileConfig {
  include: string[];
  exclude: string[];
}

export interface TemplateConfig {
  name: string;
  path: string;
  variables: Record<string, any>;
}

export interface DocumentationConfig {
  input: string;
  output: string;
  template: TemplateConfig;
  fileConfig: FileConfig;
}

export interface CodeBlock {
  content: string;
  language: string;
  path: string;
  lineStart: number;
  lineEnd: number;
}

export interface DocumentationSection {
  title: string;
  content: string;
  codeBlocks: CodeBlock[];
  relatedSections: string[];
  lastUpdated: string;
}
