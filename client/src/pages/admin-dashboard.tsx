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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, LogOut, Bot, X, Moon, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { AdminAssistant } from "@/components/admin-assistant";
import type { AdminResearch } from "@shared/schema";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white dark:text-gray-100">Admin Dashboard</h1>
            <p className="text-gray-300 dark:text-gray-400 mt-1">Manage research content</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/50"
              data-testid="button-theme-toggle"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => logoutMutation.mutate()}
              variant="outline"
              className="border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/50"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="research" className="space-y-6">
          <TabsList className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg">
            <TabsTrigger value="research" className="data-[state=active]:bg-purple-600 dark:data-[state=active]:bg-purple-700 data-[state=active]:text-white">
              Research Management
            </TabsTrigger>
            <TabsTrigger value="assistant" className="data-[state=active]:bg-purple-600 dark:data-[state=active]:bg-purple-700 data-[state=active]:text-white">
              <Bot className="w-4 h-4 mr-2" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="research" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-300 dark:text-gray-400">
                Total Research: <span className="font-bold text-white dark:text-gray-100">{research.length}</span>
              </p>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingResearch(null);
                  form.reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-800 text-white" data-testid="button-add-research">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Research
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-lg border-purple-500/30 dark:border-gray-700 text-white dark:text-gray-100">
                  <DialogHeader>
                    <DialogTitle className="text-white dark:text-gray-100">
                      {editingResearch ? "Edit Research" : "Add New Research"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-300 dark:text-gray-400">
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
                            <FormLabel className="text-gray-200 dark:text-gray-300">Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter research title" className="bg-white/10 dark:bg-gray-700/50 border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-100" data-testid="input-title" />
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
                            <FormLabel className="text-gray-200 dark:text-gray-300">Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Enter detailed description" rows={6} className="bg-white/10 dark:bg-gray-700/50 border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-100" data-testid="input-description" />
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
                              <FormLabel className="text-gray-200 dark:text-gray-300">Year</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="2024" className="bg-white/10 dark:bg-gray-700/50 border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-100" data-testid="input-year" />
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
                              <FormLabel className="text-gray-200 dark:text-gray-300">Authors</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Dr. Smith, Dr. Johnson" className="bg-white/10 dark:bg-gray-700/50 border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-100" data-testid="input-authors" />
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
                            <FormLabel className="text-gray-200 dark:text-gray-300">Institution</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., NASA Ames Research Center" className="bg-white/10 dark:bg-gray-700/50 border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-100" data-testid="input-institution" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <FormLabel className="text-gray-200 dark:text-gray-300">Tags</FormLabel>
                        <div className="mb-3">
                          <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">Quick add predefined tags:</p>
                          <div className="flex flex-wrap gap-2">
                            {PREDEFINED_TAGS.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="cursor-pointer border-purple-500/50 dark:border-purple-600/50 text-purple-300 dark:text-purple-400 hover:bg-purple-600/30 dark:hover:bg-purple-700/30"
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
                            className="bg-white/10 dark:bg-gray-700/50 border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-100"
                            data-testid="input-tag"
                          />
                          <Button type="button" onClick={addTag} variant="outline" className="border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-200" data-testid="button-add-tag">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.watch("tags").map((tag, index) => (
                            <Badge key={index} variant="secondary" className="bg-purple-600/20 dark:bg-purple-700/20 text-white dark:text-gray-200" data-testid={`badge-tag-${index}`}>
                              {tag}
                              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FormLabel className="text-gray-200 dark:text-gray-300">NASA OSDR Links</FormLabel>
                        <div className="flex gap-2">
                          <Input
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                            placeholder="Add NASA OSDR link and press Enter"
                            className="bg-white/10 dark:bg-gray-700/50 border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-100"
                            data-testid="input-link"
                          />
                          <Button type="button" onClick={addLink} variant="outline" className="border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-200" data-testid="button-add-link">
                            Add
                          </Button>
                        </div>
                        <div className="space-y-1 mt-2">
                          {form.watch("nasaOsdrLinks").map((link, index) => (
                            <div key={index} className="flex items-center gap-2 bg-white/5 dark:bg-gray-700/30 p-2 rounded" data-testid={`link-item-${index}`}>
                              <span className="text-sm text-gray-300 dark:text-gray-400 flex-1 truncate">{link}</span>
                              <X className="w-4 h-4 cursor-pointer text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-200" onClick={() => removeLink(link)} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="published"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-purple-500/30 dark:border-gray-600 p-4 bg-white/5 dark:bg-gray-700/30">
                            <div className="space-y-0.5">
                              <FormLabel className="text-gray-200 dark:text-gray-300">Published</FormLabel>
                              <div className="text-sm text-gray-400 dark:text-gray-500">Make this research visible to users</div>
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
                        <Button type="submit" className="flex-1 bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-800" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                          {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingResearch ? "Update" : "Create")}
                        </Button>
                        <Button type="button" variant="outline" className="border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-200" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="text-center text-gray-300 dark:text-gray-400 py-12">Loading research...</div>
            ) : (
              <div className="grid gap-4">
                {research.map((item: any) => (
                  <Card key={item.id} className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border-purple-500/20 dark:border-gray-700" data-testid={`card-research-${item.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-white dark:text-gray-100">{item.title}</CardTitle>
                            {item.year && (
                              <Badge variant="outline" className="border-blue-500/50 dark:border-blue-600/50 text-blue-300 dark:text-blue-400">
                                {item.year}
                              </Badge>
                            )}
                          </div>
                          {(item.authors || item.institution) && (
                            <div className="text-sm text-gray-400 dark:text-gray-500 mb-2">
                              {item.authors && <span>{item.authors}</span>}
                              {item.authors && item.institution && <span> • </span>}
                              {item.institution && <span>{item.institution}</span>}
                            </div>
                          )}
                          <CardDescription className="text-gray-300 dark:text-gray-400 mt-2">
                            {item.description.length > 200 ? `${item.description.substring(0, 200)}...` : item.description}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(item)} className="border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-200" data-testid={`button-edit-${item.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)} className="border-red-500/30 dark:border-red-600 text-red-300 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-600/20" data-testid={`button-delete-${item.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.tags?.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-purple-600/20 dark:bg-purple-700/20 text-white dark:text-gray-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={item.published ? "default" : "secondary"} className={item.published ? "bg-green-600/50 dark:bg-green-700/50 text-white" : "bg-gray-600/50 dark:bg-gray-700/50 text-gray-200"} data-testid={`badge-status-${item.id}`}>
                          {item.published ? "Published" : "Draft"}
                        </Badge>
                        {item.nasaOsdrLinks?.length > 0 && (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            {item.nasaOsdrLinks.length} NASA OSDR link(s)
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assistant">
            <AdminAssistant />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
