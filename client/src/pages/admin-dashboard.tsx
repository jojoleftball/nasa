import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, LogOut, Bot, X, Moon, Sun, Search, Filter, Copy, Check, Menu, FileText, LayoutDashboard, ChevronLeft, Sparkles, Star, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { AdminAssistant } from "@/components/admin-assistant";
import { Logo } from "@/components/ui/logo";
import type { AdminResearch } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

const PREDEFINED_TAGS = [
  "Plant Biology",
  "Human Health",
  "Microgravity Effects",
  "Radiation Studies",
  "Microbiology",
  "Genetics",
  "Space Medicine",
  "Cell Biology",
  "Molecular Biology",
  "Physiology",
];

const researchSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  year: z.string().optional(),
  authors: z.string().optional(),
  institution: z.string().optional(),
  osdStudyNumber: z.string().optional(),
  tags: z.array(z.string()).default([]),
  nasaOsdrLinks: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  customFields: z.record(z.any()).default({}),
});

type ResearchFormValues = z.infer<typeof researchSchema>;

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingResearch, setEditingResearch] = useState<any>(null);
  const [tagInput, setTagInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("research-list");

  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('admin-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const { data: research = [], isLoading } = useQuery<AdminResearch[]>({
    queryKey: ["/api/admin/research"],
  });

  const form = useForm<ResearchFormValues>({
    resolver: zodResolver(researchSchema),
    defaultValues: {
      title: "",
      description: "",
      year: "",
      authors: "",
      institution: "",
      osdStudyNumber: "",
      tags: [],
      nasaOsdrLinks: [],
      published: false,
      customFields: {},
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ResearchFormValues) => {
      const res = await apiRequest("POST", "/api/admin/research", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/research"] });
      toast({ title: "Success", description: "Research created successfully!" });
      setActiveTab("research-list");
      form.reset();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ResearchFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/admin/research/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/research"] });
      toast({ title: "Success", description: "Research updated successfully!" });
      setActiveTab("research-list");
      setEditingResearch(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/research/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/research"] });
      toast({ title: "Success", description: "Research deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      setLocation("/admin");
    },
  });

  function onSubmit(data: ResearchFormValues) {
    if (editingResearch) {
      updateMutation.mutate({ id: editingResearch.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleEdit(item: any) {
    setEditingResearch(item);
    form.reset({
      title: item.title,
      description: item.description,
      year: item.year || "",
      authors: item.authors || "",
      institution: item.institution || "",
      osdStudyNumber: item.osdStudyNumber || "",
      tags: item.tags || [],
      nasaOsdrLinks: item.nasaOsdrLinks || [],
      published: item.published,
      customFields: item.customFields || {},
    });
    setActiveTab("add-research");
  }

  function addPredefinedTag(tag: string) {
    const currentTags = form.getValues("tags");
    if (!currentTags.includes(tag)) {
      form.setValue("tags", [...currentTags, tag], { shouldValidate: false });
    } else {
      toast({ 
        title: "Already Added", 
        description: `"${tag}" is already in your tags`,
        variant: "default"
      });
    }
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this research?")) {
      deleteMutation.mutate(id);
    }
  }

  function addTag() {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags");
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()], { shouldValidate: false });
        setTagInput("");
      } else {
        toast({ 
          title: "Duplicate Tag", 
          description: "This tag already exists",
          variant: "default"
        });
      }
    }
  }

  function removeTag(tag: string) {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(t => t !== tag), { shouldValidate: false });
  }

  function addLink() {
    if (linkInput.trim()) {
      const currentLinks = form.getValues("nasaOsdrLinks");
      if (!currentLinks.includes(linkInput.trim())) {
        form.setValue("nasaOsdrLinks", [...currentLinks, linkInput.trim()], { shouldValidate: false });
        setLinkInput("");
      } else {
        toast({ 
          title: "Duplicate Link", 
          description: "This link already exists",
          variant: "default"
        });
      }
    }
  }

  function removeLink(link: string) {
    const currentLinks = form.getValues("nasaOsdrLinks");
    form.setValue("nasaOsdrLinks", currentLinks.filter(l => l !== link), { shouldValidate: false });
  }

  function copyToClipboard(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast({ title: "ID Copied!", description: "Research ID copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredAndSortedResearch = () => {
    let filtered = research || [];

    if (searchQuery.trim()) {
      filtered = filtered.filter((item: any) => {
        const query = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(query) ||
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.authors?.toLowerCase().includes(query) ||
          item.institution?.toLowerCase().includes(query) ||
          item.tags?.some((tag: string) => tag.toLowerCase().includes(query))
        );
      });
    }

    if (filterBy !== "all") {
      if (filterBy === "published") {
        filtered = filtered.filter((item: any) => item.published);
      } else if (filterBy === "unpublished") {
        filtered = filtered.filter((item: any) => !item.published);
      }
    }

    const sorted = [...filtered].sort((a: any, b: any) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "year":
          return (b.year || "0").localeCompare(a.year || "0");
        default:
          return 0;
      }
    });

    return sorted;
  };

  return (
    <div className="min-h-screen cosmic-bg relative overflow-hidden flex">
      <div className="stars"></div>
      
      <motion.aside 
        initial={false}
        animate={{ width: sidebarCollapsed ? "80px" : "280px" }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-20 glass border-r border-white/10 dark:border-white/10 flex flex-col"
      >
        <div className="p-4 border-b border-white/10 dark:border-white/10 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <Logo size="md" showText={false} />
                <span className="font-bold cosmic-text-gradient text-lg">Admin Portal</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            variant="ghost"
            size="icon"
            className="hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-300 rounded-lg"
            data-testid="button-toggle-sidebar"
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </motion.div>
          </Button>
        </div>

        <ScrollArea className="flex-1 py-6">
          <nav className="space-y-2 px-3">
            <Button
              onClick={() => setActiveTab("research-list")}
              variant={activeTab === "research-list" ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 transition-all duration-300 rounded-lg ${
                activeTab === "research-list" 
                  ? "cosmic-glow-gentle bg-gradient-to-r from-purple-600/30 to-blue-600/30 dark:from-purple-600/30 dark:to-blue-600/30" 
                  : "hover:bg-white/10 dark:hover:bg-white/10"
              }`}
              data-testid="nav-research-list"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-medium">Research List</span>}
            </Button>
            
            <Button
              onClick={() => {
                setActiveTab("add-research");
                setEditingResearch(null);
                form.reset();
              }}
              variant={activeTab === "add-research" ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 transition-all duration-300 rounded-lg ${
                activeTab === "add-research" 
                  ? "cosmic-glow-gentle bg-gradient-to-r from-purple-600/30 to-blue-600/30 dark:from-purple-600/30 dark:to-blue-600/30" 
                  : "hover:bg-white/10 dark:hover:bg-white/10"
              }`}
              data-testid="nav-add-research"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-medium">Add Research</span>}
            </Button>
            
            <Button
              onClick={() => setActiveTab("assistant")}
              variant={activeTab === "assistant" ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 transition-all duration-300 rounded-lg ${
                activeTab === "assistant" 
                  ? "cosmic-glow-gentle bg-gradient-to-r from-purple-600/30 to-blue-600/30 dark:from-purple-600/30 dark:to-blue-600/30" 
                  : "hover:bg-white/10 dark:hover:bg-white/10"
              }`}
              data-testid="nav-assistant"
            >
              <Bot className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-medium">AI Assistant</span>}
            </Button>
            
            <Button
              onClick={() => setActiveTab("suggestions")}
              variant={activeTab === "suggestions" ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 transition-all duration-300 rounded-lg ${
                activeTab === "suggestions" 
                  ? "cosmic-glow-gentle bg-gradient-to-r from-purple-600/30 to-blue-600/30 dark:from-purple-600/30 dark:to-blue-600/30" 
                  : "hover:bg-white/10 dark:hover:bg-white/10"
              }`}
              data-testid="nav-suggestions"
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-medium">Suggestions</span>}
            </Button>
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-white/10 dark:border-white/10 space-y-2">
          <Button
            onClick={toggleTheme}
            variant="ghost"
            className="w-full justify-start gap-3 hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-300 rounded-lg"
            data-testid="button-theme-toggle"
          >
            <motion.div
              animate={{ rotate: theme === 'dark' ? 0 : 180 }}
              transition={{ duration: 0.4 }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
            </motion.div>
            {!sidebarCollapsed && <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </Button>
          
          <Button
            onClick={() => logoutMutation.mutate()}
            variant="ghost"
            className="w-full justify-start gap-3 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300 rounded-lg"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </Button>
        </div>
      </motion.aside>

      <div className="flex-1 relative z-10 overflow-auto">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="w-8 h-8 text-purple-400" />
              </motion.div>
              <h1 className="text-3xl sm:text-5xl font-bold cosmic-text-gradient">
                {activeTab === "research-list" ? "Research List" : activeTab === "add-research" ? "Add Research" : activeTab === "suggestions" ? "User Suggestions" : "AI Assistant"}
              </h1>
            </div>
            <p className="text-gray-400 dark:text-gray-400 text-base sm:text-lg ml-11">
              {activeTab === "research-list" ? "View and manage your space research content" : activeTab === "add-research" ? "Add new research or edit existing entries" : activeTab === "suggestions" ? "View user feedback and suggestions for research entries" : "Get AI-powered assistance for content management"}
            </p>
          </motion.div>

        {activeTab === "research-list" && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="cosmic-card p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search by ID, title, author, institution, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 glass border-0 h-11 text-base placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/50 transition-all"
                    data-testid="input-search"
                  />
                </div>
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[180px] glass border-0 h-11" data-testid="select-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Research</SelectItem>
                    <SelectItem value="published">Published Only</SelectItem>
                    <SelectItem value="unpublished">Unpublished Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] glass border-0 h-11" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-gray-300 dark:text-gray-400 text-sm">
                    Showing: <span className="font-bold text-purple-400">{filteredAndSortedResearch().length}</span> of {research.length}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 hover:text-white h-8"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="grid gap-4 sm:gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="loading-cosmic h-48 rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6">
                  {filteredAndSortedResearch().map((item: any, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                      layout
                    >
                      <Card className="cosmic-card overflow-hidden hover:border-purple-500/30 transition-all">
                        <CardHeader className="pb-2 pt-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                                <CardTitle className="cosmic-text-gradient text-base truncate">{item.title}</CardTitle>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-mono">{item.id}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyToClipboard(item.id)}
                                  className="h-5 w-5 hover:bg-white/10"
                                  data-testid={`button-copy-${item.id}`}
                                >
                                  {copiedId === item.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {item.published && (
                                <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 text-xs px-2 py-0.5" data-testid={`badge-published-${item.id}`}>
                                  Published
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(item)}
                                className="hover:bg-purple-500/20 hover:text-purple-300 h-8 w-8 rounded-md"
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                className="hover:bg-red-500/20 hover:text-red-300 h-8 w-8 rounded-md"
                                data-testid={`button-delete-${item.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-2 pb-3">
                          <p className="text-gray-300 dark:text-gray-400 text-xs leading-relaxed line-clamp-2">{item.description}</p>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            {item.year && (
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <span className="font-semibold">Year:</span>
                                <span>{item.year}</span>
                              </div>
                            )}
                            {item.authors && (
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <span className="font-semibold">Authors:</span>
                                <span className="truncate max-w-[150px]">{item.authors}</span>
                              </div>
                            )}
                            {item.osdStudyNumber && (
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <span className="font-semibold">OSD:</span>
                                <span className="font-mono text-purple-400">{item.osdStudyNumber}</span>
                              </div>
                            )}
                            {item.institution && (
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <span className="font-semibold">Institution:</span>
                                <span className="truncate max-w-[200px]">{item.institution}</span>
                              </div>
                            )}
                          </div>

                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {item.tags.slice(0, 5).map((tag: string, tagIndex: number) => (
                                <Badge key={tagIndex} className="bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-white border border-purple-500/30 text-xs px-2 py-0" data-testid={`badge-tag-${item.id}-${tagIndex}`}>
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 5 && (
                                <Badge className="bg-gray-600/40 text-white border border-gray-500/30 text-xs px-2 py-0">
                                  +{item.tags.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === "add-research" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Card className="cosmic-card border-0">
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200 text-base font-medium">Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter research title" className="glass border-0 text-white placeholder:text-gray-400 h-11" data-testid="input-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200 text-base font-medium">Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter detailed description" rows={4} className="glass border-0 text-white placeholder:text-gray-400 min-h-[120px] resize-y" data-testid="input-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200 text-base font-medium">Year</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="2024" className="glass border-0 text-white placeholder:text-gray-400 h-11" data-testid="input-year" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="authors"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="text-gray-200 text-base font-medium">Authors</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Dr. Smith, Dr. Johnson" className="glass border-0 text-white placeholder:text-gray-400 h-11" data-testid="input-authors" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="institution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200 text-base font-medium">Institution</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., NASA Ames Research Center" className="glass border-0 text-white placeholder:text-gray-400 h-11" data-testid="input-institution" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="osdStudyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200 text-base font-medium">OSD Study Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., OSD-204" className="glass border-0 text-white placeholder:text-gray-400 h-11" data-testid="input-osd-study-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-3">
                      <FormLabel className="text-gray-200 text-base font-medium">Tags</FormLabel>
                      <div className="mb-3">
                        <p className="text-sm text-gray-400 mb-2">Quick add predefined tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {PREDEFINED_TAGS.map((tag) => (
                            <motion.div
                              key={tag}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge
                                onClick={() => addPredefinedTag(tag)}
                                className="cursor-pointer bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-white transition-all duration-300"
                                data-testid={`badge-predefined-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          placeholder="Add custom tag"
                          className="glass border-0 text-white placeholder:text-gray-400 h-11"
                          data-testid="input-tag"
                        />
                        <Button type="button" onClick={addTag} className="glass border-0 h-11 px-6" data-testid="button-add-tag">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.watch("tags").map((tag, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0" data-testid={`badge-tag-${index}`}>
                              {tag}
                              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} data-testid={`button-remove-tag-${index}`} />
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <FormLabel className="text-gray-200 text-base font-medium">NASA OSDR Links</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                          placeholder="https://osdr.nasa.gov/..."
                          className="glass border-0 text-white placeholder:text-gray-400 h-11"
                          data-testid="input-link"
                        />
                        <Button type="button" onClick={addLink} className="glass border-0 h-11 px-6" data-testid="button-add-link">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2 mt-2">
                        {form.watch("nasaOsdrLinks").map((link, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-2 p-3 glass rounded-lg"
                          >
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm flex-1 truncate">
                              {link}
                            </a>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(link)} className="hover:bg-red-500/20 h-8 w-8" data-testid={`button-remove-link-${index}`}>
                              <X className="w-4 h-4 text-red-400" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 glass rounded-lg">
                          <div className="space-y-0.5 flex-1">
                            <FormLabel className="text-gray-200 text-base font-medium">Published</FormLabel>
                            <p className="text-sm text-gray-400">Make this research visible to users</p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-600 data-[state=checked]:to-blue-600"
                              data-testid="switch-published"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setActiveTab("research-list");
                          setEditingResearch(null);
                          form.reset();
                        }} 
                        className="glass border-0 h-11 px-6" 
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="glow-button text-white border-0 h-11 px-8" data-testid="button-submit">
                        {editingResearch ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "assistant" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <AdminAssistant />
          </motion.div>
        )}

        {activeTab === "suggestions" && (
          <SuggestionsTab />
        )}
        </div>
      </div>
    </div>
  );
}

function SuggestionsTab() {
  const { toast } = useToast();
  const { data: suggestions = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/suggestions"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/suggestions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suggestions"] });
      toast({ title: "Success", description: "Suggestion deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this suggestion?")) {
      deleteMutation.mutate(id);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="cosmic-card animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="cosmic-card">
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Suggestions Yet</h3>
          <p className="text-muted-foreground">
            User suggestions and reports will appear here when they're submitted.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion: any) => (
        <motion.div
          key={suggestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="cosmic-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    <Badge 
                      className={suggestion.type === 'suggest' 
                        ? 'bg-blue-600/30 text-blue-300 mr-2' 
                        : 'bg-red-600/30 text-red-300 mr-2'
                      }
                    >
                      {suggestion.type === 'suggest' ? 'Suggestion' : 'Report'}
                    </Badge>
                    Research ID: {suggestion.researchId}
                  </CardTitle>
                  <CardDescription>
                    User ID: {suggestion.userId} • {new Date(suggestion.createdAt).toLocaleString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(suggestion.researchId);
                    }}
                    data-testid={`button-copy-research-${suggestion.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(suggestion.id)}
                    className="hover:bg-red-500/20 hover:text-red-400"
                    data-testid={`button-delete-suggestion-${suggestion.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap" data-testid={`text-message-${suggestion.id}`}>
                {suggestion.message}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
