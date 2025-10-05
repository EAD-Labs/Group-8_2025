import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Plus, Calendar, Clock, CheckCircle2, PlayCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock data
const classData = {
  id: 1,
  name: "Grade 10 - Logic A",
  students: [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", avgScore: 85 },
    { id: 2, name: "Bob Smith", email: "bob@example.com", avgScore: 78 },
    { id: 3, name: "Charlie Davis", email: "charlie@example.com", avgScore: 92 },
    { id: 4, name: "Diana Wilson", email: "diana@example.com", avgScore: 88 },
  ],
};

const quizzes = {
  upcoming: [
    { id: 1, title: "Logical Fallacies II", startDate: "Jan 15, 2025", questions: 20 },
    { id: 2, title: "Advanced Deduction", startDate: "Jan 20, 2025", questions: 15 },
  ],
  ongoing: [
    { id: 3, title: "Pattern Recognition", dueDate: "Jan 12, 2025", attempts: 18, total: 28 },
  ],
  completed: [
    { id: 4, title: "Logical Fallacies", completedDate: "Jan 5, 2025", avgScore: 78, attempts: 25 },
    { id: 5, title: "Syllogisms", completedDate: "Dec 28, 2024", avgScore: 82, attempts: 24 },
  ],
};

const TeacherClass = () => {
  const { classId } = useParams();

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
          <h1 className="text-4xl font-bold mb-2">{classData.name}</h1>
          <p className="text-muted-foreground">{classData.students.length} students enrolled</p>
        </div>

        {/* Quizzes Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Quizzes</h2>
            <div className="flex gap-3">
              <Button variant="outline">
                Continue Editing
              </Button>
              <Button className="bg-gradient-to-r from-primary to-primary/80">
                <Plus className="h-4 w-4 mr-2" />
                Create New Quiz
              </Button>
            </div>
          </div>

          {/* Ongoing Quizzes */}
          {quizzes.ongoing.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                Ongoing
              </h3>
              <div className="space-y-3">
                {quizzes.ongoing.map((quiz) => (
                  <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{quiz.title}</h4>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Due: {quiz.dueDate}
                            </span>
                            <span>
                              {quiz.attempts}/{quiz.total} students attempted
                            </span>
                          </div>
                        </div>
                        <Button asChild>
                          <Link to={`/teacher/quiz/${quiz.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Quizzes */}
          {quizzes.upcoming.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Upcoming
              </h3>
              <div className="space-y-3">
                {quizzes.upcoming.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-lg mb-2">{quiz.title}</h4>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Starts: {quiz.startDate}</span>
                            <span>{quiz.questions} questions</span>
                          </div>
                        </div>
                        <Button variant="outline">Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Quizzes */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Completed
            </h3>
            <div className="space-y-3">
              {quizzes.completed.map((quiz) => (
                <Card key={quiz.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">{quiz.title}</h4>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Completed: {quiz.completedDate}
                          </span>
                          <span className="font-medium">
                            Avg Score: {quiz.avgScore}%
                          </span>
                          <span className="text-muted-foreground">
                            {quiz.attempts} attempts
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" asChild>
                        <Link to={`/teacher/quiz/${quiz.id}`}>View Results</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Students List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Students</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {classData.students.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <Link to={`/teacher/student/${student.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{student.avgScore}%</div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherClass;
