import { AppDescriptionForm } from "./AppDescriptionForm";
import { Dropzone } from "./Dropzone";
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

export const Step1 = ({ appName, setAppName, appDescription, setAppDescription, files, setFiles, language, setLanguage, device, setDevice, onNext }: Step1Props) => {
  return (
    <div className="max-w-6xl mx-auto grid gap-8 p-4 md:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create Your App Store Presence</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Provide your app's details and screenshots, and our AI will generate compelling marketing copy and visuals for you.
        </p>
      </div>

      <div className="grid gap-8 max-w-3xl mx-auto">
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
            <div className="grid md:grid-cols-2 gap-4">
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
                <p className="text-sm text-muted-foreground mt-2">
                  Choose the language for the generated marketing content.
                </p>
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
                <p className="text-sm text-muted-foreground mt-2">
                  Choose the device for which you want to generate screenshots.
                </p>
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
            <Dropzone onFilesChange={setFiles} initialFiles={files} device={device} />
            <Alert className="mt-4">
              <InformationCircleIcon className="h-4 w-4" />
              <AlertTitle>Pro Tip!</AlertTitle>
              <AlertDescription>
                {device === 'iPad' 
                  ? 'For best results, use high-resolution iPad screenshots (e.g., 2048 x 2732 pixels for iPad Pro 12.9").'
                  : 'For best results, use high-resolution iPhone screenshots (e.g., 1242 x 2688 pixels for iPhone 11 Pro Max).'
                }
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onNext} disabled={!appName || !appDescription || files.length === 0} size="lg">
          Next: Describe Your Images
        </Button>
      </div>
    </div>
  );
};
