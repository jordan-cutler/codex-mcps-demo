import { createMCPTools, closeMCPClient } from './core/mcpConfig';

/**
 * Test the MCP tools configuration
 */
async function testMCPTools() {
  console.log('Testing MCP tools...');
  
  try {
    // Create MCP tools
    const { tools, client } = await createMCPTools();
    
    // Log the available tools
    console.log(`Found ${tools.length} tools:`);
    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}: ${tool.description}`);
    });
    
    // Test a simple file operation if tools are available
    if (tools.length > 0) {
      const readFileTool = tools.find(tool => tool.name === 'read_file');
      if (readFileTool) {
        console.log('\nTesting read_file tool:');
        const result = await readFileTool.invoke('./package.json');
        console.log('Result:', result.slice(0, 200) + '...');
      }
    }
    
    // Close the MCP client
    await closeMCPClient(client);
    console.log('\nMCP client closed successfully');
  } catch (error) {
    console.error('Error testing MCP tools:', error);
  }
}

// Run the test
testMCPTools().then(() => {
  console.log('Test completed');
}).catch(error => {
  console.error('Test failed:', error);
});
