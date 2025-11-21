import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Sparkles } from "lucide-react";
import { auth, db } from "@/firebaseConfig";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Attempt = {
  quizId: string;
  classId: string;
  teacherId: string;
  title?: string;
  submittedAt?: string;
  answers?: Record<number, string>;
};

type Q = { question: string; options: string[]; correct: string };
type QuizDoc = { title: string; questions: Q[] };

type PackedItem = {
  quizTitle: string;
  question: string;
  correct: string;
  chosen: string;
};

type AIReport = {
  overview?: string;
  categories?: Array<{
    name: string;
    accuracy: number;          // 0-100
    commonMistakes: string[];  // short bullets
    examples: Array<{ question: string; correct: string; chosen: string }>;
  }>;
  strengths?: string[];
  weaknesses?: string[];
  recommendedPractices?: string[];
  studyPlan?: Array<{ title: string; detail: string }>;
};

const MAX_QUESTIONS = 200; // cap for token safety

// Helper: robust JSON extractor (allows ```json fences)
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

const StudentAIFeedback = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [packing, setPacking] = useState(false);
  const [report, setReport] = useState<AIReport | null>(null);
  const [rawPreview, setRawPreview] = useState<PackedItem[]>([]);
  const [customNote, setCustomNote] = useState("");

  // Debug: show whether key is present
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("OPENAI KEY:", import.meta.env.VITE_OPENAI_API_KEY ? "present" : "missing");
  }, []);

  useEffect(() => {
    const run = async () => {
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }

      try {
        // 1) Load all attempts for this student
        const attemptsCol = collection(db, "students", user.uid, "attempts");
        const aSnap = await getDocs(attemptsCol);
        if (aSnap.empty) {
          setRawPreview([]);
          setLoading(false);
          return;
        }

        // 2) For each attempt, fetch the quiz to get the answer key
        //    and produce compact rows: quizTitle | question | correct | chosen
        const packed: PackedItem[] = [];

        // We’ll fetch serially to avoid Firestore throttling for now
        for (const aDoc of aSnap.docs) {
          const att = aDoc.data() as Attempt;
          if (!att.quizId || !att.classId || !att.teacherId) continue;

          const quizRef = doc(db, "teachers", att.teacherId, "classes", att.classId, "quizzes", att.quizId);
          const qSnap = await getDoc(quizRef);
          if (!qSnap.exists()) continue;

          const quiz = qSnap.data() as QuizDoc;
          const quizTitle = quiz.title || att.title || "Quiz";

          const answers = att.answers || {};
          (quiz.questions || []).forEach((q, idx) => {
            const chosen = (answers as any)[idx] ?? "";
            packed.push({
              quizTitle,
              question: q.question,
              correct: q.correct,
              chosen,
            });
          });
        }

        // 3) Limit to MAX_QUESTIONS oldest→newest or newest→oldest (choose newest)
        const trimmed = packed.slice(-MAX_QUESTIONS);
        setRawPreview(trimmed);
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error(e);
        toast({ title: "Load failed", description: e?.message || "Could not load attempts", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [toast]);

  const makePrompt = (rows: PackedItem[]) => {
    // Build a compact TSV-like payload for token efficiency
    const header = "quizTitle\tquestion\tcorrect\tchosen";
    const lines = rows.map(r =>
      [r.quizTitle, r.question, r.correct, r.chosen].map(x => (x || "").replace(/\s+/g, " ").slice(0, 400)).join("\t")
    );
    const tsv = [header, ...lines].join("\n");

    const userNote = customNote.trim() ? `\nTeacher/Student note: ${customNote.trim()}\n` : "";

    return `
You are a learning coach analyzing a student's multiple-choice quiz history.
You will receive rows: quizTitle, question, correct, chosen.

Tasks:
1) Derive 4–8 meaningful categories based on concepts/patterns (e.g., Fractions, Algebra: factoring, Geometry: angles, Logical fallacies: bandwagon, etc.)
2) For each category, compute accuracy (0–100) and list 1–3 common mistake patterns (phrased briefly).
3) Provide 3–6 clear recommended practice actions tailored to this student.
4) Build a short 7-step study plan (one item per step), each step with a concise title and 1–2 line detail.
5) Keep language simple and encouraging. Avoid grades/marks language.

Return ONLY JSON (no markdown) with this schema:
{
  "overview": "1-3 sentences summary",
  "categories": [
    { "name": "string", "accuracy": 0-100, "commonMistakes": ["..."], "examples": [{ "question": "string", "correct": "string", "chosen": "string" }] }
  ],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendedPractices": ["..."],
  "studyPlan": [{ "title": "string", "detail": "string" }]
}

${userNote}
DATA (TSV):
${tsv}
    `.trim();
  };

  const generateReport = async () => {
    if (!rawPreview.length) {
      toast({ title: "No attempts yet", description: "Attempt some quizzes first." });
      return;
    }
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      toast({ title: "API key missing", description: "VITE_OPENAI_API_KEY not found.", variant: "destructive" });
      return;
    }

    setPacking(true);
    try {
      const prompt = makePrompt(rawPreview);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a precise analyzer. Output valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.4,
        }),
      });

      if (!res.ok) throw new Error(`OpenAI error (${res.status})`);
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content ?? "";
      const parsed = extractJSON(raw);
      if (!parsed) throw new Error("Failed to parse AI JSON.");

      setReport(parsed as AIReport);
      toast({ title: "AI feedback ready" });
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e);
      toast({ title: "AI failed", description: e?.message || "Could not generate feedback", variant: "destructive" });
    } finally {
      setPacking(false);
    }
  };

  const questionCount = useMemo(() => rawPreview.length, [rawPreview]);

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

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-accent" />
            AI Feedback
          </h1>
          <Badge variant="secondary">{questionCount} questions analyzed</Badge>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Personalized Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Optional note to AI</label>
              <Textarea
                placeholder="e.g., 'Focus more on Algebra and recent quizzes only.'"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={generateReport} disabled={packing || loading}>
                {packing ? "Analyzing…" : "Generate Feedback"}
              </Button>
              {!import.meta.env.VITE_OPENAI_API_KEY && (
                <span className="text-xs text-red-600">VITE_OPENAI_API_KEY missing</span>
              )}
              {loading && <span className="text-sm text-muted-foreground">Loading attempts…</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              We summarize up to the most recent {MAX_QUESTIONS} questions for speed.
            </p>
          </CardContent>
        </Card>

        {/* Report */}
        {report ? (
          <div className="space-y-6">
            {/* Overview */}
            {report.overview && (
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{report.overview}</p>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            {Array.isArray(report.categories) && report.categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.categories.map((c, idx) => (
                    <div key={idx} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{c.name}</div>
                        <Badge variant="outline">{Math.round(c.accuracy)}% accuracy</Badge>
                      </div>
                      {Array.isArray(c.commonMistakes) && c.commonMistakes.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Common mistakes</div>
                          <ul className="list-disc pl-5 text-sm">
                            {c.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(c.examples) && c.examples.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Examples</div>
                          <ul className="space-y-2 text-sm">
                            {c.examples.slice(0, 3).map((ex, i) => (
                              <li key={i} className="rounded bg-muted/50 p-2">
                                <div className="font-medium">{ex.question}</div>
                                <div className="text-xs mt-1">
                                  <span className="mr-2">Your answer: <span className="font-medium">{ex.chosen || "—"}</span></span>
                                  <span>Correct: <span className="font-medium">{ex.correct}</span></span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Strengths / Weaknesses */}
            {(report.strengths?.length || report.weaknesses?.length) ? (
              <div className="grid md:grid-cols-2 gap-6">
                {report.strengths?.length ? (
                  <Card>
                    <CardHeader><CardTitle>Strengths</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 text-sm">
                        {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}
                {report.weaknesses?.length ? (
                  <Card>
                    <CardHeader><CardTitle>Needs Attention</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 text-sm">
                        {report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : null}

            {/* Recommendations */}
            {report.recommendedPractices?.length ? (
              <Card>
                <CardHeader><CardTitle>Recommended Practice</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm">
                    {report.recommendedPractices.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {/* Study Plan */}
            {report.studyPlan?.length ? (
              <Card>
                <CardHeader><CardTitle>7-Step Study Plan</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {report.studyPlan.map((step, i) => (
                    <div key={i} className="rounded border p-3">
                      <div className="font-semibold mb-1">{i + 1}. {step.title}</div>
                      <div className="text-sm text-muted-foreground">{step.detail}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Click <strong>Generate Feedback</strong> to create your personalized analysis.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentAIFeedback;
