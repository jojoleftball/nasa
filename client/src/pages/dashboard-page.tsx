import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chatbot } from "@/components/chatbot";
import { SearchFilters } from "@/components/search-filters";
import { VisualizationSidebar } from "@/components/visualization-sidebar";
import { ResearchResults } from "@/components/research-results";
import { ChevronDown, User, Bot, LogOut, X, Settings } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    yearRange: "All Years",
    organism: [],
    experimentType: [],
    mission: [],
    tissueType: [],
    researchArea: [],
    publicationStatus: "All Status",
    customDateRange: { start: "", end: "" },
    keywords: []
  });
  const [sortOptions, setSortOptions] = useState({
    sortBy: "relevance",
    sortOrder: "desc",
    secondarySort: "date"
  });
  const [showGuide, setShowGuide] = useState(true);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newChatbotName, setNewChatbotName] = useState(user?.chatbotName || "Ria");
  const [showInterestBased, setShowInterestBased] = useState(true);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { chatbotName: string }) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      setShowRenameDialog(false);
      toast({
        title: "Profile updated",
        description: "Your chatbot name has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRenameChatbot = () => {
    if (newChatbotName.trim()) {
      updateProfileMutation.mutate({ chatbotName: newChatbotName.trim() });
    }
  };

  const handleSearch = (query: string, newFilters: any, newSortOptions: any) => {
    setSearchQuery(query);
    setFilters(newFilters);
    setSortOptions(newSortOptions);
    setShowInterestBased(false);
  };

  return (
    <div className="cosmic-bg min-h-screen relative overflow-hidden">
      <div className="stars"></div>
      
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Logo size="md" textClassName="text-2xl font-bold" showText={true} />
            </motion.div>
            
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                    <User className="h-4 w-4" />
                    <span>{user?.username}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-border">
                  <DropdownMenuItem asChild data-testid="button-profile">
                    <Link href="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowRenameDialog(true)}
                    data-testid="button-rename-chatbot"
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    Rename Chatbot
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => logoutMutation.mutate()}
                    className="text-destructive"
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <SearchFilters onSearch={handleSearch} />
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-10 gap-8 mt-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div 
            className="lg:col-span-7"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <ResearchResults 
              query={searchQuery} 
              filters={filters} 
              sortOptions={sortOptions}
              showInterestBased={showInterestBased}
              userInterests={user?.interests || []}
            />
          </motion.div>
          
          <motion.div 
            className="lg:col-span-3"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <VisualizationSidebar />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="glass rounded-xl mt-8 border-0">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Getting Started Guide</CardTitle>
                      <p className="text-muted-foreground text-sm">
                        Learn how to navigate and use Biogalactic effectively
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowGuide(false)}
                      data-testid="button-dismiss-guide"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { num: 1, title: "Search & Filter", desc: "Use the search bar and filters to find relevant studies" },
                      { num: 2, title: "Visualizations", desc: "Explore data through interactive charts and statistics" },
                      { num: 3, title: "AI Assistant", desc: `Ask ${user?.chatbotName || "Ria"} questions about space biology research` }
                    ].map((step, idx) => (
                      <motion.div 
                        key={step.num}
                        className="flex items-start space-x-3"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.6 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-primary text-sm">{step.num}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{step.title}</h4>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.footer 
        className="border-t border-border bg-card/30 backdrop-blur-sm mt-16 relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-muted-foreground">
            © Biogalactic Team — NASA Data Used With Permission
          </p>
        </div>
      </motion.footer>

      <Chatbot />

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Rename Your AI Assistant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="chatbot-name">Assistant Name</Label>
              <Input
                id="chatbot-name"
                value={newChatbotName}
                onChange={(e) => setNewChatbotName(e.target.value)}
                placeholder="Enter a name for your AI assistant"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRenameDialog(false)}
                disabled={updateProfileMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRenameChatbot}
                disabled={updateProfileMutation.isPending || !newChatbotName.trim()}
              >
                {updateProfileMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
