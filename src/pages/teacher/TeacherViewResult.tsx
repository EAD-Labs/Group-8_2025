import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { auth, db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Brain, CheckCircle2, XCircle, LayoutDashboard, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Attempt = {
  quizId: string;
  classId: string;
  teacherId: string;
  title: string;
  submittedAt: string;
  answers?: Record<number, string>;
};

type Q = { question: string; options: string[]; correct: string };
type QuizDoc = { title: string; questions: Q[] };

const TeacherViewResult = () => {
  const { classId, studentId, quizId } = useParams<{
    classId: string;
    studentId: string;
    quizId: string;
  }>();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [quiz, setQuiz] = useState<QuizDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!studentId || !quizId) { setLoading(false); return; }

      // 1) load attempt from the student's doc
      const aRef = doc(db, "students", studentId, "attempts", quizId);
      const aSnap = await getDoc(aRef);
      if (!aSnap.exists()) { setLoading(false); return; }
      const att = aSnap.data() as Attempt;
      setAttempt(att);

      // 2) load quiz data (teacher quiz OR AI practice)
      // try teacher quiz
      let quizData: QuizDoc | null = null;
      if (att.teacherId && att.classId) {
        const qRef1 = doc(db, "teachers", att.teacherId, "classes", att.classId, "quizzes", quizId);
        const qSnap1 = await getDoc(qRef1);
        if (qSnap1.exists()) quizData = qSnap1.data() as QuizDoc;
      }
      // fallback to student's AI practice quiz
      if (!quizData) {
        const qRef2 = doc(db, "students", studentId, "practice", quizId);
        const qSnap2 = await getDoc(qRef2);
        if (qSnap2.exists()) quizData = qSnap2.data() as QuizDoc;
      }

      setQuiz(quizData);
      setLoading(false);
    };
    run();
  }, [studentId, quizId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading result…</div>;
  }

  if (!attempt || !quiz) {
    return (
      <div className="p-10 text-center text-red-600">
        Result not found.{" "}
        <Link to={`/teacher/class/${classId}`} className="underline text-primary">Back to Class</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              LogicLearn
            </span>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/teacher/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/teacher/class/${classId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Class
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <div className="text-center space-y-1">
                <h1 className="text-3xl font-bold">{attempt.title}</h1>
                <p className="text-muted-foreground">
                  Submitted on {new Date(attempt.submittedAt).toLocaleString()}
                </p>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Detailed Review</h2>
            {quiz.questions.map((q, index) => {
              const yourAns = attempt.answers?.[index] ?? "";
              const isCorrect = yourAns && yourAns === q.correct;
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary">Question {index + 1}</Badge>
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs font-medium">
                              <CheckCircle2 className="h-4 w-4" />
                              Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded text-xs font-medium">
                              <XCircle className="h-4 w-4" />
                              Incorrect
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg">{q.question}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className={`text-sm p-3 rounded-lg ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        <strong>Student answer:</strong> {yourAns || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/20">
                        <strong>Answer key:</strong> {q.correct}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherViewResult;
