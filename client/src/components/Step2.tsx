import { useState } from "react";
import type { TemplateSummary } from "@/types/project";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";
import { Textarea } from "./ui/textarea";
import { GeneratingContent } from "./GeneratingContent";

interface Step2Props {
  files: File[];
  imageDescriptions: string[];
  setImageDescriptions: (descriptions: string[]) => void;
  onGenerate: () => void;
  onBack: () => void;
  isLoading: boolean;
  templates: TemplateSummary[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string | null) => void;
  isLoadingTemplates: boolean;
}

export const Step2 = ({
  files,
  imageDescriptions,
  setImageDescriptions,
  onGenerate,
  onBack,
  isLoading,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  isLoadingTemplates,
}: Step2Props) => {
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

  const selectedTemplate = selectedTemplateId
    ? templates.find((template) => template.id === selectedTemplateId)
    : null;

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Describe Your Screenshots</CardTitle>
          <CardDescription>
            Provide a brief description for each screenshot. This helps the AI understand the context and generate more accurate and compelling headings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-4">
            <div className="flex flex-col gap-2">
              <div>
                <h3 className="text-lg font-semibold">Choose a template</h3>
                <p className="text-sm text-muted-foreground">
                  Select a layout for your generated marketing images. You can fine-tune the design after generation.
                </p>
              </div>
              {selectedTemplate ? (
                <Badge variant="secondary" className="w-fit">
                  Selected: {selectedTemplate.name}
                </Badge>
              ) : null}
            </div>

            {isLoadingTemplates ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 w-full" />
                ))}
              </div>
            ) : templates.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => {
                  const isSelected = template.id === selectedTemplateId;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => onSelectTemplate(template.id)}
                      className={cn(
                        "flex h-full flex-col gap-3 rounded-lg border border-border bg-background p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        "hover:border-primary/60 hover:shadow-sm",
                        isSelected && "border-primary ring-2 ring-primary"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold leading-tight">{template.name}</h4>
                        {template.isDefault ? <Badge variant="outline">Default</Badge> : null}
                      </div>
                      {template.description ? (
                        <p className="text-sm text-muted-foreground line-clamp-3">{template.description}</p>
                      ) : null}
                      {template.tags && template.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No templates are available yet. Please contact an administrator to add templates.
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Describe each screenshot</h3>
              <p className="text-sm text-muted-foreground">
                These descriptions help the AI craft compelling headings and subheadings for every image.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {files.map((file, index) => (
                <div key={index} className="flex flex-col gap-4 rounded-lg border p-4">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Screenshot ${index + 1}`}
                    className="h-auto w-full max-h-64 rounded-md object-contain"
                    onLoad={(event) => URL.revokeObjectURL(event.currentTarget.src)}
                  />
                  <div className="space-y-2">
                    <Label htmlFor={`description-${index}`} className="font-medium">
                      What can you see in the screenshot?
                    </Label>
                    <Textarea
                      id={`description-${index}`}
                      value={imageDescriptions[index] || ""}
                      onChange={(event) => handleDescriptionChange(index, event.target.value)}
                      placeholder="E.g., A user creating a new project."
                      className="mt-1"
                    />
                    <Button
                      onClick={() => handleGenerateDescription(index, file)}
                      disabled={isGeneratingDescription === index}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {isGeneratingDescription === index ? "Generating..." : "✨ Generate with AI"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button onClick={onBack} variant="outline" className="sm:w-auto">
              Back
            </Button>
            <Button
              onClick={onGenerate}
              disabled={isLoading || isLoadingTemplates || templates.length === 0}
              className="sm:w-auto"
            >
              {isLoading ? "Generating..." : "Generate Content"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
