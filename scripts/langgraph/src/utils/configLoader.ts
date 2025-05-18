import { promises as fs } from 'fs';
import { DocumentationConfig, FileConfig, TemplateConfig } from '@models/types';

/**
 * Configuration loader for documentation generator
 */
export class ConfigLoader {
  private static instance: ConfigLoader;

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Load configuration from a file
   * @param configPath Path to configuration file
   * @returns Loaded configuration
   */
  public async loadConfig(configPath: string): Promise<DocumentationConfig> {
    try {
      // Read configuration file
      const configContent = await fs.readFile(configPath, 'utf-8');
      
      // Parse JSON content
      const config = JSON.parse(configContent);
      
      // Validate and normalize configuration
      return this.normalizeConfig(config);
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save configuration to a file
   * @param config Configuration to save
   * @param configPath Path to save configuration
   */
  public async saveConfig(config: DocumentationConfig, configPath: string): Promise<void> {
    try {
      // Stringify configuration with pretty formatting
      const configContent = JSON.stringify(config, null, 2);
      
      // Write configuration file
      await fs.writeFile(configPath, configContent);
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a default configuration
   * @param inputPath Input path
   * @param outputPath Output path
   * @returns Default configuration
   */
  public createDefaultConfig(inputPath: string, outputPath: string): DocumentationConfig {
    return {
      input: inputPath,
      output: outputPath,
      template: {
        name: 'default',
        path: '',
        variables: {
          title: `Documentation for ${inputPath}`,
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      },
      fileConfig: {
        include: ['*'],
        exclude: ['node_modules', '.git', 'dist', 'build']
      }
    };
  }

  /**
   * Normalize configuration by filling in missing values with defaults
   * @param config Configuration to normalize
   * @returns Normalized configuration
   */
  private normalizeConfig(config: Partial<DocumentationConfig>): DocumentationConfig {
    // Create default configuration
    const defaultConfig = this.createDefaultConfig(
      config.input || process.cwd(),
      config.output || './docs'
    );
    
    // Merge with provided configuration
    return {
      input: config.input || defaultConfig.input,
      output: config.output || defaultConfig.output,
      template: this.normalizeTemplateConfig(config.template, defaultConfig.template),
      fileConfig: this.normalizeFileConfig(config.fileConfig, defaultConfig.fileConfig)
    };
  }

  /**
   * Normalize template configuration
   * @param config Template configuration to normalize
   * @param defaultConfig Default template configuration
   * @returns Normalized template configuration
   */
  private normalizeTemplateConfig(
    config: Partial<TemplateConfig> | undefined,
    defaultConfig: TemplateConfig
  ): TemplateConfig {
    if (!config) {
      return defaultConfig;
    }
    
    return {
      name: config.name || defaultConfig.name,
      path: config.path || defaultConfig.path,
      variables: {
        ...defaultConfig.variables,
        ...(config.variables || {})
      }
    };
  }

  /**
   * Normalize file configuration
   * @param config File configuration to normalize
   * @param defaultConfig Default file configuration
   * @returns Normalized file configuration
   */
  private normalizeFileConfig(
    config: Partial<FileConfig> | undefined,
    defaultConfig: FileConfig
  ): FileConfig {
    if (!config) {
      return defaultConfig;
    }
    
    return {
      include: config.include || defaultConfig.include,
      exclude: config.exclude || defaultConfig.exclude
    };
  }
}
