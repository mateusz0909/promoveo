import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/shadcn-io/spinner';

const messages = [
  'Brewing up some creative ideas...',
  'Analyzing your app details...',
  'Generating stunning visuals...',
  'Crafting compelling marketing copy...',
  'Almost there, just adding the finishing touches...',
];

export const GeneratingContent = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-96 gap-6">
      <Spinner variant="bars" />
      <p className="text-lg text-muted-foreground animate-pulse">
        {messages[messageIndex]}
      </p>
    </div>
  );
};
