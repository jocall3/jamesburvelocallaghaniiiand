import React, { useState, useEffect } from 'react';

// Mock API calls for demonstration purposes
const mockApi = {
  fetchWorkforceData: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      currentHeadcount: 1500,
      projectedHeadcount: 1800,
      attritionRate: 0.12,
      hiringNeeds: [
        { role: 'Senior Software Engineer', count: 15, deadline: '2024-12-31' },
        { role: 'Data Scientist', count: 10, deadline: '2025-03-31' },
        { role: 'Product Manager', count: 5, deadline: '2025-01-15' },
      ],
      talentAcquisitionMetrics: {
        timeToHire: 45, // days
        costPerHire: 8000, // USD
        offerAcceptanceRate: 0.75,
      },
    };
  },
  updateWorkforcePlan: async (planData: any) => {
    await new Promise(resolve => setTimeout(resolve, 700));
    console.log('Updating workforce plan with:', planData);
    return { success: true, message: 'Workforce plan updated successfully.' };
  },
};

interface HiringNeed {
  role: string;
  count: number;
  deadline: string;
}

interface TalentAcquisitionMetrics {
  timeToHire: number;
  costPerHire: number;
  offerAcceptanceRate: number;
}

interface WorkforceData {
  currentHeadcount: number;
  projectedHeadcount: number;
  attritionRate: number;
  hiringNeeds: HiringNeed[];
  talentAcquisitionMetrics: TalentAcquisitionMetrics;
}

