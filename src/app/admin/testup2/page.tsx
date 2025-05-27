"use client";

import { useState } from 'react';
import { UploadImage, type UploadedImageData } from '~/components/ui/UploadImage';
import { api } from '~/utils/api';
// import { Button } from '~/components/ui/button'; // Assuming you have a Button component, uncomment if needed

export default function TestUp2Page() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImageData[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const createUploadEntry = api.testup2.create.useMutation({
    onSuccess: (data) => {
      setTimeout(() => setFeedbackMessage(`Successfully saved: ${data.originalFilename} at ${data.imageUrl}`), 0);
      // Optionally, clear uploadedImages if you want to reset after each save
      // setUploadedImages([]); 
    },
    onError: (error) => {
      setTimeout(() => setFeedbackMessage(`Error saving to DB: ${error.message}`), 0);
      console.error("Error saving to DB:", error);
    },
  });

  const handleImageUploadChange = (data: UploadedImageData | UploadedImageData[] | null) => {
    if (data) {
      const newImagesArray = Array.isArray(data) ? data : [data];
      // We only want to process newly uploaded images, not existing ones from `value` prop on initial load.
      // This logic assumes `onChange` is primarily triggered by new user uploads.
      // If `UploadImage` calls `onChange` on initial load with `value`, this might need adjustment.
      setUploadedImages(prevImages => {
        // Simple way to find new images: check if URL is not already in prevImages
        // This is not foolproof if URLs can be identical for different uploads before saving to DB
        // but good enough for this test page.
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
        return newImagesArray; // Update the displayed images
      });
      setFeedbackMessage(null); // Clear previous feedback
    } else {
      setUploadedImages([]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Admin Test Upload (testup2)</h1>

      <div className="mb-8 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Upload Images</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload images here. They will be saved to the 'testup2' S3 folder, and their URLs and original filenames will be recorded in the database.
        </p>
        <UploadImage
          type="images" // Allow multiple images
          entityType="testup2"
          value={uploadedImages} // Controlled component: display what's in state
          onChange={handleImageUploadChange}
          maxImages={5} // Example: allow up to 5 images at a time
          label="Test Images for testup2"
          showInfo={true}
        />
      </div>

      {feedbackMessage && (
        <div className={`mt-4 rounded-md p-3 text-sm ${createUploadEntry.isError || createUploadEntry.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {feedbackMessage}
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-xl font-semibold">Uploaded Images (Reflected from UploadImage)</h3>
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
    </div>
  );
}
