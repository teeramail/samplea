import Link from "next/link";
import Image from "next/image";
import { db } from "~/server/db";
import { products } from "~/server/db/schema";
import { desc } from "drizzle-orm";

export const metadata = {
  title: "Muay Thai Products | Teera Muay Thai",
  description: "Browse our collection of authentic Muay Thai gear, apparel, and accessories. High-quality products for fighters of all levels.",
  openGraph: {
    title: "Muay Thai Products | Teera Muay Thai",
    description: "Browse our collection of authentic Muay Thai gear, apparel, and accessories. High-quality products for fighters of all levels.",
    url: "/products",
    siteName: "Teera Muay Thai",
    locale: "en_US",
    type: "website",
  },
};

// Define the Product type based on the database schema
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  thumbnailUrl: string | null;
  imageUrls: string[] | null;
  categoryId: string | null;
  isFeatured: boolean;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
};

export default async function ProductsPage() {
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));

  const featuredProducts = allProducts.filter(product => product.isFeatured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Muay Thai Products</h1>
        
        {allProducts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-4">No Products Available</h2>
            <p className="text-gray-300 mb-8">We're currently setting up our product catalog. Check back soon!</p>
            <Link 
              href="/"
              className="bg-[hsl(280,100%,70%)] hover:bg-[hsl(280,100%,80%)] text-white px-6 py-3 rounded-lg transition-colors"
            >
              Return to Home
            </Link>
          </div>
        ) : (
          <>
            {/* Featured products section */}
            {featuredProducts.length > 0 && (
              <section className="mb-12">
                <h2 className="text-3xl font-semibold mb-6">Featured Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
            
            {/* All products section */}
            <section>
              <h2 className="text-3xl font-semibold mb-6">All Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link 
      href={`/products/${product.id}`}
      className="group bg-white/10 rounded-lg shadow-md overflow-hidden hover:bg-white/20 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-64 w-full">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-white/40 text-sm">No image</span>
            </div>
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute top-2 right-2 bg-[hsl(280,100%,70%)] text-white px-2 py-1 rounded-md text-xs font-semibold">
            Featured
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 group-hover:text-[hsl(280,100%,70%)] transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-300 text-sm mb-2 line-clamp-2">
          {product.description || "No description available"}
        </p>
        <div className="flex items-center justify-between">
          <p className="font-bold text-lg text-[hsl(280,100%,70%)]">${product.price.toFixed(2)}</p>
          {product.stock > 0 ? (
            <span className="text-xs text-green-400">In Stock</span>
          ) : (
            <span className="text-xs text-red-400">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}
