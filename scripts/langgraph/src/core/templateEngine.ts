import { promises as fs } from 'fs';
import { join } from 'path';
import { DocumentationSection, TemplateConfig } from '@/models/types';
import { FileSystem } from '@/utils/fileSystem';

export class TemplateEngine {
  private static instance: TemplateEngine;
  private fileSystem: FileSystem;
  private defaultTemplate: string = 'default';
  private templateCache: Map<string, string> = new Map();

  private constructor() {
    this.fileSystem = FileSystem.getInstance();
  }

  public static getInstance(): TemplateEngine {
    if (!TemplateEngine.instance) {
      TemplateEngine.instance = new TemplateEngine();
    }
    return TemplateEngine.instance;
  }

  /**
   * Apply template to documentation sections
   * @param sections Documentation sections
   * @param templateConfig Template configuration
   * @returns Formatted documentation content
   */
  public async applyTemplate(
    sections: DocumentationSection[],
    templateConfig: TemplateConfig
  ): Promise<string> {
    try {
      // Get template content
      const templateContent = await this.getTemplateContent(templateConfig);
      
      // Apply variables to template
      let formattedContent = this.applyVariables(templateContent, templateConfig.variables);
      
      // Apply sections to template
      formattedContent = this.applySections(formattedContent, sections);
      
      return formattedContent;
    } catch (error) {
      console.error('Error applying template:', error);
      throw error;
    }
  }

  /**
   * Get template content
   * @param templateConfig Template configuration
   * @returns Template content
   */
  private async getTemplateContent(templateConfig: TemplateConfig): Promise<string> {
    const { name, path } = templateConfig;
    
    // Check cache first
    if (this.templateCache.has(name)) {
      return this.templateCache.get(name) as string;
    }
    
    let templateContent: string;
    
    // Try to load from custom path
    if (path) {
      try {
        templateContent = await this.fileSystem.readFile(path);
        this.templateCache.set(name, templateContent);
        return templateContent;
      } catch {
        // Silently handle error and fall back to default
        console.warn(`Could not load template from path: ${path}. Falling back to default.`);
      }
    }
    
    // Try to load from templates directory
    try {
      const templatePath = join(__dirname, '..', '..', 'templates', `${name}.md`);
      templateContent = await this.fileSystem.readFile(templatePath);
      this.templateCache.set(name, templateContent);
      return templateContent;
    } catch {
      // Silently handle error and fall back to default
      console.warn(`Could not load template: ${name}. Falling back to default.`);
    }
    
    // Load default template
    if (name !== this.defaultTemplate) {
      return this.getTemplateContent({
        name: this.defaultTemplate,
        path: '',
        variables: templateConfig.variables
      });
    }
    
    // If we get here, we couldn't load any template, so use a simple default
    templateContent = `# {{title}}

{{content}}

## Sections
{{sections}}

Last Updated: {{lastUpdated}}
`;
    
    this.templateCache.set(this.defaultTemplate, templateContent);
    return templateContent;
  }

  /**
   * Apply variables to template
   * @param template Template content
   * @param variables Template variables
   * @returns Formatted template
   */
  private applyVariables(template: string, variables: Record<string, unknown>): string {
    let result = template;
    
    // Replace all variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  /**
   * Apply sections to template
   * @param template Template content
   * @param sections Documentation sections
   * @returns Formatted template with sections
   */
  private applySections(template: string, sections: DocumentationSection[]): string {
    let result = template;
    
    // Replace title placeholder
    const title = sections.length > 0 ? sections[0].title : 'Documentation';
    result = result.replace(/{{title}}/g, title);
    
    // Replace content placeholder
    const content = sections.length > 0 ? sections[0].content : '';
    result = result.replace(/{{content}}/g, content);
    
    // Replace sections placeholder
    const sectionsContent = sections
      .map(section => {
        let sectionContent = `## ${section.title}\n\n${section.content}\n\n`;
        
        // Add code blocks
        if (section.codeBlocks.length > 0) {
          sectionContent += '### Code Examples\n\n';
          section.codeBlocks.forEach(block => {
            sectionContent += `\`\`\`${block.language}\n${block.content}\n\`\`\`\n\n`;
          });
        }
        
        // Add related sections
        if (section.relatedSections.length > 0) {
          sectionContent += '### Related Sections\n\n';
          section.relatedSections.forEach(related => {
            sectionContent += `- ${related}\n`;
          });
          sectionContent += '\n';
        }
        
        return sectionContent;
      })
      .join('\n');
    
    result = result.replace(/{{sections}}/g, sectionsContent);
    
    // Replace last updated placeholder
    const lastUpdated = new Date().toISOString().split('T')[0];
    result = result.replace(/{{lastUpdated}}/g, lastUpdated);
    
    return result;
  }

  /**
   * Create a default template file
   * @param outputPath Path to write the template
   * @returns Path to the created template
   */
  public async createDefaultTemplate(outputPath: string): Promise<string> {
    const defaultTemplatePath = join(outputPath, 'templates', 'default.md');
    const defaultTemplateContent = `# {{title}}

{{content}}

## Sections
{{sections}}

---
Generated with Documentation Generator
Last Updated: {{lastUpdated}}
`;
    
    try {
      // Create templates directory if it doesn't exist
      await fs.mkdir(join(outputPath, 'templates'), { recursive: true });
      
      // Write default template
      await this.fileSystem.writeFile(defaultTemplatePath, defaultTemplateContent);
      
      return defaultTemplatePath;
    } catch (error) {
      console.error('Error creating default template:', error);
      throw error;
    }
  }
}
