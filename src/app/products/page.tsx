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

export default async function ProductsPage() {
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Muay Thai Products</h1>
      
      {/* Featured products section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {allProducts
            .filter(product => product.isFeatured)
            .map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </section>
      
      {/* All products section */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">All Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <Link 
      href={`/products/${product.id}`}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
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
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm mb-2 line-clamp-2">
          {product.description || "No description available"}
        </p>
        <p className="font-bold text-lg">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
