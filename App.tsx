
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ImageDetail, CaptioningMethod, CAPTIONING_METHODS } from './types';
import FileUploader from './components/FileUploader';
import ImageCaptionEditor from './components/ImageCaptionEditor';
import ActionButtons from './components/ActionButtons';
import DatasetIdentifierModal from './components/DatasetIdentifierModal';
import ProviderSettings from './components/ProviderSettings';
import { fileToBase64 } from './utils/imageUtils';
import {
  buildProvider,
  loadStoredSettings,
  saveStoredSettings,
  validateConfig,
  PROVIDER_META,
  type CaptionImage,
  type CaptionProvider,
  type ProviderId,
} from './utils/providers';

declare var JSZip: any;
declare var WordCloud: any;
declare global {
  interface Window {
    jspdf: {
      jsPDF: new (options?: any) => any;
    };
  }
}

const DEFAULT_PROVIDER: ProviderId = 'gemini';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isBatchCaptioningInProgress, setIsBatchCaptioningInProgress] = useState<boolean>(false);
  const [prePrompt, setPrePrompt] = useState<string>('');

  const [isInterruptedVisual, setIsInterruptedVisual] = useState<boolean>(false);
  const isInterruptedRef = useRef<boolean>(false);

  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [isCaptioningSelectedInProgress, setIsCaptioningSelectedInProgress] = useState<boolean>(false);
  const [captioningMethod, setCaptioningMethod] = useState<CaptioningMethod>(CAPTIONING_METHODS[0].id);

  const [uniqueDatasetToken, setUniqueDatasetToken] = useState<string>('');
  const [uniqueDatasetNameStyle, setUniqueDatasetNameStyle] = useState<string>('');

  const [showDatasetIdentifierModal, setShowDatasetIdentifierModal] = useState<boolean>(false);
  const [modalConfig, setModalConfig] = useState<{
    type: 'token' | 'nameStyle';
    aiSuggestion: string;
    isLoadingAiSuggestion: boolean;
    captioningTrigger: 'all' | 'selected' | null;
  } | null>(null);
  const [modalInputValue, setModalInputValue] = useState<string>('');
  const [tokenCount, setTokenCount] = useState<number>(0);

  const prevUniqueDatasetTokenRef = useRef<string>('');

  const [providerId, setProviderId] = useState<ProviderId>(DEFAULT_PROVIDER);
  const [apiKeys, setApiKeys] = useState<Partial<Record<ProviderId, string>>>({});
  const [baseUrls, setBaseUrls] = useState<Partial<Record<ProviderId, string>>>({});
  const [modelsByProvider, setModelsByProvider] = useState<Partial<Record<ProviderId, string>>>({});
  const [localModelList, setLocalModelList] = useState<Partial<Record<ProviderId, string[]>>>({});
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [settingsHydrated, setSettingsHydrated] = useState<boolean>(false);

  useEffect(() => {
    const stored = loadStoredSettings();
    const envGeminiKey = (typeof process !== 'undefined' && (process as any).env?.GEMINI_API_KEY) || '';
    const envOpenAIKey = (typeof process !== 'undefined' && (process as any).env?.OPENAI_API_KEY) || '';

    const initialApiKeys: Partial<Record<ProviderId, string>> = {
      ...(stored?.apiKeys || {}),
    };
    if (!initialApiKeys.gemini && envGeminiKey) initialApiKeys.gemini = envGeminiKey;
    if (!initialApiKeys.openai && envOpenAIKey) initialApiKeys.openai = envOpenAIKey;

    setApiKeys(initialApiKeys);
    setBaseUrls(stored?.baseUrls || {});
    setModelsByProvider(stored?.modelsByProvider || {});
    setProviderId(stored?.providerId || DEFAULT_PROVIDER);
    setSettingsHydrated(true);
  }, []);

  useEffect(() => {
    if (!settingsHydrated) return;
    saveStoredSettings({
      providerId,
      model: modelsByProvider[providerId] || '',
      apiKeys,
      baseUrls,
      modelsByProvider,
    });
  }, [settingsHydrated, providerId, apiKeys, baseUrls, modelsByProvider]);

  const meta = PROVIDER_META[providerId];
  const effectiveBaseUrl = baseUrls[providerId] || meta.defaultBaseUrl || '';
  const effectiveApiKey = apiKeys[providerId] || '';
  const effectiveModel =
    modelsByProvider[providerId] ||
    (meta.models.length > 0 ? meta.models[0] : '');

  const providerConfig = {
    providerId,
    apiKey: effectiveApiKey,
    baseUrl: effectiveBaseUrl,
    model: effectiveModel,
  };
  const configError = validateConfig(providerConfig);
  const aiAvailable = !configError;

  const provider: CaptionProvider | null = useMemo(() => {
    if (!aiAvailable) return null;
    try {
      return buildProvider(providerConfig);
    } catch (e) {
      console.error('[App] Failed to build provider:', e);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, effectiveApiKey, effectiveBaseUrl, aiAvailable]);

  const handleProviderChange = (id: ProviderId) => {
    setProviderId(id);
    setConnectionStatus('idle');
    setConnectionMessage(null);
    setFetchModelsError(null);
  };

  const handleApiKeyChange = (key: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: key }));
  };

  const handleBaseUrlChange = (url: string) => {
    setBaseUrls(prev => ({ ...prev, [providerId]: url }));
    setConnectionStatus('idle');
    setConnectionMessage(null);
  };

  const handleModelChange = (model: string) => {
    setModelsByProvider(prev => ({ ...prev, [providerId]: model }));
  };

  const handleRefreshModels = async () => {
    setIsFetchingModels(true);
    setFetchModelsError(null);
    try {
      const tempProvider = buildProvider({ ...providerConfig, model: 'placeholder' });
      if (!tempProvider.listModels) {
        throw new Error('This provider does not support listing models.');
      }
      const models = await tempProvider.listModels();
      setLocalModelList(prev => ({ ...prev, [providerId]: models }));
      if (models.length && !modelsByProvider[providerId]) {
        setModelsByProvider(prev => ({ ...prev, [providerId]: models[0] }));
      }
    } catch (e: any) {
      setFetchModelsError(e.message || 'Failed to fetch model list.');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMessage(`Pinging ${effectiveBaseUrl}/models …`);
    try {
      const tempProvider = buildProvider({ ...providerConfig, model: 'placeholder' });
      if (tempProvider.listModels) {
        const models = await tempProvider.listModels();
        setLocalModelList(prev => ({ ...prev, [providerId]: models }));
        setConnectionStatus('ok');
        setConnectionMessage(
          models.length > 0
            ? `Connected. ${models.length} model(s) available. Make sure the one you pick supports vision (image input).`
            : 'Connected, but the server reports no loaded models. Load a vision model in the server UI.',
        );
      } else {
        setConnectionStatus('ok');
        setConnectionMessage('Provider does not require a connection test.');
      }
    } catch (e: any) {
      setConnectionStatus('error');
      setConnectionMessage(
        `${e.message || 'Unknown error.'} ${
          providerId === 'lmstudio'
            ? 'Make sure LM Studio\'s local server is running and a vision model is loaded.'
            : providerId === 'llamacpp'
            ? 'Make sure llama-server was started with --cors and --mmproj for vision.'
            : ''
        }`,
      );
    }
  };

  useEffect(() => {
    const currentToken = uniqueDatasetToken.trim();
    const prevToken = prevUniqueDatasetTokenRef.current.trim();

    if (currentToken === prevToken) return;
    console.log(`[App] UniqueDatasetToken changed from "${prevToken}" to "${currentToken}". Updating captions.`);

    setImages(prevImages =>
      prevImages.map(img => {
        let baseCaption = img.caption;
        if (prevToken) {
          if (baseCaption.startsWith(prevToken + ", ")) {
            baseCaption = baseCaption.substring(prevToken.length + 2);
          } else if (baseCaption === prevToken) {
            baseCaption = "";
          }
        }
        let newCaption = baseCaption;
        if (currentToken) {
          newCaption = baseCaption ? `${currentToken}, ${baseCaption}` : currentToken;
        }
        return { ...img, caption: newCaption };
      })
    );
    prevUniqueDatasetTokenRef.current = currentToken;
  }, [uniqueDatasetToken]);

  const handleFilesSelect = useCallback((selectedFiles: File[]) => {
    setError(null);
    const currentActiveToken = uniqueDatasetToken.trim();

    const newImageDetails: ImageDetail[] = selectedFiles
      .filter(file => file.type.startsWith('image/'))
      .map(file => {
        const fileNameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        return {
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          caption: currentActiveToken || '',
          fileName: fileNameWithoutExtension,
          originalFileName: file.name,
          isCaptioningAI: false,
          captionAIError: null,
        };
      });

    if (newImageDetails.length === 0 && selectedFiles.length > 0) {
      setError("No valid image files found in the selection. Please select a folder containing images (PNG, JPG, WEBP etc).");
    } else if (newImageDetails.length > 0) {
      setImages(prevImages => {
        const existingFileNames = new Set(prevImages.map(img => img.originalFileName));
        const uniqueNewImages = newImageDetails.filter(img => !existingFileNames.has(img.originalFileName));
        return [...prevImages, ...uniqueNewImages];
      });
      setSelectedImageIds(new Set());
    }
  }, [uniqueDatasetToken]);

  const handleCaptionChange = useCallback((id: string, newCaptionFromTextarea: string) => {
    const currentActiveToken = uniqueDatasetToken.trim();
    let finalCaption = newCaptionFromTextarea;

    if (currentActiveToken) {
      const tokenPrefixWithComma = currentActiveToken + ", ";
      if (newCaptionFromTextarea.startsWith(tokenPrefixWithComma)) {
        finalCaption = newCaptionFromTextarea;
      } else if (newCaptionFromTextarea === currentActiveToken) {
        finalCaption = currentActiveToken;
      } else if (newCaptionFromTextarea.startsWith(currentActiveToken)) {
        const contentAfterToken = newCaptionFromTextarea.substring(currentActiveToken.length).trim();
        finalCaption = contentAfterToken ? `${tokenPrefixWithComma}${contentAfterToken}` : currentActiveToken;
      } else {
        const trimmedCaption = newCaptionFromTextarea.trim();
        finalCaption = trimmedCaption ? `${tokenPrefixWithComma}${trimmedCaption}` : currentActiveToken;
      }
    }

    setImages(prevImages =>
      prevImages.map(img => (img.id === id ? { ...img, caption: finalCaption, captionAIError: null } : img))
    );
  }, [uniqueDatasetToken]);

  const handleToggleImageSelection = useCallback((id: string) => {
    setSelectedImageIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds);
      newSelectedIds.has(id) ? newSelectedIds.delete(id) : newSelectedIds.add(id);
      return newSelectedIds;
    });
  }, []);

  const fileToCaptionImage = async (file: File): Promise<CaptionImage> => {
    const base64 = await fileToBase64(file);
    return { file, mimeType: file.type, base64 };
  };

  const cleanCaptionText = (text: string): string => {
    let t = text;
    t = t.replace(/^Here is a (descriptive )?caption (for|describing) the image:?\s*/i, '');
    t = t.replace(/^Here is the caption:?\s*/i, '');
    t = t.replace(/^Here['’]s a caption (for|describing) the image:?\s*/i, '');
    t = t.replace(/^\*\*?Caption:?\*\*?:?\s*/i, '');
    t = t.replace(/^Output:?\s*/i, '');
    return t.trim();
  };

  const generateCaptionForImage = useCallback(async (
    imageDetail: ImageDetail,
    datasetInstructions: string,
    method: CaptioningMethod
  ): Promise<void> => {
    if (!provider) {
      const errorMessage = "AI provider not configured.";
      setImages(prev => prev.map(img => img.id === imageDetail.id ? { ...img, isCaptioningAI: false, captionAIError: errorMessage } : img));
      return;
    }

    setImages(prev => prev.map(img => img.id === imageDetail.id ? { ...img, isCaptioningAI: true, captionAIError: null } : img));

    let methodSpecificPrompt = "";
    switch (method) {
      case 'gemini_descriptive':
        methodSpecificPrompt = "Generate a strictly literal and concrete description of this image. Describe the main subject, specific objects, clothing, colors, textures, lighting, and background elements. Do NOT describe the 'mood', 'atmosphere', or 'feeling'. Do NOT use phrases like 'is visible', 'can be seen', 'there is', 'captured', or 'the image shows'. Start directly with the description of the subject (e.g., 'A red sports car...', 'A woman standing...'). Focus on physical details useful for training an image generation model. Output ONLY the raw caption text. Do not include any introductory text like 'Here is a caption' or markdown formatting like '**Caption:**'.";
        break;
      case 'danbooru_style':
        methodSpecificPrompt = "Analyze the image and generate a list of comma-separated tags in the style of Danbooru. Include tags for: general content (e.g., 1girl, solo, outdoors), character features (e.g., long hair, blonde hair, blue eyes), clothing (e.g., school uniform, dress, swimsuit), pose/action (e.g., standing, sitting, smiling), artistic style (e.g., anime coloring, sketch), and any recognized characters or series if applicable. Ensure tags are comma separated. Output ONLY the tags.";
        break;
      case 'wd14_style':
        methodSpecificPrompt = "Analyze the image and generate a comma-separated list of tags, prioritizing those commonly used by the WD1.4 tagger. Include tags for: rating (e.g., general, sensitive, questionable, explicit - choose one), overall quality (e.g., masterpiece, best quality, high quality, normal quality, low quality, worst quality - choose one or two), main subject(s) (e.g., 1girl, cat, landscape), character features, clothing, pose, background elements, and artistic style. Ensure tags are comma separated. Output ONLY the tags.";
        break;
      case 't5xxl_clip_style':
        methodSpecificPrompt = "Generate a concise, strictly literal natural language sentence caption for this image. Describe the visual content directly (subject, attributes, action, setting). Avoid interpretative language, 'mood', or phrases like 'is visible'. Aim for a style similar to captions used for training CLIP or T5 models. Output ONLY the raw sentence. Do not include any introductory text or markdown.";
        break;
      default:
        methodSpecificPrompt = "Describe this image. Output only the description.";
    }

    try {
      const captionImage = await fileToCaptionImage(imageDetail.file);
      const systemInstruction = datasetInstructions?.trim() || undefined;
      const result = await provider.generateCaption(captionImage, methodSpecificPrompt, systemInstruction, effectiveModel);
      const aiGeneratedText = cleanCaptionText(result.text);

      setTokenCount(prev => prev + (result.tokens || 0));

      let finalCaption = aiGeneratedText;
      const currentActiveToken = uniqueDatasetToken.trim();
      if (currentActiveToken) {
        if (aiGeneratedText) {
          if (!aiGeneratedText.startsWith(currentActiveToken + ", ") && aiGeneratedText !== currentActiveToken) {
            finalCaption = `${currentActiveToken}, ${aiGeneratedText}`;
          } else {
            finalCaption = aiGeneratedText;
          }
        } else {
          finalCaption = currentActiveToken;
        }
      }

      setImages(prev => prev.map(img => img.id === imageDetail.id ? { ...img, caption: finalCaption, isCaptioningAI: false, captionAIError: null } : img));
    } catch (err: any) {
      console.error(`[AI Captioning] Error for ${imageDetail.originalFileName}:`, err);
      const errorMessage = `Failed to generate AI caption. ${err.message || ''}`.trim();
      setImages(prev => prev.map(img => img.id === imageDetail.id ? { ...img, isCaptioningAI: false, captionAIError: errorMessage } : img));
    }
  }, [provider, effectiveModel, uniqueDatasetToken]);

  const processImagesForAICaptioning = useCallback(async (
    imagesInThisBatch: ImageDetail[],
    currentDatasetInstructions: string,
    method: CaptioningMethod
  ) => {
    let i = 0;
    for (i = 0; i < imagesInThisBatch.length; i++) {
      const imageDetail = imagesInThisBatch[i];
      if (isInterruptedRef.current) break;

      const currentImageState = images.find(img => img.id === imageDetail.id);
      if (currentImageState && !currentImageState.isCaptioningAI) {
        await generateCaptionForImage(currentImageState, currentDatasetInstructions, method);
      }

      if (isInterruptedRef.current) {
        i++;
        break;
      }
    }

    if (isInterruptedRef.current && i < imagesInThisBatch.length) {
      const remainingImagesToMark = imagesInThisBatch.slice(i);
      if (remainingImagesToMark.length > 0) {
        const remainingIds = new Set(remainingImagesToMark.map(img => img.id));
        setImages(prev =>
          prev.map(img => remainingIds.has(img.id)
            ? { ...img, isCaptioningAI: false, captionAIError: "Interrupted by user" }
            : img)
        );
      }
    }
  }, [generateCaptionForImage, images]);

  const executeAICaptionAll = async () => {
    if (!provider || images.length === 0 || isBatchCaptioningInProgress || isCaptioningSelectedInProgress) return;
    setIsBatchCaptioningInProgress(true);
    isInterruptedRef.current = false;
    setIsInterruptedVisual(false);
    setError(null);

    const currentDatasetInstructions = prePrompt;
    const currentActiveToken = uniqueDatasetToken.trim();
    const imagesToProcessSnapshot = images.filter(img =>
      !img.isCaptioningAI &&
      (!img.caption || (currentActiveToken && img.caption === currentActiveToken))
    );

    await processImagesForAICaptioning(imagesToProcessSnapshot, currentDatasetInstructions, captioningMethod);

    setIsBatchCaptioningInProgress(false);
    setIsInterruptedVisual(false);
  };

  const executeAICaptionSelected = async () => {
    if (!provider || selectedImageIds.size === 0 || isBatchCaptioningInProgress || isCaptioningSelectedInProgress) return;
    setIsCaptioningSelectedInProgress(true);
    isInterruptedRef.current = false;
    setIsInterruptedVisual(false);
    setError(null);

    const currentDatasetInstructions = prePrompt;
    const imagesToProcess = images.filter(img => selectedImageIds.has(img.id) && !img.isCaptioningAI);

    await processImagesForAICaptioning(imagesToProcess, currentDatasetInstructions, captioningMethod);

    setIsCaptioningSelectedInProgress(false);
    setIsInterruptedVisual(false);
  };

  const generateAIDatasetIdentifier = async (
    sampleImages: ImageDetail[],
    identifierType: 'token' | 'nameStyle'
  ): Promise<string> => {
    if (!provider) return "AI provider not available.";

    const imagesToSample = sampleImages.slice(0, 5);
    const captionImages: CaptionImage[] = await Promise.all(
      imagesToSample.map(img => fileToCaptionImage(img.file))
    );

    const userMessage = identifierType === 'token'
      ? "Based on the visual characteristics of the provided image(s), suggest a short, unique, snake_case, alphanumeric token (e.g., 'project_name_style', 'my_dataset_v1') that can be used as a primary trigger word when generating similar images. This token will be prepended to a list of other descriptive tags. Output only the token itself, without any explanation or markdown formatting. If no images are provided, suggest a generic placeholder like 'unique_dataset_token'."
      : "Based on the visual characteristics of the provided image(s), describe the overall unique name, theme, or artistic style of this dataset in a concise phrase (e.g., 'ethereal fantasy portraits', 'cyberpunk cityscapes', 'vintage botanical illustrations'). This phrase will be used to ensure consistent AI-generated descriptions. Output only the phrase itself, without any explanation or markdown formatting. If no images are provided, suggest a generic placeholder like 'unique dataset aesthetic'.";

    try {
      const result = captionImages.length > 0
        ? await provider.generateMultiImageText(captionImages, userMessage, effectiveModel, 0.5)
        : await provider.generateText(userMessage, effectiveModel, 0.5);
      if (result.tokens) setTokenCount(result.tokens);
      return result.text.trim();
    } catch (e: any) {
      console.error(`[AI Suggestion] Error generating ${identifierType}:`, e);
      return `Error suggesting ${identifierType}: ${e.message || 'Unknown error'}`;
    }
  };

  const initiateAICaptioning = async (trigger: 'all' | 'selected') => {
    if (!provider || (trigger === 'all' && images.length === 0) || (trigger === 'selected' && selectedImageIds.size === 0) || isBatchCaptioningInProgress || isCaptioningSelectedInProgress) {
      if (!provider) setError(configError || "AI provider not configured.");
      return;
    }

    const currentMethod = captioningMethod;
    let needsIdentifierModal = false;
    let identifierTypeForModal: 'token' | 'nameStyle' | null = null;

    if (trigger === 'all' && (currentMethod === 'gemini_descriptive' || currentMethod === 't5xxl_clip_style') && !uniqueDatasetNameStyle.trim()) {
      needsIdentifierModal = true;
      identifierTypeForModal = 'nameStyle';
    }

    if (needsIdentifierModal && identifierTypeForModal) {
      setModalConfig({
        type: identifierTypeForModal,
        aiSuggestion: '',
        isLoadingAiSuggestion: true,
        captioningTrigger: trigger,
      });
      setShowDatasetIdentifierModal(true);
      setModalInputValue('');

      try {
        const imagesForSuggestionContext = trigger === 'selected' && selectedImageIds.size > 0
          ? images.filter(img => selectedImageIds.has(img.id))
          : images;
        const uncaptionedInContext = imagesForSuggestionContext.filter(img => !img.caption || img.caption === uniqueDatasetToken.trim());
        const suggestionContext = uncaptionedInContext.length > 0 ? uncaptionedInContext : imagesForSuggestionContext;

        const suggestion = await generateAIDatasetIdentifier(suggestionContext, identifierTypeForModal);
        setModalConfig(prev => prev ? { ...prev, aiSuggestion: suggestion, isLoadingAiSuggestion: false } : null);
        setModalInputValue(suggestion);
      } catch (error: any) {
        setModalConfig(prev => prev ? { ...prev, aiSuggestion: `Error: ${error.message || 'Failed.'}`, isLoadingAiSuggestion: false } : null);
        setModalInputValue('');
      }
    } else {
      if (trigger === 'all') await executeAICaptionAll();
      else await executeAICaptionSelected();
    }
  };

  const triggerAISuggestionModal = async (identifierType: 'token' | 'nameStyle') => {
    if (!provider || images.length === 0 || isBatchCaptioningInProgress || isCaptioningSelectedInProgress) {
      if (!images.length) setError("Please load images before suggesting an identifier.");
      return;
    }
    setModalConfig({
      type: identifierType,
      aiSuggestion: '',
      isLoadingAiSuggestion: true,
      captioningTrigger: null,
    });
    setShowDatasetIdentifierModal(true);
    setModalInputValue(identifierType === 'token' ? uniqueDatasetToken : uniqueDatasetNameStyle);

    try {
      const imagesForSuggestionContext = images;
      const uncaptionedInContext = imagesForSuggestionContext.filter(img => !img.caption || img.caption === uniqueDatasetToken.trim());
      const suggestionContext = uncaptionedInContext.length > 0 ? uncaptionedInContext : imagesForSuggestionContext;

      const suggestion = await generateAIDatasetIdentifier(suggestionContext, identifierType);
      setModalConfig(prev => prev ? { ...prev, aiSuggestion: suggestion, isLoadingAiSuggestion: false } : null);
      setModalInputValue(suggestion);
    } catch (error: any) {
      setModalConfig(prev => prev ? { ...prev, aiSuggestion: `Error: ${error.message || 'Failed.'}`, isLoadingAiSuggestion: false } : null);
    }
  };

  const handleDatasetIdentifierModalSubmit = async () => {
    if (!modalConfig) {
      setShowDatasetIdentifierModal(false);
      setModalConfig(null);
      return;
    }

    const { type, captioningTrigger } = modalConfig;
    const finalValueFromModal = modalInputValue.trim();

    if (type === 'nameStyle' && !finalValueFromModal) {
      setError(`The dataset name/style cannot be empty.`);
      setModalConfig(prev => prev ? { ...prev, aiSuggestion: `Please provide a value for the dataset name/style.` } : null);
      return;
    }

    if (type === 'token') setUniqueDatasetToken(finalValueFromModal);
    else setUniqueDatasetNameStyle(finalValueFromModal);

    setShowDatasetIdentifierModal(false);

    if (captioningTrigger === 'all') await executeAICaptionAll();
    else if (captioningTrigger === 'selected') await executeAICaptionSelected();

    setModalConfig(null);
  };

  const handleDatasetIdentifierModalClose = () => {
    setShowDatasetIdentifierModal(false);
    setModalConfig(null);
  };

  const handleInterruptCaptioning = useCallback(() => {
    isInterruptedRef.current = true;
    setIsInterruptedVisual(true);
  }, []);

  const generateAIDatasetOverview = async (instructions: string, imageDetails: ImageDetail[]): Promise<string> => {
    if (!provider) return "AI provider not available to generate overview.";

    const sampleCaptions = imageDetails
      .map(img => img.caption)
      .filter(caption => caption && caption.trim() !== '' && caption.trim() !== uniqueDatasetToken.trim())
      .slice(0, 10);

    if (sampleCaptions.length === 0 && !instructions && !uniqueDatasetNameStyle.trim() && !uniqueDatasetToken.trim()) {
      return "Not enough data (no instructions, style, token, or meaningful captions) to generate an overview.";
    }

    let promptText = "Based on the following dataset information, please provide a concise 2-3 sentence overview of the dataset's main theme, content, and potential artistic style. Focus on what makes this dataset unique or its primary subject matter.\n\n";
    if (instructions) promptText += `User-provided Instructions/Context:\n"${instructions}"\n\n`;
    if (uniqueDatasetNameStyle.trim()) promptText += `Dataset Name/Style:\n"${uniqueDatasetNameStyle.trim()}"\n\n`;
    if (uniqueDatasetToken.trim()) promptText += `Dataset Token:\n"${uniqueDatasetToken.trim()}"\n\n`;
    if (sampleCaptions.length > 0) {
      promptText += `Sample Captions from the Dataset (token prefix may be omitted for brevity here):\n`;
      sampleCaptions.forEach(caption => {
        let displayCaption = caption;
        if (uniqueDatasetToken.trim() && caption.startsWith(uniqueDatasetToken.trim() + ", ")) {
          displayCaption = caption.substring(uniqueDatasetToken.trim().length + 2);
        } else if (uniqueDatasetToken.trim() && caption === uniqueDatasetToken.trim()) {
          displayCaption = "(token only)";
        }
        promptText += `- ${displayCaption}\n`;
      });
      promptText += "\n";
    }
    promptText += "Dataset Overview:";

    try {
      const result = await provider.generateText(promptText, effectiveModel, 0.5);
      if (result.tokens) setTokenCount(result.tokens);
      return result.text || "Could not generate AI overview.";
    } catch (e: any) {
      return `Failed to generate AI overview: ${e.message}`;
    }
  };

  const generateWordCloudImage = async (imageDetails: ImageDetail[]): Promise<string | null> => {
    const activeToken = uniqueDatasetToken.trim();
    const allCaptionsText = imageDetails.map(img => {
      let baseCaption = img.caption;
      if (activeToken) {
        if (baseCaption.startsWith(activeToken + ", ")) baseCaption = baseCaption.substring(activeToken.length + 2);
        else if (baseCaption === activeToken) baseCaption = "";
      }
      return baseCaption;
    }).join(' ');

    if (!allCaptionsText.trim()) return null;

    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
      'in', 'on', 'at', 'by', 'from', 'to', 'with', 'about', 'above', 'after', 'again', 'against', 'all', 'am',
      'as', 'any', 'because', 'before', 'below', 'between', 'both', 'each', 'few', 'further', 'he', 'her', 'here',
      'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'into', 'it', 'its', 'itself', 'just', 'me',
      'more', 'most', 'my', 'myself', 'no', 'not', 'now', 'of', 'off', 'once', 'only', 'other', 'our', 'ours', 'ourselves',
      'out', 'over', 'own', 'same', 'she', 'some', 'such', 'than', 'that', 'their', 'theirs', 'them', 'themselves',
      'then', 'there', 'these', 'they', 'this', 'those', 'through', 'too', 'under', 'until', 'up', 'very', 'we', 'what',
      'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'within', 'without', 'you', 'your', 'yours', 'yourself',
      'yourselves', 'e.g', 'i.e', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'zero',
      'image', 'photo', 'picture', 'style', 'shot', 'art', 'design', 'background', 'subject', 'element', 'elements', 'illustration', 'drawing', 'painting',
      'realistic', 'photorealistic', 'looking', 'view', 'scene', 'closeup', 'portrait', 'landscape',
      ...(uniqueDatasetNameStyle.trim() ? uniqueDatasetNameStyle.trim().toLowerCase().split(/[\s,_]+/) : [])
    ]);

    const words = allCaptionsText
      .toLowerCase()
      .replace(/[^\w\s']|_/g, "")
      .replace(/\s+/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word));

    if (words.length === 0) return null;

    const frequencyMap: { [key: string]: number } = {};
    words.forEach(word => { frequencyMap[word] = (frequencyMap[word] || 0) + 1; });

    const wordList = Object.entries(frequencyMap)
      .map(([text, weight]) => ({ text, weight: Math.log2(weight + 1) * 5 }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 100);

    if (wordList.length < 5) return null;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;

      let resolved = false;
      const commonResolve = (dataUrl: string | null) => {
        if (!resolved) { resolved = true; resolve(dataUrl); }
      };
      const tryResolveCanvas = () => {
        try { commonResolve(canvas.toDataURL('image/png')); }
        catch { commonResolve(null); }
      };

      WordCloud(canvas, {
        list: wordList.map(item => [item.text, item.weight]),
        gridSize: Math.round(16 * canvas.width / 1024),
        weightFactor: (size: number) => Math.pow(size, 1.6) * (canvas.width / 512),
        fontFamily: 'Inter, sans-serif',
        color: 'random-dark',
        backgroundColor: '#FFFFFF',
        rotateRatio: 0.3,
        minSize: 12,
        drawOutOfBound: false,
        shrinkToFit: true,
        clearCanvas: true,
        onstop: () => setTimeout(tryResolveCanvas, 200),
      });
      setTimeout(tryResolveCanvas, 2500);
    });
  };

  const generateDocumentationPdf = async (imageDetails: ImageDetail[], generalInstructions: string, currentCaptioningMethod: CaptioningMethod): Promise<Blob> => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    let yPos = margin;

    doc.setFontSize(18);
    doc.text("Image Dataset Documentation", pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Captioning Method Used:", margin, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const methodName = CAPTIONING_METHODS.find(m => m.id === currentCaptioningMethod)?.name || currentCaptioningMethod;
    doc.text(methodName, margin, yPos);
    yPos += 7;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("AI Provider & Model:", margin, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${PROVIDER_META[providerId].label} — ${effectiveModel}`, margin, yPos);
    yPos += 7;

    const currentActiveToken = uniqueDatasetToken.trim();
    const currentActiveStyle = uniqueDatasetNameStyle.trim();

    if (currentActiveToken) {
      doc.setFontSize(14); doc.setFont(undefined, 'bold');
      doc.text("Unique Dataset Token:", margin, yPos); yPos += 7;
      doc.setFontSize(10); doc.setFont(undefined, 'normal');
      const tokenLines = doc.splitTextToSize(currentActiveToken, maxLineWidth);
      tokenLines.forEach((line: string) => { if (yPos > doc.internal.pageSize.getHeight() - margin - 5) { doc.addPage(); yPos = margin; } doc.text(line, margin, yPos); yPos += 5; });
      yPos += 7;
    }
    if (currentActiveStyle && (currentCaptioningMethod === 'gemini_descriptive' || currentCaptioningMethod === 't5xxl_clip_style')) {
      doc.setFontSize(14); doc.setFont(undefined, 'bold');
      doc.text("Unique Dataset Name/Style:", margin, yPos); yPos += 7;
      doc.setFontSize(10); doc.setFont(undefined, 'normal');
      const styleLines = doc.splitTextToSize(currentActiveStyle, maxLineWidth);
      styleLines.forEach((line: string) => { if (yPos > doc.internal.pageSize.getHeight() - margin - 5) { doc.addPage(); yPos = margin; } doc.text(line, margin, yPos); yPos += 5; });
      yPos += 7;
    }

    if (generalInstructions) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Dataset Instructions (System Prompt):", margin, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const instructionLines = doc.splitTextToSize(generalInstructions, maxLineWidth);
      instructionLines.forEach((line: string) => {
        if (yPos > doc.internal.pageSize.getHeight() - margin - 5) { doc.addPage(); yPos = margin; }
        doc.text(line, margin, yPos);
        yPos += 5;
      });
      yPos += 7;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("AI-Generated Dataset Overview:", margin, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const aiOverview = await generateAIDatasetOverview(generalInstructions, imageDetails);
    const overviewLines = doc.splitTextToSize(aiOverview, maxLineWidth);
    overviewLines.forEach((line: string) => {
      if (yPos > doc.internal.pageSize.getHeight() - margin - 5) { doc.addPage(); yPos = margin; }
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 7;

    const wordCloudImage = await generateWordCloudImage(imageDetails);
    if (wordCloudImage) {
      if (yPos > doc.internal.pageSize.getHeight() - margin - 60) { doc.addPage(); yPos = margin; }
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Prominent Caption Keywords (Word Cloud):", margin, yPos);
      yPos += 7;

      const imgWidth = maxLineWidth;
      const imgHeight = (imgWidth * 500) / 800;

      if (yPos + imgHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage(); yPos = margin;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Prominent Caption Keywords (Word Cloud):", margin, yPos);
        yPos += 7;
      }
      try {
        doc.addImage(wordCloudImage, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 7;
      } catch {
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        if (yPos > doc.internal.pageSize.getHeight() - margin - 5) { doc.addPage(); yPos = margin; }
        doc.text("Error embedding word cloud image.", margin, yPos);
        yPos += 7;
      }
    }

    if (yPos > doc.internal.pageSize.getHeight() - margin - 20) { doc.addPage(); yPos = margin; }
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Image Captions:", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    for (const image of imageDetails) {
      if (yPos > doc.internal.pageSize.getHeight() - margin - 15) {
        doc.addPage();
        yPos = margin;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("Image Captions (Continued):", margin, yPos);
        yPos += 10;
        doc.setFontSize(10);
      }

      doc.setFont(undefined, 'bold');
      doc.text(`File: ${image.originalFileName}`, margin, yPos);
      yPos += 5;

      doc.setFont(undefined, 'normal');
      const captionText = image.caption || '(No caption)';
      const splitCaption = doc.splitTextToSize(captionText, maxLineWidth);

      splitCaption.forEach((line: string) => {
        if (yPos > doc.internal.pageSize.getHeight() - margin - 5) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += 5;
      });
      yPos += 7;
    }
    return doc.output('blob');
  };

  const handleDownloadZip = useCallback(async () => {
    if (images.length === 0) {
      setError("No images to download. Please select images first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const zip = new JSZip();
      images.forEach(imageDetail => {
        zip.file(imageDetail.originalFileName, imageDetail.file);
        const captionContent = (imageDetail.caption || ` `).replace(/\xA0/g, ' ');
        zip.file(`${imageDetail.fileName}.txt`, captionContent);
      });

      const pdfBlob = await generateDocumentationPdf(images, prePrompt, captioningMethod);
      zip.file('dataset_documentation.pdf', pdfBlob);

      const logContent = `
Captioning Log - ${new Date().toLocaleString()}
-------------------------------------------------
Provider: ${PROVIDER_META[providerId].label}
Model: ${effectiveModel}
Images Processed: ${images.length}
Total Tokens Used: ${tokenCount}
-------------------------------------------------
`;
      const logFileName = `caption_log_${new Date().toISOString().replace(/:/g, '-')}.txt`;
      zip.file(logFileName, logContent);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'lora_dataset.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err: any) {
      setError(`Failed to generate ZIP file. ${err.message || 'See console for details.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [images, prePrompt, captioningMethod, uniqueDatasetToken, uniqueDatasetNameStyle, providerId, effectiveModel, tokenCount]);

  const handleClearAllCaptions = useCallback(() => {
    if (isBatchCaptioningInProgress || isCaptioningSelectedInProgress || isLoading) {
      setError("Cannot clear captions while another operation is in progress.");
      return;
    }
    const currentToken = uniqueDatasetToken.trim();
    setImages(prev => prev.map(img => ({
      ...img,
      caption: currentToken || '',
      captionAIError: null,
      isCaptioningAI: false,
    })));
    setError(null);
  }, [uniqueDatasetToken, isBatchCaptioningInProgress, isCaptioningSelectedInProgress, isLoading]);

  const handleClearAll = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setSelectedImageIds(new Set());
    setError(null);
    setIsLoading(false);
    setIsBatchCaptioningInProgress(false);
    setIsCaptioningSelectedInProgress(false);
    isInterruptedRef.current = false;
    setIsInterruptedVisual(false);
    setUniqueDatasetToken('');
    setUniqueDatasetNameStyle('');
    setModalInputValue('');
  }, [images]);

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const availableLocalModels = localModelList[providerId] || [];

  const operationInProgress = isLoading || isBatchCaptioningInProgress || isCaptioningSelectedInProgress;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-6xl mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          LoRA Captioner
        </h1>
        <p className="mt-2 text-gray-400 text-sm md:text-base">
          Create `.txt` caption files for your image datasets. Perfect for training LoRA models! Use Gemini, OpenAI, or your own local LLM.
        </p>
      </header>

      <main className="w-full max-w-6xl flex flex-col gap-6">
        <FileUploader onFilesSelect={handleFilesSelect} disabled={operationInProgress} />

        {error && (
          <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-md relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!aiAvailable && configError && (
          <div className="bg-yellow-700 border border-yellow-600 text-yellow-100 px-4 py-3 rounded-md relative" role="alert">
            <strong className="font-bold">AI not configured: </strong>
            <span className="block sm:inline">{configError}</span>
          </div>
        )}

        <ProviderSettings
          providerId={providerId}
          model={effectiveModel}
          apiKey={effectiveApiKey}
          baseUrl={effectiveBaseUrl}
          availableModels={availableLocalModels}
          isFetchingModels={isFetchingModels}
          fetchModelsError={fetchModelsError}
          connectionStatus={connectionStatus}
          connectionMessage={connectionMessage}
          disabled={operationInProgress}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
          onApiKeyChange={handleApiKeyChange}
          onBaseUrlChange={handleBaseUrlChange}
          onRefreshModels={handleRefreshModels}
          onTestConnection={handleTestConnection}
        />

        <div className="w-full p-4 bg-gray-800 rounded-lg shadow-md">
          <label htmlFor="prePrompt" className="block text-sm font-medium text-gray-300 mb-2">
            AI Captioning Instructions (Optional System Prompt for AI)
          </label>
          <textarea
            id="prePrompt"
            value={prePrompt}
            onChange={(e) => setPrePrompt(e.target.value)}
            placeholder="e.g., 'The dataset focuses on cats in funny hats. Emphasize accessories and expressions.' Use this to guide the AI for all images."
            className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-y text-sm placeholder-gray-500 min-h-[80px] transition-colors duration-150"
            rows={3}
            disabled={operationInProgress || !aiAvailable}
          />
          <p className="mt-2 text-xs text-gray-400">
            This text will be sent as a general instruction to the AI for captioning. It will also be included in the PDF documentation.
          </p>
        </div>

        <div className="w-full p-4 bg-gray-800 rounded-lg shadow-md">
          <label htmlFor="captioningMethod" className="block text-sm font-medium text-gray-300 mb-2">
            AI Captioning Method
          </label>
          <select
            id="captioningMethod"
            value={captioningMethod}
            onChange={(e) => setCaptioningMethod(e.target.value as CaptioningMethod)}
            className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            disabled={operationInProgress || !aiAvailable}
          >
            {CAPTIONING_METHODS.map(method => (
              <option key={method.id} value={method.id}>{method.name}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-400">
            Choose the style of captions the AI should generate. The Unique Dataset Token (if set below) will be prepended globally.
          </p>
        </div>

        {images.length > 0 && aiAvailable && (
          <>
            <div className="w-full p-4 bg-gray-800 rounded-lg shadow-md">
              <label htmlFor="uniqueTokenInput" className="block text-sm font-medium text-gray-300 mb-1">
                Unique Dataset Token <span className="text-xs text-gray-400">(Applied globally to all captions)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="uniqueTokenInput"
                  value={uniqueDatasetToken}
                  onChange={(e) => setUniqueDatasetToken(e.target.value.trim())}
                  placeholder="e.g., my_project_style (leave blank if not needed)"
                  className="flex-grow p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 text-sm placeholder-gray-500"
                  disabled={operationInProgress}
                />
                <button
                  onClick={() => triggerAISuggestionModal('token')}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm disabled:opacity-50 whitespace-nowrap"
                  disabled={operationInProgress || !images.length}
                >
                  {uniqueDatasetToken ? "Edit/Re-suggest" : "Suggest with AI"}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">If set, this token is automatically prepended to ALL captions. Useful for triggering concepts. AI can suggest one.</p>
            </div>

            {(captioningMethod === 'gemini_descriptive' || captioningMethod === 't5xxl_clip_style') && (
              <div className="w-full p-4 bg-gray-800 rounded-lg shadow-md">
                <label htmlFor="uniqueStyleInput" className="block text-sm font-medium text-gray-300 mb-1">
                  Unique Dataset Name/Style <span className="text-xs text-gray-400">(for descriptive styles)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="uniqueStyleInput"
                    value={uniqueDatasetNameStyle}
                    onChange={(e) => setUniqueDatasetNameStyle(e.target.value)}
                    placeholder="e.g., ethereal fantasy characters, gritty urban photos"
                    className="flex-grow p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 text-sm placeholder-gray-500"
                    disabled={operationInProgress}
                  />
                  <button
                    onClick={() => triggerAISuggestionModal('nameStyle')}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm disabled:opacity-50 whitespace-nowrap"
                    disabled={operationInProgress || !images.length}
                  >
                    {uniqueDatasetNameStyle ? "Edit/Re-suggest" : "Suggest with AI"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">Fluently integrated into descriptive captions for Descriptive or CLIP/T5 style. AI can suggest one if empty.</p>
              </div>
            )}
          </>
        )}

        {images.length > 0 && (
          <ActionButtons
            onDownload={handleDownloadZip}
            onClear={handleClearAll}
            onClearAllCaptions={handleClearAllCaptions}
            onAICaptionAll={() => initiateAICaptioning('all')}
            onAICaptionSelected={() => initiateAICaptioning('selected')}
            onInterruptCaptioning={handleInterruptCaptioning}
            isDownloading={isLoading}
            isCaptioningAll={isBatchCaptioningInProgress}
            isCaptioningSelected={isCaptioningSelectedInProgress}
            isInterruptSignaled={isInterruptedVisual}
            imagesExist={images.length > 0}
            selectedImagesCount={selectedImageIds.size}
            aiAvailable={aiAvailable}
          />
        )}

        {images.length === 0 && !isLoading && !error && (
          <div className="text-center py-10 px-6 bg-gray-800 rounded-lg shadow-xl">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-300">No images selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by selecting a folder containing your image dataset.
            </p>
          </div>
        )}

        <ImageCaptionEditor
          images={images}
          selectedImageIds={selectedImageIds}
          onToggleImageSelection={handleToggleImageSelection}
          onCaptionChange={handleCaptionChange}
          aiAvailable={aiAvailable}
          isAnyCaptioningInProgress={isBatchCaptioningInProgress || isCaptioningSelectedInProgress}
        />
      </main>

      {modalConfig && (
        <DatasetIdentifierModal
          isOpen={showDatasetIdentifierModal}
          onClose={handleDatasetIdentifierModalClose}
          onSubmit={handleDatasetIdentifierModalSubmit}
          config={modalConfig}
          inputValue={modalInputValue}
          onInputChange={setModalInputValue}
        />
      )}

      <footer className="w-full max-w-6xl mt-12 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Ralf Milzarek. LoRA Captioner. Multi-provider: {PROVIDER_META[providerId].label} — {effectiveModel || '(no model)'}.</p>
        <div className="text-xs text-gray-500">
          <span>Total Tokens Used: {tokenCount}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
