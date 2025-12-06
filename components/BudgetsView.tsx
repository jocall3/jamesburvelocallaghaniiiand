
import React, { useContext, useState } from 'react';
import Card from './Card';
import { DataContext } from '../context/DataContext';

// Define the NewBudgetModal as a simple internal component to avoid import issues if the file doesn't exist yet
const NewBudgetModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onAdd: (name: string, limit: number) => void; 
    transactions: any[];
}> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [limit, setLimit] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h3 className="text-xl font-bold text-white mb-4">Create New Budget</h3>
                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Category Name" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    />
                    <input 
                        type="number" 
                        placeholder="Monthly Limit" 
                        value={limit} 
                        onChange={e => setLimit(e.target.value)}
                        className="w-full p-2 bg-gray-700 text-white rounded"
                    />
                    <div className="flex justify-between">
                        <button onClick={onClose} className="text-gray-400 hover:text-white">Cancel</button>
                        <button onClick={() => {
                            const numLimit = parseFloat(limit);
                            if (name && !isNaN(numLimit)) {
                                onAdd(name, numLimit);
                                onClose();
                            }
                        }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">Create</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BudgetsView: React.FC = () => {
  const context = useContext(DataContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  if (!context) return <div>Loading...</div>;
  
  const { budgets, transactions, addBudget } = context;
  
  return (
    <div className="space-y-6">
      <Card title="Budget Overview">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(budget => (
             <div key={budget.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-white">{budget.name}</h4>
                    <span className="text-sm text-gray-400">${budget.spent} / ${budget.limit}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                        className={`h-2 rounded-full ${budget.spent > budget.limit ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%` }}
                    ></div>
                </div>
             </div>
          ))}
        </div>
        <button onClick={() => setIsModalOpen(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">Add Budget</button>
      </Card>
      <NewBudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addBudget} transactions={transactions} />
    </div>
  );
};

export default BudgetsView;
