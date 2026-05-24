export type ProviderId = 'gemini' | 'openai' | 'lmstudio' | 'llamacpp';

export interface ProviderConfig {
  providerId: ProviderId;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface CaptionImage {
  file: File;
  mimeType: string;
  base64: string;
}

export interface CaptionResult {
  text: string;
  tokens: number;
}

export interface CaptionProvider {
  readonly id: ProviderId;
  generateCaption(
    image: CaptionImage,
    userPrompt: string,
    systemPrompt: string | undefined,
    model: string,
  ): Promise<CaptionResult>;
  generateMultiImageText(
    images: CaptionImage[],
    userPrompt: string,
    model: string,
    temperature?: number,
  ): Promise<CaptionResult>;
  generateText(
    userPrompt: string,
    model: string,
    temperature?: number,
  ): Promise<CaptionResult>;
  listModels?(): Promise<string[]>;
}

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  needsApiKey: boolean;
  needsBaseUrl: boolean;
  defaultBaseUrl?: string;
  isLocal: boolean;
  models: string[];
  helpText: string;
}

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    label: 'Google Gemini (Cloud)',
    needsApiKey: true,
    needsBaseUrl: false,
    isLocal: false,
    models: [
      'gemini-3-pro-preview',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite-preview-02-05',
      'gemini-1.5-pro-002',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-8b',
    ],
    helpText: 'Get a free key at https://aistudio.google.com/. Free tier has generous quota for image captioning.',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI (Cloud)',
    needsApiKey: true,
    needsBaseUrl: false,
    defaultBaseUrl: 'https://api.openai.com/v1',
    isLocal: false,
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'o3',
      'o4-mini',
    ],
    helpText: 'Get an API key at https://platform.openai.com/api-keys. Vision is supported on the gpt-4o, gpt-4.1, and o-series models listed here.',
  },
  lmstudio: {
    id: 'lmstudio',
    label: 'LM Studio (Local)',
    needsApiKey: false,
    needsBaseUrl: true,
    defaultBaseUrl: 'http://localhost:1234/v1',
    isLocal: true,
    models: [],
    helpText: 'Run a local vision model in LM Studio. See the setup checklist below.',
  },
  llamacpp: {
    id: 'llamacpp',
    label: 'llama.cpp server (Local)',
    needsApiKey: false,
    needsBaseUrl: true,
    defaultBaseUrl: 'http://localhost:8080/v1',
    isLocal: true,
    models: [],
    helpText: 'Run llama-server with a vision projector. See the setup checklist below.',
  },
};
