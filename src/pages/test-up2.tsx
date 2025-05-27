import { useState } from 'react';
import { UploadImage } from '../components/UploadImage';
import { api } from '../utils/api';
import { uploadImages } from '../lib/s3-upload';
import { env } from '~/env';

/**
 * TestUp2Page - A page for testing file uploads to S3
 * Implements the T3 stack pattern with proper state management
 */
export default function TestUp2Page() {
  // State for tracking the upload process
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  /**
   * Handle file selection and upload
   * This function is called directly from the UploadImage component
   */
  function handleImageSelect(file: File) {
    // Prevent processing if already uploading
    if (isUploading) return;

    // Defer the entire processing to the next event loop tick
    // This is a more robust way to avoid state update conflicts during rendering phases
    setTimeout(() => {
      // First update UI state
      setSelectedFile(file);
      setIsUploading(true);
      setUploadStatus('Uploading...');

      // Then start the upload process
      uploadFile(file).catch((error) => {
        console.error('Unhandled upload error:', error);
        // Consider setting an error status here as well, also deferred if needed
        // setTimeout(() => setUploadStatus('Critical upload error: ' + error.message), 0);
      });
    }, 0);
  }
  
  /**
   * Separate the actual upload logic into its own function
   * This helps prevent state update issues during rendering
   */
  async function uploadFile(file: File) {
    try {
      console.log('S3 Root Folder from env:', env.AWS_S3_ROOT_FOLDER);
      
      // Upload the file to S3 using the uploadImages function
      const uploadResult = await uploadImages([file], 'testup2');
      
      if (!uploadResult.success || !uploadResult.urls || uploadResult.urls.length === 0) {
        throw new Error(uploadResult.error || 'Upload failed with no URLs returned');
      }
      
      const imageUrl = uploadResult.urls[0];
      console.log('File uploaded successfully:', imageUrl);
      
      // Verify the URL contains the expected path structure
      if (!imageUrl?.includes(`/${env.AWS_S3_ROOT_FOLDER}/testup2/`)) {
        console.warn('Warning: Uploaded file URL does not contain the expected path structure:', 
          `Expected: /${env.AWS_S3_ROOT_FOLDER}/testup2/, Actual: ${imageUrl}`);
      }
      
      // Save the upload details to the database using tRPC
      const dbResult = await api.testup2.create.mutate({
        imageUrl,
        originalFilename: file.name,
      });
      
      console.log('Database record created:', dbResult);
      setUploadStatus('Upload successful!');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Image Upload Test</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <UploadImage 
          onImageSelect={handleImageSelect}
          selectedFileName={selectedFile?.name}
          selectedFileSize={selectedFile?.size}
        />
        {isUploading && (
          <div className="mt-4 p-2 bg-blue-50 text-blue-700 rounded">
            {uploadStatus}
          </div>
        )}
        {uploadStatus && !isUploading && (
          <div className={`mt-4 p-2 rounded ${
            uploadStatus.includes('failed') 
              ? 'bg-red-50 text-red-700' 
              : 'bg-green-50 text-green-700'
          }`}>
            {uploadStatus}
          </div>
        )}
      </div>
    </div>
  );
}
