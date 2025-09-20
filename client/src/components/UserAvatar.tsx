import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      first_name?: string;
      last_name?: string;
      avatar_url?: string;
    };
  } | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Generate initials from user's name or email
const getInitials = (user: UserAvatarProps["user"]): string => {
  if (!user) return "?";

  // Try to get name from metadata
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
  const firstName = user.user_metadata?.first_name;
  const lastName = user.user_metadata?.last_name;

  if (fullName) {
    const names = fullName.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) {
    return firstName[0].toUpperCase();
  }

  // Fall back to email
  if (user.email) {
    return user.email[0].toUpperCase();
  }

  return "?";
};

// Generate consistent color based on user email/name
const getAvatarColor = (user: UserAvatarProps["user"]): string => {
  if (!user?.email) return "bg-gray-500";

  const colors = [
    "bg-red-400",
    "bg-orange-400", 
    "bg-amber-400",
    "bg-yellow-400",
    "bg-lime-400",
    "bg-green-400",
    "bg-emerald-400",
    "bg-teal-700",
    "bg-cyan-700",
    "bg-sky-400",
    "bg-blue-400",
    "bg-indigo-400",
    "bg-violet-400",
    "bg-purple-400",
    "bg-fuchsia-400",
    "bg-pink-400",
    "bg-rose-400"
  ];

  const hash = user.email.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

export const UserAvatar = ({ user, className, size = "md" }: UserAvatarProps) => {
  const initials = getInitials(user);
  const avatarColor = getAvatarColor(user);

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base"
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={user?.user_metadata?.avatar_url} />
      <AvatarFallback className={cn(avatarColor, "text-white font-medium")}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};