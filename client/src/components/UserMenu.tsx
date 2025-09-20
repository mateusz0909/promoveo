import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "./UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

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

export const UserMenu = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const displayName = getDisplayName(user);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className=" h-10 w-10 rounded-full">
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <UserAvatar user={user} size="md" />
              <div className="flex flex-col">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center">
            <Cog6ToothIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/privacy" className="flex items-center">
            <ShieldCheckIcon className="mr-2 h-4 w-4" />
            <span>Privacy Policy</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};