const WorkforcePlanningSoftware: React.FC = () => {
  const [workforceData, setWorkforceData] = useState<WorkforceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // State for editable fields
  const [projectedHeadcount, setProjectedHeadcount] = useState<number>(0);
  const [attritionRate, setAttritionRate] = useState<number>(0);
  const [hiringNeeds, setHiringNeeds] = useState<HiringNeed[]>([]);
  const [timeToHire, setTimeToHire] = useState<number>(0);
  const [costPerHire, setCostPerHire] = useState<number>(0);
  const [offerAcceptanceRate, setOfferAcceptanceRate] = useState<number>(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await mockApi.fetchWorkforceData();
        setWorkforceData(data);
        // Initialize editable states
        setProjectedHeadcount(data.projectedHeadcount);
        setAttritionRate(data.attritionRate);
        setHiringNeeds(data.hiringNeeds);
        setTimeToHire(data.talentAcquisitionMetrics.timeToHire);
        setCostPerHire(data.talentAcquisitionMetrics.costPerHire);
        setOfferAcceptanceRate(data.talentAcquisitionMetrics.offerAcceptanceRate);
      } catch (err) {
        setError('Failed to load workforce data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    // Reset to original data
    if (workforceData) {
      setProjectedHeadcount(workforceData.projectedHeadcount);
      setAttritionRate(workforceData.attritionRate);
      setHiringNeeds(workforceData.hiringNeeds);
      setTimeToHire(workforceData.talentAcquisitionMetrics.timeToHire);
      setCostPerHire(workforceData.talentAcquisitionMetrics.costPerHire);
      setOfferAcceptanceRate(workforceData.talentAcquisitionMetrics.offerAcceptanceRate);
    }
  };

  const handleSaveClick = async () => {
    const updatedData = {
      projectedHeadcount,
      attritionRate,
      hiringNeeds,
      talentAcquisitionMetrics: {
        timeToHire,
        costPerHire,
        offerAcceptanceRate,
      },
    };
    try {
      const result = await mockApi.updateWorkforcePlan(updatedData);
      if (result.success) {
        setWorkforceData({ ...workforceData!, ...updatedData }); // Update state with saved data
        setIsEditing(false);
        alert('Workforce plan saved successfully!');
      } else {
        setError('Failed to save workforce plan.');
      }
    } catch (err) {
      setError('An error occurred while saving.');
      console.error(err);
    }
  };

  const handleHiringNeedChange = (index: number, field: keyof HiringNeed, value: string | number) => {
    const newHiringNeeds = [...hiringNeeds];
    newHiringNeeds[index] = { ...newHiringNeeds[index], [field]: value };
    setHiringNeeds(newHiringNeeds);
  };

  const addHiringNeed = () => {
    setHiringNeeds([...hiringNeeds, { role: '', count: 0, deadline: '' }]);
  };

  const removeHiringNeed = (index: number) => {
    const newHiringNeeds = hiringNeeds.filter((_, i) => i !== index);
    setHiringNeeds(newHiringNeeds);
  };

  if (loading) {
    return <div className="text-center p-8">Loading workforce data...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (!workforceData) {
    return <div className="text-center p-8">No workforce data available.</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Workforce Planning & Talent Acquisition</h1>
        {!isEditing ? (
          <button
            onClick={handleEditClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Edit Plan
          </button>
        ) : (
          <div className="flex space-x-4">
            <button
              onClick={handleCancelClick}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Save Plan
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Workforce Overview */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Workforce Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Headcount:</span>
              <span className="font-medium">{workforceData.currentHeadcount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Projected Headcount:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={projectedHeadcount}
                  onChange={(e) => setProjectedHeadcount(parseInt(e.target.value, 10) || 0)}
                  className="p-1 border rounded-md w-24 text-right"
                />
              ) : (
                <span className="font-medium">{workforceData.projectedHeadcount}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Projected Attrition Rate:</span>
              {isEditing ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    value={attritionRate}
                    onChange={(e) => setAttritionRate(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded-md w-24 text-right"
                  />
                  <span className="ml-2 text-gray-500">%</span>
                </div>
              ) : (
                <span className="font-medium">{(workforceData.attritionRate * 100).toFixed(1)}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Hiring Needs */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2 flex justify-between items-center">
            <span>Key Hiring Needs</span>
            {isEditing && (
              <button
                onClick={addHiringNeed}
                className="text-sm px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none"
              >
                Add Role
              </button>
            )}
          </h2>
          {hiringNeeds.length === 0 ? (
            <p className="text-gray-500">No specific hiring needs identified.</p>
          ) : (
            <ul className="space-y-4">
              {hiringNeeds.map((need, index) => (
                <li key={index} className="border p-3 rounded-md bg-gray-50">
                  {isEditing ? (
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        placeholder="Role"
                        value={need.role}
                        onChange={(e) => handleHiringNeedChange(index, 'role', e.target.value)}
                        className="p-2 border rounded-md w-full"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Count"
                          value={need.count}
                          onChange={(e) => handleHiringNeedChange(index, 'count', parseInt(e.target.value, 10) || 0)}
                          className="p-2 border rounded-md"
                        />
                        <input
                          type="date"
                          placeholder="Deadline"
                          value={need.deadline}
                          onChange={(e) => handleHiringNeedChange(index, 'deadline', e.target.value)}
                          className="p-2 border rounded-md"
                        />
                      </div>
                      <button
                        onClick={() => removeHiringNeed(index)}
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg text-blue-700">{need.role}</span>
                      <div className="flex justify-between mt-2">
                        <span className="text-gray-600">Required: <span className="font-medium">{need.count}</span></span>
                        <span className="text-gray-600">Target Date: <span className="font-medium">{need.deadline}</span></span>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Talent Acquisition Metrics */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Talent Acquisition Metrics</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Time to Hire:</span>
              {isEditing ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    value={timeToHire}
                    onChange={(e) => setTimeToHire(parseInt(e.target.value, 10) || 0)}
                    className="p-1 border rounded-md w-24 text-right"
                  />
                  <span className="ml-2 text-gray-500">days</span>
                </div>
              ) : (
                <span className="font-medium">{workforceData.talentAcquisitionMetrics.timeToHire} days</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Cost Per Hire:</span>
              {isEditing ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    value={costPerHire}
                    onChange={(e) => setCostPerHire(parseInt(e.target.value, 10) || 0)}
                    className="p-1 border rounded-md w-28 text-right"
                  />
                  <span className="ml-2 text-gray-500">USD</span>
                </div>
              ) : (
                <span className="font-medium">${workforceData.talentAcquisitionMetrics.costPerHire.toLocaleString()}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Offer Acceptance Rate:</span>
              {isEditing ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    value={offerAcceptanceRate}
                    onChange={(e) => setOfferAcceptanceRate(parseFloat(e.target.value) || 0)}
                    className="p-1 border rounded-md w-24 text-right"
                  />
                  <span className="ml-2 text-gray-500">%</span>
                </div>
              ) : (
                <span className="font-medium">{(workforceData.talentAcquisitionMetrics.offerAcceptanceRate * 100).toFixed(0)}%</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add more sections as needed, e.g., Skill Gap Analysis, Succession Planning */}
    </div>
  );
};

export default WorkforcePlanningSoftware;