import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Shield, Settings } from "lucide-react";
import { Link } from "wouter";
import { ProfileForm } from "@/components/profile/profile-form";
import { PasswordForm } from "@/components/profile/password-form";
import { UsernameForm } from "@/components/profile/username-form";
import { ProfileHeader } from "@/components/profile/profile-header";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  if (!user) {
    return null;
  }

  return (
    <div className="cosmic-bg min-h-screen relative">
      <div className="stars"></div>
      
      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <ProfileHeader user={{
            ...user,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            displayName: user.displayName || undefined,
            profilePicture: user.profilePicture || undefined,
            coverImage: user.coverImage || undefined,
            bio: user.bio || undefined,
            interests: user.interests || undefined,
            createdAt: user.createdAt || new Date().toISOString()
          }} />

          {/* Profile Management Tabs */}
          <Card className="glass border-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Preferences
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="space-y-6">
                <TabsContent value="profile">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Personal Information</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your personal details and profile information.
                      </p>
                    </div>
                    <Separator />
                    <ProfileForm user={user} />
                  </div>
                </TabsContent>

                <TabsContent value="security">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Security Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your account security and authentication.
                      </p>
                    </div>
                    <Separator />
                    
                    <div className="space-y-8">
                      <UsernameForm currentUsername={user.username} />
                      <Separator />
                      <PasswordForm />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preferences">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Application Preferences</h3>
                      <p className="text-sm text-muted-foreground">
                        Customize your research interests and application settings.
                      </p>
                    </div>
                    <Separator />
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-md font-medium mb-4">Research Interests</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Current interests: {user.interests && user.interests.length > 0 
                            ? user.interests.join(", ") 
                            : "No interests set"}
                        </p>
                        <Link href="/interests">
                          <Button variant="outline" data-testid="button-edit-interests">
                            Edit Research Interests
                          </Button>
                        </Link>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="text-md font-medium mb-4">AI Assistant</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Current assistant name: {user.chatbotName || "Ria"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You can customize your AI assistant name from the dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}