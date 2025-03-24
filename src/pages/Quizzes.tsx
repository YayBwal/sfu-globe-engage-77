import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Clock, HelpCircle, CheckCircle, XCircle, Award, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Quizzes = () => {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Sample quizzes data
  const quizzesData = [
    {
      id: 1,
      title: "Computing Science Basics",
      category: "CMPT",
      difficulty: "Easy",
      questions: [
        {
          question: "What does CPU stand for?",
          options: ["Central Processing Unit", "Computer Personal Unit", "Central Processor Utility", "Central Protocol Unit"],
          correctAnswer: 0
        },
        {
          question: "Which of the following is not a programming language?",
          options: ["Java", "Python", "HTML", "Photoshop"],
          correctAnswer: 3
        },
        {
          question: "What does RAM stand for?",
          options: ["Random Access Memory", "Read Access Memory", "Random Allocation Memory", "Runtime Access Method"],
          correctAnswer: 0
        }
      ]
    },
    {
      id: 2,
      title: "Mathematics 101",
      category: "MATH",
      difficulty: "Medium",
      questions: [
        {
          question: "What is the derivative of x²?",
          options: ["2x", "x²", "2", "x"],
          correctAnswer: 0
        },
        {
          question: "What is the value of π (pi) to two decimal places?",
          options: ["3.41", "3.14", "3.12", "3.18"],
          correctAnswer: 1
        }
      ]
    },
    {
      id: 3,
      title: "Biology Fundamentals",
      category: "BISC",
      difficulty: "Hard",
      questions: [
        {
          question: "What is the powerhouse of the cell?",
          options: ["Nucleus", "Mitochondria", "Golgi Apparatus", "Endoplasmic Reticulum"],
          correctAnswer: 1
        },
        {
          question: "Which of the following is not a nucleotide base found in DNA?",
          options: ["Adenine", "Cytosine", "Guanine", "Selenium"],
          correctAnswer: 3
        }
      ]
    }
  ];

  // Define the Quiz type
  type Quiz = (typeof quizzesData)[0];
  type Question = Quiz['questions'][0];

  // Format time function (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Start quiz function
  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setSelectedOption(null);
    setScore(0);
    setTimeLeft(60);
    setQuizCompleted(false);
    setTimerActive(true);
  };

  // Function to save quiz result to Supabase
  const saveQuizResult = async () => {
    if (!activeQuiz || !user) {
      console.error('No active quiz or user found');
      return;
    }

    try {
      console.log('Starting to save quiz result...');
      console.log('Quiz data:', {
        title: activeQuiz.title,
        description: activeQuiz.category,
        total_questions: activeQuiz.questions.length,
        created_by: user.id
      });

      // First, create or get the quiz in the database
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .upsert({
          title: activeQuiz.title,
          description: activeQuiz.category,
          total_questions: activeQuiz.questions.length,
          created_by: user.id
        })
        .select()
        .single();

      if (quizError) {
        console.error('Error creating/updating quiz:', quizError);
        throw quizError;
      }

      console.log('Quiz created/updated successfully:', quizData);

      // Calculate the score
      const correctAnswers = activeQuiz.questions.filter((q, index) => 
        q.options[q.correctOption] === selectedOption
      ).length;

      const finalScore = Math.round((correctAnswers / activeQuiz.questions.length) * 100);

      // Save the quiz result
      const resultData = {
        user_id: user.id,
        quiz_id: quizData.id,
        score: correctAnswers, // Save raw score (number of correct answers)
        total_questions: activeQuiz.questions.length,
        completed_at: new Date().toISOString()
      };

      console.log('Saving quiz result with data:', resultData);

      const { error: resultError } = await supabase
        .from('quiz_results')
        .insert(resultData);

      if (resultError) {
        console.error('Error saving quiz result:', resultError);
        throw resultError;
      }

      console.log('Quiz result saved successfully');
      toast({
        title: "Success",
        description: `Your quiz result has been saved! Score: ${finalScore}% (${correctAnswers}/${activeQuiz.questions.length} correct)`,
      });

      // Reset quiz state
      setActiveQuiz(null);
      setCurrentQuestion(0);
      setSelectedOption(null);
      setScore(0);
      setTimeLeft(60);
      setQuizCompleted(false);
      setTimerActive(false);

    } catch (error) {
      console.error('Error in saveQuizResult:', error);
      toast({
        title: "Error",
        description: "Failed to save your quiz result. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle next question
  const handleNextQuestion = async () => {
    if (!activeQuiz) return;
    
    if (currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setTimeLeft(60); // Reset timer for next question
    } else {
      setQuizCompleted(true);
      setTimerActive(false);
      await saveQuizResult(); // Save the result when quiz is completed
    }
  };

  // Handle option selection
  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    // Check if the answer is correct
    const isCorrect = activeQuiz?.questions[currentQuestion].options[optionIndex] === 
                     activeQuiz?.questions[currentQuestion].options[activeQuiz.questions[currentQuestion].correctOption];
    
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  // Exit quiz function
  const exitQuiz = () => {
    setActiveQuiz(null);
    setTimerActive(false);
  };

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && activeQuiz) {
      // Time's up, move to next question
      if (currentQuestion < activeQuiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setTimeLeft(60);
      } else {
        setQuizCompleted(true);
        setTimerActive(false);
      }
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, timeLeft, currentQuestion, activeQuiz]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container-narrow max-w-6xl mx-auto px-4">
          {!activeQuiz ? (
            <>
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Interactive Quizzes</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Test your knowledge with our collection of quizzes designed to reinforce learning and make studying more engaging.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzesData.map(quiz => (
                  <div key={quiz.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="bg-gradient-to-r from-sfu-red/20 to-sfu-red/5 p-4">
                      <div className="flex justify-between items-center">
                        <span className="pill bg-white/80 text-sfu-red text-xs px-3 py-1 rounded-full">
                          {quiz.category}
                        </span>
                        <span className="pill bg-white/80 text-gray-700 text-xs px-3 py-1 rounded-full">
                          {quiz.difficulty}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-lg mt-3">{quiz.title}</h3>
                      <p className="text-sm text-gray-700 mt-1">{quiz.questions.length} questions</p>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Clock size={16} />
                        <span>Estimated time: {quiz.questions.length} min</span>
                      </div>
                      
                      <Button 
                        className="w-full bg-sfu-red hover:bg-sfu-red/90 text-white"
                        onClick={() => startQuiz(quiz)}
                      >
                        Start Quiz
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 bg-sfu-lightgray rounded-xl p-6">
                <h2 className="text-2xl font-display font-semibold mb-4">Quiz Benefits</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      icon: <BookOpen size={20} />,
                      title: "Reinforces Learning",
                      description: "Quizzes help solidify your understanding of key concepts."
                    },
                    {
                      icon: <Clock size={20} />,
                      title: "Improves Recall Speed",
                      description: "Timed quizzes help you practice retrieving information quickly."
                    },
                    {
                      icon: <Award size={20} />,
                      title: "Tracks Progress",
                      description: "Monitor your improvement and identify areas that need more focus."
                    }
                  ].map((benefit, index) => (
                    <div key={index} className="bg-white p-5 rounded-lg shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-sfu-red/10 text-sfu-red flex items-center justify-center flex-shrink-0">
                          {benefit.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-lg mb-1">{benefit.title}</h3>
                          <p className="text-gray-600 text-sm">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="max-w-2xl mx-auto">
              {!quizCompleted ? (
                <div className="relative z-10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-sfu-black text-white p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="text-xs">{activeQuiz.title}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock size={14} className={timeLeft < 10 ? "text-red-400 animate-pulse" : ""} />
                      <span className={timeLeft < 10 ? "text-red-400 animate-pulse" : ""}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="pill bg-sfu-red/10 text-sfu-red">
                        Question {currentQuestion + 1}/{activeQuiz.questions.length}
                      </div>
                      <div className="flex space-x-1">
                        {activeQuiz.questions.map((_, index) => (
                          <div 
                            key={index} 
                            className={`w-2 h-2 rounded-full ${
                              index === currentQuestion ? 'bg-sfu-red' : 
                              index < currentQuestion ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sfu-red transition-all duration-1000" 
                        style={{ width: `${(timeLeft / 60) * 100}%` }}
                      ></div>
                    </div>
                    
                    <h3 className="text-lg font-medium mb-4">
                      {activeQuiz.questions[currentQuestion].question}
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      {activeQuiz.questions[currentQuestion].options.map((option, index) => (
                        <div 
                          key={index}
                          className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedOption === index 
                              ? selectedOption === activeQuiz.questions[currentQuestion].correctAnswer
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-sfu-red/50'
                          }`}
                          onClick={() => handleOptionSelect(index)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {selectedOption === index && (
                              selectedOption === activeQuiz.questions[currentQuestion].correctAnswer
                                ? <CheckCircle size={20} className="text-green-500" />
                                : <XCircle size={20} className="text-red-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline"
                        onClick={exitQuiz}
                      >
                        Exit Quiz
                      </Button>
                      
                      <Button 
                        className="bg-sfu-red text-white hover:bg-sfu-red/90"
                        disabled={selectedOption === null}
                        onClick={handleNextQuestion}
                      >
                        {currentQuestion < activeQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                      <div>Score: {score * 100} pts</div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>Time left: {formatTime(timeLeft)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="w-20 h-20 bg-sfu-red/10 rounded-full flex items-center justify-center text-sfu-red mx-auto mb-6">
                    <Award size={32} />
                  </div>
                  
                  <h2 className="text-2xl font-display font-bold mb-4">Quiz Completed!</h2>
                  
                  <div className="text-4xl font-bold mb-4">
                    {score} / {activeQuiz.questions.length}
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-sm text-gray-500 mb-2">Your score</div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sfu-red" 
                        style={{ width: `${(score / activeQuiz.questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => startQuiz(activeQuiz)}
                    >
                      Try Again
                    </Button>
                    <Button 
                      className="bg-sfu-red text-white hover:bg-sfu-red/90"
                      onClick={exitQuiz}
                    >
                      Back to Quizzes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Quizzes;
