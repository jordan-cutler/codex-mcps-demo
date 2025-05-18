import { DocumentationGenerator } from '@/core/documentationGenerator';
import path from 'path';
import fs from 'fs/promises';

/**
 * Test the documentation generation capabilities
 */
async function testDocumentationGenerator() {
  console.log('Testing Documentation Generator...');
  
  try {
    // Get the documentation generator instance
    const generator = DocumentationGenerator.getInstance();
    
    // Initialize the generator
    await generator.initialize();
    console.log('Documentation generator initialized successfully');
    
    // Generate documentation for a single file
    const filePath = path.join(__dirname, 'core/codeAnalyzer.ts');
    console.log(`\nGenerating documentation for ${filePath}...`);
    
    const sections = await generator.generateDocumentation(filePath);
    console.log(`Generated ${sections.length} documentation sections`);
    
    // Print the section titles
    console.log('\nDocumentation sections:');
    sections.forEach((section, index) => {
      console.log(`${index + 1}. ${section.title}`);
    });
    
    // Save the documentation to a file
    const outputDir = path.join(__dirname, '../docs');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, 'codeAnalyzer.md');
    const markdown = sections.map(section => section.content).join('\n\n---\n\n');
    await fs.writeFile(outputPath, markdown);
    
    console.log(`\nDocumentation saved to ${outputPath}`);
    
    // Generate documentation for a directory
    console.log('\nGenerating documentation for the utils directory...');
    const directoryPath = path.join(__dirname, 'utils');
    const options = {
      extensions: ['.ts'],
      excludeDirs: ['node_modules', 'dist'],
      maxFiles: 5
    };
    
    const directoryResults = await generator.generateProjectDocumentation(directoryPath, options);
    const fileCount = Object.keys(directoryResults).length;
    console.log(`Generated documentation for ${fileCount} files in the directory`);
    
    // Save all documentation to files
    for (const [filePath, sections] of Object.entries(directoryResults)) {
      const fileName = path.basename(filePath, path.extname(filePath));
      const outputPath = path.join(outputDir, `${fileName}.md`);
      const markdown = sections.map(section => section.content).join('\n\n---\n\n');
      await fs.writeFile(outputPath, markdown);
      console.log(`Saved documentation for ${fileName} to ${outputPath}`);
    }
    
    console.log('\nDocumentation generation test completed successfully');
  } catch (error) {
    console.error('Error testing documentation generator:', error);
  }
}

// Run the test
testDocumentationGenerator().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Test failed:', error);
});
