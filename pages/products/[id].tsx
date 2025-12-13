import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { Product, Subscription } from '../../types'; // Assuming you have these types defined
import { fetchProductById, updateProduct, deleteProduct, fetchSubscriptionsByProductId } from '../../lib/api'; // Assuming these API functions exist

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product: initialProduct }) => {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState<Product>(initialProduct);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product>(initialProduct);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const fetchProductData = async () => {
        setLoading(true);
        try {
          const fetchedProduct = await fetchProductById(id);
          setProduct(fetchedProduct);
          setEditedProduct(fetchedProduct); // Initialize editedProduct with fetched data
          const fetchedSubscriptions = await fetchSubscriptionsByProductId(id);
          setSubscriptions(fetchedSubscriptions);
        } catch (err) {
          setError('Failed to load product details.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchProductData();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProduct({ ...editedProduct, [name]: value });
  };

  const handleSave = async () => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateProduct(id, editedProduct);
      setProduct(updated);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save changes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProduct(product); // Reset to original product data
  };

  const handleDelete = async () => {
    if (!id || typeof id !== 'string') return;
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      setLoading(true);
      setError(null);
      try {
        await deleteProduct(id);
        router.push('/products'); // Redirect to the products list page
      } catch (err) {
        setError('Failed to delete product.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading product details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!product) {
    return <div className="container mx-auto p-4">Product not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>{isEditing ? `Editing ${product.name}` : product.name} - Product Management</title>
      </Head>

      <h1 className="text-3xl font-bold mb-6">
        {isEditing ? `Editing Product: ${product.name}` : `Product: ${product.name}`}
      </h1>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={editedProduct.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={editedProduct.description}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={editedProduct.price}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
            <input
              type="text"
              id="currency"
              name="currency"
              value={editedProduct.currency}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="billingInterval" className="block text-sm font-medium text-gray-700">Billing Interval</label>
            <input
              type="text"
              id="billingInterval"
              name="billingInterval"
              value={editedProduct.billingInterval}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={loading}
            >
              Save Changes
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p><span className="font-semibold">Product ID:</span> {product.id}</p>
          <p><span className="font-semibold">Name:</span> {product.name}</p>
          <p><span className="font-semibold">Description:</span> {product.description}</p>
          <p><span className="font-semibold">Price:</span> {product.price} {product.currency}</p>
          <p><span className="font-semibold">Billing Interval:</span> {product.billingInterval}</p>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit Product
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={loading}
            >
              Delete Product
            </button>
          </div>
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Active Subscriptions</h2>
        {subscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sub.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/subscriptions/${sub.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No active subscriptions found for this product.</p>
        )}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<ProductDetailsProps> = async (context) => {
  const { id } = context.params!;

  try {
    const product = await fetchProductById(id as string);
    return {
      props: {
        product,
      },
    };
  } catch (error) {
    console.error('Error fetching product in getServerSideProps:', error);
    // Handle error, e.g., return a 404 or an error page
    return {
      notFound: true,
    };
  }
};

export default ProductDetails;