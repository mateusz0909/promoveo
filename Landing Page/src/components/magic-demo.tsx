"use client";

import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Lock, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { BorderBeam } from '@/components/ui/border-beam';
import { Meteors } from '@/components/ui/meteors';
import { BlurFade } from '@/components/ui/blur-fade';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import AnimatedShinyText from '@/components/ui/animated-shiny-text';

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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/magic-demo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      // Stage 3: Finalizing
      setProcessingStage(3);
      
      const data = await response.json();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const resolvedImages: DemoImage[] = Array.isArray(data.images)
        ? data.images.map((image: DemoImage) => {
            if (!image || !image.url) return image;
            return {
              ...image,
              url: image.url.startsWith('http') ? image.url : `${apiUrl}${image.url}`
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
      <div className="w-full space-y-8 py-8">
        <BlurFade delay={0.1}>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">Your concepts are ready!</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Here's how your app could look.
            </h3>
            <p className="text-lg text-foreground/70">
              Explore three polished versions of your screenshot.
            </p>
          </div>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {results.images.map((image, index) => {
            const state = imageStates[index] ?? { loaded: false, error: false };

            return (
              <BlurFade key={index} delay={0.2 + index * 0.1}>
                <MagicCard
                  className="cursor-pointer overflow-hidden shadow-2xl"
                  gradientColor="rgba(var(--primary-rgb, 99, 102, 241), 0.15)"
                >
                  <div
                    onContextMenu={event => event.preventDefault()}
                    className="relative group select-none"
                  >
                    <div className="aspect-[9/19.5] relative bg-gradient-to-br from-background/50 to-muted/50">
                      {!state.error && (
                        <Image
                          src={image.url}
                          alt={`Concept ${index + 1}`}
                          fill
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
                          className={cn(
                            "object-contain transition-all duration-700",
                            state.loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                          )}
                        />
                      )}
                      {(!state.loaded || state.error) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted/60 to-muted/40 backdrop-blur-sm">
                          <div className="rounded-full bg-primary/10 p-4 animate-pulse">
                            <ImageIcon className="h-8 w-8 text-primary" />
                          </div>
                          <p className="text-sm font-medium tracking-wide text-center text-foreground/70">
                            {state.error ? 'Preview unavailable' : 'Loading preview…'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                        <p className="text-white font-bold text-lg">
                          Concept {index + 1}
                        </p>
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <Sparkles className="h-4 w-4" />
                          <span>AI-Generated Design</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </MagicCard>
              </BlurFade>
            );
          })}
        </div>

        <BlurFade delay={0.5}>
          <div className="flex flex-col items-center gap-4 pt-4">
            <button
              onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/signup`}
              className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-semibold text-lg shadow-2xl shadow-primary/50 hover:shadow-primary/70 hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Sparkles className="h-5 w-5 relative z-10" />
              <span className="relative z-10">Get your full-resolution images</span>
              <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleReset}
              className="text-sm text-foreground/60 hover:text-foreground transition-colors underline underline-offset-4"
            >
              Try another screenshot
            </button>
          </div>
        </BlurFade>
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
      <div className="w-full py-8">
        <div className="w-full max-w-2xl mx-auto space-y-10">
          <BlurFade delay={0.1}>
            <div className="text-center space-y-6">
              {/* Animated icon */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-2xl shadow-primary/50">
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-foreground">Creating your designs</h3>
                <p className="text-foreground/60">AI magic in progress...</p>
              </div>
            </div>
          </BlurFade>

          {/* Progress Stages */}
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const isActive = stage.id === processingStage;
              const isComplete = stage.id < processingStage;

              return (
                <BlurFade key={stage.id} delay={0.2 + index * 0.1}>
                  <div
                    className={cn(
                      "relative overflow-hidden flex items-start gap-4 p-5 rounded-xl transition-all duration-500",
                      "backdrop-blur-sm border",
                      isActive && "bg-primary/5 border-primary/30 scale-[1.02] shadow-lg shadow-primary/10",
                      isComplete && "bg-green-500/5 border-green-500/30",
                      !isActive && !isComplete && "bg-white/5 border-white/10 opacity-40"
                    )}
                  >
                    {isActive && <BorderBeam size={150} duration={2} />}
                    
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isComplete ? (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      ) : isActive ? (
                        <div className="relative w-7 h-7">
                          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-white/20" />
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-semibold text-base",
                        isActive && "text-primary",
                        isComplete && "text-green-400",
                        !isActive && !isComplete && "text-foreground/40"
                      )}>
                        {stage.label}
                      </p>
                      <p className="text-sm text-foreground/60 mt-0.5">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </BlurFade>
              );
            })}
          </div>

          {/* Progress Bar */}
          <BlurFade delay={0.5}>
            <div className="space-y-3">
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(processingStage / 3) * 100}%` }}
                />
              </div>
              <p className="text-center text-sm text-foreground/50">
                This usually takes 3-5 seconds
              </p>
            </div>
          </BlurFade>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <BlurFade delay={0.1}>
        <div className="relative max-w-5xl mx-auto">
          {/* Animated background glow */}
          <div className={cn(
            "absolute inset-0 rounded-3xl transition-all duration-500 blur-3xl",
            isDragging 
              ? "bg-gradient-to-r from-primary/30 via-purple-500/30 to-pink-500/30 scale-105" 
              : "bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10"
          )} />
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative backdrop-blur-sm rounded-3xl transition-all duration-300 cursor-pointer group",
              "border-2 border-dashed",
              isDragging 
                ? "border-primary bg-primary/5 scale-[1.01] shadow-2xl shadow-primary/25" 
                : "border-white/10 bg-white/5 hover:border-primary/50 hover:bg-white/10 hover:shadow-xl"
            )}
          >
            {isDragging && <BorderBeam size={250} duration={8} delay={0} />}
            
            <input
              type="file"
              id="file-input"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className="flex flex-col items-center gap-8 p-16 md:p-20 pointer-events-none">
              {/* Upload icon with glow effect */}
              <div className="relative">
                <div className={cn(
                  "absolute inset-0 rounded-full transition-all duration-500",
                  isDragging 
                    ? "bg-primary/40 blur-2xl scale-150 animate-pulse" 
                    : "bg-primary/20 blur-xl group-hover:bg-primary/30 group-hover:scale-110"
                )} />
                <div className={cn(
                  "relative p-6 rounded-2xl transition-all duration-300",
                  "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm",
                  "border border-white/10",
                  isDragging && "scale-110 rotate-12"
                )}>
                  <Upload className={cn(
                    "h-16 w-16 transition-all duration-300",
                    isDragging ? "text-primary" : "text-foreground/60 group-hover:text-primary/80"
                  )} />
                </div>
              </div>
              
              <div className="text-center space-y-3">
                {isDragging ? (
                  <div className="space-y-2">
                    <h3 className="text-2xl md:text-3xl font-bold text-primary flex items-center justify-center gap-2">
                      <Sparkles className="h-6 w-6 animate-spin" />
                      Drop your image here
                    </h3>
                    <p className="text-foreground/70">Release to start generating</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                      Drag & drop your screenshot
                    </h3>
                    <p className="text-base text-foreground/60">
                      or click to browse
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-foreground/40 pt-1">
                      <span>PNG or JPG</span>
                      <span>•</span>
                      <span>Max 10 MB</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </BlurFade>

      <BlurFade delay={0.2}>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm mt-10 px-4">
          <div className="flex items-center gap-2.5 text-foreground/70 hover:text-foreground transition-colors">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">AI-powered</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-2.5 text-foreground/70 hover:text-foreground transition-colors">
            <Lock className="h-4 w-4 text-green-400" />
            <span className="font-medium">Secure & private</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-2.5 text-foreground/70 hover:text-foreground transition-colors">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="font-medium">Results in seconds</span>
          </div>
        </div>
      </BlurFade>
    </div>
  );
}
