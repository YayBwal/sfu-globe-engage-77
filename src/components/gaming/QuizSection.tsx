
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGaming, Question } from '@/contexts/GamingContext';
import { Trophy, Check, X, Clock, BookOpen, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import LoadingSpinner from './leaderboard/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface QuizSectionProps {
  courseId?: string;
}

const QuizSection: React.FC<QuizSectionProps> = ({ courseId }) => {
  const { 
    questions, 
    fetchQuestions, 
    saveQuizScore, 
    isLoading,
    deleteSession,
    createSession 
  } = useGaming();
  
  const { toast } = useToast();
  const [activeQuiz, setActiveQuiz] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [answers, setAnswers] = useState<{ question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  
  // Fetch questions on mount or when courseId changes
  useEffect(() => {
    fetchQuestions(courseId);
  }, [fetchQuestions, courseId]);
  
  // Create new session (quiz)
  const handleCreateNewSession = async () => {
    const sessionName = courseId 
      ? `Quiz - ${courseId.toUpperCase()}` 
      : "Standard Quiz";
    
    const sessionId = await createSession(sessionName, courseId);
    if (sessionId) {
      setCurrentSessionId(sessionId);
      startQuiz();
    }
  };
  
  // Delete a quiz session
  const handleDeleteQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setShowDeleteDialog(true);
  };
  
  const confirmDeleteQuiz = async () => {
    if (selectedQuizId) {
      await deleteSession(selectedQuizId);
      setShowDeleteDialog(false);
      setSelectedQuizId(null);
    }
  };
  
  // Start quiz
  const startQuiz = useCallback(() => {
    if (!questions || questions.length === 0) {
      toast({
        title: 'No Questions Available',
        description: 'There are no questions available for this course.',
        variant: 'destructive',
      });
      return;
    }
    
    // Filter questions by course if specified
    let filteredQuestions = questions;
    
    // Randomly select 10 questions
    const quizLength = Math.min(10, filteredQuestions.length);
    const selectedQuestions = [...filteredQuestions]
      .sort(() => 0.5 - Math.random())
      .slice(0, quizLength);
    
    setQuizQuestions(selectedQuestions);
    setActiveQuiz(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
    setQuizFinished(false);
    setSelectedAnswerIndex(null);
    setTimeRemaining(30);
    setTotalTime(0);
    
    // Start timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up for this question
          handleAnswer(null);
          return 30;
        }
        return prev - 1;
      });
      
      setTotalTime(prev => prev + 1);
    }, 1000);
    
    setTimerId(timer);
  }, [questions, toast]);
  
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
        setTimeRemaining(30);
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
    
    // Add completion bonus
    const finalScore = score + 20;
    
    // Add speed bonus (up to 30 points)
    const averageTimePerQuestion = totalTime / quizQuestions.length;
    let speedBonus = 0;
    
    if (averageTimePerQuestion < 10) {
      speedBonus = 30;
    } else if (averageTimePerQuestion < 15) {
      speedBonus = 20;
    } else if (averageTimePerQuestion < 20) {
      speedBonus = 10;
    }
    
    const totalFinalScore = finalScore + speedBonus;
    
    setScore(totalFinalScore);
    setQuizFinished(true);
    setShowResult(true);
    setActiveQuiz(false);
    
    // Save the quiz score
    saveQuizScore(
      courseId || "quiz-challenge", 
      courseId ? `Quiz - ${courseId.toUpperCase()}` : "Quiz Challenge", 
      totalFinalScore, 
      totalTime,
      currentSessionId
    );
  };
  
  // Restart the quiz
  const restartQuiz = () => {
    setShowResult(false);
    startQuiz();
  };
  
  // Return to quiz selection
  const returnToSelection = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    
    setActiveQuiz(false);
    setQuizFinished(false);
    setShowResult(false);
    setCurrentSessionId(undefined);
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
            <h2 className="text-2xl font-display font-bold mb-2">
              {courseId ? `${courseId.toUpperCase()} Quiz Challenge` : "Quiz Challenge"}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Test your knowledge with 10 random questions. Each correct answer gives you 10 points, plus bonuses for completion and speed!
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            {isLoading ? (
              <LoadingSpinner />
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No questions available for this course. Please try again later or select a different course.
              </div>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-xl font-medium mb-4">Ready to take the challenge?</h3>
                <p className="text-gray-600 mb-6">
                  You'll get 10 randomly selected questions with 30 seconds for each question.
                </p>
                <Button 
                  onClick={handleCreateNewSession} 
                  className="bg-sfu-red hover:bg-sfu-red/90 px-8"
                >
                  Start New Quiz
                </Button>
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-sfu-red/5 to-sfu-red/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy size={20} className="text-sfu-red" />
              <h3 className="font-display font-medium">How Scoring Works</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="font-medium">Correct Answer</p>
                <p className="text-xl font-bold text-sfu-red">10 points</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="font-medium">Completion Bonus</p>
                <p className="text-xl font-bold text-sfu-red">20 points</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="font-medium">Speed Bonus</p>
                <p className="text-xl font-bold text-sfu-red">Up to 30 points</p>
              </div>
            </div>
            
            <p className="text-gray-600">
              Complete quizzes to appear on the leaderboard and earn points. The top players are recognized in the global rankings.
            </p>
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

      {/* Delete Quiz Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete this quiz? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteQuiz}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizSection;
