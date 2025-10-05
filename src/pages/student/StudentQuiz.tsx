import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

// Mock data
const quizData = {
  id: 1,
  title: "Logical Fallacies",
  timeLeft: "45:30",
  totalQuestions: 15,
  currentQuestion: 1,
  questions: [
    {
      id: 1,
      question: "Identify the fallacy in the following statement: 'Everyone is doing it, so it must be right.'",
      points: 5,
      answer: "",
    },
    {
      id: 2,
      question: "Explain the ad hominem fallacy with an example from real life.",
      points: 10,
      answer: "",
    },
    {
      id: 3,
      question: "What is a straw man argument? Provide a clear example.",
      points: 7,
      answer: "",
    },
  ],
};

const StudentQuiz = () => {
  const { quizId } = useParams();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const currentQuestion = quizData.questions[currentQ];
  const progress = ((currentQ + 1) / quizData.totalQuestions) * 100;

  const handleAnswerChange = (value: string) => {
    setAnswers({ ...answers, [currentQ]: value });
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentQ)) {
      newFlagged.delete(currentQ);
    } else {
      newFlagged.add(currentQ);
    }
    setFlagged(newFlagged);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Top Bar */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Brain className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-bold">{quizData.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Question {currentQ + 1} of {quizData.totalQuestions}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-accent" />
                <span className="font-mono font-semibold">{quizData.timeLeft}</span>
              </div>
              <Button variant="destructive" size="sm">
                Submit Quiz
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary">Question {currentQ + 1}</Badge>
                    <Badge variant="outline">{currentQuestion.points} points</Badge>
                    {flagged.has(currentQ) && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        Flagged
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl leading-relaxed">
                    {currentQuestion.question}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFlag}
                  className={flagged.has(currentQ) ? "text-destructive" : ""}
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Answer Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Answer</label>
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[currentQ] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  AI will analyze your answer for logical reasoning and provide detailed feedback
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                  disabled={currentQ === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {quizData.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQ(index)}
                      className={`h-8 w-8 rounded text-xs font-medium transition-colors ${
                        index === currentQ
                          ? "bg-primary text-primary-foreground"
                          : answers[index]
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : flagged.has(index)
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => setCurrentQ(Math.min(quizData.questions.length - 1, currentQ + 1))}
                  disabled={currentQ === quizData.questions.length - 1}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="mt-6 bg-accent/5 border-accent/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Take your time to think through your answer. The AI will evaluate your 
                logical reasoning process, not just the final answer. Show your work for better feedback!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;
