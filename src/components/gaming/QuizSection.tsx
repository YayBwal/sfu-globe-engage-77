
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Question, useGaming } from '@/contexts/GamingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Activity, Clock, Award, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const QuizSection = () => {
  const { questions, fetchQuestions, saveQuizScore } = useGaming();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizEndTime, setQuizEndTime] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'completed'>('idle');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [category, setCategory] = useState<string>('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  useEffect(() => {
    fetchQuestions();
  }, []);
  
  // Extract available categories once questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      const categories = [...new Set(questions.map(q => q.category))];
      setAvailableCategories(categories);
    }
  }, [questions]);
  
  const startQuiz = () => {
    // Filter questions by difficulty and category
    let filteredQuestions = [...questions];
    
    if (difficulty !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }
    
    if (category !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }
    
    // If no questions match the criteria
    if (filteredQuestions.length === 0) {
      toast({
        title: 'No questions available',
        description: 'No questions match your selected criteria. Try different filters.',
        variant: 'destructive'
      });
      return;
    }
    
    // Get 5 random questions
    const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    setCurrentQuizQuestions(selected);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizStartTime(Date.now());
    setQuizEndTime(null);
    setQuizState('active');
    setFeedback(null);
    setSelectedOption(null);
  };
  
  const handleOptionSelect = (optionIndex: number) => {
    if (feedback !== null) return; // Prevent changing answer after submitting
    
    setSelectedOption(optionIndex);
  };
  
  const checkAnswer = () => {
    if (selectedOption === null) return;
    
    const currentQuestion = currentQuizQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Move to next question after 1.5 seconds
    setTimeout(() => {
      if (currentQuestionIndex < currentQuizQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        // Quiz completed
        const endTime = Date.now();
        setQuizEndTime(endTime);
        setQuizState('completed');
        
        // If user is logged in, save the score
        if (user) {
          const timeTaken = Math.round((endTime - (quizStartTime || endTime)) / 1000);
          saveQuizScore(
            'general-knowledge-quiz', 
            `${category.charAt(0).toUpperCase() + category.slice(1)} Quiz (${difficulty})`, 
            score + (isCorrect ? 1 : 0), 
            timeTaken
          );
        }
      }
    }, 1500);
  };
  
  const resetQuiz = () => {
    setQuizState('idle');
    setCurrentQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setFeedback(null);
    setQuizStartTime(null);
    setQuizEndTime(null);
  };
  
  // Calculate progress percentage
  const progressPercentage = (currentQuestionIndex / currentQuizQuestions.length) * 100;
  
  // Calculate time taken for completed quiz
  const timeTaken = quizEndTime && quizStartTime 
    ? Math.round((quizEndTime - quizStartTime) / 1000) 
    : 0;
  
  // Current question or null if no quiz is active
  const currentQuestion = quizState === 'active' && currentQuizQuestions.length > 0 
    ? currentQuizQuestions[currentQuestionIndex] 
    : null;
  
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Activity className="mr-2 h-6 w-6 text-sfu-red" /> Quiz Challenge
          </CardTitle>
          <CardDescription>
            Test your knowledge and compete on the leaderboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {quizState === 'idle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <Button 
                onClick={startQuiz} 
                className="w-full bg-sfu-red hover:bg-sfu-red/90 transition-all mt-4"
              >
                Start Quiz
              </Button>
            </div>
          )}
          
          {quizState === 'active' && currentQuestion && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <Badge variant="secondary">
                  Question {currentQuestionIndex + 1} of {currentQuizQuestions.length}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              
              <Progress value={progressPercentage} className="h-2 mb-4" />
              
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-medium mb-4">{currentQuestion.question}</h3>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {currentQuestion.options.map((option, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.1 }}
                      >
                        <Button
                          variant={selectedOption === index ? "default" : "outline"}
                          className={`w-full justify-start text-left p-4 h-auto ${
                            feedback !== null && index === currentQuestion.correctAnswer 
                              ? "bg-green-100 border-green-500 text-green-800" 
                              : ""
                          } ${
                            feedback === 'incorrect' && index === selectedOption
                              ? "bg-red-100 border-red-500 text-red-800"
                              : ""
                          }`}
                          onClick={() => handleOptionSelect(index)}
                        >
                          <div className="flex items-center">
                            {feedback !== null && index === currentQuestion.correctAnswer && (
                              <Check className="mr-2 h-5 w-5 text-green-600" />
                            )}
                            {feedback === 'incorrect' && index === selectedOption && (
                              <X className="mr-2 h-5 w-5 text-red-600" />
                            )}
                            {option}
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          )}
          
          {quizState === 'completed' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">Quiz Completed!</h3>
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex items-center space-x-2">
                    <Award className="h-6 w-6 text-amber-500" />
                    <span className="text-xl font-semibold">
                      Score: {score} / {currentQuizQuestions.length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-6 w-6 text-blue-500" />
                    <span>Time: {timeTaken} seconds</span>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  {score === currentQuizQuestions.length ? (
                    <p className="text-green-600 font-medium">Perfect score! Amazing job!</p>
                  ) : score >= currentQuizQuestions.length / 2 ? (
                    <p className="text-blue-600 font-medium">Good job! Keep practicing!</p>
                  ) : (
                    <p className="text-amber-600 font-medium">Keep practicing to improve your score!</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {quizState === 'active' && (
            <>
              <Button variant="outline" onClick={resetQuiz}>Cancel</Button>
              <Button 
                onClick={checkAnswer} 
                disabled={selectedOption === null || feedback !== null}
                className="bg-sfu-red hover:bg-sfu-red/90"
              >
                Submit Answer
              </Button>
            </>
          )}
          
          {quizState === 'completed' && (
            <Button 
              onClick={resetQuiz} 
              className="w-full bg-sfu-red hover:bg-sfu-red/90"
            >
              Play Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizSection;
