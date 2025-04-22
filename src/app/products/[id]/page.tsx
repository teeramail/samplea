import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "~/server/db";
import { products } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { Metadata } from "next";

type Props = {
  params: { id: string };
};

export async function generateStaticParams() {
  const allProducts = await db.select({ id: products.id }).from(products);
  return allProducts.map(product => ({ id: product.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, params.id))
    .then(res => res[0]);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  // Get the thumbnail URL (safely handle if it doesn't exist in the type yet)
  const thumbnailUrl = (product as any).thumbnailUrl || null;
  
  return {
    title: `${product.name} | Teera Muay Thai`,
    description: product.description?.slice(0, 160) || `Buy ${product.name} from Teera Muay Thai.`,
    openGraph: {
      title: product.name,
      description: product.description || `Buy ${product.name} from Teera Muay Thai.`,
      images: thumbnailUrl 
        ? [{ url: thumbnailUrl, width: 800, height: 600, alt: product.name }]
        : [],
      type: "website", // Changed from "product" to "website" which is a valid OpenGraph type
      siteName: "Teera Muay Thai",
      locale: "en_US",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, params.id))
    .then(res => res[0]);

  if (!product) {
    notFound();
  }

  // Format price with 2 decimal places
  const formattedPrice = product.price.toFixed(2);
  
  // Get the thumbnail URL (safely handle if it doesn't exist in the type yet)
  const thumbnailUrl = (product as any).thumbnailUrl || null;
  
  // Prepare JSON-LD structured data for product
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [thumbnailUrl, ...(product.imageUrls || [])].filter(Boolean),
    sku: product.id,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: formattedPrice,
      availability: "https://schema.org/InStock",
      url: `https://teeramuaythai.com/products/${product.id}`,
    },
    brand: {
      "@type": "Brand",
      name: "Teera Muay Thai",
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main thumbnail image */}
          <div className="relative h-96 w-full rounded-lg overflow-hidden">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>
          
          {/* Gallery of additional images */}
          {product.imageUrls && product.imageUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.imageUrls.map((url, index) => (
                <div key={index} className="relative h-24 rounded-md overflow-hidden">
                  <Image
                    src={url}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 12vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Product Information */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-2xl font-semibold text-indigo-600 mb-4">
            ${formattedPrice}
          </p>
          
          <div className="prose mb-6">
            <p>{product.description || "No description available."}</p>
          </div>
          
          {/* Add to Cart Button */}
          <button 
            className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
      
      {/* Related Products section could go here */}
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
