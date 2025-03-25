import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGaming, Question } from '@/contexts/GamingContext';
import { Trophy, Check, X, Clock, HelpCircle, BookOpen, SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const QuizSection: React.FC = () => {
  const { questions, fetchQuestions, saveQuizScore, isLoading } = useGaming();
  
  const [activeQuiz, setActiveQuiz] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [answers, setAnswers] = useState<{ question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  
  // Fetch questions on mount
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);
  
  // Filter questions based on category and difficulty
  useEffect(() => {
    if (!questions) return;
    
    let filtered = [...questions];
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(q => q.category === categoryFilter);
    }
    
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }
    
    setFilteredQuestions(filtered);
  }, [questions, categoryFilter, difficultyFilter]);
  
  // Get unique categories
  const categories = questions ? 
    Array.from(new Set(questions.map(q => q.category))).sort() : 
    [];
  
  // Function to get limited questions by difficulty
  const getLimitedQuestionsByDifficulty = (difficulty: string, limit = 3) => {
    if (!filteredQuestions.length) return [];
    
    let questionsForDifficulty = filteredQuestions;
    
    if (difficulty !== 'all') {
      questionsForDifficulty = filteredQuestions.filter(q => q.difficulty === difficulty);
    }
    
    return questionsForDifficulty.slice(0, limit);
  };
  
  // Start quiz
  const startQuiz = () => {
    if (filteredQuestions.length === 0) return;
    
    // Randomly select 10 questions (or all if less than 10)
    const quizLength = Math.min(10, filteredQuestions.length);
    const selectedQuestions = [...filteredQuestions]
      .sort(() => 0.5 - Math.random())
      .slice(0, quizLength);
    
    setQuizQuestions(selectedQuestions);
    setActiveQuiz(true);
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
    setQuizFinished(false);
    setSelectedAnswerIndex(null);
    setTimeRemaining(60);
    setTotalTime(0);
    
    // Start timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up for this question
          handleAnswer(null);
          return 60;
        }
        return prev - 1;
      });
      
      setTotalTime(prev => prev + 1);
    }, 1000);
    
    setTimerId(timer);
  };
  
  // Handle answer selection
  const handleAnswer = (answerIndex: number | null) => {
    if (quizFinished || answerIndex === selectedAnswerIndex) return;
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    
    setSelectedAnswerIndex(answerIndex);
    
    setTimeout(() => {
      // Record the answer
      const isCorrect = answerIndex === currentQuestion.correctAnswer;
      
      if (isCorrect) {
        setScore(prevScore => prevScore + 10);
      }
      
      setAnswers(prev => [
        ...prev,
        {
          question: currentQuestion.question,
          userAnswer: answerIndex !== null ? currentQuestion.options[answerIndex] : "No answer",
          correctAnswer: currentQuestion.options[currentQuestion.correctAnswer],
          isCorrect: isCorrect
        }
      ]);
      
      // Move to the next question or end the quiz
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setSelectedAnswerIndex(null);
        setTimeRemaining(60);
      } else {
        endQuiz();
      }
    }, 1000);
  };
  
  // End the quiz
  const endQuiz = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    
    setQuizFinished(true);
    setShowResult(true);
    setActiveQuiz(false);
    
    // Save the quiz score
    saveQuizScore(
      "trivia-quiz", 
      `${categoryFilter !== "all" ? categoryFilter : "General"} Quiz`, 
      score, 
      totalTime
    );
  };
  
  // Restart the quiz
  const restartQuiz = () => {
    setShowResult(false);
    setQuizStarted(false);
  };
  
  // Return to quiz selection
  const returnToSelection = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    
    setActiveQuiz(false);
    setQuizStarted(false);
    setQuizFinished(false);
    setShowResult(false);
  };
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [timerId]);
  
  return (
    <div className="min-h-[60vh]">
      {!activeQuiz && !showResult ? (
        <div>
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Quiz Challenge</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Test your knowledge across various categories and difficulty levels. Each correct answer gives you 10 points.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="w-full md:w-auto flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-gray-400" />
                <h3 className="font-medium">Quiz Filters</h3>
              </div>
              
              <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={difficultyFilter}
                  onValueChange={(value: "all" | "easy" | "medium" | "hard") => setDifficultyFilter(value)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Select Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={startQuiz} 
                disabled={isLoading || filteredQuestions.length === 0}
                className="w-full md:w-auto bg-sfu-red hover:bg-sfu-red/90"
              >
                Start Quiz
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-10 h-10 border-4 border-sfu-red/20 border-t-sfu-red rounded-full animate-spin"></div>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No questions available for the selected filters. Try different criteria.
              </div>
            ) : (
              <div>
                {['easy', 'medium', 'hard'].map((difficulty) => {
                  const questionsForDifficulty = getLimitedQuestionsByDifficulty(difficulty, 3);
                  
                  return questionsForDifficulty.length > 0 ? (
                    <div key={difficulty} className="mb-6">
                      <h3 className="text-lg font-medium mb-3 capitalize">{difficulty} Questions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {questionsForDifficulty.map((question, index) => (
                          <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50 rounded-lg p-4 overflow-hidden"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant={
                                question.difficulty === 'easy' 
                                  ? 'outline' 
                                  : question.difficulty === 'medium' 
                                    ? 'secondary' 
                                    : 'destructive'
                              }>
                                {question.difficulty.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{question.category}</Badge>
                            </div>
                            <p className="text-sm font-medium line-clamp-3 h-12">{question.question}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-sfu-red/5 to-sfu-red/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy size={20} className="text-sfu-red" />
              <h3 className="font-display font-medium">Quiz Leaderboard</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Complete quizzes to appear on the leaderboard and earn points. The top players are recognized in the global rankings.
            </p>
            
            <div className="flex justify-center">
              <Button variant="outline" className="gap-2">
                View Leaderboard <Trophy size={14} />
              </Button>
            </div>
          </div>
        </div>
      ) : showResult ? (
        <Dialog open={showResult} onOpenChange={setShowResult}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Quiz Results</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <div className="text-gray-500">Your Score</div>
                <div className="text-2xl font-bold text-sfu-red">{score} pts</div>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <div className="text-gray-500">Time Taken</div>
                <div className="font-medium">
                  {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4 my-4 max-h-[200px] overflow-y-auto">
                {answers.map((answer, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium mb-1">{index + 1}. {answer.question}</div>
                    <div className="flex items-center gap-2">
                      {answer.isCorrect ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <X size={16} className="text-red-500" />
                      )}
                      <span>
                        {answer.isCorrect ? (
                          <span>Correct: <span className="text-green-600">{answer.correctAnswer}</span></span>
                        ) : (
                          <span>
                            Your answer: <span className="text-red-500">{answer.userAnswer}</span> 
                            <span className="mx-1">•</span> 
                            Correct: <span className="text-green-600">{answer.correctAnswer}</span>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={restartQuiz} className="w-full">
                Try Again
              </Button>
              <Button onClick={returnToSelection} className="w-full bg-sfu-red hover:bg-sfu-red/90">
                Back to Quizzes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Badge variant={
                  quizQuestions[currentQuestionIndex]?.difficulty === 'easy' 
                    ? 'outline' 
                    : quizQuestions[currentQuestionIndex]?.difficulty === 'medium' 
                      ? 'secondary' 
                      : 'destructive'
                }>
                  {quizQuestions[currentQuestionIndex]?.difficulty.toUpperCase()}
                </Badge>
                <Badge variant="outline">{quizQuestions[currentQuestionIndex]?.category}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="font-mono">{timeRemaining}s</span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Question {currentQuestionIndex + 1} of {quizQuestions.length}</div>
              <Progress value={(currentQuestionIndex + 1) / quizQuestions.length * 100} className="h-2" />
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">{quizQuestions[currentQuestionIndex]?.question}</h3>
              
              <div className="space-y-3">
                {quizQuestions[currentQuestionIndex]?.options.map((option, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswerIndex !== null}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedAnswerIndex === index && index === quizQuestions[currentQuestionIndex]?.correctAnswer
                        ? 'bg-green-50 border-green-300 text-green-800'
                        : selectedAnswerIndex === index
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={returnToSelection}
                className="gap-2"
              >
                Quit <X size={14} />
              </Button>
              
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Score:</div>
                <div className="font-semibold text-sfu-red">{score}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSection;
