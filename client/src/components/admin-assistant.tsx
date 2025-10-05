import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Loader2, Sparkles, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function AdminAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant for managing research content. I can help you with:\n\n• Suggesting relevant tags for your research\n• Creating compelling descriptions\n• Finding related NASA OSDR links\n• Reviewing research entries for completeness\n• Optimizing content for search\n\nHow can I assist you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const res = await apiRequest("POST", "/api/admin/assistant", {
        message: userMessage,
        context: {},
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        },
      ]);
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get response from assistant",
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = {
      role: "user" as const,
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(message);
  }

  return (
    <Card className="cosmic-card border-0 h-[calc(100vh-16rem)] overflow-hidden">
      <CardHeader className="border-b border-white/10 dark:border-white/10 pb-4">
        <CardTitle className="flex items-center gap-3 cosmic-text-gradient text-2xl font-bold">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Bot className="w-6 h-6 text-purple-400" />
          </motion.div>
          Admin AI Assistant
        </CardTitle>
        <CardDescription className="text-gray-300 dark:text-gray-400 text-base">
          Get intelligent help with research content creation and management
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-10rem)] p-6">
        <ScrollArea className="flex-1 pr-4 mb-6">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${index}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-4 ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-purple-600/60 to-blue-600/60 text-white backdrop-blur-sm"
                        : "glass text-gray-100 dark:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      {msg.role === "user" ? (
                        <>
                          <User className="w-4 h-4" />
                          You
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          AI Assistant
                        </>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {chatMutation.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="glass rounded-xl p-4 max-w-[85%]">
                  <div className="flex items-center gap-3 text-gray-300 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    <span className="text-sm font-medium">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask for help with research content..."
            className="flex-1 glass border-0 text-white placeholder:text-gray-400 h-12 text-base focus:ring-2 focus:ring-purple-500/50 transition-all"
            disabled={chatMutation.isPending}
            data-testid="input-message"
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              type="submit"
              className="glow-button text-white h-12 w-12 p-0"
              disabled={chatMutation.isPending || !message.trim()}
              data-testid="button-send"
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        </form>
      </CardContent>
    </Card>
  );
}
