import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { updateUsernameSchema, type UpdateUsername } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AtSign, Eye, EyeOff } from "lucide-react";

interface UsernameFormProps {
  currentUsername: string;
}

export function UsernameForm({ currentUsername }: UsernameFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<UpdateUsername>({
    resolver: zodResolver(updateUsernameSchema),
    defaultValues: {
      username: currentUsername,
      password: ""
    }
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (data: UpdateUsername) => {
      const res = await apiRequest("PUT", "/api/user/username", data);
      return await res.json();
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["/api/user"], response.user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      form.reset();
      setIsEditing(false);
      toast({
        title: "Username updated",
        description: "Your username has been updated successfully.",
      });
    },
    onError: (error: any) => {
      // Parse error from apiRequest format: "status: {json}"
      let errorData: any = {};
      try {
        const errorMessage = error.message || "";
        const jsonPart = errorMessage.substring(errorMessage.indexOf(":") + 1).trim();
        errorData = JSON.parse(jsonPart);
      } catch {
        errorData = { message: error.message || "Unknown error" };
      }
      
      if (errorData.message === "Password is incorrect") {
        form.setError("password", {
          message: "Password is incorrect"
        });
      } else if (errorData.message === "Username is already taken") {
        form.setError("username", {
          message: "This username is already taken"
        });
      } else if (errorData.errors) {
        // Handle Zod validation errors
        errorData.errors.forEach((err: any) => {
          const field = err.path?.[0];
          if (field) {
            form.setError(field as keyof UpdateUsername, {
              message: err.message
            });
          }
        });
      } else {
        toast({
          title: "Update failed",
          description: errorData.message || "Failed to update username. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = (data: UpdateUsername) => {
    updateUsernameMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset({
      username: currentUsername,
      password: ""
    });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AtSign className="h-5 w-5" />
            Username
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Current Username</Label>
            <p className="mt-1 text-lg font-medium">@{currentUsername}</p>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              data-testid="button-edit-username"
            >
              Change Username
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AtSign className="h-5 w-5" />
          Change Username
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">New Username</Label>
            <Input
              id="username"
              {...form.register("username")}
              placeholder="Enter your new username"
              data-testid="input-new-username"
            />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Confirm with Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...form.register("password")}
                placeholder="Enter your password to confirm"
                data-testid="input-username-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-username-password"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              For security reasons, we need your password to change your username.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              data-testid="button-cancel-username"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateUsernameMutation.isPending}
              data-testid="button-update-username"
            >
              {updateUsernameMutation.isPending ? "Updating..." : "Update Username"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}