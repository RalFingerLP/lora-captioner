import type {
  CaptionImage,
  CaptionProvider,
  CaptionResult,
  ProviderId,
} from './types';

interface OpenAIChatResponse {
  choices?: { message?: { content?: string | null } }[];
  usage?: { total_tokens?: number };
  error?: { message?: string };
}

interface OpenAIModelsResponse {
  data?: { id: string }[];
}

export class OpenAICompatibleProvider implements CaptionProvider {
  readonly id: ProviderId;
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(id: ProviderId, baseUrl: string, apiKey?: string) {
    this.id = id;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`;
    return h;
  }

  private async chat(body: any): Promise<CaptionResult> {
    let resp: Response;
    try {
      resp = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      });
    } catch (e: any) {
      throw new Error(
        `Network error contacting ${this.baseUrl}: ${e.message || e}. ` +
          (this.id === 'lmstudio' || this.id === 'llamacpp'
            ? 'Check that the local server is running and CORS is enabled.'
            : ''),
      );
    }
    if (!resp.ok) {
      let detail = '';
      try {
        const errBody = await resp.json();
        detail = errBody?.error?.message || JSON.stringify(errBody);
      } catch {
        detail = await resp.text();
      }
      throw new Error(`HTTP ${resp.status} from ${this.id}: ${detail}`);
    }
    const data = (await resp.json()) as OpenAIChatResponse;
    if (data.error) throw new Error(data.error.message || 'Provider error');
    const text = data.choices?.[0]?.message?.content?.toString().trim() || '';
    return { text, tokens: data.usage?.total_tokens ?? 0 };
  }

  private imageContentPart(image: CaptionImage) {
    return {
      type: 'image_url',
      image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
    };
  }

  async generateCaption(
    image: CaptionImage,
    userPrompt: string,
    systemPrompt: string | undefined,
    model: string,
  ): Promise<CaptionResult> {
    const messages: any[] = [];
    if (systemPrompt && systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt.trim() });
    }
    messages.push({
      role: 'user',
      content: [
        this.imageContentPart(image),
        { type: 'text', text: userPrompt },
      ],
    });
    return this.chat({ model, messages });
  }

  async generateMultiImageText(
    images: CaptionImage[],
    userPrompt: string,
    model: string,
    temperature?: number,
  ): Promise<CaptionResult> {
    const content: any[] = images.map(img => this.imageContentPart(img));
    content.push({ type: 'text', text: userPrompt });
    const body: any = {
      model,
      messages: [{ role: 'user', content }],
    };
    if (temperature !== undefined) body.temperature = temperature;
    return this.chat(body);
  }

  async generateText(
    userPrompt: string,
    model: string,
    temperature?: number,
  ): Promise<CaptionResult> {
    const body: any = {
      model,
      messages: [{ role: 'user', content: userPrompt }],
    };
    if (temperature !== undefined) body.temperature = temperature;
    return this.chat(body);
  }

  async listModels(): Promise<string[]> {
    let resp: Response;
    try {
      resp = await fetch(`${this.baseUrl}/models`, { headers: this.headers() });
    } catch (e: any) {
      throw new Error(
        `Could not reach ${this.baseUrl}/models: ${e.message || e}`,
      );
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status} listing models`);
    const data = (await resp.json()) as OpenAIModelsResponse;
    return (data.data || []).map(m => m.id).sort();
  }
}
