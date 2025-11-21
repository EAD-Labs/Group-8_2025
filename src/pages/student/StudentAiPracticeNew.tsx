// src/pages/student/StudentAiPracticeNew.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import { auth, db } from "@/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type GenQuestion = { question: string; options: string[]; correct: string };

const StudentAiPracticeNew = () => {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const extractJSON = (text: string): any | null => {
    if (!text) return null;
    let cleaned = text.replace(/```json|```/gi, "").trim();
    try { return JSON.parse(cleaned); } catch {}
    const s = cleaned.indexOf("["); const e = cleaned.lastIndexOf("]");
    if (s !== -1 && e !== -1 && e > s) {
      try { return JSON.parse(cleaned.slice(s, e + 1)); } catch {}
    }
    return null;
  };

  const handleGenerate = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Not logged in", description: "Please login", variant: "destructive" });
      return;
    }
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Enter a topic for the quiz", variant: "destructive" });
      return;
    }
    if (count < 1 || count > 20) {
      toast({ title: "Invalid number", description: "Choose between 1 and 20 questions", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const key = import.meta.env.VITE_OPENAI_API_KEY;
      if (!key) throw new Error("Missing VITE_OPENAI_API_KEY");

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.5,
          messages: [
            { role: "system", content: "You generate MCQ practice. Return ONLY raw JSON, no prose." },
            {
              role: "user",
              content:
`Create ${count} multiple-choice questions on: "${topic}".
Return STRICT JSON array of objects (no backticks, no text before/after):
[
  {"question":"string","options":["a","b","c","d"],"correct":"one of the options"},
  ...
]`
            }
          ]
        })
      });

      if (!res.ok) throw new Error(`OpenAI API error (${res.status})`);
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content ?? "";
      const parsed = extractJSON(raw);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("AI did not return a valid questions array");
      }

      const questions: GenQuestion[] = parsed.map((q: any) => ({
        question: String(q.question || ""),
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map((o: any) => String(o)) : ["", ""],
        correct: String(q.correct || ""),
      }));

      // ensure at least 2 options each
      const fixed = questions.map(q => {
        const opts = [...q.options];
        while (opts.length < 4) opts.push("");
        return { ...q, options: opts };
      });

      // Save practice quiz under the student
      const docRef = await addDoc(collection(db, "students", user.uid, "practice"), {
        title: `AI Practice: ${topic}`,
        topic,
        questions: fixed,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Practice quiz ready!" });
      navigate(`/student/ai/practice/${docRef.id}`);
    } catch (err: any) {
      console.error(err);
      toast({ title: "AI error", description: err?.message || "Failed to generate quiz", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
            <Button variant="ghost" asChild><Link to="/student/dashboard">Dashboard</Link></Button>
            <Button variant="outline" asChild><Link to="/login">Logout</Link></Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Generate AI Practice Quiz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input placeholder='e.g., "Quadratic Equations" or "Logical Fallacies"' value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Number of Questions (1–20)</Label>
              <Input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>) : "Generate Quiz"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAiPracticeNew;
