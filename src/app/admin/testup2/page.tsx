"use client";

import { useState } from 'react';
import { UploadImage, type UploadedImageData } from '~/components/ui/UploadImage';
import { UploadUltraSmallImage, type UploadedUltraSmallImageData } from '~/components/ui/UploadUltraSmallImage';
import { api } from '~/utils/api';
// import { Button } from '~/components/ui/button'; // Assuming you have a Button component, uncomment if needed

export default function TestUp2Page() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImageData[]>([]);
  const [ultraSmallImages, setUltraSmallImages] = useState<UploadedUltraSmallImageData[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [ultraSmallFeedback, setUltraSmallFeedback] = useState<string | null>(null);

  const createUploadEntry = api.testup2.create.useMutation({
    onSuccess: (data) => {
      setTimeout(() => setFeedbackMessage(`Successfully saved: ${data.originalFilename} at ${data.imageUrl}`), 0);
    },
    onError: (error) => {
      setTimeout(() => setFeedbackMessage(`Error saving to DB: ${error.message}`), 0);
      console.error("Error saving to DB:", error);
    },
  });

  const createUltraSmallEntry = api.testup2.create.useMutation({
    onSuccess: (data) => {
      setTimeout(() => setUltraSmallFeedback(`Successfully saved ultra-small: ${data.originalFilename} at ${data.imageUrl}`), 0);
    },
    onError: (error) => {
      setTimeout(() => setUltraSmallFeedback(`Error saving ultra-small to DB: ${error.message}`), 0);
      console.error("Error saving ultra-small to DB:", error);
    },
  });

  const handleImageUploadChange = (data: UploadedImageData | UploadedImageData[] | null) => {
    if (data) {
      const newImagesArray = Array.isArray(data) ? data : [data];
      setUploadedImages(prevImages => {
        const trulyNewImages = newImagesArray.filter(newImg => 
          !prevImages.some(prevImg => prevImg.url === newImg.url && prevImg.originalFilename === newImg.originalFilename)
        );
        
        trulyNewImages.forEach(image => {
          if (image.url && image.originalFilename) {
            createUploadEntry.mutate({
              imageUrl: image.url,
              originalFilename: image.originalFilename,
            });
          }
        });
        return newImagesArray;
      });
      setFeedbackMessage(null);
    } else {
      setUploadedImages([]);
    }
  };

  const handleUltraSmallImageChange = (data: UploadedUltraSmallImageData | UploadedUltraSmallImageData[] | null) => {
    if (data) {
      const newImagesArray = Array.isArray(data) ? data : [data];
      setUltraSmallImages(prevImages => {
        const trulyNewImages = newImagesArray.filter(newImg => 
          !prevImages.some(prevImg => prevImg.url === newImg.url && prevImg.originalFilename === newImg.originalFilename)
        );
        
        trulyNewImages.forEach(image => {
          if (image.url && image.originalFilename) {
            createUltraSmallEntry.mutate({
              imageUrl: image.url,
              originalFilename: image.originalFilename,
            });
          }
        });
        return newImagesArray;
      });
      setUltraSmallFeedback(null);
    } else {
      setUltraSmallImages([]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Admin Test Upload (testup2)</h1>

      <div className="mb-8 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Upload Images (120KB max)</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload images here. They will be saved to the 'testup2' S3 folder, and their URLs and original filenames will be recorded in the database.
        </p>
        <UploadImage
          type="images"
          entityType="testup2"
          value={uploadedImages}
          onChange={handleImageUploadChange}
          maxImages={5}
          label="Test Images for testup2 (max 120KB each)"
          showInfo={true}
        />
      </div>

      <div className="mb-8 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Upload Ultra Small Images (30KB max)</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload ultra-compressed images here. They will be optimized to 30KB or less and saved to the 'testup2' S3 folder.
        </p>
        <UploadUltraSmallImage
          type="images"
          entityType="testup2"
          value={ultraSmallImages}
          onChange={handleUltraSmallImageChange}
          maxImages={5}
          label="Ultra Small Test Images (max 30KB each)"
          showInfo={true}
        />
      </div>

      {feedbackMessage && (
        <div className={`mt-4 rounded-md p-3 text-sm ${createUploadEntry.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {feedbackMessage}
        </div>
      )}

      {ultraSmallFeedback && (
        <div className={`mt-4 rounded-md p-3 text-sm ${createUltraSmallEntry.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {ultraSmallFeedback}
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-xl font-semibold">Uploaded Images (120KB max)</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {uploadedImages.map((image, index) => (
              <div key={index} className="rounded-md border p-2">
                {image.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt={image.originalFilename || 'Uploaded image'} className="mb-2 h-40 w-full rounded object-cover" />
                )}
                <p className="truncate text-xs" title={image.originalFilename}>Filename: {image.originalFilename}</p>
                <p className="truncate text-xs" title={image.url}>URL: {image.url}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {ultraSmallImages.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-xl font-semibold">Ultra Small Images (30KB max)</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ultraSmallImages.map((image, index) => (
              <div key={index} className="rounded-md border p-2">
                {image.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt={image.originalFilename || 'Ultra small image'} className="mb-2 h-40 w-full rounded object-cover" />
                )}
                <p className="truncate text-xs" title={image.originalFilename}>Filename: {image.originalFilename}</p>
                <p className="truncate text-xs" title={image.url}>URL: {image.url}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Section */}
      {(uploadedImages.length > 0 || ultraSmallImages.length > 0) && (
        <div className="mt-8 rounded-lg border bg-blue-50 p-6">
          <h3 className="mb-4 text-xl font-semibold text-blue-900">Size Comparison</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-md bg-white p-4">
              <h4 className="mb-2 font-semibold text-gray-800">Regular Images (120KB max)</h4>
              <p className="text-sm text-gray-600">
                • Max width: 800px<br/>
                • Max size: 120KB<br/>
                • Quality: 80%<br/>
                • Best for: Product galleries, detailed images
              </p>
              <p className="mt-2 text-xs text-blue-600">
                Uploaded: {uploadedImages.length} images
              </p>
            </div>
            <div className="rounded-md bg-white p-4">
              <h4 className="mb-2 font-semibold text-gray-800">Ultra Small Images (30KB max)</h4>
              <p className="text-sm text-gray-600">
                • Max width: 300px<br/>
                • Max size: 30KB<br/>
                • Quality: 70%<br/>
                • Best for: Thumbnails, previews, fast loading
              </p>
              <p className="mt-2 text-xs text-blue-600">
                Uploaded: {ultraSmallImages.length} images
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
