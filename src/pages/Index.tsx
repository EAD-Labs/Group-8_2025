import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, TrendingUp, Users, Sparkles, Award } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              LogicLearn
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-foreground mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Learning Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Master{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Logical Reasoning
            </span>
            <br />
            Beyond the Classroom
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            An intelligent educational platform where AI meets learning. Practice logical reasoning,
            get instant feedback, and track your progress with advanced AI insights.
          </p>
          <div className="flex gap-4 justify-center pt-6">
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Link to="/signup">Start Learning Free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Grading</h3>
            <p className="text-muted-foreground">
              Get instant, detailed feedback on your answers with step-by-step analysis powered by advanced AI.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Performance Tracking</h3>
            <p className="text-muted-foreground">
              Monitor your progress with detailed analytics and personalized learning insights.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Interactive Classrooms</h3>
            <p className="text-muted-foreground">
              Teachers can create classes, assign quizzes, and track student performance in real-time.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rich Content Library</h3>
            <p className="text-muted-foreground">
              Access topic-wise quizzes and reading materials curated for logical reasoning mastery.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Quiz Generation</h3>
            <p className="text-muted-foreground">
              Teachers get AI assistance to create perfectly balanced quizzes with auto-generated point systems.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Personalized Feedback</h3>
            <p className="text-muted-foreground">
              Receive AI-generated insights highlighting strengths, weaknesses, and areas for improvement.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent/80 text-primary-foreground shadow-xl">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Learning?</h2>
          <p className="text-lg mb-8 text-primary-foreground/90">
            Join thousands of students and teachers using AI to master logical reasoning
          </p>
          <Button size="lg" variant="secondary" asChild className="shadow-lg">
            <Link to="/signup">Start Your Journey Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 LogicLearn. Empowering minds with AI-driven education.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
