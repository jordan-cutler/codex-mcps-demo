import { marked } from 'marked';
import { CodeBlock, DocumentationSection } from '@/models/types';

export class MarkdownFormatter {
  private static instance: MarkdownFormatter;

  private constructor() {}

  public static getInstance(): MarkdownFormatter {
    if (!MarkdownFormatter.instance) {
      MarkdownFormatter.instance = new MarkdownFormatter();
    }
    return MarkdownFormatter.instance;
  }

  /**
   * Format documentation sections as Markdown
   * @param sections Documentation sections
   * @returns Formatted Markdown content
   */
  public formatSections(sections: DocumentationSection[]): string {
    let markdown = '';
    
    // Add title from first section
    if (sections.length > 0) {
      markdown += `# ${sections[0].title}\n\n`;
    }
    
    // Process each section
    for (const section of sections) {
      markdown += this.formatSection(section);
    }
    
    // Add last updated date
    const lastUpdated = new Date().toISOString().split('T')[0];
    markdown += `\n\n---\nLast Updated: ${lastUpdated}`;
    
    return markdown;
  }

  /**
   * Format a single documentation section
   * @param section Documentation section
   * @returns Formatted Markdown content
   */
  public formatSection(section: DocumentationSection): string {
    let markdown = '';
    
    // Add section title
    markdown += `## ${section.title}\n\n`;
    
    // Add section content
    markdown += `${section.content}\n\n`;
    
    // Add code blocks
    if (section.codeBlocks.length > 0) {
      markdown += `### Code Examples\n\n`;
      
      for (const block of section.codeBlocks) {
        markdown += this.formatCodeBlock(block);
      }
    }
    
    // Add related sections
    if (section.relatedSections.length > 0) {
      markdown += `### Related Sections\n\n`;
      
      for (const related of section.relatedSections) {
        markdown += `- [${related}](#${this.createAnchor(related)})\n`;
      }
      
      markdown += '\n';
    }
    
    return markdown;
  }

  /**
   * Format a code block
   * @param block Code block
   * @returns Formatted Markdown code block
   */
  public formatCodeBlock(block: CodeBlock): string {
    return `\`\`\`${block.language}\n${block.content}\n\`\`\`\n\n`;
  }

  /**
   * Validate Markdown content
   * @param content Markdown content
   * @returns True if valid, false otherwise
   */
  public validateMarkdown(content: string): boolean {
    try {
      // Parse Markdown to check for syntax errors
      marked.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create an anchor from a section title
   * @param title Section title
   * @returns Anchor string
   */
  private createAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  /**
   * Add cross-references between sections
   * @param content Markdown content
   * @param sections Documentation sections
   * @returns Content with cross-references
   */
  public addCrossReferences(content: string, sections: DocumentationSection[]): string {
    let result = content;
    
    // Create a map of section titles to anchors
    const anchors: Record<string, string> = {};
    
    for (const section of sections) {
      anchors[section.title] = this.createAnchor(section.title);
    }
    
    // Replace section titles with links
    for (const [title, anchor] of Object.entries(anchors)) {
      const regex = new RegExp(`(?<!#\\s)${title}(?!\\])`, 'g');
      result = result.replace(regex, `[${title}](#${anchor})`);
    }
    
    return result;
  }
}
