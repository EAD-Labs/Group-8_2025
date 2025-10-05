import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Users, BookOpen, Plus, TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data
const classes = [
  { id: 1, name: "Grade 10 - Logic A", students: 28, quizzes: 12 },
  { id: 2, name: "Grade 11 - Advanced Reasoning", students: 24, quizzes: 8 },
  { id: 3, name: "Grade 9 - Introduction to Logic", students: 32, quizzes: 15 },
];

const recentQuizzes = [
  { id: 1, title: "Logical Fallacies", class: "Grade 10 - Logic A", attempts: 25, avgScore: 78 },
  { id: 2, title: "Deductive Reasoning", class: "Grade 11 - Advanced Reasoning", attempts: 20, avgScore: 82 },
  { id: 3, title: "Pattern Recognition", class: "Grade 9 - Introduction to Logic", attempts: 30, avgScore: 75 },
];

const TeacherDashboard = () => {
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
            <Link to="/teacher/profile">
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
          <h1 className="text-4xl font-bold mb-2">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your classes and track student progress</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Classes</CardDescription>
              <CardTitle className="text-3xl">{classes.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{classes.reduce((sum, c) => sum + c.students, 0)} students</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Quizzes</CardDescription>
              <CardTitle className="text-3xl">{classes.reduce((sum, c) => sum + c.quizzes, 0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Across all classes</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg. Class Score</CardDescription>
              <CardTitle className="text-3xl">79%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="pb-3">
              <CardDescription>AI Insights</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-accent" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="h-auto p-0 text-accent" asChild>
                <Link to="/teacher/ai-feedback">View insights</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Classes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Classes</h2>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{classItem.name}</span>
                    <Badge variant="secondary">{classItem.students} students</Badge>
                  </CardTitle>
                  <CardDescription>{classItem.quizzes} quizzes assigned</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/teacher/class/${classItem.id}`}>View Class</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Quizzes */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Quizzes</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{quiz.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{quiz.class}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {quiz.attempts} attempts
                          </span>
                          <span className="font-medium">
                            Avg: {quiz.avgScore}%
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" asChild>
                        <Link to={`/teacher/quiz/${quiz.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
