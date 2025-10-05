import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle2, XCircle, Award, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Mock data
const resultsData = {
  quizTitle: "Logical Fallacies",
  completedDate: "Jan 5, 2025",
  score: 85,
  maxScore: 100,
  questions: [
    {
      id: 1,
      question: "Identify the fallacy: 'Everyone is doing it, so it must be right.'",
      points: 5,
      earnedPoints: 5,
      studentAnswer: "This is an appeal to popularity (bandwagon fallacy).",
      aiSolution: "Correct! This is indeed an appeal to popularity, also known as argumentum ad populum.",
      feedback: "Excellent identification! You correctly identified the fallacy type.",
    },
    {
      id: 2,
      question: "Explain the ad hominem fallacy with an example.",
      points: 10,
      earnedPoints: 8,
      studentAnswer: "Ad hominem attacks the person instead of their argument. Example: 'You can't trust his climate change research because he's not a scientist.'",
      aiSolution: "Ad hominem (Latin for 'to the person') is attacking someone's character rather than addressing their argument. Your example demonstrates this well.",
      feedback: "Good explanation and relevant example! Minor deduction for not mentioning that credentials can be relevant in some contexts.",
    },
    {
      id: 3,
      question: "What is a straw man argument?",
      points: 7,
      earnedPoints: 5,
      studentAnswer: "It's when you misrepresent someone's argument.",
      aiSolution: "A straw man fallacy occurs when someone misrepresents an opponent's argument to make it easier to attack, then refutes this distorted version instead of the actual argument.",
      feedback: "You have the basic idea, but your answer could be more detailed. Consider explaining how and why the misrepresentation occurs.",
    },
  ],
};

const StudentQuizResults = () => {
  const { quizId } = useParams();
  const percentage = Math.round((resultsData.score / resultsData.maxScore) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              LogicLearn
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/student/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Logout</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Score Card */}
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Award className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{resultsData.quizTitle}</h1>
                  <p className="text-muted-foreground">Completed on {resultsData.completedDate}</p>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2">
                    {resultsData.score}/{resultsData.maxScore}
                  </div>
                  <div className="text-xl text-muted-foreground">{percentage}% Score</div>
                </div>
                <Progress value={percentage} className="h-3 max-w-xs mx-auto" />
              </div>
            </CardHeader>
          </Card>

          {/* AI Overall Feedback */}
          <Card className="mb-8 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                AI Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-background/60 backdrop-blur-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  Strengths
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                  <li>• Excellent at identifying basic fallacies</li>
                  <li>• Strong understanding of ad hominem arguments</li>
                  <li>• Clear and concise explanations</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-background/60 backdrop-blur-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-accent">
                  <Award className="h-4 w-4" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                  <li>• Provide more detailed explanations for complex fallacies</li>
                  <li>• Include context about when arguments might be valid</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-background/60 backdrop-blur-sm">
                <h4 className="font-semibold mb-2">Recommended Next Steps</h4>
                <p className="text-sm text-muted-foreground">
                  Practice identifying straw man arguments in real debates. Check out the 
                  "Advanced Logical Fallacies" module in your learning materials.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Question by Question */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Detailed Review</h2>
            
            {resultsData.questions.map((question, index) => {
              const isFullScore = question.earnedPoints === question.points;
              const scorePercentage = (question.earnedPoints / question.points) * 100;

              return (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary">Question {index + 1}</Badge>
                          <Badge 
                            variant={isFullScore ? "default" : "secondary"}
                            className={isFullScore ? "bg-green-600" : ""}
                          >
                            {question.earnedPoints}/{question.points} points
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{question.question}</CardTitle>
                      </div>
                      {isFullScore ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-accent" />
                      )}
                    </div>
                    <Progress value={scorePercentage} className="mt-4" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Your Answer</h4>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{question.studentAnswer}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-muted-foreground">
                        AI Optimal Solution
                      </h4>
                      <p className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/20">
                        {question.aiSolution}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        AI Feedback
                      </h4>
                      <p className="text-sm bg-accent/5 p-3 rounded-lg border border-accent/20">
                        {question.feedback}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/student/dashboard">Back to Dashboard</Link>
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-primary to-primary/80" asChild>
              <Link to="/student/library">Practice More</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuizResults;
