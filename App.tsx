import React, { useState, useCallback, useEffect } from 'react';
import { changePose } from './services/geminiService';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { Loader } from './components/Loader';
import { ImageDisplay } from './components/ImageDisplay';
import type { ImageFile } from './types';
import { INITIAL_IMAGE_URL } from './constants';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<ImageFile | null>(null);
  const [clothingImage, setClothingImage] = useState<ImageFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [clothingPrompt, setClothingPrompt] = useState<string>('');
  const [backgroundPrompt, setBackgroundPrompt] = useState<string>('');
  const [preserveBodyShape, setPreserveBodyShape] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialImage = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const response = await fetch(INITIAL_IMAGE_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setOriginalImage({
            dataUrl: dataUrl,
            mimeType: blob.type,
          });
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Failed to load initial image:", e);
        setError("Could not load the sample image. Please upload your own.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialImage();
  }, []);


  const handleImageUpload = (imageFile: ImageFile) => {
    setOriginalImage(imageFile);
    setGeneratedImage(null);
    setError(null);
  };

  const handleGeneratePose = useCallback(async () => {
    if (!originalImage || (!prompt.trim() && !clothingPrompt.trim() && !backgroundPrompt.trim() && !backgroundImage && !clothingImage)) {
      setError("Please describe what you want to change (pose, clothing, or background).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Strips the "data:image/jpeg;base64," part
      const base64Data = originalImage.dataUrl.split(',')[1];
      if (!base64Data) {
        throw new Error("Invalid image data URL.");
      }

      const newImageBase64 = await changePose(
        base64Data,
        originalImage.mimeType,
        backgroundImage ? backgroundImage.dataUrl.split(',')[1] : null,
        backgroundImage ? backgroundImage.mimeType : null,
        clothingImage ? clothingImage.dataUrl.split(',')[1] : null,
        clothingImage ? clothingImage.mimeType : null,
        prompt,
        backgroundPrompt,
        clothingPrompt,
        preserveBodyShape
        );
      setGeneratedImage(newImageBase64);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to generate new pose. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, backgroundImage, clothingImage, prompt, backgroundPrompt, clothingPrompt, preserveBodyShape]);

  const isGenerationDisabled = isLoading || !originalImage || (!prompt.trim() && !clothingPrompt.trim() && !backgroundPrompt.trim() && !backgroundImage && !clothingImage);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-8">
               {/* Section 1 */}
               <div className="flex flex-col gap-4">
                  <h2 className="text-2xl font-bold text-cyan-400">1. Your Image</h2>
                  {isLoading && !originalImage ? (
                    <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
                        <Loader />
                    </div>
                  ) : (
                    <ImageUploader 
                      onImageUpload={handleImageUpload}
                      imageSrc={originalImage?.dataUrl} 
                    />
                  )}
               </div>
            </div>

            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-cyan-400">2. Customize Your Image</h2>
              
              <div>
                <label htmlFor="pose-prompt" className="block text-sm font-medium text-gray-300 mb-2">Describe New Pose (Optional)</label>
                <textarea
                    id="pose-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., superhero landing pose, confident stance"
                    className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-none h-24"
                    rows={3}
                    disabled={!originalImage}
                    aria-label="Describe New Pose"
                />
              </div>

              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col gap-4">
                    <h3 className="text-lg font-semibold text-gray-200">Clothing & Style Options</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Upload a Reference Image</label>
                         {clothingImage ? (
                            <div className="relative bg-gray-800 rounded-lg p-2 shadow-lg w-full">
                                <img
                                    src={clothingImage.dataUrl}
                                    alt="Clothing Reference"
                                    className="w-full h-auto object-contain rounded-md aspect-square"
                                />
                                <button
                                    onClick={() => setClothingImage(null)}
                                    className="absolute top-3 right-3 z-10 bg-slate-900/70 text-white rounded-full p-1.5 leading-none hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors"
                                    aria-label="Remove clothing image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ) : (
                            <ImageUploader onImageUpload={setClothingImage} />
                        )}
                    </div>
                    
                    <div className="flex items-center text-gray-500">
                        <hr className="flex-grow border-gray-600" />
                        <span className="px-2 text-sm">OR</span>
                        <hr className="flex-grow border-gray-600" />
                    </div>

                    <div>
                        <label htmlFor="clothing-prompt" className="block text-sm font-medium text-gray-300 mb-2">Describe with Text</label>
                        <textarea
                            id="clothing-prompt"
                            value={clothingPrompt}
                            onChange={(e) => setClothingPrompt(e.target.value)}
                            placeholder="e.g., a formal black suit, a red summer dress"
                            className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-none h-24 disabled:bg-gray-800/50 disabled:cursor-not-allowed"
                            rows={3}
                            disabled={!originalImage || !!clothingImage}
                            aria-label="Describe Clothing & Style (Optional)"
                        />
                    </div>
                </div>


                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col gap-4">
                    <h3 className="text-lg font-semibold text-gray-200">Background Options</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Upload an Image</label>
                         {backgroundImage ? (
                            <div className="relative bg-gray-800 rounded-lg p-2 shadow-lg w-full">
                                <img
                                    src={backgroundImage.dataUrl}
                                    alt="New Background"
                                    className="w-full h-auto object-contain rounded-md aspect-square"
                                />
                                <button
                                    onClick={() => setBackgroundImage(null)}
                                    className="absolute top-3 right-3 z-10 bg-slate-900/70 text-white rounded-full p-1.5 leading-none hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors"
                                    aria-label="Remove background image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ) : (
                            <ImageUploader onImageUpload={setBackgroundImage} />
                        )}
                    </div>
                    
                    <div className="flex items-center text-gray-500">
                        <hr className="flex-grow border-gray-600" />
                        <span className="px-2 text-sm">OR</span>
                        <hr className="flex-grow border-gray-600" />
                    </div>

                    <div>
                        <label htmlFor="background-prompt" className="block text-sm font-medium text-gray-300 mb-2">Describe with Text</label>
                        <textarea
                            id="background-prompt"
                            value={backgroundPrompt}
                            onChange={(e) => setBackgroundPrompt(e.target.value)}
                            placeholder="e.g., a futuristic city, a sunny beach"
                            className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-none h-24 disabled:bg-gray-800/50 disabled:cursor-not-allowed"
                            rows={3}
                            disabled={!originalImage || !!backgroundImage}
                            aria-label="Describe New Background (Optional)"
                        />
                    </div>
                </div>


              <div className="flex items-center">
                <input
                  id="body-shape-checkbox"
                  type="checkbox"
                  checked={preserveBodyShape}
                  onChange={(e) => setPreserveBodyShape(e.target.checked)}
                  disabled={!originalImage}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="body-shape-checkbox" className="ml-2 block text-sm text-gray-300">
                  Preserve original body shape
                </label>
              </div>

              <button
                onClick={handleGeneratePose}
                disabled={isGenerationDisabled}
                className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <Loader small={true} />}
                {isLoading ? 'Generating...' : 'Generate'}
              </button>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-center">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 text-center">3. AI Generated Result</h2>
            <div className="w-full md:w-1/2 mx-auto">
                 {isLoading && !generatedImage && (
                     <div className="aspect-square bg-gray-800 rounded-lg flex flex-col items-center justify-center text-center p-4">
                        <Loader />
                        <p className="mt-4 text-gray-400">The AI is striking a new pose...</p>
                        <p className="text-sm text-gray-500">This may take a moment.</p>
                     </div>
                 )}
                {generatedImage && <ImageDisplay title="Generated Pose" src={generatedImage} />}
                {!generatedImage && !isLoading && !error && (
                    <div className="aspect-square bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                        <p>Your new image will appear here</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;