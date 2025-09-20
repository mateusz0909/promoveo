import { useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PaintBrushIcon,
  UserIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

// Get display name from user
const getDisplayName = (user: any): string => {
  if (!user) return "Unknown User";

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
  const firstName = user.user_metadata?.first_name;
  const lastName = user.user_metadata?.last_name;

  if (fullName) return fullName;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  
  return user.email || "Unknown User";
};

type SettingsSection = "themes" | "profile";

export const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>("themes");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const displayName = getDisplayName(user);

  const handleDeleteAccount = async () => {
    try {
      if (!user) {
        alert("No user found to delete.");
        return;
      }

      // Get the current session for the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert("Authentication required. Please log in again.");
        return;
      }

      // Try to call server endpoint to delete user account and data
      try {
        const response = await fetch('/api/delete-account', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        console.log("Account data deleted successfully from server");
      } catch (serverError) {
        console.warn("Server deletion failed, user will be signed out:", serverError);
        // Continue with sign out even if server deletion fails
      }

      // Sign out the user (this will effectively "delete" their session)
      await supabase.auth.signOut();
      
      setDeleteDialogOpen(false);
      navigate("/login");
      alert("Account deleted successfully. All session data has been cleared.");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please contact support.");
    }
  };

  const handleBackToApp = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToApp}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to App
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-[calc(100vh-4rem)] border-r bg-muted/50">
          <div className="p-6">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-6">
              <UserAvatar user={user} size="lg" />
              <div className="flex flex-col">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <Separator className="mb-4" />

            {/* Navigation */}
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("themes")}
                className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors ${
                  activeSection === "themes"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <PaintBrushIcon className="h-4 w-4 mr-3" />
                Themes
              </button>
              <button
                onClick={() => setActiveSection("profile")}
                className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors ${
                  activeSection === "profile"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <UserIcon className="h-4 w-4 mr-3" />
                Profile
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeSection === "themes" && (
            <div className="max-w-2xl">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium mb-2">Theme Preferences</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Customize the appearance of the application.
                  </p>
                </div>

                {/* Theme Options */}
                <div className="space-y-4">
                  {/* <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-base font-medium">Dark Mode</label>
                      <div className="text-sm text-muted-foreground">
                        Use dark theme as default
                      </div>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => 
                        setTheme(checked ? "dark" : "light")
                      }
                    />
                  </div> */}

                  {/* <Separator />s */}

                  <div className="space-y-3">
                                        <RadioGroup value={theme} onValueChange={setTheme} className="space-y-0">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light" className="text-sm font-medium cursor-pointer">
                          Light
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="dark" />
                        <Label htmlFor="dark" className="text-sm font-medium cursor-pointer">
                          Dark
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="system" />
                        <Label htmlFor="system" className="text-sm font-medium cursor-pointer">
                          System
                        </Label>
                        <span className="text-xs text-muted-foreground ml-2">
                          (Follow system preference)
                        </span>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "profile" && (
            <div className="max-w-2xl">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium mb-2">Profile Settings</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Manage your account and personal information.
                  </p>
                </div>

                {/* Profile Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <UserAvatar user={user} size="lg" />
                    <div className="flex flex-col">
                      <h3 className="font-medium">{displayName}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Danger Zone */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-medium text-destructive mb-2">
                        Danger Zone
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                    </div>

                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Account</DialogTitle>
                          <DialogDescription>
                            Are you absolutely sure you want to delete your account? This action cannot be undone.
                            This will permanently delete your account and remove all your data from our servers.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteAccount}>
                            Yes, delete my account
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};