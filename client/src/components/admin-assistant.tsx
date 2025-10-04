import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    <Card className="glass border-0 h-[calc(100vh-16rem)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white dark:text-gray-100">
          <Bot className="w-5 h-5 text-purple-400 dark:text-purple-500" />
          Admin AI Assistant
        </CardTitle>
        <CardDescription className="text-gray-300 dark:text-gray-400">
          Get help with research content creation and management
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-8rem)]">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${index}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === "user"
                      ? "bg-purple-600/50 dark:bg-purple-700/50 text-white"
                      : "bg-white/10 dark:bg-gray-700/50 text-gray-100 dark:text-gray-200"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {msg.role === "user" ? "You" : "AI Assistant"}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white/10 dark:bg-gray-700/50 rounded-lg p-4 max-w-[80%]">
                  <div className="flex items-center gap-2 text-gray-300 dark:text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask for help with research content..."
            className="flex-1 bg-white/10 dark:bg-gray-700/50 border-purple-500/30 dark:border-gray-600 text-white dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            disabled={chatMutation.isPending}
            data-testid="input-message"
          />
          <Button
            type="submit"
            className="bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-800 text-white"
            disabled={chatMutation.isPending || !message.trim()}
            data-testid="button-send"
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
