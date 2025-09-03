import React, { useCallback, useState } from 'react';
import type { ImageFile } from '../types';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (imageFile: ImageFile) => void;
  imageSrc?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageSrc }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload({
          dataUrl: reader.result as string,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`group relative border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-cyan-500 bg-gray-700/50' : 'border-gray-600 hover:border-cyan-600 bg-gray-800'} ${imageSrc ? 'p-2' : 'p-8'}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      {imageSrc ? (
        <div className="relative aspect-square">
           <img src={imageSrc} alt="Your upload" className="w-full h-full object-contain rounded-md" />
           <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                <UploadIcon className="w-12 h-12 mb-4" />
                <p className="font-semibold">Click or drag to change image</p>
           </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <UploadIcon className="w-12 h-12 mb-4" />
          <p className="font-semibold">Click to upload or drag & drop</p>
          <p className="text-sm">PNG, JPG, or WEBP</p>
        </div>
      )}

      <input
        id="file-input"
        type="file"
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
      />
    </div>
  );
};
