import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { auth, db } from "@/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle2, XCircle, Award, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type AttemptDoc = {
  quizId: string;
  classId: string;          // "__ai__" for AI practice mirror
  teacherId?: string;       // present for class attempts
  title: string;
  submittedAt: string;
  answers?: Record<number, string>;
  type?: "teacher" | "ai";
};

type Q = { question: string; options: string[]; correct: string };
type QuizDoc = { title: string; questions: Q[] };

type AiFeedback = {
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestedTopics: string[];
  practicePlan: string[];
};

const TeacherAttemptResults = () => {
  const { classId, studentId, quizId } = useParams<{
    classId: string;
    studentId: string;
    quizId: string;
  }>();
  const [search] = useSearchParams();
  const src = search.get("src"); // "__ai__" for AI practice
  const { toast } = useToast();

  const [attempt, setAttempt] = useState<AttemptDoc | null>(null);
  const [quiz, setQuiz] = useState<QuizDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // AI feedback state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!studentId || !quizId) {
        setLoading(false);
        return;
      }

      // 1) Load attempt
      const aRef = doc(db, "students", studentId, "attempts", quizId);
      const aSnap = await getDoc(aRef);
      if (!aSnap.exists()) {
        setLoading(false);
        return;
      }
      const att = aSnap.data() as AttemptDoc;
      setAttempt(att);

      // 2) Load source quiz
      const isAi = src === "__ai__" || att.type === "ai" || att.classId === "__ai__";

      if (isAi) {
        const pRef = doc(db, "students", studentId, "practice", quizId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const pdata = pSnap.data() as any;
          setQuiz({
            title: pdata.title || att.title || "AI Practice",
            questions: Array.isArray(pdata.questions) ? pdata.questions : [],
          });
        }
      } else {
        const tId = att.teacherId;
        const clsId = classId!;
        if (tId && clsId) {
          const qRef = doc(db, "teachers", tId, "classes", clsId, "quizzes", quizId);
          const qSnap = await getDoc(qRef);
          if (qSnap.exists()) setQuiz(qSnap.data() as QuizDoc);
        }
      }

      // 3) Load existing AI feedback (shared with student)
      const fbRef = doc(db, "students", studentId, "ai_feedback", quizId);
      const fbSnap = await getDoc(fbRef);
      if (fbSnap.exists()) setAiFeedback(fbSnap.data() as AiFeedback);

      setLoading(false);
    };
    run();
  }, [classId, studentId, quizId, src]);

  // --- Robust JSON extractor (handles fenced code) ---
  const extractJSON = (text: string): any | null => {
    if (!text) return null;
    let cleaned = text.replace(/```json|```/gi, "").trim();
    try { return JSON.parse(cleaned); } catch {}
    const s = cleaned.indexOf("{"); const e = cleaned.lastIndexOf("}");
    if (s !== -1 && e !== -1 && e > s) {
      try { return JSON.parse(cleaned.slice(s, e + 1)); } catch {}
    }
    return null;
  };

  const generateAiFeedback = async () => {
    if (!attempt || !quiz || !studentId || !quizId) return;

    setAiLoading(true);
    try {
      const payload = quiz.questions.map((q, i) => ({
        i,
        question: q.question,
        correct: q.correct,
        student: attempt.answers?.[i] ?? "",
      }));

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "You are an expert learning coach. Analyze the student's MCQ attempt and return ONLY JSON exactly matching the schema.",
            },
            {
              role: "user",
              content:
`Student attempt for "${attempt.title}":
${JSON.stringify(payload, null, 2)}

Return strictly this JSON:
{
  "summary": "2-3 sentences overview of performance and misconceptions",
  "strengths": ["bullet", "bullet"],
  "improvements": ["bullet", "bullet"],
  "suggestedTopics": ["topic1","topic2","topic3"],
  "practicePlan": ["short actionable step 1","step 2","step 3"]
}`
            }
          ],
        }),
      });

      if (!res.ok) throw new Error(`OpenAI error (${res.status})`);
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? "";
      const parsed = extractJSON(content);

      if (
        !parsed ||
        typeof parsed.summary !== "string" ||
        !Array.isArray(parsed.strengths) ||
        !Array.isArray(parsed.improvements) ||
        !Array.isArray(parsed.suggestedTopics) ||
        !Array.isArray(parsed.practicePlan)
      ) {
        throw new Error("AI did not return expected JSON fields.");
      }

      const feedback: AiFeedback = {
        summary: parsed.summary,
        strengths: parsed.strengths,
        improvements: parsed.improvements,
        suggestedTopics: parsed.suggestedTopics,
        practicePlan: parsed.practicePlan,
      };

      // Save where the student view also reads
      await setDoc(
        doc(db, "students", studentId, "ai_feedback", quizId),
        feedback,
        { merge: true }
      );

      setAiFeedback(feedback);
      toast({ title: "AI feedback generated" });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Feedback failed",
        description: err?.message || "Try again.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading results…
      </div>
    );
  }

  if (!attempt || !quiz) {
    return (
      <div className="p-10 text-center text-red-600">
        Results not found.{" "}
        <Link to={`/teacher/class/${classId}`} className="underline text-primary">
          Back to class
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Nav */}
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
              <Link to={`/teacher/class/${classId}`}>Back to Class</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Award className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{quiz.title || attempt.title}</h1>
                  <p className="text-muted-foreground">
                    Submitted on {new Date(attempt.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Q-by-Q review */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Detailed Review</h2>

            {quiz.questions.map((q, i) => {
              const your = attempt.answers?.[i] ?? "";
              const ok = your && your === q.correct;

              return (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary">Question {i + 1}</Badge>
                          {ok ? (
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
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Student Answer</h4>
                      <p
                        className={`text-sm p-3 rounded-lg ${
                          ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                        }`}
                      >
                        {your || "—"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Answer Key</h4>
                      <p className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/20">
                        {q.correct}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* AI Feedback (teacher view) */}
          <Card className="mt-8 bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                AI Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!aiFeedback ? (
                <Button onClick={generateAiFeedback} disabled={aiLoading}>
                  {aiLoading ? "Generating..." : "Generate Feedback"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Overview</h4>
                    <p className="text-sm text-muted-foreground">{aiFeedback.summary}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-background/60">
                      <h4 className="font-semibold mb-2">Strengths</h4>
                      <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
                        {aiFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-background/60">
                      <h4 className="font-semibold mb-2">Areas to Improve</h4>
                      <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
                        {aiFeedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-background/60">
                    <h4 className="font-semibold mb-2">Suggested Topics</h4>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {aiFeedback.suggestedTopics.map((t, i) => (
                        <Badge key={i} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-background/60">
                    <h4 className="font-semibold mb-2">Practice Plan</h4>
                    <ol className="list-decimal ml-5 text-sm text-muted-foreground space-y-1">
                      {aiFeedback.practicePlan.map((p, i) => <li key={i}>{p}</li>)}
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="flex gap-4 mt-8">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={`/teacher/class/${classId}`}>Back to Class</Link>
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-primary to-primary/80" asChild>
              <Link to="/teacher/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttemptResults;
