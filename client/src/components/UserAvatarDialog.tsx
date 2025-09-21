import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from './UserAvatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface UserAvatarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function UserAvatarDialog({ open, onOpenChange }: UserAvatarDialogProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      onOpenChange(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) return null;

  const displayName = getDisplayName(user);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">User Account</DialogTitle>
          <DialogDescription className="sr-only">
            User account information and options
          </DialogDescription>
        </DialogHeader>

        {/* User Info Section */}
        <div className="flex flex-col items-center space-y-4 py-4">
          <UserAvatar user={user} size="lg" />
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold">{displayName}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2 py-2">
          <Button 
            variant="ghost" 
            asChild
            className="justify-start h-10"
            onClick={() => onOpenChange(false)}
          >
            <Link to="/privacy" className="flex items-center">
              <ShieldCheckIcon className="mr-3 h-4 w-4" />
              Privacy Policy
            </Link>
          </Button>

          <Button 
            variant="ghost" 
            asChild
            className="justify-start h-10"
            onClick={() => onOpenChange(false)}
          >
            <Link to="/terms" className="flex items-center">
              <DocumentTextIcon className="mr-3 h-4 w-4" />
              Terms of Service
            </Link>
          </Button>
        </div>

        <Separator />

        {/* Sign Out Button */}
        <div className="py-2">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}