export interface ImageDetail {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  fileName: string; // Original file name without extension
  originalFileName: string; // Original file name with extension
  isCaptioningAI?: boolean;
  captionAIError?: string | null;
}

export type CaptioningMethod = 
  | 'gemini_descriptive' 
  | 'danbooru_style' 
  | 'wd14_style' 
  | 't5xxl_clip_style';

export const CAPTIONING_METHODS: { id: CaptioningMethod, name: string }[] = [
  { id: 'gemini_descriptive', name: 'Descriptive (Gemini Default)' },
  { id: 'danbooru_style', name: 'Danbooru-Style Tags' },
  { id: 'wd14_style', name: 'WD1.4-Style Tags' },
  { id: 't5xxl_clip_style', name: 'CLIP/T5-Style Sentence' },
];

// For JSZip global variable, if needed in other files.
// Typically, you'd declare it where used or in a global.d.ts.
// For this structure, it will be declared in App.tsx.