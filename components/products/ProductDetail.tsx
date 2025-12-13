import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    currency: string;
    rating: number;
    reviews: number;
    features: string[];
  };
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative w-full h-96">
          <Image
            src={product.imageUrl}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="rounded-lg shadow-md"
          />
        </div>

        {/* Product Information */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <div className="flex items-center mb-4">
            {[...Array(Math.round(product.rating))].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
            <span className="ml-2 text-gray-600">
              ({product.reviews} reviews)
            </span>
          </div>
          <p className="text-2xl font-semibold mb-6">
            {product.price.toFixed(2)} {product.currency}
          </p>
          <p className="text-gray-700 mb-6">{product.description}</p>

          {product.features && product.features.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Key Features:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <Button size="lg" className="w-full md:w-auto">
              Subscribe Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;