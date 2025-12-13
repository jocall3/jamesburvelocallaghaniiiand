import React from 'react';

interface PlanDescriptionProps {
  title: string;
  description: string;
  features: string[];
  price: string;
  buttonText: string;
  onSubscribe: () => void;
}

const PlanDescription: React.FC<PlanDescriptionProps> = ({
  title,
  description,
  features,
  price,
  buttonText,
  onSubscribe,
}) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">{title}</h2>
      <p className="text-gray-600 text-lg mb-6">{description}</p>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Features:</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      <div className="text-center">
        <p className="text-4xl font-extrabold text-indigo-600 mb-6">{price}</p>
        <button
          onClick={onSubscribe}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default PlanDescription;