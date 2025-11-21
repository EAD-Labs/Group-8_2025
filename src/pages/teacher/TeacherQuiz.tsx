import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, auth } from "@/firebaseConfig";
import { collection, doc, getDoc, addDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged } from "firebase/auth";

interface Question { question: string; options: string[]; correct: string; }

interface QuizData {
  id?: string;
  title: string;
  questions: Question[];
  status: "draft" | "ongoing";
  startDate?: string;
  dueDate?: string;
}

const TeacherQuiz = () => {
  const { quizId, classId } = useParams<{ quizId: string; classId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<QuizData>({
    title: "",
    questions: [{ question: "", options: ["", ""], correct: "" }],
    status: "ongoing",
    dueDate: "",
  });
  const [loading, setLoading] = useState(!!quizId);
  const [userReady, setUserReady] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    console.log("OPENAI KEY:", import.meta.env.VITE_OPENAI_API_KEY?.slice(0, 8) + "...");
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserReady(!!user);
      if (!user) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!quizId || !userReady || !auth.currentUser) {
      setLoading(false);
      return;
    }
    const fetchQuiz = async () => {
      const docRef = doc(db, "teachers", auth.currentUser!.uid, "classes", classId!, "quizzes", quizId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as QuizData;
        setQuiz({
          ...data,
          questions: data.questions?.length ? data.questions : [{ question: "", options: ["", ""], correct: "" }],
        });
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [quizId, classId, userReady]);

  if (!classId) {
    return (
      <div className="p-10 text-center text-red-600">
        Error: No class selected. Go back to your{" "}
        <Link to="/teacher/dashboard" className="underline text-primary">Dashboard</Link>
      </div>
    );
  }

  if (loading) return <div className="p-10">Loading...</div>;

  const handleAddQuestion = () => {
    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, { question: "", options: ["", ""], correct: "" }],
    }));
  };

  const handleDeleteQuestion = (index: number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionChange = (index: number, field: "question" | "correct", value: string) => {
    const updated = [...quiz.questions];
    updated[index][field] = value;
    setQuiz({ ...quiz, questions: updated });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...quiz.questions];
    updated[qIndex].options[optIndex] = value;
    setQuiz({ ...quiz, questions: updated });
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      toast({ title: "Not logged in", description: "Please login", variant: "destructive" });
      return;
    }
    if (!quiz.title.trim()) {
      toast({ title: "Error", description: "Quiz title required", variant: "destructive" });
      return;
    }
    try {
      const quizzesCol = collection(db, "teachers", auth.currentUser.uid, "classes", classId, "quizzes");
      if (quizId) {
        const docRef = doc(quizzesCol, quizId);
        await setDoc(docRef, { ...quiz, updatedAt: serverTimestamp() });
        toast({ title: "Quiz updated" });
      } else {
        await addDoc(quizzesCol, { ...quiz, status: quiz.status, createdAt: serverTimestamp() });
        toast({ title: "Quiz created" });
      }
      navigate(`/teacher/class/${classId}`);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Something went wrong", variant: "destructive" });
    }
  };

  // ---------- AI helper to extract JSON even if fenced ----------
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

  const handleGenerateAIQuestion = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Error", description: "Please enter a prompt", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an AI quiz generator. Return ONLY raw JSON. No prose or markdown." },
            { role: "user", content:
`Generate ONE MCQ about: ${aiPrompt}
Return EXACT JSON: {"question":"string","options":["a","b","c","d"],"correct":"one of the options"}` },
          ],
          temperature: 0.7,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI API error (${res.status})`);
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content ?? "";
      const parsed = extractJSON(raw);
      if (!parsed || !parsed.question || !Array.isArray(parsed.options)) {
        throw new Error("AI did not return valid question format.");
      }
      const generated: Question = {
        question: String(parsed.question),
        options: parsed.options.map((x: any) => String(x)).slice(0, 4),
        correct: String(parsed.correct ?? ""),
      };
      while (generated.options.length < 4) generated.options.push("");
      setQuiz((prev) => ({ ...prev, questions: [...prev.questions, generated] }));
      setAiPrompt("");
      toast({ title: "AI question added!" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Failed to generate question", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              LogicLearn
            </span>
          </Link>
          <Button variant="outline" asChild>
            <Link to={`/teacher/class/${classId}`}>Back to Class</Link>
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10">
        <Card className="p-6">
          <CardHeader>
            <CardTitle>{quizId ? "Edit Quiz" : "Create Quiz"}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <label className="block mb-1 font-medium">Quiz Title</label>
              <Input
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={quiz.status === "draft"}
                  onChange={(e) =>
                    setQuiz((prev) => ({ ...prev, status: e.target.checked ? "draft" : "ongoing" }))
                  }
                />
                Complete Later
              </label>
            </div>

            {/* AI Assistant */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">AI-assisted Question Generator</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Describe a question topic (e.g., 'Quadratic equations basics')"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <Button onClick={handleGenerateAIQuestion} disabled={aiLoading}>
                  {aiLoading ? "Generating..." : "Generate Question"}
                </Button>
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-2">Questions</h2>
              {quiz.questions.map((q, idx) => (
                <Card key={idx} className="mb-3 border p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Question {idx + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder={`Question text`}
                    value={q.question}
                    onChange={(e) => handleQuestionChange(idx, "question", e.target.value)}
                    className="mb-2"
                  />
                  {q.options.map((opt, oidx) => (
                    <Input
                      key={oidx}
                      placeholder={`Option ${oidx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, oidx, e.target.value)}
                      className="mb-1"
                    />
                  ))}
                  <Input
                    placeholder="Correct answer"
                    value={q.correct}
                    onChange={(e) => handleQuestionChange(idx, "correct", e.target.value)}
                  />
                </Card>
              ))}
              <Button onClick={handleAddQuestion} className="mt-2 w-full">
                <Plus className="h-4 w-4 mr-2" /> Add Question
              </Button>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" asChild>
                <Link to={`/teacher/class/${classId}`}>Cancel</Link>
              </Button>
              <Button onClick={handleSave}>{quizId ? "Update Quiz" : "Save Quiz"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherQuiz;
