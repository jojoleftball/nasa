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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, LogOut, Bot, X, Moon, Sun, Search, Filter, Copy, Check } from "lucide-react";
import { useLocation } from "wouter";
import { AdminAssistant } from "@/components/admin-assistant";
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
      form.setValue("tags", [...currentTags, tag]);
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
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(t => t !== tag));
  }

  function addLink() {
    if (linkInput.trim()) {
      const currentLinks = form.getValues("nasaOsdrLinks");
      form.setValue("nasaOsdrLinks", [...currentLinks, linkInput.trim()]);
      setLinkInput("");
    }
  }

  function removeLink(link: string) {
    const currentLinks = form.getValues("nasaOsdrLinks");
    form.setValue("nasaOsdrLinks", currentLinks.filter(l => l !== link));
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
    <div className="min-h-screen cosmic-bg relative overflow-x-hidden">
      <div className="stars"></div>
      <div className="relative z-10 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold cosmic-text-gradient mb-2">Admin Dashboard</h1>
            <p className="text-gray-300 dark:text-gray-400">Manage research content</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="glass border-0 cosmic-glow hover:scale-110 transition-transform"
              data-testid="button-theme-toggle"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => logoutMutation.mutate()}
              variant="outline"
              className="glass border-0 hover:scale-105 transition-transform"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="research" className="space-y-6">
          <TabsList className="glass border-0">
            <TabsTrigger value="research" className="data-[state=active]:cosmic-glow data-[state=active]:text-white">
              Research Management
            </TabsTrigger>
            <TabsTrigger value="assistant" className="data-[state=active]:cosmic-glow data-[state=active]:text-white">
              <Bot className="w-4 h-4 mr-2" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="research" className="space-y-6">
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
                <Button className="cosmic-glow hover:scale-105 transition-transform bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0" data-testid="button-add-research">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Research
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-0 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white cosmic-text-gradient">
                    {editingResearch ? "Edit Research" : "Add New Research"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-300">
                    Fill in the details for the research entry
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter research title" className="glass border-0 text-white placeholder:text-gray-400" data-testid="input-title" />
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
                          <FormLabel className="text-gray-200">Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter detailed description" rows={6} className="glass border-0 text-white placeholder:text-gray-400" data-testid="input-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200">Year</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="2024" className="glass border-0 text-white placeholder:text-gray-400" data-testid="input-year" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="authors"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-gray-200">Authors</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Dr. Smith, Dr. Johnson" className="glass border-0 text-white placeholder:text-gray-400" data-testid="input-authors" />
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
                          <FormLabel className="text-gray-200">Institution</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., NASA Ames Research Center" className="glass border-0 text-white placeholder:text-gray-400" data-testid="input-institution" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel className="text-gray-200">Tags</FormLabel>
                      <div className="mb-3">
                        <p className="text-sm text-gray-400 mb-2">Quick add predefined tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {PREDEFINED_TAGS.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer border-purple-500/50 text-purple-300 hover:bg-purple-600/30 hover:scale-105 transition-transform"
                              onClick={() => addPredefinedTag(tag)}
                              data-testid={`badge-predefined-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              + {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          placeholder="Add tag and press Enter"
                          className="glass border-0 text-white placeholder:text-gray-400"
                          data-testid="input-tag"
                        />
                        <Button type="button" onClick={addTag} variant="outline" className="glass border-0" data-testid="button-add-tag">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.watch("tags").map((tag, index) => (
                          <Badge key={index} className="bg-purple-600/30 text-white" data-testid={`badge-tag-${index}`}>
                            {tag}
                            <X className="w-3 h-3 ml-1 cursor-pointer hover:scale-110 transition-transform" onClick={() => removeTag(tag)} />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <FormLabel className="text-gray-200">NASA OSDR Links</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                          placeholder="Add NASA OSDR link and press Enter"
                          className="glass border-0 text-white placeholder:text-gray-400"
                          data-testid="input-link"
                        />
                        <Button type="button" onClick={addLink} variant="outline" className="glass border-0" data-testid="button-add-link">
                          Add
                        </Button>
                      </div>
                      <div className="space-y-1 mt-2">
                        {form.watch("nasaOsdrLinks").map((link, index) => (
                          <div key={index} className="flex items-center gap-2 glass p-2 rounded" data-testid={`link-item-${index}`}>
                            <span className="text-sm text-gray-300 flex-1 truncate">{link}</span>
                            <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-white hover:scale-110 transition-transform" onClick={() => removeLink(link)} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg glass p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-gray-200">Published</FormLabel>
                            <div className="text-sm text-gray-400">Make this research visible to users</div>
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

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 cosmic-glow bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 transition-transform" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                        {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingResearch ? "Update" : "Create")}
                      </Button>
                      <Button type="button" variant="outline" className="glass border-0" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {isLoading ? (
              <div className="text-center text-gray-300 py-12">Loading research...</div>
            ) : (
              <div className="grid gap-4">
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
            )}
          </TabsContent>

          <TabsContent value="assistant">
            <AdminAssistant />
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
}
