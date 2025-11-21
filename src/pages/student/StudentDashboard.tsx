import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Clock, Play, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { auth, db } from "@/firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

type OngoingCard = {
  classId: string;
  className: string;
  teacherId: string;
  quizId: string;
  title: string;
  dueDate?: string | null;
  questionsCount: number;
};

type AttemptCard = {
  quizId: string;
  classId?: string;
  teacherId?: string;
  title: string;
  submittedAt: string;
  className: string;
  type: "teacher" | "ai";
};

const StudentDashboard = () => {
  const [ongoing, setOngoing] = useState<OngoingCard[]>([]);
  const [attempted, setAttempted] = useState<AttemptCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }

      // Enrollments (for teacher quizzes)
      const enrollRef = collection(db, "students", user.uid, "enrollments");
      const enrollSnap = await getDocs(enrollRef);
      const enrolls = enrollSnap.docs.map(d => ({ classId: d.id, ...(d.data() as any) }));

      // Class meta
      const classMeta: Record<string, { teacherId: string; className: string }> = {};
      for (const enr of enrolls) {
        const { classId, teacherId } = enr;
        if (!teacherId) continue;
        const classDocRef = doc(db, "teachers", teacherId, "classes", classId);
        const classDocSnap = await getDoc(classDocRef);
        const className =
          classDocSnap.exists() ? ((classDocSnap.data() as any).name || "Class") : "Class";
        classMeta[classId] = { teacherId, className };
      }

      // Attempts (both teacher + AI)
      const atRef = collection(db, "students", user.uid, "attempts");
      const atSnap = await getDocs(atRef);

      const attemptedSet = new Set<string>();
      const attemptedCards: AttemptCard[] = [];

      atSnap.forEach(a => {
        const aData = a.data() as any;
        const type = (aData.type as "teacher" | "ai") || "teacher";
        attemptedSet.add(a.id); // attempt doc id == quizId

        if (type === "teacher") {
          const cm = aData.classId ? (classMeta[aData.classId] || { className: "Class", teacherId: aData.teacherId }) : { className: "Class", teacherId: aData.teacherId };
          attemptedCards.push({
            type,
            quizId: aData.quizId,
            classId: aData.classId,
            teacherId: aData.teacherId,
            title: aData.title || "Quiz",
            submittedAt: aData.submittedAt,
            className: cm.className,
          });
        } else {
          // <<< AI attempts: show as "AI Practice"
          attemptedCards.push({
            type,
            quizId: aData.quizId,
            title: aData.title || "AI Practice Quiz",
            submittedAt: aData.submittedAt,
            className: "AI Practice",
          });
        }
      });

      // Ongoing teacher quizzes (exclude attempted)
      const cards: OngoingCard[] = [];
      for (const enr of enrolls) {
        const { classId, teacherId } = enr;
        if (!teacherId) continue;
        const cm = classMeta[classId] || { className: "Class", teacherId };
        const quizzesRef = collection(db, "teachers", teacherId, "classes", classId, "quizzes");
        const qOngoing = query(quizzesRef, where("status", "==", "ongoing"));
        const qSnap = await getDocs(qOngoing);
        qSnap.forEach(qd => {
          if (attemptedSet.has(qd.id)) return;
          const qData = qd.data() as any;
          cards.push({
            classId,
            className: cm.className,
            teacherId,
            quizId: qd.id,
            title: qData.title || "Untitled Quiz",
            dueDate: qData.dueDate ?? null,
            questionsCount: Array.isArray(qData.questions) ? qData.questions.length : 0,
          });
        });
      }

      attemptedCards.sort((a, b) => (new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));

      setAttempted(attemptedCards);
      setOngoing(cards);
      setLoading(false);
    };

    run();
  }, []);

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
            <Link to="/student/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
            <Button variant="outline" asChild>
              <Link to="/login">Logout</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* AI Feedback at the top */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="pb-3">
              <CardDescription>AI Feedback</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-accent" />
                Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <Button variant="link" className="h-auto p-0 text-accent" asChild>
                  <Link to="/student/ai-feedback">View insights</Link>
                </Button>
                <Button className="bg-gradient-to-r from-primary to-primary/80" asChild>
                  <Link to="/student/ai/practice/new">Generate AI Practice Quiz</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-muted-foreground">Continue your logical reasoning journey</p>
        </div>

        {/* Ongoing Quizzes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Continue Learning</h2>

          {loading ? (
            <div className="text-muted-foreground">Loading your quizzes...</div>
          ) : ongoing.length === 0 ? (
            <div className="text-muted-foreground">No ongoing quizzes you can attempt right now.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {ongoing.map((q) => (
                <Card key={`${q.classId}-${q.quizId}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <CardTitle className="mb-1">{q.title}</CardTitle>
                        <CardDescription>{q.className}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {q.dueDate || "TBD"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {q.questionsCount} questions
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-gradient-to-r from-primary to-primary/80" asChild>
                      <Link to={`/student/class/${q.classId}/quiz/${q.quizId}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Start / Continue
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Attempted Quizzes (includes AI attempts now) */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Attempted Quizzes</h2>
          {loading ? (
            <div className="text-muted-foreground">Loading your attempts...</div>
          ) : attempted.length === 0 ? (
            <div className="text-muted-foreground">You haven’t attempted any quizzes yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {attempted.map((a) => {
                const link =
                  a.type === "ai"
                    ? `/student/ai/quiz/${a.quizId}/results`
                    : `/student/class/${a.classId}/quiz/${a.quizId}/results`;
                return (
                  <Card key={`${a.type}-${a.quizId}`} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <CardTitle className="mb-1">{a.title}</CardTitle>
                          <CardDescription>{a.className}</CardDescription>
                        </div>
                        <Badge variant="outline">
                          {new Date(a.submittedAt).toLocaleString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={link}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Results
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
