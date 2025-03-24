// This is a placeholder for the AI service
// You'll need to integrate with an actual AI API (like OpenAI, Google AI, etc.)

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  private static instance: AIService;
  private context: ChatMessage[] = [];
  private static readonly API_URL = '/api/huggingface/models/facebook/opt-1.3b';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000; // 2 seconds
  private static readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
  private static lastRequestTime = 0;

  private constructor() {
    // Initialize with system message
    this.context.push({
      role: 'system',
      content: `You are an intelligent study assistant for SFU students. You can help with:
- Understanding course concepts and materials
- Study strategies and time management
- Programming and technical questions
- Math and science problems
- Writing and research
- Exam preparation
- Academic stress management
- Study group organization

Be friendly, professional, and provide detailed, helpful responses. When appropriate, include examples and step-by-step explanations.`
    });
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async ensureRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - AIService.lastRequestTime;
    
    if (timeSinceLastRequest < AIService.MIN_REQUEST_INTERVAL) {
      await this.delay(AIService.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    
    AIService.lastRequestTime = Date.now();
  }

  async getResponse(userMessage: string): Promise<string> {
    let retryCount = 0;
    const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    
    console.log('API Key available:', !!apiKey);
    console.log('API Key length:', apiKey?.length);

    if (!apiKey) {
      throw new Error('Hugging Face API key not found. Please check your environment variables.');
    }

    while (retryCount < AIService.MAX_RETRIES) {
      try {
        await this.ensureRateLimit();
        retryCount++;
        console.log(`Attempt ${retryCount} of ${AIService.MAX_RETRIES}`);

        // Format conversation history for the model
        const formattedHistory = this.context.map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`).join('\n');

        const prompt = `${formattedHistory}\nHuman: ${userMessage}\nAssistant:`;

        const response = await fetch(AIService.API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_length: 200,
              temperature: 0.7,
              top_p: 0.9,
              return_full_text: false,
              wait_for_model: true
            }
          })
        });

        console.log('API Response status:', response.status);
        console.log('API Response status text:', response.statusText);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.log('API Error details:', errorData);

          if (response.status === 429) {
            const waitTime = AIService.RETRY_DELAY * Math.pow(2, retryCount - 1);
            console.log(`Rate limit hit. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          if (response.status === 401) {
            throw new Error('Invalid Hugging Face API key. Please check your credentials.');
          }

          if (response.status === 403) {
            throw new Error('Access denied. Please check your Hugging Face API key permissions.');
          }

          if (response.status === 503) {
            const waitTime = AIService.RETRY_DELAY * Math.pow(2, retryCount - 1);
            console.log(`Service unavailable. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          if (response.status === 500 && errorData.error?.includes('Model too busy')) {
            const waitTime = AIService.RETRY_DELAY * Math.pow(2, retryCount - 1);
            console.log(`Model busy. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          throw new Error(`API request failed: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response data:', data);

        if (!Array.isArray(data) || data.length === 0 || !data[0].generated_text) {
          throw new Error('Invalid response format from Hugging Face API');
        }

        const responseText = data[0].generated_text.trim();
        this.addMessage('user', userMessage);
        this.addMessage('assistant', responseText);
        return responseText;

      } catch (error) {
        console.error('Error getting AI response:', error);
        if (retryCount === AIService.MAX_RETRIES) {
          // If all retries failed, return a mock response
          const mockResponse = this.generateMockResponse(userMessage);
          this.addMessage('user', userMessage);
          this.addMessage('assistant', mockResponse);
          return mockResponse;
        }
      }
    }

    // If we get here, all retries failed
    const mockResponse = this.generateMockResponse(userMessage);
    this.addMessage('user', userMessage);
    this.addMessage('assistant', mockResponse);
    return mockResponse;
  }

  private generateMockResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Subject-specific responses
    if (lowerMessage.includes('math') || lowerMessage.includes('calculus')) {
      return "For math and calculus:\n1. Practice solving problems step by step\n2. Use visual aids and graphs\n3. Review fundamental concepts\n4. Work with study groups\n5. Use online resources like Khan Academy\n\nWould you like specific help with a math topic?";
    }

    if (lowerMessage.includes('programming') || lowerMessage.includes('coding')) {
      return "For programming:\n1. Start with basic concepts\n2. Practice coding daily\n3. Work on small projects\n4. Use online platforms like LeetCode\n5. Join coding communities\n\nWhich programming language or concept would you like help with?";
    }

    if (lowerMessage.includes('science') || lowerMessage.includes('physics') || lowerMessage.includes('chemistry')) {
      return "For science subjects:\n1. Understand core concepts first\n2. Use diagrams and models\n3. Practice problem-solving\n4. Review formulas and equations\n5. Conduct experiments when possible\n\nWhich specific science topic would you like to explore?";
    }

    // Study strategy responses
    if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
      return "I'm here to help! I can assist you with:\n- Understanding course concepts\n- Practice problems\n- Study strategies\n- Time management\n- Subject-specific guidance\n\nWhat specific topic would you like help with?";
    }

    if (lowerMessage.includes('study') || lowerMessage.includes('learn')) {
      return "Here are some effective study tips:\n1. Create a study schedule\n2. Take regular breaks\n3. Use active recall\n4. Practice with quizzes\n5. Join study groups\n6. Use flashcards\n7. Teach others\n\nWould you like more specific advice about any of these methods?";
    }

    if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
      return "For quiz preparation:\n1. Review your notes regularly\n2. Practice with sample questions\n3. Create flashcards\n4. Join study sessions\n5. Get enough rest before the quiz\n6. Review past quizzes\n7. Focus on weak areas\n\nNeed help with a specific subject?";
    }

    if (lowerMessage.includes('time') || lowerMessage.includes('schedule')) {
      return "Time management tips:\n1. Use a planner or calendar\n2. Break tasks into smaller chunks\n3. Set specific study times\n4. Avoid procrastination\n5. Take regular breaks\n6. Prioritize tasks\n7. Review and adjust your schedule\n\nWould you like help creating a study schedule?";
    }

    if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety')) {
      return "Managing academic stress:\n1. Practice deep breathing\n2. Exercise regularly\n3. Get enough sleep\n4. Take breaks\n5. Talk to friends or counselors\n6. Stay organized\n7. Set realistic goals\n\nWould you like more specific stress management techniques?";
    }

    if (lowerMessage.includes('group') || lowerMessage.includes('team')) {
      return "Study group tips:\n1. Find dedicated study partners\n2. Set clear goals\n3. Share notes and resources\n4. Teach each other\n5. Stay focused\n6. Meet regularly\n7. Use online collaboration tools\n\nNeed help finding or organizing a study group?";
    }

    // Default response
    return "I'm your AI study assistant! I can help you with:\n- Understanding course concepts\n- Study strategies\n- Time management\n- Subject-specific guidance\n- Quiz preparation\n- Stress management\n\nWhat would you like to learn about?";
  }

  clearContext() {
    // Keep the system message but clear the rest
    this.context = [this.context[0]];
  }

  private addMessage(role: 'user' | 'assistant', content: string) {
    this.context.push({
      role,
      content
    });
  }
} 