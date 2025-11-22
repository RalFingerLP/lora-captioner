
import React from 'react';

interface ActionButtonsProps {
  onDownload: () => void;
  onClear: () => void;
  onClearAllCaptions: () => void; // New prop
  onAICaptionAll: () => void;
  onAICaptionSelected: () => void;
  onInterruptCaptioning: () => void;
  isDownloading: boolean;
  isCaptioningAll: boolean;
  isCaptioningSelected: boolean;
  isInterruptSignaled?: boolean; 
  imagesExist: boolean;
  selectedImagesCount: number;
  aiAvailable: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onDownload,
  onClear,
  onClearAllCaptions, // New prop consumed
  onAICaptionAll,
  onAICaptionSelected,
  onInterruptCaptioning,
  isDownloading,
  isCaptioningAll,
  isCaptioningSelected,
  isInterruptSignaled, 
  imagesExist,
  selectedImagesCount,
  aiAvailable
}) => {
  if (!imagesExist) {
    return null;
  }

  const anyBatchCaptioningInProgress = isCaptioningAll || isCaptioningSelected;
  const anyOtherOperationInProgress = isDownloading;
  const anOperationIsRunning = anyBatchCaptioningInProgress || anyOtherOperationInProgress;


  const buttonBaseClasses = "px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 flex items-center justify-center space-x-2 w-full sm:w-auto";
  
  const primaryButtonClasses = (bgColorClass: string, hoverBgColorClass: string, ringColorClass: string, disabledCondition: boolean) =>
    `${buttonBaseClasses} ${bgColorClass} ${hoverBgColorClass} text-white focus:${ringColorClass} ${disabledCondition ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 active:scale-95'}`;

  const aiButtonClasses = (disabledCondition: boolean) =>
    `${buttonBaseClasses} bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 ${disabledCondition ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 active:scale-95'}`;
  
  const interruptButtonClasses = `${buttonBaseClasses} bg-yellow-500 hover:bg-yellow-600 text-gray-900 focus:ring-yellow-400 transform hover:scale-105 active:scale-95 ${isInterruptSignaled ? 'opacity-75 animate-pulse' : ''}`;


  return (
    <div className="w-full p-4 bg-gray-800 rounded-lg shadow-xl flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sticky top-4 z-10 border-b border-gray-700">
      {!anyBatchCaptioningInProgress ? (
        <>
          <button
            onClick={onAICaptionAll}
            disabled={anOperationIsRunning || !aiAvailable || selectedImagesCount > 0}
            className={aiButtonClasses(anOperationIsRunning || !aiAvailable || selectedImagesCount > 0)}
            aria-live="polite"
            title={selectedImagesCount > 0 ? "Clear selection or use 'AI Caption Selected'" : (aiAvailable ? "Use AI to caption all images that are empty or only contain the dataset token" : "AI not available")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.33 14.33L14.33 14.33M14.33 14.33L14.33 14.33M14.33 14.33L14.33 14.33M14.33 14.33L14.33 14.33M9.67 14.33L9.67 14.33M9.67 14.33L9.67 14.33M9.67 14.33L9.67 14.33M9.67 14.33L9.67 14.33M12 10.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM12 12h.01" />
            </svg>
            <span>AI Caption All</span>
          </button>
          {selectedImagesCount > 0 && (
            <button
              onClick={onAICaptionSelected}
              disabled={anOperationIsRunning || !aiAvailable}
              className={aiButtonClasses(anOperationIsRunning || !aiAvailable)}
              aria-live="polite"
              title={aiAvailable ? "Use AI to caption only the selected images" : "AI not available"}
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3z" />
                <path fillRule="evenodd" d="M6.173 12.173a.75.75 0 011.06 0L9 13.94l2.767-2.767a.75.75 0 011.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0l-3.25-3.25a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
              <span>AI Caption Selected ({selectedImagesCount})</span>
            </button>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center gap-4 w-full sm:w-auto">
            <button
                disabled={true}
                className={`${buttonBaseClasses} bg-indigo-700 text-white opacity-75 cursor-wait`}
                aria-live="polite"
            >
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isCaptioningAll ? 'Captioning All...' : `Captioning Selected (${selectedImagesCount > 0 ? selectedImagesCount : 'multiple'})...`}
            </button>
            <button
                onClick={onInterruptCaptioning}
                className={interruptButtonClasses}
                aria-label="Interrupt AI captioning process"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{isInterruptSignaled ? 'Interrupting...' : 'Interrupt'}</span>
            </button>
        </div>
      )}

      <button
        onClick={onDownload}
        disabled={anOperationIsRunning}
        className={primaryButtonClasses('bg-green-600', 'hover:bg-green-700', 'ring-green-500', anOperationIsRunning)}
        title="Download all images and their .txt caption files as a ZIP, including PDF documentation."
      >
        {isDownloading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download ZIP</span>
          </>
        )}
      </button>
      <button
        onClick={onClearAllCaptions}
        disabled={anOperationIsRunning}
        className={primaryButtonClasses('bg-teal-600', 'hover:bg-teal-700', 'ring-teal-500', anOperationIsRunning)}
        title="Clear all captions. Resets to unique token if set, or to empty if not."
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20H3m15.732-14.268a2.5 2.5 0 00-3.536-3.536" /> {/* Simplified icon for "clear text" */}
        </svg>
        <span>Clear All Captions</span>
      </button>
      <button
        onClick={onClear}
        disabled={anOperationIsRunning}
        className={primaryButtonClasses('bg-red-600', 'hover:bg-red-700', 'ring-red-500', anOperationIsRunning)}
        title="Remove all images and clear all data from the application."
      >
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Clear All</span>
      </button>
    </div>
  );
};

export default ActionButtons;
