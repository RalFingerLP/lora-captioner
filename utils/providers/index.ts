import { GeminiProvider } from './gemini';
import { OpenAICompatibleProvider } from './openaiCompatible';
import {
  PROVIDER_META,
  type CaptionProvider,
  type ProviderConfig,
  type ProviderId,
} from './types';

export type { CaptionImage, CaptionProvider, CaptionResult, ProviderConfig, ProviderId, ProviderMeta } from './types';
export { PROVIDER_META } from './types';

export function buildProvider(config: ProviderConfig): CaptionProvider {
  const meta = PROVIDER_META[config.providerId];
  switch (config.providerId) {
    case 'gemini': {
      if (!config.apiKey) throw new Error('Gemini API key required.');
      return new GeminiProvider(config.apiKey);
    }
    case 'openai': {
      if (!config.apiKey) throw new Error('OpenAI API key required.');
      const baseUrl = config.baseUrl || meta.defaultBaseUrl!;
      return new OpenAICompatibleProvider('openai', baseUrl, config.apiKey);
    }
    case 'lmstudio': {
      const baseUrl = config.baseUrl || meta.defaultBaseUrl!;
      return new OpenAICompatibleProvider('lmstudio', baseUrl, config.apiKey);
    }
    case 'llamacpp': {
      const baseUrl = config.baseUrl || meta.defaultBaseUrl!;
      return new OpenAICompatibleProvider('llamacpp', baseUrl, config.apiKey);
    }
    default: {
      const _: never = config.providerId;
      throw new Error(`Unknown provider: ${_}`);
    }
  }
}

export function validateConfig(config: ProviderConfig): string | null {
  const meta = PROVIDER_META[config.providerId];
  if (meta.needsApiKey && !config.apiKey?.trim()) {
    return `${meta.label} requires an API key.`;
  }
  if (meta.needsBaseUrl && !(config.baseUrl?.trim() || meta.defaultBaseUrl)) {
    return `${meta.label} requires a server URL.`;
  }
  if (!config.model?.trim()) {
    return 'Please choose or enter a model.';
  }
  return null;
}

const SETTINGS_KEY = 'loraCaptioner.providerSettings.v1';

interface StoredSettings {
  providerId: ProviderId;
  model: string;
  // keyed by provider id
  apiKeys: Partial<Record<ProviderId, string>>;
  baseUrls: Partial<Record<ProviderId, string>>;
  modelsByProvider: Partial<Record<ProviderId, string>>;
}

export function loadStoredSettings(): StoredSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSettings;
  } catch {
    return null;
  }
}

export function saveStoredSettings(settings: StoredSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore — quota or disabled storage
  }
}

export type { StoredSettings };
