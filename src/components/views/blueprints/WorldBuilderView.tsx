import React, { useState, useEffect } from 'react';

const WorldBuilderView: React.FC = () => {
  const [worldName, setWorldName] = useState('');
  const [worldDescription, setWorldDescription] = useState('');
  const [geography, setGeography] = useState('');
  const [resources, setResources] = useState('');
  const [factions, setFactions] = useState('');
  const [lore, setLore] = useState('');

  useEffect(() => {
      document.title = "World Builder - The Sovereign's Ledger";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement the logic to use the generative jurisprudence engine with all the parameters and send this to backend
    console.log('Submitting:', {
      worldName,
      worldDescription,
      geography,
      resources,
      factions,
      lore,
    });
    alert('World Building parameters submitted!');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">World Builder</h1>
      <p className="mb-4">Design the geography, resources, and factions of synthetic worlds. Use these parameters to generate detailed backstories and simulate interactions between these elements.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="worldName" className="block text-sm font-medium text-gray-300">World Name</label>
          <input
            type="text"
            id="worldName"
            className="mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm bg-gray-800 text-gray-200"
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="worldDescription" className="block text-sm font-medium text-gray-300">World Description</label>
          <textarea
            id="worldDescription"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm bg-gray-800 text-gray-200"
            value={worldDescription}
            onChange={(e) => setWorldDescription(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="geography" className="block text-sm font-medium text-gray-300">Geography</label>
          <textarea
            id="geography"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm bg-gray-800 text-gray-200"
            value={geography}
            onChange={(e) => setGeography(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="resources" className="block text-sm font-medium text-gray-300">Resources</label>
          <textarea
            id="resources"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm bg-gray-800 text-gray-200"
            value={resources}
            onChange={(e) => setResources(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="factions" className="block text-sm font-medium text-gray-300">Factions</label>
          <textarea
            id="factions"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm bg-gray-800 text-gray-200"
            value={factions}
            onChange={(e) => setFactions(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="lore" className="block text-sm font-medium text-gray-300">Initial Lore and History</label>
          <textarea
            id="lore"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm bg-gray-800 text-gray-200"
            value={lore}
            onChange={(e) => setLore(e.target.value)}
          />
        </div>
        <div>
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            Create World
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorldBuilderView;