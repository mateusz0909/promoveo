import { useCallback } from "react";
import imageCompression from "browser-image-compression";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import GalleryUpload from "./file-upload/gallery-upload";
import { AppDescriptionForm } from "./AppDescriptionForm";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface Step1Props {
  appName: string;
  setAppName: (name: string) => void;
  appDescription: string;
  setAppDescription: (description: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  language: string;
  setLanguage: (language: string) => void;
  device: string;
  setDevice: (device: string) => void;
  onNext: () => void;
}

export const Step1 = ({
  appName,
  setAppName,
  appDescription,
  setAppDescription,
  files,
  setFiles,
  language,
  setLanguage,
  device,
  setDevice,
  onNext,
}: Step1Props) => {
  const handleFilesChange = useCallback(
    (fileItems: FileWithPreview[]) => {
      const actualFiles = fileItems
        .map((fileItem) => (fileItem.file instanceof File ? fileItem.file : null))
        .filter((file): file is File => file !== null);

      setFiles(actualFiles);
    },
    [setFiles],
  );

  const validateFile = useCallback(
    (file: File): Promise<string | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          try {
            const aspectRatio = img.width / img.height;
            const targetAspectRatio = device === "iPad" ? 2048 / 2732 : 9 / 19.5;
            const tolerance = 0.15;

            if (Math.abs(aspectRatio - targetAspectRatio) > tolerance) {
              resolve(
                `Invalid aspect ratio for ${file.name}. Expected ${device} portrait (${targetAspectRatio.toFixed(3)}), got ${aspectRatio.toFixed(3)}. Please use portrait screenshots for the selected device.`,
              );
            } else {
              resolve(null);
            }
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(`Error reading file ${file.name}`);
        };

        img.src = objectUrl;
      });
    },
    [device],
  );

  const processFile = useCallback(async (file: File): Promise<File> => {
    const compressionOptions = {
      initialQuality: 0.6,
      maxWidthOrHeight: 1290,
      useWebWorker: true,
      fileType: "image/jpeg",
    } as const;

    const compressedFile = await imageCompression(file, compressionOptions);
    const originalNameWithoutExt = file.name.split(".").slice(0, -1).join(".") || file.name;
    const newName = `${originalNameWithoutExt}.jpg`;

    return new File([compressedFile], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">

        <div className="order-2 grid gap-8 lg:order-1">
          <section className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              Launch faster with AI-crafted assets
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Create Your App Store Presence</h1>
              <p className="max-w-2xl text-muted-foreground">
                Provide your app's details and screenshots, and our AI will generate compelling marketing copy and visuals for you.
              </p>
            </div>
          </section>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>1. App Details</CardTitle>
              <CardDescription>
                This information will be used to generate your app's title, subtitle, and description.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <AppDescriptionForm
                appName={appName}
                setAppName={setAppName}
                appDescription={appDescription}
                setAppDescription={setAppDescription}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="language">Content Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="Polish">Polish</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-sm text-muted-foreground">Choose the language for the generated marketing content.</p>
                </div>
                <div>
                  <Label htmlFor="device">Device</Label>
                  <Select value={device} onValueChange={setDevice}>
                    <SelectTrigger id="device" className="w-full">
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iPhone">iPhone</SelectItem>
                      <SelectItem value="iPad">iPad</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-sm text-muted-foreground">Choose the device for which you want to generate screenshots.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>2. Upload Screenshots</CardTitle>
              <CardDescription>
                Upload up to 10 portrait screenshots of your app. These will be used to create your App Store images.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GalleryUpload
                maxFiles={10}
                accept="image/png,image/jpeg"
                onFilesChange={handleFilesChange}
                initialFiles={files}
                validateFile={validateFile}
                processFile={processFile}
                className="w-full"
              />
              <Alert className="mt-4">
                <InformationCircleIcon className="h-6 w-6" />
                {/* <AlertTitle>Pro Tip!</AlertTitle> */}
                <AlertDescription>
                  {device === "iPad"
                    ? "For best results, use high-resolution iPad screenshots (e.g., 2048 x 2732 pixels for the 12.9-inch iPad Pro)."
                    : "For best results, use high-resolution iPhone screenshots (e.g., 1242 x 2688 pixels for the iPhone 11 Pro Max)."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onNext} disabled={!appName || !appDescription || files.length === 0} size="lg">
              Next: Describe Your Images
            </Button>
          </div>
        </div>
{/* 
        <aside className="order-1 rounded-3xl  p-8  lg:order-2  lg:top-24">
          <div className="flex flex-col items-center text-center">
            <img
              src="/upload-animate.svg"
              alt="Illustration of a person uploading files"
              className="max-h-[360px] w-full object-contain"
            />
            <div className="mt-6 space-y-3">
              <h2 className="text-xl font-semibold">Upload with confidence</h2>
              <p className="text-sm text-muted-foreground">
                Your screenshots are validated for the selected device and optimized automatically, so you can stay focused on crafting the perfect launch story.
              </p>
            </div>
          </div>
        </aside> */}
      </div>
    
  );
};
