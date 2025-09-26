import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Camera, Upload, X } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  profilePicture: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal(""))
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    bio?: string;
    profilePicture?: string;
    coverImage?: string;
    username: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      displayName: user.displayName || "",
      bio: user.bio || "",
      profilePicture: user.profilePicture || "",
      coverImage: user.coverImage || ""
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ProfileFormData) => {
    // Clean up empty strings to send as undefined
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === "" ? undefined : value])
    );
    updateProfileMutation.mutate(cleanData);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const displayName = user.displayName || 
                     (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
                     user.username;

  const initials = user.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.username.slice(0, 2).toUpperCase();

  if (!isEditing) {
    return (
      <Card className="glass border-0">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium">Profile Information</h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              data-testid="button-edit-profile"
            >
              Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
              <p className="mt-1">{user.firstName || "Not set"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
              <p className="mt-1">{user.lastName || "Not set"}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Display Name</Label>
              <p className="mt-1">{user.displayName || "Not set"}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Bio</Label>
              <p className="mt-1 text-sm">{user.bio || "No bio added yet"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Profile Picture</Label>
              <div className="mt-2 flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.profilePicture} alt={displayName} />
                  <AvatarFallback className="text-lg font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">
                  {user.profilePicture ? "Custom profile picture set" : "Using default avatar"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Cover Image</Label>
              <div className="mt-2">
                {user.coverImage ? (
                  <div className="w-full h-24 bg-cover bg-center rounded-md border"
                       style={{ backgroundImage: `url(${user.coverImage})` }} />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-md border flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Default cover image</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-0">
      <CardContent className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium">Edit Profile Information</h4>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Enter your first name"
                data-testid="input-first-name"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Enter your last name"
                data-testid="input-last-name"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                {...form.register("displayName")}
                placeholder="How you'd like to be displayed (optional)"
                data-testid="input-display-name"
              />
              {form.formState.errors.displayName && (
                <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...form.register("bio")}
                placeholder="Tell us about yourself..."
                className="min-h-[100px]"
                data-testid="input-bio"
              />
              {form.formState.errors.bio && (
                <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profilePicture">Profile Picture URL</Label>
                <Input
                  id="profilePicture"
                  {...form.register("profilePicture")}
                  placeholder="https://example.com/your-image.jpg"
                  data-testid="input-profile-picture"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a URL to an image you'd like to use as your profile picture
                </p>
                {form.formState.errors.profilePicture && (
                  <p className="text-sm text-destructive">{form.formState.errors.profilePicture.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <Input
                  id="coverImage"
                  {...form.register("coverImage")}
                  placeholder="https://example.com/your-cover.jpg"
                  data-testid="input-cover-image"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a URL to an image you'd like to use as your cover image
                </p>
                {form.formState.errors.coverImage && (
                  <p className="text-sm text-destructive">{form.formState.errors.coverImage.message}</p>
                )}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}