import { type ChangeEvent } from 'react';

interface UploadImageProps {
  onImageSelect: (file: File) => void;
  selectedFileName?: string;
  selectedFileSize?: number;
}

/**
 * A completely stateless image upload component.
 * All state and side effects are handled by the parent component.
 */
export function UploadImage({ onImageSelect, selectedFileName, selectedFileSize }: UploadImageProps) {
  // Simple direct event handler - no hooks, no state, no refs
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    // Get the file from the input
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file) return;
    
    // Reset the input value to allow re-selecting the same file
    e.currentTarget.value = '';
    
    // Call the parent's callback directly
    // The parent is responsible for handling this safely
    onImageSelect(file);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Upload Image
      </label>
      <div className="mt-1 flex items-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      {selectedFileName && (
        <p className="mt-2 text-sm text-gray-600">
          Selected: {selectedFileName} {selectedFileSize ? `(${(selectedFileSize / 1024).toFixed(2)} KB)` : ''}
        </p>
      )}
    </div>
  );
}
