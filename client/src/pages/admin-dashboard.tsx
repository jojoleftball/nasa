import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, LogOut, Bot, X, Moon, Sun, Search, Filter, Copy, Check, Menu, FileText, LayoutDashboard, ChevronLeft } from "lucide-react";
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
  tags: z.array(z.string()).default([]),
  nasaOsdrLinks: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  customFields: z.record(z.any()).default({}),
});

type ResearchFormValues = z.infer<typeof researchSchema>;

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResearch, setEditingResearch] = useState<any>(null);
  const [tagInput, setTagInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("research");

  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('admin-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
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
      setIsDialogOpen(false);
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
      setIsDialogOpen(false);
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
      tags: item.tags || [],
      nasaOsdrLinks: item.nasaOsdrLinks || [],
      published: item.published,
      customFields: item.customFields || {},
    });
    setIsDialogOpen(true);
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
        className="relative z-20 glass border-r border-white/10 flex flex-col transition-all duration-300"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {!sidebarCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <Logo size="md" showText={false} />
              <span className="font-bold cosmic-text-gradient">Admin</span>
            </motion.div>
          )}
          <Button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            variant="ghost"
            size="icon"
            className="hover:bg-white/10 transition-all"
            data-testid="button-toggle-sidebar"
          >
            {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-2 px-3">
            <Button
              onClick={() => setActiveTab("research")}
              variant={activeTab === "research" ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 transition-all ${
                activeTab === "research" ? "cosmic-glow bg-purple-600/20" : "hover:bg-white/10"
              }`}
              data-testid="nav-research"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Research</span>}
            </Button>
            
            <Button
              onClick={() => setActiveTab("assistant")}
              variant={activeTab === "assistant" ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 transition-all ${
                activeTab === "assistant" ? "cosmic-glow bg-purple-600/20" : "hover:bg-white/10"
              }`}
              data-testid="nav-assistant"
            >
              <Bot className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>AI Assistant</span>}
            </Button>
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-white/10 space-y-2">
          <Button
            onClick={toggleTheme}
            variant="ghost"
            className="w-full justify-start gap-3 hover:bg-white/10 transition-all"
            data-testid="button-theme-toggle"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
            {!sidebarCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </Button>
          
          <Button
            onClick={() => logoutMutation.mutate()}
            variant="ghost"
            className="w-full justify-start gap-3 hover:bg-white/10 text-red-400 hover:text-red-300 transition-all"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </motion.aside>

      <div className="flex-1 relative z-10 overflow-auto">
        <div className="p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-4xl font-bold cosmic-text-gradient mb-2">
              {activeTab === "research" ? "Research Management" : "AI Assistant"}
            </h1>
            <p className="text-gray-300 dark:text-gray-400 text-sm sm:text-base">
              {activeTab === "research" ? "Manage research content" : "Get AI-powered assistance"}
            </p>
          </motion.div>

        {activeTab === "research" && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 rounded-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by ID, title, author, institution, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glass border-0 text-white placeholder:text-gray-400"
                    data-testid="input-search"
                  />
                </div>
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[180px] glass border-0" data-testid="select-filter">
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
                  <SelectTrigger className="w-[160px] glass border-0" data-testid="select-sort">
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
                  <p className="text-gray-300">
                    Showing: <span className="font-bold text-white">{filteredAndSortedResearch().length}</span> of {research.length}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 hover:text-white"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingResearch(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="cosmic-glow transition-all bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0" data-testid="button-add-research">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Research
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] md:w-[min(90vw,1200px)] lg:w-[min(85vw,1400px)] h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] max-h-none glass border-0 text-white p-0 flex flex-col overflow-hidden">
                <DialogHeader className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-2 sm:pb-3 md:pb-4 border-b border-white/10 flex-shrink-0">
                  <DialogTitle className="text-white cosmic-text-gradient text-lg sm:text-xl md:text-2xl">
                    {editingResearch ? "Edit Research" : "Add New Research"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-300 text-xs sm:text-sm md:text-base">
                    Fill in the details for the research entry
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 px-3 sm:px-4 md:px-6 overflow-y-auto" type="always">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200 text-sm sm:text-base">Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter research title" className="glass border-0 text-white placeholder:text-gray-400 text-sm sm:text-base h-9 sm:h-10" data-testid="input-title" />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200 text-sm sm:text-base">Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter detailed description" rows={4} className="glass border-0 text-white placeholder:text-gray-400 text-sm sm:text-base min-h-[100px] sm:min-h-[120px] resize-y" data-testid="input-description" />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200 text-sm sm:text-base">Year</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="2024" className="glass border-0 text-white placeholder:text-gray-400 text-sm sm:text-base h-9 sm:h-10" data-testid="input-year" />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="authors"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="text-gray-200 text-sm sm:text-base">Authors</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Dr. Smith, Dr. Johnson" className="glass border-0 text-white placeholder:text-gray-400 text-sm sm:text-base h-9 sm:h-10" data-testid="input-authors" />
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="institution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200 text-sm sm:text-base">Institution</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., NASA Ames Research Center" className="glass border-0 text-white placeholder:text-gray-400 text-sm sm:text-base h-9 sm:h-10" data-testid="input-institution" />
                          </FormControl>
                          <FormMessage className="text-xs sm:text-sm" />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel className="text-gray-200 text-sm sm:text-base">Tags</FormLabel>
                      <div className="mb-2 sm:mb-3">
                        <p className="text-xs sm:text-sm text-gray-400 mb-2">Quick add predefined tags:</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {PREDEFINED_TAGS.map((tag, idx) => (
                            <motion.div
                              key={tag}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.03, duration: 0.2 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge
                                variant="outline"
                                className="cursor-pointer border-purple-500/50 text-purple-300 hover:bg-purple-600/30 transition-colors text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1"
                                onClick={() => addPredefinedTag(tag)}
                                data-testid={`badge-predefined-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                + {tag}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          placeholder="Add tag and press Enter"
                          className="glass border-0 text-white placeholder:text-gray-400 text-sm sm:text-base h-9 sm:h-10 flex-1"
                          data-testid="input-tag"
                        />
                        <Button type="button" onClick={addTag} variant="outline" className="glass border-0 text-sm sm:text-base h-9 sm:h-10 w-full sm:w-auto" data-testid="button-add-tag">
                          Add
                        </Button>
                      </div>
                      <AnimatePresence mode="popLayout">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                          {form.watch("tags").map((tag, index) => (
                            <motion.div
                              key={tag}
                              initial={{ opacity: 0, scale: 0.8, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, x: -20 }}
                              transition={{ duration: 0.2 }}
                              layout
                            >
                              <Badge className="bg-purple-600/30 text-white text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1" data-testid={`badge-tag-${index}`}>
                                {tag}
                                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                  <X className="w-3 h-3 ml-1 cursor-pointer hover:text-red-300 transition-colors inline-block" onClick={() => removeTag(tag)} />
                                </motion.div>
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    </div>

                    <div className="space-y-2">
                      <FormLabel className="text-gray-200 text-sm sm:text-base">NASA OSDR Links</FormLabel>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                          placeholder="Add NASA OSDR link and press Enter"
                          className="glass border-0 text-white placeholder:text-gray-400 text-sm sm:text-base h-9 sm:h-10 flex-1"
                          data-testid="input-link"
                        />
                        <Button type="button" onClick={addLink} variant="outline" className="glass border-0 text-sm sm:text-base h-9 sm:h-10 w-full sm:w-auto" data-testid="button-add-link">
                          Add
                        </Button>
                      </div>
                      <AnimatePresence mode="popLayout">
                        <div className="space-y-1 sm:space-y-1.5 mt-2">
                          {form.watch("nasaOsdrLinks").map((link, index) => (
                            <motion.div 
                              key={link}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.2 }}
                              layout
                              className="flex items-center gap-2 glass p-2 sm:p-2.5 rounded" 
                              data-testid={`link-item-${index}`}
                            >
                              <span className="text-xs sm:text-sm text-gray-300 flex-1 truncate break-all">{link}</span>
                              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                <X className="w-4 h-4 flex-shrink-0 cursor-pointer text-gray-400 hover:text-red-300 transition-colors" onClick={() => removeLink(link)} />
                              </motion.div>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    </div>

                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg glass p-3 sm:p-4 gap-2 sm:gap-0">
                          <div className="space-y-0.5 flex-1">
                            <FormLabel className="text-gray-200 text-sm sm:text-base">Published</FormLabel>
                            <div className="text-xs sm:text-sm text-gray-400">Make this research visible to users</div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-published"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                  </form>
                </Form>
                <div className="h-4 sm:h-6" />
                </ScrollArea>
                <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-t border-white/10 bg-black/20 flex-shrink-0">
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <motion.div className="sm:w-auto w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="button" variant="outline" className="glass border-0 w-full h-9 sm:h-10 text-sm sm:text-base transition-all" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                        Cancel
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        type="submit" 
                        onClick={form.handleSubmit(onSubmit)} 
                        className="w-full cosmic-glow bg-gradient-to-r from-purple-600 to-blue-600 transition-all h-9 sm:h-10 text-sm sm:text-base" 
                        disabled={createMutation.isPending || updateMutation.isPending} 
                        data-testid="button-submit"
                      >
                        {createMutation.isPending || updateMutation.isPending ? (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            Saving...
                          </motion.span>
                        ) : (editingResearch ? "Update" : "Create")}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {isLoading ? (
              <div className="text-center text-gray-300 py-12">Loading research...</div>
            ) : (
              <ScrollArea className="h-[calc(100vh-28rem)]">
                <div className="grid gap-4 pr-4">
                  <AnimatePresence>
                    {filteredAndSortedResearch().map((item: any, index: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="glass border-0 hover:scale-[1.01] transition-transform" data-testid={`card-research-${item.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-white">{item.title}</CardTitle>
                                {item.year && (
                                  <Badge variant="outline" className="border-blue-500/50 text-blue-300 cosmic-glow">
                                    {item.year}
                                  </Badge>
                                )}
                                {item.published ? (
                                  <Badge className="bg-green-600/30 text-green-300 border-green-500/50">
                                    Published
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-600/30 text-yellow-300 border-yellow-500/50">
                                    Draft
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <code className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded">
                                  ID: {item.id.substring(0, 8)}...
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(item.id)}
                                  className="h-6 px-2 text-gray-400 hover:text-white"
                                  data-testid={`button-copy-${item.id}`}
                                >
                                  {copiedId === item.id ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>

                              {(item.authors || item.institution) && (
                                <div className="text-sm text-gray-400 mb-2">
                                  {item.authors && <span>{item.authors}</span>}
                                  {item.authors && item.institution && <span> • </span>}
                                  {item.institution && <span>{item.institution}</span>}
                                </div>
                              )}
                              <CardDescription className="text-gray-300 mt-2">
                                {item.description.length > 200 ? `${item.description.substring(0, 200)}...` : item.description}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleEdit(item)} className="glass border-0 hover:scale-110 transition-transform" data-testid={`button-edit-${item.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)} className="glass border-0 text-red-300 hover:bg-red-500/20 hover:scale-110 transition-transform" data-testid={`button-delete-${item.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.tags?.map((tag: string, index: number) => (
                              <Badge key={index} className="bg-purple-600/30 text-white">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          {item.nasaOsdrLinks && item.nasaOsdrLinks.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-400 mb-1">
                                {item.nasaOsdrLinks.length} NASA OSDR link(s)
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredAndSortedResearch().length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 glass rounded-lg"
                    >
                      <p className="text-gray-400">No research found matching your search criteria.</p>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {activeTab === "assistant" && (
          <div className="space-y-6">
            <AdminAssistant />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
