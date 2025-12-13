import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { Plan } from '../../types/plan'; // Assuming you have a Plan type defined
import { fetchPlanById } from '../../lib/api'; // Assuming you have an API function to fetch plan details

interface PlanDetailsProps {
  plan: Plan | null;
}

const PlanDetailsPage: React.FC<PlanDetailsProps> = ({ plan }) => {
  const router = useRouter();
  const { id } = router.query;

  const [currentPlan, setCurrentPlan] = useState<Plan | null>(plan);
  const [isLoading, setIsLoading] = useState<boolean>(!plan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plan && id) {
      const loadPlan = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedPlan = await fetchPlanById(id as string);
          setCurrentPlan(fetchedPlan);
        } catch (err) {
          console.error('Error fetching plan:', err);
          setError('Failed to load plan details. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };
      loadPlan();
    }
  }, [id, plan]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <p>Loading plan details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="container mx-auto p-4">
        <p>Plan not found.</p>
      </div>
    );
  }

  const handleEditPlan = () => {
    router.push(`/plans/${id}/edit`);
  };

  const handleDeletePlan = async () => {
    if (confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      try {
        // Assume you have an API function to delete a plan
        // await deletePlan(id as string);
        alert('Plan deleted successfully!');
        router.push('/plans'); // Redirect to the plans list page
      } catch (err) {
        console.error('Error deleting plan:', err);
        alert('Failed to delete plan. Please try again later.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>{currentPlan.name} - Plan Details</title>
      </Head>

      <h1 className="text-3xl font-bold mb-6">{currentPlan.name}</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 font-semibold">Plan ID:</p>
            <p className="text-lg">{currentPlan.id}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">Price:</p>
            <p className="text-lg">${currentPlan.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">Billing Cycle:</p>
            <p className="text-lg capitalize">{currentPlan.billingCycle}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">Features:</p>
            <ul className="list-disc list-inside text-lg">
              {currentPlan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">Active:</p>
            <p className="text-lg">{currentPlan.isActive ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">Created At:</p>
            <p className="text-lg">{new Date(currentPlan.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">Updated At:</p>
            <p className="text-lg">{new Date(currentPlan.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleEditPlan}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Edit Plan
        </button>
        <button
          onClick={handleDeletePlan}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Delete Plan
        </button>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<PlanDetailsProps> = async (context) => {
  const { id } = context.params!;
  try {
    const plan = await fetchPlanById(id as string);
    return {
      props: {
        plan,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        plan: null,
      },
    };
  }
};

export default PlanDetailsPage;