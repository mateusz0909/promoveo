import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import {
  ArrowPathIcon,
  ClipboardDocumentIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface GeneratedText {
  title: string;
  subtitle: string;
  promotionalText: string;
  description: string;
  keywords: string;
  headings: {
    heading: string;
    subheading: string;
  }[];
}

interface AppStoreContentTabProps {
  generatedText: GeneratedText | null;
  onCopy: (text: string) => void | Promise<void>;
  appName: string;
  appDescription: string;
  imageDescriptions?: string[];
  onContentUpdate: (contentType: string, newContent: string) => void | Promise<void>;
  language?: string;
}

type ContentKey = "title" | "subtitle" | "promotionalText" | "description" | "keywords";

type ContentBlueprint = {
  section: string;
  description: string;
  items: Array<{
    key: ContentKey;
    title: string;
    helper: string;
    multiline?: boolean;
    span?: "full" | "half";
  }>;
};

const CHARACTER_LIMITS: Record<ContentKey, number | null> = {
  title: 30,
  subtitle: 30,
  promotionalText: 170,
  description: 4000,
  keywords: 100,
};

const blueprints: ContentBlueprint[] = [
  {
    section: "Localizable information",
    description: "The essentials users see first in the App Store.",
    items: [
      {
        key: "title",
        title: "Name",
        helper: "Main title that appears on your listing.",
        span: "half",
      },
      {
        key: "subtitle",
        title: "Subtitle",
        helper: "Supports your title with an extra benefit-driven phrase.",
        span: "half",
      },
    ],
  },
  {
    section: "Marketing content",
    description: "Story-driven copy that highlights value and improves conversion.",
    items: [
      {
        key: "promotionalText",
        title: "Promotional text",
        helper: "Short hook used across campaigns and feature banners.",
        span: "half",
      },
      {
        key: "description",
        title: "Description",
        helper: "Long-form narrative that explains your product benefits.",
        multiline: true,
        span: "full",
      },
    ],
  },
  {
    section: "SEO & discovery",
    description: "Keywords that improve App Store search visibility.",
    items: [
      {
        key: "keywords",
        title: "Keywords",
        helper: "Comma-separated list of unique keywords.",
        span: "full",
      },
    ],
  },
];

export function AppStoreContentTab({
  generatedText,
  onCopy,
  appName,
  appDescription,
  imageDescriptions,
  onContentUpdate,
  language = "English",
}: AppStoreContentTabProps) {
  const { session } = useAuth();
  const [editingState, setEditingState] = useState<Record<ContentKey, boolean>>({
    title: false,
    subtitle: false,
    promotionalText: false,
    description: false,
    keywords: false,
  });
  const [draftValues, setDraftValues] = useState<Record<ContentKey, string>>({
    title: "",
    subtitle: "",
    promotionalText: "",
    description: "",
    keywords: "",
  });
  const [loadingActions, setLoadingActions] = useState<Record<ContentKey, boolean>>({
    title: false,
    subtitle: false,
    promotionalText: false,
    description: false,
    keywords: false,
  });
  const [copiedState, setCopiedState] = useState<Record<ContentKey, boolean>>({
    title: false,
    subtitle: false,
    promotionalText: false,
    description: false,
    keywords: false,
  });

  const values = useMemo(() => {
    if (!generatedText) {
      return {
        title: "",
        subtitle: "",
        promotionalText: "",
        description: "",
        keywords: "",
      };
    }

    return {
      title: generatedText.title || "",
      subtitle: generatedText.subtitle || "",
      promotionalText: generatedText.promotionalText || "",
      description: generatedText.description || "",
      keywords: generatedText.keywords || "",
    };
  }, [generatedText]);

  const getCurrentValue = (key: ContentKey) =>
    editingState[key] ? draftValues[key] : values[key];

  const getLength = (key: ContentKey) => getCurrentValue(key)?.length || 0;

  const isOverLimit = (key: ContentKey) => {
    const limit = CHARACTER_LIMITS[key];
    if (!limit) return false;
    return getLength(key) > limit;
  };

  const handleCopy = async (key: ContentKey) => {
    const text = values[key];
    if (!text) {
      toast.info("Nothing to copy yet");
      return;
    }

    await onCopy(text);
    setCopiedState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedState((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleEdit = (key: ContentKey) => {
    setDraftValues((prev) => ({ ...prev, [key]: values[key] }));
    setEditingState((prev) => ({ ...prev, [key]: true }));
  };

  const handleCancelEdit = (key: ContentKey) => {
    setEditingState((prev) => ({ ...prev, [key]: false }));
    setDraftValues((prev) => ({ ...prev, [key]: values[key] }));
  };

  const handleSave = async (key: ContentKey) => {
    const newValue = draftValues[key] ?? "";
    await onContentUpdate(key, newValue);
    setEditingState((prev) => ({ ...prev, [key]: false }));
    toast.success("Content updated");
  };

  const handleRegenerate = async (key: ContentKey) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to regenerate content");
      return;
    }

    setLoadingActions((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch("/api/regenerate-content-part", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          appName,
          appDescription,
          imageDescriptions,
          contentType: key,
          currentContent: values[key],
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const freshValue = data[key];

      if (!freshValue) {
        throw new Error("No content received from API");
      }

      await onContentUpdate(key, freshValue);
      toast.success("Content regenerated");
    } catch (error) {
      console.error("Error regenerating content", error);
      toast.error("Failed to regenerate. Please try again.");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (!generatedText) {
    return (
      <Card className="bg-card/60 border border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GlobeAltIcon className="h-5 w-5 text-primary" />
            App Store Content
          </CardTitle>
          <CardDescription>
            Generate App Store copy to unlock editing tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-8 text-center text-muted-foreground">
            No content yet. Complete the previous step to generate your first draft.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="bg-card/60 border border-border/50 shadow-sm">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground uppercase text-xs tracking-widest">
                <GlobeAltIcon className="h-4 w-4 text-primary" />
                App Store content suite
              </div>
              <CardTitle className="mt-1 text-2xl">Polished copy for your listing</CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Review, refine, and publish AI-assisted copy. Hover any action for guidance, track App Store character limits at a glance, and keep everything organized in one workspace.
              </CardDescription>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wide">
                Language: {language}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-wide">
                {generatedText.headings?.length ?? 0} supporting headlines
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-10">
            {blueprints.map((section) => {
              const visibleItems = section.items.filter((item) => values[item.key]);
              if (visibleItems.length === 0) {
                return null;
              }

              return (
                <div key={section.section} className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {section.section}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground/80">
                      {section.description}
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {visibleItems.map((item) => {
                      const current = getCurrentValue(item.key);
                      const length = getLength(item.key);
                      const limit = CHARACTER_LIMITS[item.key];
                      const overLimit = isOverLimit(item.key);
                      const percentage = limit ? Math.min(100, Math.round((length / limit) * 100)) : null;
                      const isEditing = editingState[item.key];
                      const isLoading = loadingActions[item.key];
                      const isCopied = copiedState[item.key];

                      const inputProps = {
                        value: draftValues[item.key],
                        onChange: (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
                          const value = event.target.value;
                          setDraftValues((prev) => ({ ...prev, [item.key]: value }));
                        },
                        className:
                          "mt-3 w-full rounded-lg border border-border/60 bg-background text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-primary/30",
                      };

                      return (
                        <Card
                          key={item.key}
                          className={`border border-border/50 bg-background/60 shadow-sm transition-all ${
                            item.span === "full" ? "md:col-span-2" : ""
                          }`}
                        >
                          <CardHeader className="gap-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <CardTitle className="text-base font-semibold">
                                  {item.title}
                                </CardTitle>
                                <CardDescription className="mt-1 text-xs text-muted-foreground">
                                  {item.helper}
                                </CardDescription>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {limit ? (
                                  <Badge
                                    variant={overLimit ? "destructive" : "secondary"}
                                    className="px-2 py-0.5 text-xs font-mono"
                                  >
                                    {length} / {limit}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="px-2 py-0.5 text-xs font-mono">
                                    {length} chars
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-sm leading-relaxed text-foreground">
                              {isEditing ? (
                                item.multiline ? (
                                  <Textarea {...inputProps} rows={6} />
                                ) : (
                                  <Input {...inputProps} />
                                )
                              ) : (
                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                  {current || <span className="italic text-muted-foreground">Empty</span>}
                                </div>
                              )}
                            </div>

                            {limit && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                                  <span>{percentage}% of limit</span>
                                  <span className={overLimit ? "text-destructive" : "text-muted-foreground"}>
                                    {overLimit ? "Over limit" : "Within limit"}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted">
                                  <div
                                    className={`h-full rounded-full ${overLimit ? "bg-destructive" : "bg-primary"}`}
                                    style={{ width: `${percentage ?? 0}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <Separator className="my-2" />

                            <div className="flex flex-wrap gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleSave(item.key)}
                                    disabled={overLimit}
                                    className="gap-2"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCancelEdit(item.key)}
                                    className="gap-2"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleEdit(item.key)}
                                        className="gap-2"
                                      >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Edit
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit content inline</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRegenerate(item.key)}
                                        disabled={isLoading}
                                        className="gap-2"
                                      >
                                        <ArrowPathIcon
                                          className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : ""}`}
                                        />
                                        Regenerate
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Ask the AI to refresh this single field
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCopy(item.key)}
                                        className="gap-2"
                                      >
                                        <ClipboardDocumentIcon
                                          className={`h-4 w-4 ${isCopied ? "text-green-500" : ""}`}
                                        />
                                        {isCopied ? "Copied" : "Copy"}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copy to clipboard</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}