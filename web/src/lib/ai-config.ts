import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface AIProviderConfig {
  name: AIProvider;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Configuration for different AI providers
export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
    openai: {
        name: 'openai',
        model: 'gpt-4o',
        maxTokens: 2000,
        temperature: 0.3,
      },
  anthropic: {
    name: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 1000,
    temperature: 0.7,
  },
  google: {
    name: 'google',
    model: 'gemini-pro',
    maxTokens: 1000,
    temperature: 0.7,
  },
};

// Function to get the configured AI provider
export function getConfiguredProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'openai';
  console.log('AI Provider from env:', provider);
  return (provider.toLowerCase() as AIProvider) || 'openai';
}

// Function to get the AI model instance
export function getAIModel() {
  try {
    const provider = getConfiguredProvider();
    const config = AI_PROVIDERS[provider];
    
    console.log('Getting AI model for provider:', provider);
    console.log('Config:', config);
    
    // Validate API key is present
    const apiKeyEnvVar = getAPIKeyEnvVar(provider);
    const apiKey = process.env[apiKeyEnvVar];
    
    console.log('API Key env var:', apiKeyEnvVar);
    console.log('API Key present:', !!apiKey);
    
    if (!apiKey) {
      throw new Error(`${apiKeyEnvVar} not configured for provider: ${provider}`);
    }
    
    let model;
    switch (provider) {
      case 'anthropic':
        console.log('Creating Anthropic model...');
        model = anthropic(config.model);
        break;
      case 'google':
        console.log('Creating Google model...');
        model = google(config.model);
        break;
      case 'openai':
      default:
        console.log('Creating OpenAI model...');
        model = openai(config.model);
        break;
    }
    
    console.log('Model created successfully:', !!model);
    return model;
  } catch (error) {
    console.error('Error in getAIModel:', error);
    throw error;
  }
}

// Function to get the configuration for the current provider
export function getAIConfig(): AIProviderConfig {
  const provider = getConfiguredProvider();
  return AI_PROVIDERS[provider];
}

// Function to get the environment variable name for API key
function getAPIKeyEnvVar(provider: AIProvider): string {
  switch (provider) {
    case 'anthropic':
      return 'ANTHROPIC_API_KEY';
    case 'google':
      return 'GOOGLE_AI_API_KEY';
    case 'openai':
    default:
      return 'OPENAI_API_KEY';
  }
}

// Function to validate all required environment variables
export function validateAIEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const provider = getConfiguredProvider();
  const apiKeyEnvVar = getAPIKeyEnvVar(provider);
  
  console.log('Validating AI environment for provider:', provider);
  console.log('Required API key env var:', apiKeyEnvVar);
  console.log('API key present:', !!process.env[apiKeyEnvVar]);
  
  if (!process.env[apiKeyEnvVar]) {
    errors.push(`${apiKeyEnvVar} is required for provider: ${provider}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
} 