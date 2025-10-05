import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, FileText, Users, TrendingUp, Sparkles, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Mock data
const quizData = {
  id: 1,
  title: "Logical Fallacies",
  class: "Grade 10 - Logic A",
  totalQuestions: 15,
  totalPoints: 100,
  attempts: 25,
  avgScore: 78,
  questions: [
    { id: 1, question: "Identify the fallacy: 'Everyone is doing it, so it must be right.'", points: 5 },
    { id: 2, question: "Explain the ad hominem fallacy with an example.", points: 10 },
    { id: 3, question: "What is a straw man argument?", points: 7 },
  ],
};

const studentResults = [
  { id: 1, name: "Alice Johnson", score: 85, totalPoints: 100, attempted: "Jan 5, 2025" },
  { id: 2, name: "Bob Smith", score: 72, totalPoints: 100, attempted: "Jan 5, 2025" },
  { id: 3, name: "Charlie Davis", score: 92, totalPoints: 100, attempted: "Jan 5, 2025" },
  { id: 4, name: "Diana Wilson", score: 88, totalPoints: 100, attempted: "Jan 5, 2025" },
  { id: 5, name: "Eva Martinez", score: 68, totalPoints: 100, attempted: "Jan 6, 2025" },
];

const TeacherQuiz = () => {
  const { quizId } = useParams();

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
              <Link to="/teacher/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Logout</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{quizData.title}</h1>
              <p className="text-muted-foreground">{quizData.class}</p>
            </div>
            <Button variant="outline" asChild>
              <Link to={`/teacher/class/${1}`}>Back to Class</Link>
            </Button>
          </div>
          
          {/* Quiz Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{quizData.totalQuestions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{quizData.totalPoints}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{quizData.attempts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{quizData.avgScore}%</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Feedback */}
        <Card className="mb-8 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              AI Feedback & Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-background/60 backdrop-blur-sm">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Strengths
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                <li>• Students performed well on identifying basic fallacies (avg: 88%)</li>
                <li>• Strong understanding of ad hominem arguments (avg: 85%)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-background/60 backdrop-blur-sm">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <BarChart className="h-4 w-4 text-accent" />
                Areas for Improvement
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                <li>• Straw man arguments need more practice (avg: 65%)</li>
                <li>• 5 students need extra help with complex fallacies</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-background/60 backdrop-blur-sm">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Student Recommendations
              </h4>
              <p className="text-sm text-muted-foreground">
                Consider providing additional resources on complex fallacies for Eva Martinez and Bob Smith.
                They may benefit from one-on-one sessions or supplementary materials.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Questions */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Questions
            </h2>
            <div className="space-y-3">
              {quizData.questions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-1">Q{index + 1}</Badge>
                      <div className="flex-1">
                        <p className="text-sm mb-2">{question.question}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">{question.points} points</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" className="w-full">
                View All Questions
              </Button>
            </div>
          </div>

          {/* Student Results */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Student Results
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {studentResults.map((student) => (
                    <div key={student.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{student.name}</span>
                        <span className="text-lg font-bold">
                          {student.score}/{student.totalPoints}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Progress value={(student.score / student.totalPoints) * 100} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{student.attempted}</span>
                          <span>{Math.round((student.score / student.totalPoints) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherQuiz;
