
import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Sparkles, Brain, Briefcase } from 'lucide-react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatBubbleProps {
  apiKey?: string;
}

const AIChatBubble: React.FC<AIChatBubbleProps> = ({ apiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mental-health' | 'career-guide'>('mental-health');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getWelcomeMessage = () => {
    if (activeTab === 'mental-health') {
      return "Hi there! I'm your mental health assistant. How are you feeling today?";
    } else {
      return "Hello! I'm your career guide assistant. What career questions do you have?";
    }
  };

  // Initialize welcome message when tab changes
  useEffect(() => {
    if (messages.length === 0 || messages[0].sender !== 'ai') {
      setMessages([
        {
          id: Date.now().toString(),
          content: getWelcomeMessage(),
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    }
  }, [activeTab]);

  const handleTabChange = (value: 'mental-health' | 'career-guide') => {
    setActiveTab(value);
    // Reset messages with new welcome message for the selected tab
    setMessages([
      {
        id: Date.now().toString(),
        content: value === 'mental-health' 
          ? "Hi there! I'm your mental health assistant. How are you feeling today?" 
          : "Hello! I'm your career guide assistant. What career questions do you have?",
        sender: 'ai',
        timestamp: new Date()
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Check if we have an API key
      if (!apiKey) {
        throw new Error("API key not configured");
      }
      
      // Prepare the prompt based on active tab
      const systemPrompt = activeTab === 'mental-health' 
        ? "You are a compassionate mental health assistant. Provide supportive, empathetic responses to students who may be dealing with stress, anxiety, or other mental health challenges. Suggest coping strategies and resources when appropriate. Never provide medical advice or diagnosis."
        : "You are a knowledgeable career guide assistant. Help students explore career paths, provide information about job opportunities in different fields, and offer advice on resume building, interview preparation, and professional development.";
      
      // Call AI API here - for now we'll use a mock response while waiting for actual API integration
      // This is where you would integrate the actual API call
      
      // Simulate API response delay
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: generateMockResponse(inputValue, activeTab),
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Temporary mock response generator
  const generateMockResponse = (input: string, category: 'mental-health' | 'career-guide') => {
    if (category === 'mental-health') {
      return `I understand how you feel about "${input}". Remember that it's normal to have ups and downs. Would you like to explore some coping strategies?`;
    } else {
      return `Regarding your career question about "${input}", there are several paths you could consider. Would you like more specific advice on education requirements or job prospects?`;
    }
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center ${
              activeTab === 'mental-health' 
                ? 'bg-gradient-to-br from-violet-600 to-indigo-700' 
                : 'bg-gradient-to-br from-blue-600 to-cyan-700'
            }`}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <MessageCircle className="h-6 w-6 text-white" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <div 
            className={`w-80 sm:w-96 h-[450px] rounded-2xl shadow-xl overflow-hidden flex flex-col ${
              activeTab === 'mental-health' 
                ? 'bg-gradient-to-br from-violet-50 to-white border border-violet-200' 
                : 'bg-gradient-to-br from-blue-50 to-white border border-blue-200'
            }`}
          >
            {/* Chat Header */}
            <div className={`p-4 ${
              activeTab === 'mental-health' 
                ? 'bg-gradient-to-r from-violet-600 to-indigo-700' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-700'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-white/90 text-xs mt-1">AI is here to help with your questions</p>
            </div>
            
            {/* Chat Tabs */}
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => handleTabChange(value as 'mental-health' | 'career-guide')}
              className="flex-1 flex flex-col"
            >
              <TabsList className="w-full grid grid-cols-2 p-0 h-12">
                <TabsTrigger 
                  value="mental-health" 
                  className={`data-[state=active]:shadow-none data-[state=active]:text-violet-700 data-[state=active]:bg-violet-50 rounded-none border-b`}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Mental Health
                </TabsTrigger>
                <TabsTrigger 
                  value="career-guide" 
                  className={`data-[state=active]:shadow-none data-[state=active]:text-blue-700 data-[state=active]:bg-blue-50 rounded-none border-b`}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Career Guide
                </TabsTrigger>
              </TabsList>
              
              {/* Chat Messages Container - Shared between tabs */}
              <div className="flex-1 overflow-y-auto p-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'ai' && (
                      <div className="mr-2 mt-1">
                        <Avatar className={`h-8 w-8 ${
                          activeTab === 'mental-health' 
                            ? 'bg-violet-100 text-violet-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          <AvatarFallback>
                            {activeTab === 'mental-health' ? <Brain className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div 
                      className={`max-w-[80%] p-3 rounded-xl text-sm ${
                        message.sender === 'user' 
                          ? 'bg-gray-200 text-gray-800 rounded-tr-none' 
                          : activeTab === 'mental-health'
                            ? 'bg-violet-100 text-gray-800 rounded-tl-none' 
                            : 'bg-blue-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="mr-2 mt-1">
                      <Avatar className={`h-8 w-8 ${
                        activeTab === 'mental-health' 
                          ? 'bg-violet-100 text-violet-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        <AvatarFallback>
                          {activeTab === 'mental-health' ? <Brain className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className={`p-3 rounded-xl text-sm ${
                      activeTab === 'mental-health'
                        ? 'bg-violet-100 text-gray-800' 
                        : 'bg-blue-100 text-gray-800'
                    }`}>
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 rounded-full animate-pulse delay-0 bg-gray-400"></div>
                        <div className="h-2 w-2 rounded-full animate-pulse delay-150 bg-gray-400"></div>
                        <div className="h-2 w-2 rounded-full animate-pulse delay-300 bg-gray-400"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Type your message..." 
                    className="resize-none"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    className={`shrink-0 ${
                      activeTab === 'mental-health' 
                        ? 'bg-violet-600 hover:bg-violet-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleSendMessage}
                    disabled={isLoading}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </Tabs>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AIChatBubble;
