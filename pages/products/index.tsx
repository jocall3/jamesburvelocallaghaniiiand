import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@prisma/client';
import { GetServerSideProps } from 'next';
import prisma from '@/lib/prisma';

interface ProductsPageProps {
  products: Product[];
}

export const getServerSideProps: GetServerSideProps<ProductsPageProps> = async () => {
  const products = await prisma.product.findMany();
  return {
    props: { products },
  };
};

const ProductsPage: React.FC<ProductsPageProps> = ({ products: initialProducts }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        });
        setProducts(products.filter(product => product.id !== id));
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">All Products</h1>

      <div className="mb-6 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search products..."
          className="p-2 border border-gray-300 rounded-md w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Link href="/products/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">
            Add New Product
          </button>
        </Link>
      </div>

      {filteredProducts.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
              <p className="text-gray-700 mb-4 line-clamp-3">{product.description}</p>
              <div className="flex justify-between items-center mt-4">
                <Link href={`/products/${product.id}`}>
                  <button className="text-blue-600 hover:underline">View Details</button>
                </Link>
                <div className="flex space-x-2">
                  <Link href={`/products/${product.id}/edit`}>
                    <button className="text-yellow-600 hover:underline">Edit</button>
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;