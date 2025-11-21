import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { auth, db } from "@/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Q = { question: string; options: string[]; correct: string };
type PracticeDoc = { title: string; topic: string; questions: Q[]; createdAt?: any };

const StudentAiPracticeQuiz = () => {
  const { practiceId } = useParams<{ practiceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<PracticeDoc | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const progress = useMemo(() => {
    if (!quiz?.questions?.length) return 0;
    const answered = Object.keys(answers).length;
    return Math.min(100, Math.round((answered / quiz.questions.length) * 100));
  }, [answers, quiz]);

  useEffect(() => {
    const run = async () => {
      const user = auth.currentUser;
      if (!user || !practiceId) { setLoading(false); return; }

      // If already attempted, lock and preload answers
      const aRef = doc(db, "students", user.uid, "practiceAttempts", practiceId);
      const aSnap = await getDoc(aRef);
      if (aSnap.exists()) {
        const data = aSnap.data() as any;
        setSubmitted(true);
        setAnswers(data.answers || {});
      }

      const pRef = doc(db, "students", user.uid, "practice", practiceId);
      const pSnap = await getDoc(pRef);
      if (!pSnap.exists()) { setLoading(false); return; }
      setQuiz(pSnap.data() as PracticeDoc);
      setLoading(false);
    };
    run();
  }, [practiceId]);

  const handleSelect = (value: string) => {
    if (submitted) return;
    setAnswers({ ...answers, [currentQ]: value });
  };

  const toggleFlag = () => {
    const next = new Set(flagged);
    if (next.has(currentQ)) next.delete(currentQ);
    else next.add(currentQ);
    setFlagged(next);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !practiceId || !quiz) return;
    if (submitted) return;

    const submittedAt = new Date().toISOString();

    // 1) Save practice attempt (locked)
    await setDoc(
      doc(db, "students", user.uid, "practiceAttempts", practiceId),
      {
        practiceId,
        title: quiz.title,
        topic: quiz.topic,
        answers,
        submittedAt,
      },
      { merge: true }
    );

    // 2) Save unified attempt so it appears in Attempted Quizzes
    await setDoc(
      doc(db, "students", user.uid, "attempts", practiceId),
      {
        quizId: practiceId,
        classId: "__ai__",
        teacherId: "__ai__",
        title: quiz.title,
        submittedAt,
        answers,
        type: "ai",
      },
      { merge: true }
    );

    setSubmitted(true);
    toast({ title: "Practice submitted" });

    // 3) Go to unified results page
    navigate(`/student/class/__ai__/quiz/${practiceId}/results`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!quiz) {
    return (
      <div className="p-10 text-center text-red-600">
        Practice quiz not found. Go back to{" "}
        <Link to="/student/dashboard" className="underline text-primary">Dashboard</Link>
      </div>
    );
  }

  const current = quiz.questions[currentQ];
  const answered = answers[currentQ] ?? "";

  const isCorrect = (idx: number) => {
    const your = answers[idx] ?? "";
    return your && your === quiz.questions[idx].correct;
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
                <h1 className="font-bold">{quiz.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Question {currentQ + 1} of {quiz.questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/student/dashboard">Back to Dashboard</Link>
              </Button>
              {!submitted ? (
                <Button variant="destructive" size="sm" onClick={handleSubmit}>
                  Submit Practice
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/student/dashboard">Done</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary">Question {currentQ + 1}</Badge>
                    {submitted && (
                      <Badge
                        variant={isCorrect(currentQ) ? "default" : "secondary"}
                        className={isCorrect(currentQ) ? "bg-green-600" : ""}
                      >
                        {isCorrect(currentQ) ? "Correct" : "Incorrect"}
                      </Badge>
                    )}
                    {!submitted && flagged.has(currentQ) && (
                      <Badge variant="destructive">Flagged</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{current.question}</CardTitle>
                </div>
                {!submitted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFlag}
                    className={flagged.has(currentQ) ? "text-destructive" : ""}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Options */}
              <div className="space-y-3">
                {current.options.map((opt, idx) => {
                  const id = `q${currentQ}-opt${idx}`;
                  const chosen = answered === opt;
                  const after = submitted
                    ? opt === current.correct
                      ? "border-green-300 bg-green-50"
                      : chosen
                      ? "border-red-300 bg-red-50"
                      : ""
                    : "";

                  return (
                    <label
                      key={id}
                      htmlFor={id}
                      className={`flex items-center space-x-2 cursor-pointer border rounded p-2 ${after}`}
                    >
                      <input
                        id={id}
                        type="radio"
                        name={`q-${currentQ}`}
                        value={opt}
                        disabled={submitted}
                        checked={chosen}
                        onChange={() => handleSelect(opt)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={id}>{opt}</Label>
                    </label>
                  );
                })}
              </div>

              {/* Nav */}
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
                  {quiz.questions.map((_, index) => (
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
                  onClick={() => setCurrentQ(Math.min(quiz.questions.length - 1, currentQ + 1))}
                  disabled={currentQ === quiz.questions.length - 1}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {submitted && (
            <div className="mt-4 text-sm text-muted-foreground">
              Practice locked. Review answers above. Generate another practice quiz anytime.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAiPracticeQuiz;
