import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, TrendingUp, Clock, CheckCircle2, Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Mock data
const stats = {
  quizzesCompleted: 24,
  avgScore: 82,
  streak: 7,
  topicsMastered: 12,
};

const ongoingQuizzes = [
  { id: 1, title: "Logical Fallacies", progress: 60, timeLeft: "2 days", topic: "Critical Thinking" },
  { id: 2, title: "Pattern Recognition", progress: 30, timeLeft: "5 days", topic: "Problem Solving" },
];

const upcomingQuizzes = [
  { id: 3, title: "Deductive Reasoning", startDate: "Jan 15, 2025", topic: "Logic" },
  { id: 4, title: "Inductive Reasoning", startDate: "Jan 20, 2025", topic: "Logic" },
];

const completedQuizzes = [
  { id: 5, title: "Syllogisms", score: 85, maxScore: 100, date: "Jan 5, 2025" },
  { id: 6, title: "Truth Tables", score: 92, maxScore: 100, date: "Jan 3, 2025" },
  { id: 7, title: "Venn Diagrams", score: 78, maxScore: 100, date: "Dec 28, 2024" },
];

const StudentDashboard = () => {
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
            <Link to="/student/library">
              <Button variant="ghost">Quiz Library</Button>
            </Link>
            <Link to="/student/materials">
              <Button variant="ghost">Materials</Button>
            </Link>
            <Link to="/student/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
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
          <h1 className="text-4xl font-bold mb-2">Welcome back, Student! 👋</h1>
          <p className="text-muted-foreground">Continue your logical reasoning journey</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Quizzes Completed</CardDescription>
              <CardTitle className="text-3xl">{stats.quizzesCompleted}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>Keep it up!</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl">{stats.avgScore}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+3% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Streak</CardDescription>
              <CardTitle className="text-3xl">{stats.streak} days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>🔥</span>
                <span>Don't break it!</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="pb-3">
              <CardDescription>AI Feedback</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-accent" />
                Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="h-auto p-0 text-accent" asChild>
                <Link to="/student/ai-feedback">View insights</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ongoing Quizzes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Continue Learning</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {ongoingQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <CardTitle className="mb-1">{quiz.title}</CardTitle>
                      <CardDescription>{quiz.topic}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {quiz.timeLeft}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{quiz.progress}%</span>
                    </div>
                    <Progress value={quiz.progress} />
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-gradient-to-r from-primary to-primary/80" asChild>
                    <Link to={`/student/quiz/${quiz.id}`}>
                      <Play className="h-4 w-4 mr-2" />
                      Continue Quiz
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Quizzes */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Upcoming Quizzes</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {upcomingQuizzes.map((quiz) => (
                    <div key={quiz.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold mb-1">{quiz.title}</h3>
                          <p className="text-sm text-muted-foreground">{quiz.topic}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{quiz.startDate}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Completions */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Recently Completed</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {completedQuizzes.map((quiz) => (
                    <div key={quiz.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <Link to={`/student/quiz/${quiz.id}/results`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{quiz.title}</h3>
                            <p className="text-sm text-muted-foreground">{quiz.date}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {quiz.score}/{quiz.maxScore}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round((quiz.score / quiz.maxScore) * 100)}%
                            </div>
                          </div>
                        </div>
                      </Link>
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

export default StudentDashboard;
