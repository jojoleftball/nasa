import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bot, Send, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatHistory = [] } = useQuery<Message[]>({
    queryKey: ["/api/chat/history"],
    enabled: isOpen,
  });

  const chatMutation = useMutation({
    mutationFn: async ({ message, context }: { message: string; context?: string }) => {
      const res = await apiRequest("POST", "/api/chat", { message, context });
      return await res.json();
    },
    onSuccess: (data) => {
      setMessage("");
      // The chat history will be refetched automatically due to query invalidation
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = () => {
    if (message.trim()) {
      chatMutation.mutate({ message: message.trim() });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 mb-4"
          >
            <Card className="glass border-0 shadow-2xl">
              <CardHeader className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <span className="font-medium">{user?.chatbotName || "Ria"} - Space Biology Assistant</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    data-testid="button-close-chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="h-80 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
                  {chatHistory.length === 0 && (
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="glass rounded-lg p-3 text-sm">
                          Hello! I'm {user?.chatbotName || "Ria"}, your space biology research assistant. 
                          I can help you understand NASA's research data, explain scientific concepts, 
                          and find relevant studies. What would you like to know?
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {chatHistory.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex items-start space-x-2 ${
                        msg.role === "user" ? "justify-end" : ""
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      
                      <div className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}>
                        <div className={`inline-block p-3 text-sm rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "glass"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                      
                      {msg.role === "user" && (
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {chatMutation.isPending && (
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className="glass rounded-lg p-3 text-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 border-t border-border">
                  <div className="flex space-x-2">
                    <Input
                      placeholder={`Ask ${user?.chatbotName || "Ria"} about space biology...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={chatMutation.isPending}
                      data-testid="input-chat-message"
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={!message.trim() || chatMutation.isPending}
                      className="glow"
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full glow pulse-glow"
        data-testid="button-chat-toggle"
      >
        <Bot className="h-6 w-6" />
      </Button>
    </div>
  );
}
