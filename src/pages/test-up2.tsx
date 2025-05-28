import { useState } from 'react';

/**
 * TestUp2Page - A simplified test page for production builds
 * This version avoids any API calls or complex operations that might cause build issues
 */
export default function TestUp2Page() {
  const [message] = useState('This is a placeholder for the image upload test page');

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Image Upload Test</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-700">{message}</p>
        <p className="mt-4 text-sm text-gray-500">
          The full functionality of this page is only available in development mode.
          For production builds, this placeholder is used to prevent build errors.
        </p>
      </div>
    </div>
  );
}
