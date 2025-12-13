import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Subscription } from '../../types/subscription'; // Assuming you have a types directory
import { fetchSubscriptionById, updateSubscription, deleteSubscription } from '../../api/subscriptions'; // Assuming you have an api directory

const SubscriptionDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubscription, setEditedSubscription] = useState<Partial<Subscription> | null>(null);

  useEffect(() => {
    if (id) {
      const fetchSubscription = async () => {
        try {
          setLoading(true);
          const data = await fetchSubscriptionById(id as string);
          setSubscription(data);
          setEditedSubscription(data); // Initialize editedSubscription with current data
        } catch (err) {
          setError('Failed to load subscription details.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchSubscription();
    }
  }, [id]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedSubscription(subscription); // Reset to original values
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedSubscription((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveClick = async () => {
    if (!editedSubscription || !id) return;
    try {
      setLoading(true);
      const updated = await updateSubscription(id as string, editedSubscription);
      setSubscription(updated);
      setIsEditing(false);
      setEditedSubscription(updated); // Update editedSubscription with saved data
    } catch (err) {
      setError('Failed to save subscription changes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        setLoading(true);
        await deleteSubscription(id as string);
        router.push('/subscriptions'); // Redirect to the subscriptions list page
      } catch (err) {
        setError('Failed to delete subscription.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading subscription details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!subscription) {
    return <div className="container mx-auto p-4">Subscription not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Subscription Details</h1>

      {isEditing ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Edit Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={editedSubscription?.name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={editedSubscription?.price || 0}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="billingCycle" className="block text-sm font-medium text-gray-700">
                Billing Cycle
              </label>
              <select
                id="billingCycle"
                name="billingCycle"
                value={editedSubscription?.billingCycle || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={editedSubscription?.status || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={editedSubscription?.description || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              ></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">{subscription.name}</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleEditClick}
                className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteClick}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Price:</span> ${subscription.price.toFixed(2)}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Billing Cycle:</span> {subscription.billingCycle}
              </p>
            </div>
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    subscription.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : subscription.status === 'canceled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {subscription.status}
                </span>
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Created At:</span>{' '}
                {new Date(subscription.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-600">
                <span className="font-medium">Description:</span>
              </p>
              <p className="mt-1 text-gray-800">{subscription.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDetailsPage;