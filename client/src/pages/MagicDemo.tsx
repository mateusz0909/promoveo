import { useState, useCallback } from 'react';
import { ArrowUpTrayIcon, PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface DemoImage {
  url: string;
  layout: string;
  theme: string;
  style: number;
}

interface DemoResult {
  images: DemoImage[];
}

export function MagicDemo() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [results, setResults] = useState<DemoResult | null>(null);
  const [imageStates, setImageStates] = useState<Record<number, { loaded: boolean; error: boolean }>>({});

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (!imageFile) {
      toast.error('Please drop an image file (PNG or JPG)');
      return;
    }

    await processImage(imageFile);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (PNG or JPG)');
      return;
    }

    await processImage(file);
  }, []);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProcessingStage(0);

    try {
      // Stage 1: Analyzing screenshot
      setProcessingStage(1);
      await new Promise(resolve => setTimeout(resolve, 800));

      const formData = new FormData();
      formData.append('image', file);

      // Stage 2: Generating concepts
      setProcessingStage(2);
      
      const response = await fetch('/api/magic-demo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      // Stage 3: Finalizing
      setProcessingStage(3);
      
      const data = await response.json();
      const responseUrl = new URL(response.url);
      const origin = `${responseUrl.protocol}//${responseUrl.host}`;
      const resolvedImages: DemoImage[] = Array.isArray(data.images)
        ? data.images.map((image: DemoImage) => {
            if (!image || !image.url) return image;
            return {
              ...image,
              url: image.url.startsWith('http') ? image.url : `${origin}${image.url}`
            };
          })
        : [];

      await new Promise(resolve => setTimeout(resolve, 400));

      setResults({ images: resolvedImages });
      setIsProcessing(false);
      setProcessingStage(0);
      setImageStates({});
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Something went wrong while processing the image');
      setIsProcessing(false);
      setProcessingStage(0);
    }
  };

  const handleReset = () => {
    setResults(null);
    setIsProcessing(false);
    setProcessingStage(0);
    setImageStates({});
  };

  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-6xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Here’s how your app could look.
            </h2>
            <p className="text-lg text-muted-foreground">
              Explore three polished versions of your screenshot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {results.images.map((image, index) => {
              const state = imageStates[index] ?? { loaded: false, error: false };

              return (
                <div
                  key={index}
                  onContextMenu={event => event.preventDefault()}
                  className="relative group overflow-hidden rounded-xl border bg-card shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02] select-none"
                >
                  <div className="aspect-[9/19.5] relative">
                    {!state.error && (
                      <img
                        src={image.url}
                        alt={`Concept ${index + 1}`}
                        draggable={false}
                        loading="lazy"
                        onLoad={() =>
                          setImageStates(prev => ({
                            ...prev,
                            [index]: { ...(prev[index] ?? { error: false }), loaded: true },
                          }))
                        }
                        onError={() =>
                          setImageStates(prev => ({
                            ...prev,
                            [index]: { loaded: false, error: true },
                          }))
                        }
                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                          state.loaded ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    )}
                    {(!state.loaded || state.error) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground animate-pulse">
                        <div className="rounded-full bg-muted-foreground/20 p-4">
                          <PhotoIcon className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium tracking-wide text-center">
                          {state.error ? 'Preview unavailable' : 'Generating preview…'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-semibold text-sm">
                        Concept {index + 1}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-4 pt-8">
            <button
              onClick={() => window.location.href = '/signup'}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
            >
              <SparklesIcon className="h-6 w-6" />
              Get your full-resolution images
            </button>
            <button
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Try another screenshot
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    const stages = [
      { id: 1, label: 'Analyzing screenshot', description: 'Extracting colors and content' },
      { id: 2, label: 'Generating concepts', description: 'Creating 3 unique designs' },
      { id: 3, label: 'Finalizing', description: 'Applying finishing touches' },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Icon and Title */}
          <div className="text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <SparklesIcon className="w-20 h-20 text-primary animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold">Creating your designs</h2>
          </div>

          {/* Progress Stages */}
          <div className="space-y-4">
            {stages.map((stage) => {
              const isActive = stage.id === processingStage;
              const isComplete = stage.id < processingStage;

              return (
                <div
                  key={stage.id}
                  className={`
                    flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-300
                    ${isActive ? 'border-primary bg-primary/5 scale-105' : ''}
                    ${isComplete ? 'border-green-500/30 bg-green-500/5' : ''}
                    ${!isActive && !isComplete ? 'border-border opacity-40' : ''}
                  `}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isComplete ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isActive ? 'text-primary' : isComplete ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {stage.label}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(processingStage / 3) * 100}%` }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              This usually takes 3-5 seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Your App Store screenshots, leveled up in 10 seconds.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Drop one screenshot and our AI will show you three professional concepts—no signup required.
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 transition-all
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/50'
            }
          `}
        >
          <input
            type="file"
            id="file-input"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-6 pointer-events-none">
            <div className={`
              p-6 rounded-full transition-all
              ${isDragging ? 'bg-primary/10 scale-110' : 'bg-muted'}
            `}>
              <ArrowUpTrayIcon className={`
                h-16 w-16 transition-colors
                ${isDragging ? 'text-primary' : 'text-muted-foreground'}
              `} />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold">
                {isDragging ? 'Drop your image here' : 'Drag & drop your screenshot'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PNG or JPG, up to 10 MB
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4" />
            <span>AI-powered</span>
          </div>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure & private</span>
          </div>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Results in seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
