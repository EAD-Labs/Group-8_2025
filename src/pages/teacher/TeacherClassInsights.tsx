import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
} from "firebase/firestore";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, BarChart2, Users, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Student = { id: string; name: string; email: string };
type ClassDoc = { name?: string; students?: Student[] };

type Attempt = {
  quizId: string;
  classId: string;
  teacherId: string;
  title: string;
  submittedAt: string;
};

type AiFeedback = {
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestedTopics: string[];
  practicePlan: string[];
};

type StudentInsight = {
  student: Student;
  attempts: Array<{
    quizId: string;
    title: string;
    submittedAt: string;
    feedback?: AiFeedback | null;
  }>;
  topicCounts: Record<string, number>;
};

const normalizeTopic = (t: string) =>
  t.trim().toLowerCase()
   .replace(/[^\p{L}\p{N}\s\-]/gu, "")
   .replace(/\s+/g, " ");

const topicsFromImprovements = (imps: string[]): string[] => {
  // very light heuristic: take short phrases split by punctuation; keep <= 3 words
  const out: string[] = [];
  imps.forEach((line) => {
    const parts = line.split(/[;.,]/g).map(p => p.trim()).filter(Boolean);
    parts.forEach(p => {
      const words = p.split(/\s+/g);
      if (words.length <= 5 && words.length >= 1) out.push(p);
    });
  });
  return out;
};

const TeacherClassInsights = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [className, setClassName] = useState<string>("Class");
  const [students, setStudents] = useState<Student[]>([]);
  const [insights, setInsights] = useState<StudentInsight[]>([]);

  // auth + class meta
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !classId) {
        setLoading(false);
        return;
      }
      setTeacherId(user.uid);
      try {
        const cRef = doc(db, "teachers", user.uid, "classes", classId);
        const cSnap = await getDoc(cRef);
        if (cSnap.exists()) {
          const data = cSnap.data() as ClassDoc;
          setClassName(data.name || "Class");
          setStudents(Array.isArray(data.students) ? data.students : []);
        }
      } catch (e) {
        console.error(e);
        toast({ title: "Failed to load class", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [classId, toast]);

  useEffect(() => {
    const loadInsights = async () => {
      if (!teacherId || !classId || students.length === 0) return;

      const result: StudentInsight[] = [];

      for (const student of students) {
        try {
          // attempts for this student (we'll filter client-side by class + teacher)
          const atCol = collection(db, "students", student.id, "attempts");
          const atSnap = await getDocs(query(atCol));

          const attempts: Attempt[] = [];
          atSnap.forEach((d) => {
            const a = d.data() as Attempt;
            if (a.classId === classId && a.teacherId === teacherId) {
              attempts.push(a);
            }
          });

          // load ai_feedback for each attempt (same id as quizId)
          const detail: StudentInsight["attempts"] = [];
          const topicCounts: Record<string, number> = {};

          for (const a of attempts) {
            const fbRef = doc(db, "students", student.id, "ai_feedback", a.quizId);
            const fbSnap = await getDoc(fbRef);
            let fb: AiFeedback | null = null;
            if (fbSnap.exists()) {
              fb = fbSnap.data() as AiFeedback;

              // aggregate topics: suggestedTopics + light parse from improvements
              const topics: string[] = [];
              if (Array.isArray(fb.suggestedTopics)) topics.push(...fb.suggestedTopics);
              if (Array.isArray(fb.improvements)) topics.push(...topicsFromImprovements(fb.improvements));

              topics.forEach((t) => {
                const key = normalizeTopic(t);
                if (!key) return;
                topicCounts[key] = (topicCounts[key] || 0) + 1;
              });
            }
            detail.push({
              quizId: a.quizId,
              title: a.title,
              submittedAt: a.submittedAt,
              feedback: fb,
            });
          }

          result.push({
            student,
            attempts: detail.sort(
              (x, y) => new Date(y.submittedAt).getTime() - new Date(x.submittedAt).getTime()
            ),
            topicCounts,
          });
        } catch (e) {
          console.error("insight load error", e);
        }
      }

      setInsights(result);
    };

    loadInsights();
  }, [students, teacherId, classId]);

  const sorted = useMemo(() => {
    // order students by total weaknesses desc
    return [...insights].sort((a, b) => {
      const sumA = Object.values(a.topicCounts).reduce((s, n) => s + n, 0);
      const sumB = Object.values(b.topicCounts).reduce((s, n) => s + n, 0);
      return sumB - sumA;
    });
  }, [insights]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading insights…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navbar */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              LogicLearn
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button variant="outline" asChild>
              <Link to="/teacher/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Insights — {className}</h1>
          <p className="text-muted-foreground">
            See which topics each student is struggling with. Powered by AI feedback and recent attempts.
          </p>
        </div>

        {/* Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{students.length}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Insights available
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {insights.filter(i => Object.keys(i.topicCounts).length > 0).length}/{students.length}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Tip
              </CardTitle>
              <CardDescription>Open any student to view AI details and recent attempts.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Per-student list */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map(({ student, attempts, topicCounts }) => {
            const pairs = Object.entries(topicCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3);

            return (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{student.name || "Student"}</CardTitle>
                  <CardDescription>{student.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold mb-2">Top weak topics</div>
                    {pairs.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No topics yet — ask the student to generate feedback after submitting a quiz.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {pairs.map(([t, n]) => (
                          <Badge key={t} variant="secondary">
                            {t} • {n}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-semibold mb-2">Recent attempts</div>
                    <div className="space-y-2">
                      {attempts.slice(0, 3).map((a) => (
                        <div key={a.quizId} className="text-sm flex items-center justify-between">
                          <span className="truncate max-w-[60%]" title={a.title}>{a.title}</span>
                          <span className="text-muted-foreground">{new Date(a.submittedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                      {attempts.length === 0 && (
                        <div className="text-sm text-muted-foreground">No attempts yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/teacher/class/${classId}/student/${student.id}/insights`}>
                        View student details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeacherClassInsights;
