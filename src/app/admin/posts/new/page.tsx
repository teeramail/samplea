'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
// import toast from 'react-hot-toast'; // Uncomment if you have toast installed

export default function CreatePostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    seoTitle: '',
    seoDescription: '',
    isFeatured: false,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });

  // Create post mutation
  const createPostMutation = api.post.create.useMutation({
    onSuccess: () => {
      // toast.success('Post created successfully!');
      console.log('Post created successfully!');
      router.push('/admin/posts');
    },
    onError: (error) => {
      setIsSubmitting(false);
      // toast.error(`Error creating post: ${error.message}`);
      console.error('Error creating post:', error);
    },
  });

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createPostMutation.mutate(formData);
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Blog Post</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Slug (URL)
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">Will be used in the URL: /blog/{formData.slug}</p>
        </div>
        
        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            value={formData.content}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            value={formData.excerpt}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">A short summary used on blog listing pages</p>
        </div>
        
        {/* SEO Title */}
        <div>
          <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700">
            SEO Title
          </label>
          <input
            type="text"
            id="seoTitle"
            name="seoTitle"
            value={formData.seoTitle}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        {/* SEO Description */}
        <div>
          <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700">
            SEO Description
          </label>
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            value={formData.seoDescription}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        {/* Status and Featured */}
        <div className="flex space-x-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
          
          <div className="flex items-center pt-6">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleCheckboxChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
              Feature on Homepage
            </label>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-3 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
} 