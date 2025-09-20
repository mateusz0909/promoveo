import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AppDescriptionFormProps {
  appName: string;
  setAppName: (name: string) => void;
  appDescription: string;
  setAppDescription: (description: string) => void;
}

export function AppDescriptionForm({
  appName,
  setAppName,
  appDescription,
  setAppDescription,
}: AppDescriptionFormProps) {
  return (
    <div className="grid w-full gap-6">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="appName">App Name</Label>
        <p className="text-sm text-muted-foreground">
          What is the name of your app? This will be used as the main title.
        </p>
        <Input
          id="appName"
          type="text"
          placeholder="e.g., My Awesome App"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="appDescription">App Description & Goal</Label>
        <p className="text-sm text-muted-foreground">
          Describe your app and its main goal. What problem does it solve? Who is it for?
        </p>
        <Textarea
          id="appDescription"
          placeholder="e.g., A social media app for cat lovers to share pictures of their furry friends."
          value={appDescription}
          onChange={(e) => setAppDescription(e.target.value)}
          maxLength={500}
        />
        <p className="text-sm text-muted-foreground text-right">
          {appDescription.length} / 500
        </p>
      </div>
    </div>
  );
}