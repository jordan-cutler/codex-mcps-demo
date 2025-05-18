import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";
import { DocumentationSection } from "@/models/types";

// Define input/output types for memory operations
type MemoryInput = Record<string, unknown>;
type MemoryOutput = Record<string, unknown>;

// Define custom memory classes since the imports are not available
class BufferWindowMemory {
  private messages: BaseMessage[] = [];
  private k: number;
  private returnMessages: boolean;
  private memoryKey: string;
  private inputKey: string;

  constructor(config: {
    k: number;
    returnMessages: boolean;
    memoryKey: string;
    inputKey: string;
  }) {
    this.k = config.k;
    this.returnMessages = config.returnMessages;
    this.memoryKey = config.memoryKey;
    this.inputKey = config.inputKey;
  }

  async saveContext(inputValues: MemoryInput, outputValues: MemoryOutput): Promise<void> {
    // In a real implementation, this would save messages to the buffer
    console.log('Saving context to memory', { input: inputValues, output: outputValues });
  }

  async loadMemoryVariables(): Promise<Record<string, BaseMessage[] | string>> {
    // In a real implementation, this would return the message history
    return { [this.memoryKey]: this.returnMessages ? this.messages : 'Chat history placeholder' };
  }
}

// Define the type for code analysis results
interface CodeAnalysisBlock {
  lineStart: number;
  lineEnd: number;
  content: string;
  type: string;
  name?: string;
}

interface CodeAnalysisResult {
  filePath: string;
  blocks: CodeAnalysisBlock[];
  imports: string[];
  exports: string[];
  dependencies: string[];
}

class MemoryManager {
  private memory: DocumentationMemory;
  private getSessionId: () => string;

  constructor(config: { memory: DocumentationMemory; getSessionId: () => string }) {
    this.memory = config.memory;
    this.getSessionId = config.getSessionId;
  }

  async get<K extends keyof DocumentationMemory>(key: K): Promise<DocumentationMemory[K]> {
    return this.memory[key];
  }

  async update<K extends keyof DocumentationMemory>(key: K, value: DocumentationMemory[K]): Promise<void> {
    this.memory[key] = value;
  }

  async getSessionMemory(): Promise<DocumentationMemory> {
    return this.memory;
  }
}

// ChatMessageHistory implementation removed as it's not needed

// Define memory interfaces
export interface DocumentationMemory {
  codeAnalysisResults: Record<string, CodeAnalysisResult>;
  documentationSections: Record<string, DocumentationSection>;
  crossReferences: Record<string, string[]>;
  processedFiles: string[];
}

// Create initial memory state
export const createInitialMemory = (): DocumentationMemory => {
  return {
    codeAnalysisResults: {},
    documentationSections: {},
    crossReferences: {},
    processedFiles: []
  };
};

// Create memory manager
export const createMemoryManager = () => {
  // Short-term conversation memory
  const conversationMemory = new BufferWindowMemory({
    k: 5, // Keep last 5 interactions
    returnMessages: true,
    memoryKey: "chat_history",
    inputKey: "input"
  });

  // Long-term memory for documentation context
  const documentationMemory = createInitialMemory();

  // Create memory manager
  const memoryManager = new MemoryManager({
    memory: documentationMemory,
    getSessionId: () => "documentation_session"
  });

  return {
    conversationMemory,
    documentationMemory,
    memoryManager
  };
};

export const getCodeAnalysis = async (
  memoryManager: MemoryManager,
  filePath: string
): Promise<CodeAnalysisResult | undefined> => {
  const memory = await memoryManager.getSessionMemory();
  return memory.codeAnalysisResults[filePath];
};

export const storeDocumentationSection = async (
  memoryManager: MemoryManager,
  sectionId: string,
  section: DocumentationSection | string // Allow string for backward compatibility
): Promise<void> => {
  const memory = await memoryManager.getSessionMemory();

  // Store documentation section
  memory.documentationSections[sectionId] = typeof section === 'string'
    ? {
        title: sectionId,
        content: section,
        codeBlocks: [],
        relatedSections: [],
        lastUpdated: new Date().toISOString()
      } as DocumentationSection
    : section;

  await memoryManager.update('documentationSections', memory.documentationSections);
};

export const getDocumentationSection = async (
  memoryManager: MemoryManager,
  sectionId: string
): Promise<DocumentationSection | undefined> => {
  const memory = await memoryManager.getSessionMemory();
  return memory.documentationSections[sectionId];
};

export const addCrossReference = async (
  memoryManager: MemoryManager,
  sourceId: string,
  targetId: string
): Promise<void> => {
  const memory = await memoryManager.getSessionMemory();

  // Initialize cross-references array if it doesn't exist
  if (!memory.crossReferences[sourceId]) {
    memory.crossReferences[sourceId] = [];
  }

  // Add cross-reference if it doesn't already exist
  if (!memory.crossReferences[sourceId].includes(targetId)) {
    memory.crossReferences[sourceId].push(targetId);
  }

  await memoryManager.update('crossReferences', memory.crossReferences);
};

export const getCrossReferences = async (
  memoryManager: MemoryManager,
  sourceId: string
): Promise<string[]> => {
  const memory = await memoryManager.getSessionMemory();
  return memory.crossReferences[sourceId] || [];
};

export const isFileProcessed = async (
  memoryManager: MemoryManager,
  filePath: string
): Promise<boolean> => {
  const memory = await memoryManager.getSessionMemory();
  return memory.processedFiles.includes(filePath);
};

// Create a runnable with memory
export const createRunnableWithMemory = (
  runnable: RunnableSequence<RunnableInput, RunnableOutput>,
  conversationMemory: BufferWindowMemory
) => {
  // Define input type for this specific context
  type InputType = { input: string; [key: string]: unknown };

  // Create a sequence that loads memory variables
  const withMemory = RunnableSequence.from([
    {
      input: (input: InputType) => input.input,
      memory: async () => {
        const memoryVariables = await conversationMemory.loadMemoryVariables();
        return memoryVariables;
      }
    },
    {
      input: (previousOutput: { input: string; memory: Record<string, unknown> }) => previousOutput.input,
      chat_history: (previousOutput: { memory: Record<string, unknown> }) => previousOutput.memory.chat_history
    },
    runnable
  ]);

  // Create a function that saves the conversation to memory
  const saveMemory = async (input: InputType, output: unknown) => {
    await conversationMemory.saveContext(input, { output });
    return output;
  };

  // Return a sequence that loads memory, runs the model, and saves the result
  return RunnableSequence.from([
    RunnablePassthrough.assign({ originalInput: (input: InputType) => input }),
    withMemory,
    // Use a simpler callback signature to avoid type errors
    (result: unknown) => {
      const original = { originalInput: { input: "" } }; // Default value
      return saveMemory(original.originalInput as InputType, result);
    }
  ]);
};
