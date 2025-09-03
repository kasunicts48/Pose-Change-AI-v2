
import React from 'react';

interface ImageDisplayProps {
  title: string;
  src: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ title, src }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-2 shadow-lg w-full">
      <img
        src={src}
        alt={title}
        className="w-full h-auto object-contain rounded-md aspect-square"
      />
      <h3 className="text-center font-semibold text-gray-300 mt-2">{title}</h3>
    </div>
  );
};
