
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-3xl font-bold text-center">
          <span className="text-white">Pose Changer</span>{' '}
          <span className="text-cyan-400">AI</span>
        </h1>
        <p className="text-center text-gray-400 mt-1">
          Upload a photo and describe a new pose with Gemini
        </p>
      </div>
    </header>
  );
};
