
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Clock, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useGaming } from '@/contexts/GamingContext';
import { supabase } from '@/integrations/supabase/client';

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

type QuizState = 'intro' | 'playing' | 'results';

const QuizSection: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { addQuizScore } = useGaming();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('category');
        
        if (error) throw error;
        
        if (data) {
          const uniqueCategories = [...new Set(data.map(item => item.category))];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch questions based on category and difficulty
  const fetchQuestions = async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('quiz_questions')
        .select('*');
      
      // Apply category filter if not 'all'
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      // Apply difficulty filter if not 'all'
      if (difficulty !== 'all') {
        query = query.eq('difficulty', difficulty);
      }
      
      // Limit and order
      const { data, error } = await query
        .limit(10)
        .order('id', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Shuffle the questions
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
        return true;
      } else {
        toast({
          title: "No questions found",
          description: "Try selecting a different category or difficulty",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Start the quiz
  const startQuiz = async () => {
    const success = await fetchQuestions();
    
    if (success) {
      setQuizState('playing');
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setScore(0);
      setStartTime(Date.now());
    }
  };

  // Handle option selection
  const handleOptionClick = (index: number) => {
    if (selectedOption !== null) return; // Prevent changing answer after selection
    
    setSelectedOption(index);
    
    // Check if answer is correct
    const currentQuestion = questions[currentQuestionIndex];
    if (index === currentQuestion.correctAnswer) {
      // Award points based on difficulty
      let points = 10;
      if (currentQuestion.difficulty === 'medium') points = 20;
      if (currentQuestion.difficulty === 'hard') points = 30;
      
      setScore(prevScore => prevScore + points);
    }
    
    // Move to next question after a delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setSelectedOption(null);
      } else {
        // Quiz completed
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
        setQuizState('results');
        
        // Save score if user is logged in
        if (user) {
          addQuizScore({
            userId: user.id,
            userName: user.email || 'Anonymous',
            quizId: 'general',
            quizName: `${selectedCategory} (${difficulty})`,
            score,
            timeTaken: Math.floor((Date.now() - startTime) / 1000)
          });
        }
      }
    }, 1500);
  };

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (quizState === 'playing') {
      timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizState, startTime]);

  // Reset quiz
  const resetQuiz = () => {
    setQuizState('intro');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setTimeElapsed(0);
  };

  return (
    <div className="min-h-[60vh]">
      {quizState === 'intro' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Test Your Knowledge</h2>
            <p className="text-gray-600">Challenge yourself with our interactive quizzes and see how you rank on the leaderboard.</p>
          </div>
          
          <div className="bg-sfu-lightgray/30 rounded-xl p-6 mb-8">
            <h3 className="font-medium text-lg mb-4">Quiz Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sfu-red focus:border-transparent"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                  {['all', 'easy', 'medium', 'hard'].map(level => (
                    <Button 
                      key={level}
                      variant={difficulty === level ? "default" : "outline"}
                      className={difficulty === level ? "bg-sfu-red hover:bg-sfu-red/90" : ""}
                      onClick={() => setDifficulty(level as any)}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              size="lg"
              className="bg-sfu-red hover:bg-sfu-red/90 text-white font-medium px-8"
              onClick={startQuiz}
              disabled={isLoading}
            >
              {isLoading ? "Loading Questions..." : "Start Quiz"}
            </Button>
          </div>
        </motion.div>
      )}
      
      {quizState === 'playing' && questions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-sfu-black text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-sm">Interactive Quiz</div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs">
                  <Clock size={14} />
                  <span>{formatTime(timeElapsed)}</span>
                </div>
                
                <div className="px-2 py-1 bg-white/10 rounded text-xs">
                  Score: {score}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Question {currentQuestionIndex + 1}/{questions.length}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    {questions[currentQuestionIndex].difficulty.toUpperCase()}
                  </span>
                </div>
                <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2" />
              </div>
              
              <h3 className="text-xl font-medium mb-6">
                {questions[currentQuestionIndex].question}
              </h3>
              
              <div className="space-y-3 mb-6">
                {questions[currentQuestionIndex].options.map((option, index) => (
                  <div 
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedOption === index 
                        ? selectedOption === questions[currentQuestionIndex].correctAnswer
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-sfu-red/50'
                    }`}
                    onClick={() => handleOptionClick(index)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {selectedOption === index && (
                        selectedOption === questions[currentQuestionIndex].correctAnswer
                          ? <CheckCircle size={20} className="text-green-500" />
                          : <XCircle size={20} className="text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <Button 
                  variant="outline"
                  onClick={resetQuiz}
                >
                  Abandon Quiz
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {quizState === 'results' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-20 h-20 bg-sfu-red/10 rounded-full flex items-center justify-center text-sfu-red mx-auto mb-6">
              <CheckCircle size={32} />
            </div>
            
            <h2 className="text-2xl font-display font-bold mb-4">Quiz Complete!</h2>
            
            <p className="text-gray-600 mb-8">
              Great job! You've completed the quiz. Here's how you did:
            </p>
            
            <div className="grid grid-cols-2 gap-6 max-w-xs mx-auto mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">Score</div>
                <div className="text-3xl font-bold text-sfu-red">{score}</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">Time</div>
                <div className="text-3xl font-bold">{formatTime(timeElapsed)}</div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={startQuiz}
              >
                Try Again
              </Button>
              
              <Button 
                className="bg-sfu-red text-white hover:bg-sfu-red/90"
                onClick={resetQuiz}
              >
                Back to Categories
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QuizSection;
