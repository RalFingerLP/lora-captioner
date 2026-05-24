import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import type { CaptionImage, CaptionProvider, CaptionResult } from './types';

export class GeminiProvider implements CaptionProvider {
  readonly id = 'gemini' as const;
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  private extractTokens(response: GenerateContentResponse): number {
    const meta: any = (response as any).usageMetadata;
    return meta?.totalTokens ?? meta?.totalTokenCount ?? 0;
  }

  async generateCaption(
    image: CaptionImage,
    userPrompt: string,
    systemPrompt: string | undefined,
    model: string,
  ): Promise<CaptionResult> {
    const imagePart = {
      inlineData: { mimeType: image.mimeType, data: image.base64 },
    };
    const textPart = { text: userPrompt };
    const payload: any = {
      model,
      contents: { parts: [imagePart, textPart] },
    };
    if (systemPrompt && systemPrompt.trim()) {
      payload.config = { systemInstruction: systemPrompt.trim() };
    }
    const response = await this.client.models.generateContent(payload);
    return {
      text: (response.text || '').trim(),
      tokens: this.extractTokens(response),
    };
  }

  async generateMultiImageText(
    images: CaptionImage[],
    userPrompt: string,
    model: string,
    temperature?: number,
  ): Promise<CaptionResult> {
    const parts: any[] = images.map(img => ({
      inlineData: { mimeType: img.mimeType, data: img.base64 },
    }));
    parts.push({ text: userPrompt });
    const payload: any = {
      model,
      contents: { parts },
    };
    if (temperature !== undefined) {
      payload.config = { temperature };
    }
    const response = await this.client.models.generateContent(payload);
    return {
      text: (response.text || '').trim(),
      tokens: this.extractTokens(response),
    };
  }

  async generateText(
    userPrompt: string,
    model: string,
    temperature?: number,
  ): Promise<CaptionResult> {
    const payload: any = {
      model,
      contents: userPrompt,
    };
    if (temperature !== undefined) {
      payload.config = { temperature };
    }
    const response = await this.client.models.generateContent(payload);
    return {
      text: (response.text || '').trim(),
      tokens: this.extractTokens(response),
    };
  }
}
