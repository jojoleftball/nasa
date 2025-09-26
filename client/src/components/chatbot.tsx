import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bot, Send, X, User, Settings, Sparkles, BarChart3, Database, BookOpen, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

enum ConversationMode {
  RESEARCH_ASSISTANT = "research_assistant",
  STUDY_ANALYZER = "study_analyzer", 
  DATA_EXPLORER = "data_explorer",
  METHODOLOGY_EXPERT = "methodology_expert"
}

interface ChatContext {
  currentStudy?: any;
  userInterests?: string[];
  recentSearches?: string[];
  currentPage?: string;
  favoriteStudies?: any[];
  researchGoals?: string[];
}

export function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<ConversationMode>(ConversationMode.RESEARCH_ASSISTANT);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatHistory = [] } = useQuery<Message[]>({
    queryKey: ["/api/chat/history"],
    enabled: isOpen,
  });

  const chatMutation = useMutation({
    mutationFn: async ({ 
      message, 
      context, 
      mode, 
      currentStudy, 
      currentPage 
    }: { 
      message: string; 
      context?: any; 
      mode?: ConversationMode;
      currentStudy?: any;
      currentPage?: string;
    }) => {
      const res = await apiRequest("POST", "/api/chat", { 
        message, 
        context, 
        mode, 
        currentStudy, 
        currentPage: window.location.pathname 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setMessage("");
      // Invalidate and refetch chat history
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
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
      chatMutation.mutate({ 
        message: message.trim(), 
        mode,
        currentPage: window.location.pathname
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getModeIcon = (currentMode: ConversationMode) => {
    switch (currentMode) {
      case ConversationMode.RESEARCH_ASSISTANT:
        return <Sparkles className="h-4 w-4" />;
      case ConversationMode.STUDY_ANALYZER:
        return <BarChart3 className="h-4 w-4" />;
      case ConversationMode.DATA_EXPLORER:
        return <Database className="h-4 w-4" />;
      case ConversationMode.METHODOLOGY_EXPERT:
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getModeLabel = (currentMode: ConversationMode) => {
    switch (currentMode) {
      case ConversationMode.RESEARCH_ASSISTANT:
        return "Research Assistant";
      case ConversationMode.STUDY_ANALYZER:
        return "Study Analyzer";
      case ConversationMode.DATA_EXPLORER:
        return "Data Explorer";
      case ConversationMode.METHODOLOGY_EXPERT:
        return "Methodology Expert";
      default:
        return "Assistant";
    }
  };

  const getWelcomeMessage = () => {
    switch (mode) {
      case ConversationMode.RESEARCH_ASSISTANT:
        return `Hello! I'm ${user?.chatbotName || "Ria"}, your advanced NASA space biology research assistant. I can help you discover studies, understand research concepts, and guide your exploration of space life sciences. What would you like to research today?`;
      case ConversationMode.STUDY_ANALYZER:
        return `I'm in Study Analyzer mode. I can provide detailed analysis of research papers, compare methodologies across studies, and help you understand the strengths and limitations of different approaches. Share a study or ask for comparative analysis!`;
      case ConversationMode.DATA_EXPLORER:
        return `Data Explorer mode activated! I can help you navigate NASA's OSDR database, search for specific datasets, identify research patterns, and guide you through complex space biology data. What data are you looking for?`;
      case ConversationMode.METHODOLOGY_EXPERT:
        return `I'm your Methodology Expert. I can help with experimental design, suggest appropriate controls, recommend statistical approaches, and troubleshoot research methodology challenges. What aspect of your research design needs attention?`;
      default:
        return `Hello! I'm ${user?.chatbotName || "Ria"}, your space biology research assistant.`;
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
            className="absolute bottom-16 right-0 w-96 mb-4"
          >
            <Card className="glass border-0 shadow-2xl">
              <CardHeader className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getModeIcon(mode)}
                    <span className="font-medium">{user?.chatbotName || "Ria"} - {getModeLabel(mode)}</span>
                    <Badge variant="secondary" className="text-xs">
                      Advanced AI
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                      data-testid="button-chat-settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      data-testid="button-close-chat"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Conversation Mode</label>
                          <Select value={mode} onValueChange={(value) => setMode(value as ConversationMode)}>
                            <SelectTrigger className="w-full mt-1" data-testid="select-conversation-mode">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ConversationMode.RESEARCH_ASSISTANT}>
                                <div className="flex items-center space-x-2">
                                  <Sparkles className="h-4 w-4" />
                                  <span>Research Assistant</span>
                                </div>
                              </SelectItem>
                              <SelectItem value={ConversationMode.STUDY_ANALYZER}>
                                <div className="flex items-center space-x-2">
                                  <BarChart3 className="h-4 w-4" />
                                  <span>Study Analyzer</span>
                                </div>
                              </SelectItem>
                              <SelectItem value={ConversationMode.DATA_EXPLORER}>
                                <div className="flex items-center space-x-2">
                                  <Database className="h-4 w-4" />
                                  <span>Data Explorer</span>
                                </div>
                              </SelectItem>
                              <SelectItem value={ConversationMode.METHODOLOGY_EXPERT}>
                                <div className="flex items-center space-x-2">
                                  <BookOpen className="h-4 w-4" />
                                  <span>Methodology Expert</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mode === ConversationMode.RESEARCH_ASSISTANT && "General research guidance and study discovery"}
                          {mode === ConversationMode.STUDY_ANALYZER && "In-depth analysis and comparison of research papers"}
                          {mode === ConversationMode.DATA_EXPLORER && "Navigate and query NASA OSDR datasets"}
                          {mode === ConversationMode.METHODOLOGY_EXPERT && "Experimental design and methodology guidance"}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
                  {chatHistory.length === 0 && (
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        {getModeIcon(mode)}
                      </div>
                      <div className="flex-1">
                        <div className="glass rounded-lg p-3 text-sm">
                          {getWelcomeMessage()}
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
                          {getModeIcon(mode)}
                        </div>
                      )}
                      
                      <div className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}>
                        <div className={`inline-block p-3 text-sm rounded-lg max-w-xs ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "glass"
                        }`}>
                          <div className="whitespace-pre-wrap">
                            {msg.content}
                          </div>
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
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      </div>
                      <div className="flex-1">
                        <div className="glass rounded-lg p-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">
                              {mode === ConversationMode.DATA_EXPLORER && "Searching NASA OSDR database..."}
                              {mode === ConversationMode.STUDY_ANALYZER && "Analyzing research data..."}
                              {mode === ConversationMode.METHODOLOGY_EXPERT && "Evaluating methodology..."}
                              {mode === ConversationMode.RESEARCH_ASSISTANT && "Processing your query..."}
                            </span>
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                            </div>
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
                      placeholder={`Ask ${user?.chatbotName || "Ria"} about space biology research...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={chatMutation.isPending}
                      data-testid="input-chat-message"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={!message.trim() || chatMutation.isPending}
                      className="glow"
                      data-testid="button-send-message"
                    >
                      {chatMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {user?.interests && user.interests.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Context: {user.interests.slice(0, 2).join(", ")}
                      {user.interests.length > 2 && ` +${user.interests.length - 2} more`}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full glow pulse-glow relative"
        data-testid="button-chat-toggle"
      >
        <Bot className="h-6 w-6" />
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 w-6 h-6 text-xs p-0 flex items-center justify-center"
        >
          AI
        </Badge>
      </Button>
    </div>
  );
}