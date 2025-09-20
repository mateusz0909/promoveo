import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { GeneratingContent } from "./GeneratingContent";

interface Step2Props {
  files: File[];
  imageDescriptions: string[];
  setImageDescriptions: (descriptions: string[]) => void;
  onGenerate: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export const Step2 = ({ files, imageDescriptions, setImageDescriptions, onGenerate, onBack, isLoading }: Step2Props) => {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<number | null>(null);

  const handleDescriptionChange = (index: number, value: string) => {
    const newDescriptions = [...imageDescriptions];
    newDescriptions[index] = value;
    setImageDescriptions(newDescriptions);
  };

  const handleGenerateDescription = async (index: number, file: File) => {
    setIsGeneratingDescription(index);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/images/generate-description", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.description) {
        handleDescriptionChange(index, data.description);
      }
    } catch (error) {
      console.error("Error generating image description:", error);
      alert("Error generating image description. Please check the console for details.");
    } finally {
      setIsGeneratingDescription(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generating Your Masterpiece</CardTitle>
        </CardHeader>
        <CardContent>
          <GeneratingContent />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Describe Your Screenshots</CardTitle>
        <CardDescription>
          Provide a brief description for each screenshot. This helps the AI understand the context and generate more accurate and compelling headings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {files.map((file, index) => (
            <div key={index} className="flex flex-col gap-4 p-4 border rounded-sm">
              <img
              src={URL.createObjectURL(file)}
              alt={`Screenshot ${index + 1}`}
              className="rounded-md w-full h-100 flex-shrink-0 object-contain"
              onLoad={e => URL.revokeObjectURL(e.currentTarget.src)}
              />
              <div>
              <Label htmlFor={`description-${index}`} className="font-medium">What can you see in the screenshot?</Label>
              <Textarea
                id={`description-${index}`}
                value={imageDescriptions[index] || ""}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder={`E.g., A user creating a new project.`}
                className="mt-2"
              />
              <Button
                onClick={() => handleGenerateDescription(index, file)}
                disabled={isGeneratingDescription === index}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                {isGeneratingDescription === index ? "Generating..." : "✨ Generate with AI"}
              </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <Button onClick={onBack} variant="outline">Back</Button>
          <Button onClick={onGenerate} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Content"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
