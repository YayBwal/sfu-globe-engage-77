
import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';

type ChatCategory = 'mental-health' | 'career-guide';

const CATEGORY_COLORS = {
  'mental-health': 'bg-purple-500 hover:bg-purple-600 text-white',
  'career-guide': 'bg-blue-500 hover:bg-blue-600 text-white',
};

const CATEGORY_HEADERS = {
  'mental-health': 'Mental Health Support',
  'career-guide': 'Career Guidance',
};

// OpenAI API Key - in production, this should be stored securely
const OPENAI_API_KEY = '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';

export const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ChatCategory>('mental-health');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const handleTabChange = (value: string) => {
    setCurrentCategory(value as ChatCategory);
    // Clear chat when switching categories
    setChatHistory([]);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    setChatHistory([...chatHistory, { role: 'user', content: message }]);
    const userMessage = message;
    setMessage('');
    setIsLoading(true);
    
    try {
      // Prepare system message based on category
      let systemMessage = '';
      
      if (currentCategory === 'mental-health') {
        systemMessage = "You are a supportive mental health assistant. Provide empathetic, thoughtful responses to users seeking mental health support. Do not provide medical diagnoses or replace professional help. Always encourage users to seek professional help for serious concerns.";
      } else {
        systemMessage = "You are a career guidance assistant. Provide helpful advice on career development, job searching, resume building, and professional growth. Offer practical tips and resources that can help users advance in their careers.";
      }
      
      // Call OpenAI API with exponential backoff for rate limiting
      const delay = retryCount > 0 ? Math.min(2 ** retryCount * 1000, 10000) : 0;
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemMessage },
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: userMessage }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });
      
      if (response.status === 429) {
        // Rate limit exceeded
        if (retryCount < 3) {
          setRetryCount(retryCount + 1);
          throw new Error('Rate limit exceeded. Retrying...');
        } else {
          throw new Error('API is currently busy. Please try again later.');
        }
      }
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      // Reset retry count on success
      setRetryCount(0);
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      let errorMessage = 'Failed to get AI response. Please try again later.';
      
      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          errorMessage = 'The AI service is currently busy. Please wait a moment and try again.';
        } else if (error.message.includes('API is currently busy')) {
          errorMessage = 'The AI service is experiencing high demand. Please try again in a few minutes.';
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Fallback response
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            className={cn(
              "rounded-full p-3 shadow-lg", 
              isOpen ? "bg-gray-700 hover:bg-gray-800" : CATEGORY_COLORS[currentCategory]
            )}
          >
            {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="mt-2 rounded-lg shadow-lg border bg-white w-80 sm:w-96 overflow-hidden">
            <div className="p-3 bg-gray-100 border-b font-medium">
              <h3 className="text-center">AI is here to help</h3>
            </div>
            
            <Tabs defaultValue="mental-health" onValueChange={handleTabChange}>
              <TabsList className="w-full">
                <TabsTrigger value="mental-health" className="flex-1">Mental Health</TabsTrigger>
                <TabsTrigger value="career-guide" className="flex-1">Career Guide</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mental-health" className="m-0">
                <div className={cn("p-2 bg-purple-100 border-b", chatHistory.length === 0 ? "block" : "hidden")}>
                  <p className="text-sm text-center text-purple-800 font-medium">{CATEGORY_HEADERS['mental-health']}</p>
                </div>
                <ChatMessages messages={chatHistory} />
              </TabsContent>
              
              <TabsContent value="career-guide" className="m-0">
                <div className={cn("p-2 bg-blue-100 border-b", chatHistory.length === 0 ? "block" : "hidden")}>
                  <p className="text-sm text-center text-blue-800 font-medium">{CATEGORY_HEADERS['career-guide']}</p>
                </div>
                <ChatMessages messages={chatHistory} />
              </TabsContent>
            </Tabs>
            
            <div className="p-3 border-t bg-gray-50">
              <div className="flex">
                <Textarea 
                  placeholder="Type your message..." 
                  className="min-h-10 flex-1 resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                />
                <Button 
                  className={cn(
                    "ml-2 px-3", 
                    CATEGORY_COLORS[currentCategory]
                  )}
                  onClick={handleSendMessage}
                  disabled={isLoading || !message.trim()}
                >
                  {isLoading ? 
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                    <Send className="h-4 w-4" />
                  }
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const ChatMessages = ({ messages }: { messages: { role: 'user' | 'assistant', content: string }[] }) => {
  if (messages.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 italic">
        <p>Ask me anything, I'm here to help!</p>
      </div>
    );
  }
  
  return (
    <div className="h-60 overflow-y-auto p-3 space-y-3">
      {messages.map((msg, index) => (
        <div 
          key={index} 
          className={cn(
            "max-w-[80%] p-2 rounded-lg",
            msg.role === 'user' 
              ? "bg-gray-100 ml-auto" 
              : "bg-blue-100 mr-auto"
          )}
        >
          {msg.content}
        </div>
      ))}
    </div>
  );
};
