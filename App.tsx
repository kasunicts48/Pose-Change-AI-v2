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
    if (!originalImage || (!prompt.trim() && !clothingPrompt.trim() && !backgroundPrompt.trim())) {
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

      const newImageBase64 = await changePose(base64Data, originalImage.mimeType, prompt, backgroundPrompt, clothingPrompt, preserveBodyShape);
      setGeneratedImage(newImageBase64);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to generate new pose. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt, backgroundPrompt, clothingPrompt, preserveBodyShape]);

  const isGenerationDisabled = isLoading || !originalImage || (!prompt.trim() && !clothingPrompt.trim() && !backgroundPrompt.trim());

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
                  {originalImage ? (
                    <ImageDisplay title="Original" src={originalImage.dataUrl} />
                  ) : isLoading ? (
                    <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
                        <Loader />
                    </div>
                  ) : (
                    <ImageUploader onImageUpload={handleImageUpload} />
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

              <div>
                <label htmlFor="clothing-prompt" className="block text-sm font-medium text-gray-300 mb-2">Describe Clothing & Style (Optional)</label>
                <textarea
                    id="clothing-prompt"
                    value={clothingPrompt}
                    onChange={(e) => setClothingPrompt(e.target.value)}
                    placeholder="e.g., a formal black suit, a red summer dress"
                    className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-none h-24"
                    rows={3}
                    disabled={!originalImage}
                    aria-label="Describe Clothing & Style (Optional)"
                />
              </div>

              <div>
                <label htmlFor="background-prompt" className="block text-sm font-medium text-gray-300 mb-2">Describe New Background (Optional)</label>
                <textarea
                    id="background-prompt"
                    value={backgroundPrompt}
                    onChange={(e) => setBackgroundPrompt(e.target.value)}
                    placeholder="e.g., a futuristic city, a sunny beach"
                    className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-none h-24"
                    rows={3}
                    disabled={!originalImage}
                    aria-label="Describe New Background (Optional)"
                />
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