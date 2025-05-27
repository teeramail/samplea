"use client";

import { useState } from "react";
import { UploadImage } from "~/components/ui/UploadImage";
import Link from "next/link";

export default function UploadModelTestPage() {
  // Product form data
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    thumbnailUrl: "",
    imageUrls: [] as string[],
  });
  
  // Fighter form data
  const [fighterData, setFighterData] = useState({
    name: "",
    description: "",
    thumbnailUrl: "",
    imageUrls: [] as string[],
  });
  
  // Form submission
  const handleSubmit = (type: string, e: React.FormEvent) => {
    e.preventDefault();
    console.log(`${type} form data:`, type === 'product' ? productData : fighterData);
    alert(`${type} form submitted! Check console for data.`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Image Upload Model Test</h1>
        <Link 
          href="/admin/categories"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Categories
        </Link>
      </div>
      
      <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Universal Image Upload Model</h2>
        <p className="mb-2 text-gray-700">
          This image upload model can be used across all entity types in your application.
        </p>
        <ul className="ml-5 list-disc space-y-1 text-gray-700">
          <li><strong>Client-side Optimization:</strong> Images are optimized in the browser when possible</li>
          <li><strong>Automatic WebP Conversion:</strong> All images are converted to WebP format</li>
          <li><strong>Size Limits:</strong> Thumbnails limited to 80KB, images to 120KB each</li>
          <li><strong>Organized Storage:</strong> Files are stored in separate S3 folders by entity type</li>
          <li><strong>Drag & Drop:</strong> Modern interface with visual feedback</li>
          <li><strong>Size Feedback:</strong> Shows original vs compressed size</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Product Example */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-semibold text-center">Product Example</h2>
          
          <form onSubmit={(e) => handleSubmit('product', e)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                value={productData.name}
                onChange={(e) => setProductData({...productData, name: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={productData.description}
                onChange={(e) => setProductData({...productData, description: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price
              </label>
              <input
                type="text"
                value={productData.price}
                onChange={(e) => setProductData({...productData, price: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div className="pt-4">
              <UploadImage
                type="thumbnail"
                entityType="products"
                value={productData.thumbnailUrl}
                onChange={(url) => setProductData({...productData, thumbnailUrl: url as string})}
                label="Product Thumbnail (max 80KB)"
              />
            </div>
            
            <div className="pt-4">
              <UploadImage
                type="images"
                entityType="products"
                value={productData.imageUrls}
                onChange={(urls) => setProductData({...productData, imageUrls: urls as string[]})}
                maxImages={8}
                label="Product Images (max 120KB each)"
              />
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
        
        {/* Fighter Example */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-xl font-semibold text-center">Fighter Example</h2>
          
          <form onSubmit={(e) => handleSubmit('fighter', e)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fighter Name
              </label>
              <input
                type="text"
                value={fighterData.name}
                onChange={(e) => setFighterData({...fighterData, name: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Biography
              </label>
              <textarea
                value={fighterData.description}
                onChange={(e) => setFighterData({...fighterData, description: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="pt-4">
              <UploadImage
                type="thumbnail"
                entityType="fighters"
                value={fighterData.thumbnailUrl}
                onChange={(url) => setFighterData({...fighterData, thumbnailUrl: url as string})}
                label="Fighter Portrait (max 80KB)"
              />
            </div>
            
            <div className="pt-4">
              <UploadImage
                type="images"
                entityType="fighters"
                value={fighterData.imageUrls}
                onChange={(urls) => setFighterData({...fighterData, imageUrls: urls as string[]})}
                maxImages={8}
                label="Fighter Gallery (max 120KB each)"
              />
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save Fighter
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Code Examples */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Code Example</h2>
        
        <pre className="mb-6 rounded-md bg-gray-800 p-4 text-xs text-white overflow-x-auto">
{`import { UploadImage } from "~/components/ui/UploadImage";

// For thumbnail (single image, max 80KB)
const [thumbnailUrl, setThumbnailUrl] = useState("");

<UploadImage
  type="thumbnail"
  entityType="products" // or "fighters", "venues", "regions"
  value={thumbnailUrl}
  onChange={setThumbnailUrl}
  label="Product Thumbnail"
/>

// For multiple images (max 120KB each)
const [imageUrls, setImageUrls] = useState<string[]>([]);

<UploadImage
  type="images"
  entityType="products"
  value={imageUrls}
  onChange={setImageUrls}
  maxImages={8}
  label="Product Gallery"
/>`}
        </pre>
        
        <h3 className="mb-2 text-lg font-medium">Integration with T3 Stack</h3>
        <pre className="rounded-md bg-gray-800 p-4 text-xs text-white overflow-x-auto">
{`// In your schema.ts
export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  thumbnailUrl: text("thumbnailUrl"),
  imageUrls: text("imageUrls").array(),
  // Other fields...
});

// In your tRPC router
export const productsRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      imageUrls: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const product = await ctx.db.insert(products).values({
          id: createId(),
          name: input.name,
          description: input.description ?? null,
          price: input.price ?? null,
          thumbnailUrl: input.thumbnailUrl ?? null,
          imageUrls: input.imageUrls ?? [],
        }).returning();
        
        return product[0];
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create product",
        });
      }
    }),
});`}
        </pre>
      </div>
    </div>
  );
}
