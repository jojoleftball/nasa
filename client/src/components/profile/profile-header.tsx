import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Mail } from "lucide-react";
import { format } from "date-fns";

interface ProfileHeaderProps {
  user: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    profilePicture?: string;
    coverImage?: string;
    bio?: string;
    interests?: string[];
    createdAt: string;
  };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const displayName = user.displayName || 
                     (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
                     user.username;

  const initials = user.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.username.slice(0, 2).toUpperCase();

  return (
    <Card className="glass border-0 overflow-hidden">
      {/* Cover Image */}
      <div 
        className="h-32 bg-gradient-to-r from-primary/20 to-blue-500/20 relative"
        style={{
          backgroundImage: user.coverImage ? `url(${user.coverImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <CardContent className="relative pb-6">
        {/* Profile Picture */}
        <div className="flex items-start justify-between -mt-16 mb-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={user.profilePicture} alt={displayName} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* User Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                @{user.username}
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {format(new Date(user.createdAt), "MMMM yyyy")}
              </div>
            </div>
          </div>

          {user.bio && (
            <p className="text-muted-foreground">{user.bio}</p>
          )}

          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest.replace('-', ' ').split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}