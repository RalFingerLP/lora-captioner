
import React, { useRef } from 'react';

interface FileUploaderProps {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      console.log(`[FileUploader] Selected ${filesArray.length} files/items from folder.`);
      onFilesSelect(filesArray);
      // Reset file input to allow selecting the same folder again if needed after clearing
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full p-6 bg-gray-800 rounded-lg shadow-xl flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        // @ts-ignore because webkitdirectory is non-standard but widely supported
        webkitdirectory=""
        directory=""
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 ease-in-out
          text-white focus:outline-none focus:ring-4 focus:ring-opacity-50
          ${disabled
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500 transform hover:scale-105 active:scale-95'
          }
        `}
      >
        <div className="flex items-center space-x-3">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>Select Image Folder</span>
        </div>
      </button>
      <p className="mt-4 text-sm text-gray-400">
        Select the root folder containing your images (e.g., PNG, JPG, WEBP).
      </p>
    </div>
  );
};

export default FileUploader;
