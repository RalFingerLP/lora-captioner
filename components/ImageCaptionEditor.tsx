
import React from 'react';
import { ImageDetail } from '../types';

interface ImageCaptionEditorProps {
  images: ImageDetail[];
  selectedImageIds: Set<string>;
  onToggleImageSelection: (id: string) => void;
  onCaptionChange: (id: string, caption: string) => void;
  aiAvailable: boolean;
  isAnyCaptioningInProgress: boolean; // True if "AI Caption All" or "AI Caption Selected" is running
}

const ImageCaptionEditor: React.FC<ImageCaptionEditorProps> = ({ 
  images, 
  selectedImageIds,
  onToggleImageSelection,
  onCaptionChange, 
  aiAvailable,
  isAnyCaptioningInProgress 
}) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {images.map(image => {
        const isSelected = selectedImageIds.has(image.id);
        // Card interaction (selection, editing text) disabled if its own AI is running OR any batch AI is running.
        const isDisabledOverall = image.isCaptioningAI || isAnyCaptioningInProgress;

        return (
          <div 
            key={image.id}
            onClick={() => !isAnyCaptioningInProgress && onToggleImageSelection(image.id)} // Allow selection toggle only if no global captioning is running
            className={`
              bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col 
              transition-all duration-200 ease-in-out
              ${isAnyCaptioningInProgress ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:shadow-2xl hover:scale-[1.02]'}
              ${isSelected && !isAnyCaptioningInProgress ? 'ring-2 ring-purple-500 scale-[1.02]' : 'ring-1 ring-transparent'}
              ${isSelected && isAnyCaptioningInProgress ? 'ring-2 ring-purple-700' : ''} // Slightly darker ring if selected but disabled
            `}
            role="button"
            aria-pressed={isSelected}
            aria-label={`Select or deselect image ${image.originalFileName}`}
            tabIndex={isAnyCaptioningInProgress ? -1 : 0} // Make it focusable if not disabled
            onKeyDown={(e) => {
              if (!isAnyCaptioningInProgress && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onToggleImageSelection(image.id);
              }
            }}
          >
            <div className="aspect-w-1 aspect-h-1 w-full bg-gray-700 relative">
              <img 
                src={image.previewUrl} 
                alt={image.originalFileName} 
                className="w-full h-full object-cover" 
              />
              {/* Visual cue for selection on the image itself */}
              {isSelected && (
                <div className="absolute top-2 left-2 z-10 p-1.5 bg-purple-600 bg-opacity-80 rounded-full shadow-lg">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {aiAvailable && image.isCaptioningAI && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="sr-only">AI Captioning in progress...</span>
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-400 truncate flex-grow mr-2" title={image.originalFileName}>
                  {image.originalFileName}
                  </p>
                  {/* "AI This" button removed */}
              </div>
              <textarea
                value={image.caption}
                onChange={(e) => {
                  e.stopPropagation(); // Prevent card click when typing
                  onCaptionChange(image.id, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()} // Prevent card click when clicking textarea
                placeholder="e.g., trigger_word, 1girl, masterpiece..."
                className="w-full h-24 p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm placeholder-gray-500"
                rows={3}
                aria-label={`Caption for ${image.originalFileName}`}
                disabled={isDisabledOverall} // Disabled if this image is being AI captioned or any batch operation
              />
              {aiAvailable && image.captionAIError && (
                <p className="mt-1 text-xs text-red-400" role="alert">
                  AI Error: {image.captionAIError}
                </p>
              )}
              {!aiAvailable && !image.isCaptioningAI && ( // Show only if not loading and AI not available
                   <p className="mt-1 text-xs text-yellow-500">AI captioning unavailable.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ImageCaptionEditor;