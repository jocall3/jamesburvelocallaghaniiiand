import React from 'react';

const ComponentLibraryView: React.FC = () => {
  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">Component Library</h1>
      <p className="text-gray-400 mb-8">
        A collection of reusable UI components used throughout the application.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Buttons Section */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
              Secondary Button
            </button>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors">
              Danger Button
            </button>
          </div>
        </div>

        {/* Cards Section */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">Card Styles</h2>
          <div className="p-4 bg-gray-900 rounded border border-gray-700 mb-4">
            <h3 className="font-bold text-cyan-400">Standard Card</h3>
            <p className="text-sm text-gray-400">This is a sample card content.</p>
          </div>
        </div>

        {/* Typography Section */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">Typography</h2>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-bold">Heading 2</h2>
            <h3 className="text-2xl font-bold">Heading 3</h3>
            <p className="text-base text-gray-300">Body text looks like this. It is legible and has good contrast.</p>
            <p className="text-sm text-gray-500">Small text for captions or metadata.</p>
          </div>
        </div>

        {/* Form Elements */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-white">Form Elements</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Input Field</label>
              <input 
                type="text" 
                placeholder="Type something..." 
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-cyan-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Select Dropdown</label>
              <select className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-cyan-500 text-white">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentLibraryView;