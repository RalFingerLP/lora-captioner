
import React from 'react';

interface DatasetIdentifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  config: {
    type: 'token' | 'nameStyle';
    aiSuggestion: string;
    isLoadingAiSuggestion: boolean;
    captioningTrigger: 'all' | 'selected' | null; // Not directly used by modal UI but part of config
  } | null;
  inputValue: string;
  onInputChange: (value: string) => void;
}

const DatasetIdentifierModal: React.FC<DatasetIdentifierModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  config,
  inputValue,
  onInputChange,
}) => {
  if (!isOpen || !config) {
    return null;
  }

  const { type, aiSuggestion, isLoadingAiSuggestion } = config;
  const title = type === 'token' ? 'Set Unique Dataset Token' : 'Set Unique Dataset Name/Style';
  const description =
    type === 'token'
      ? 'This token will be prepended to tag-based captions (e.g., Danbooru, WD1.4 styles). It helps uniquely identify images from this dataset.'
      : 'This name or style description will be fluently incorporated into descriptive captions to guide the AI towards your desired aesthetic or theme.';
  const placeholder =
    type === 'token' ? 'e.g., my_project_alpha, char_style_v2' : 'e.g., ethereal fantasy portraits, retro comic art style';
  const inputLabel = type === 'token' ? 'Dataset Token' : 'Dataset Name/Style';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "") {
        // Basic validation, more can be added
        alert(`The ${inputLabel} cannot be empty.`);
        return;
    }
    onSubmit();
  };


  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
        <form onSubmit={handleSubmit}>
          <h2 id="modal-title" className="text-2xl font-semibold text-purple-400 mb-3">
            {title}
          </h2>
          <p className="text-sm text-gray-400 mb-4">{description}</p>

          {isLoadingAiSuggestion && (
            <div className="flex items-center justify-center my-4 p-3 bg-gray-700 rounded-md">
              <svg className="animate-spin h-5 w-5 text-purple-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-300">Getting AI suggestion...</span>
            </div>
          )}

          {!isLoadingAiSuggestion && aiSuggestion && (
            <div className="my-4 p-3 bg-gray-700 rounded-md">
              <p className="text-sm text-gray-400 mb-1">AI Suggestion:</p>
              <p className="text-md text-purple-300 break-words">{aiSuggestion.startsWith('Error:') ? <span className="text-red-400">{aiSuggestion}</span> : aiSuggestion}</p>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="identifierInput" className="block text-sm font-medium text-gray-300 mb-1">
              Your {inputLabel}:
            </label>
            <input
              id="identifierInput"
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={placeholder}
              className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm placeholder-gray-500"
              required
              aria-describedby="identifier-description"
            />
             <p id="identifier-description" className="mt-1 text-xs text-gray-500">
                {type === 'token' ? 'Should be short, ideally snake_case.' : 'A concise descriptive phrase.'}
             </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              disabled={isLoadingAiSuggestion && !aiSuggestion} // Disable if loading AND no suggestion yet to input
            >
              Confirm and Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DatasetIdentifierModal;
