import React, { useState } from 'react';

interface VisibilityToggleProps {
  initialVisibility: 'Visible' | 'Hidden';
  onVisibilityChange: (newVisibility: 'Visible' | 'Hidden') => void;
}

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({ initialVisibility, onVisibilityChange }) => {
  const [isToggled, setIsToggled] = useState(initialVisibility === 'Visible');

  const handleToggle = () => {
    const newState = !isToggled;
    setIsToggled(newState);
    onVisibilityChange(newState ? 'Visible' : 'Hidden');
  };

  return (
    <div className="flex items-center cursor-pointer" onClick={handleToggle}>
      <div className={`w-10 h-5 rounded-full transition duration-300 ease-in-out ${isToggled ? 'bg-blue-500' : 'bg-gray-300'}`}>
        <div
          className={`w-5 h-5 rounded-full bg-white shadow transform transition duration-300 ease-in-out ${
            isToggled ? 'translate-x-5' : ''
          }`}
        ></div>
      </div>
      <span className="ml-2 font-medium">{isToggled ? 'Visible' : 'Hidden'}</span>
    </div>
  );
};

export default VisibilityToggle;