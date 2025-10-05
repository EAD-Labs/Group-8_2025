import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, TrendingUp, Award, Target, Flame } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const studentData = {
  name: "Alex Martinez",
  email: "alex.martinez@student.edu",
  grade: "Grade 10",
  quizzesCompleted: 24,
  avgScore: 82,
  streak: 7,
  topicsMastered: 12,
  totalTopics: 20,
  strongAreas: ["Deductive Reasoning", "Pattern Recognition", "Truth Tables"],
  improvementAreas: ["Inductive Reasoning", "Complex Fallacies"],
};

const recentPerformance = [
  { topic: "Logical Fallacies", score: 85, date: "Jan 5" },
  { topic: "Syllogisms", score: 92, date: "Jan 3" },
  { topic: "Truth Tables", score: 78, date: "Dec 28" },
  { topic: "Venn Diagrams", score: 88, date: "Dec 25" },
];

const StudentProfile = () => {
  const masteryPercentage = (studentData.topicsMastered / studentData.totalTopics) * 100;

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
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">My Profile</h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      AM
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{studentData.name}</CardTitle>
                  <CardDescription>{studentData.grade}</CardDescription>
                  <Badge className="mt-2" variant="secondary">
                    {studentData.email}
                  </Badge>
                </CardHeader>
              </Card>

              {/* Stats */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Performance Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quizzes Done</span>
                    <span className="font-semibold">{studentData.quizzesCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Score</span>
                    <span className="font-semibold">{studentData.avgScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Streak</span>
                    <span className="font-semibold flex items-center gap-1">
                      {studentData.streak} days <Flame className="h-4 w-4 text-orange-500" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Topics Mastered</span>
                      <span className="font-semibold">
                        {studentData.topicsMastered}/{studentData.totalTopics}
                      </span>
                    </div>
                    <Progress value={masteryPercentage} />
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="mt-6 bg-accent/5 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-accent" />
                    Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-background/60">
                      <div className="text-2xl mb-1">🔥</div>
                      <div className="text-xs font-medium">7 Day Streak</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/60">
                      <div className="text-2xl mb-1">🎯</div>
                      <div className="text-xs font-medium">High Scorer</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/60">
                      <div className="text-2xl mb-1">📚</div>
                      <div className="text-xs font-medium">Quick Learner</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/60">
                      <div className="text-2xl mb-1">⭐</div>
                      <div className="text-xs font-medium">Consistent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="Alex" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Martinez" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={studentData.email} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Input id="grade" defaultValue={studentData.grade} />
                  </div>

                  <Button className="bg-gradient-to-r from-primary to-primary/80">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Strong Areas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {studentData.strongAreas.map((area) => (
                        <Badge key={area} variant="secondary" className="bg-green-100 text-green-700">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-accent" />
                      Areas for Improvement
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {studentData.improvementAreas.map((area) => (
                        <Badge key={area} variant="outline" className="border-accent/50 text-accent">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentPerformance.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <div className="font-medium">{item.topic}</div>
                          <div className="text-sm text-muted-foreground">{item.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{item.score}%</div>
                          <Progress value={item.score} className="w-24 h-2" />
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
    </div>
  );
};

export default StudentProfile;
