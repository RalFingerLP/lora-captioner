/**
 * Converts a File object to a base64 encoded string.
 * @param file The File object to convert.
 * @returns A promise that resolves with the base64 encoded string (without the data: prefix).
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // reader.result includes "data:image/jpeg;base64," prefix, remove it.
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};
