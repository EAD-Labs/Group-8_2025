import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { auth, db } from "@/firebaseConfig";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AttemptCard = {
  quizId: string;
  classId: string;
  teacherId?: string;
  title: string;
  submittedAt: string;
  type?: "teacher" | "ai";
};

const TeacherStudentDetails = () => {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState("Student");
  const [attempts, setAttempts] = useState<AttemptCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const teacher = auth.currentUser;
      if (!teacher || !classId || !studentId) {
        setLoading(false);
        return;
      }

      // student name from class roster
      const classDoc = await getDoc(doc(db, "teachers", teacher.uid, "classes", classId));
      if (classDoc.exists()) {
        const data = classDoc.data() as any;
        const match = (data.students || []).find((s: any) => s.id === studentId);
        if (match?.name) setStudentName(match.name);
      }

      // attempts (teacher + AI mirror)
      const atRef = collection(db, "students", studentId, "attempts");
      const atSnap = await getDocs(atRef);
      const arr: AttemptCard[] = [];
      atSnap.forEach((d) => {
        const a = d.data() as any;
        // include this class's attempts OR AI attempts
        if (a.classId === classId || a.classId === "__ai__" || a.type === "ai") {
          arr.push({
            quizId: a.quizId,
            classId: a.classId,
            teacherId: a.teacherId,
            title: a.title || "Quiz",
            submittedAt: a.submittedAt,
            type: a.type,
          });
        }
      });
      arr.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setAttempts(arr);
      setLoading(false);
    };
    run();
  }, [classId, studentId]);

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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{studentName}</h1>
          <p className="text-muted-foreground">Class: {classId}</p>
        </div>

        <h2 className="text-2xl font-bold mb-4">Attempts</h2>
        {loading ? (
          <div className="text-muted-foreground">Loading attempts…</div>
        ) : attempts.length === 0 ? (
          <div className="text-muted-foreground">No attempts yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {attempts.map((a) => {
              const isAi = a.type === "ai" || a.classId === "__ai__";
              const label = isAi ? "AI Practice" : "Class Quiz";
              const src = isAi ? "__ai__" : classId!;
              return (
                <Card key={`${a.classId}-${a.quizId}`} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="mb-1">{a.title}</CardTitle>
                    <CardDescription className="flex items-center justify-between">
                      <span>{label}</span>
                      <Badge variant="outline">{new Date(a.submittedAt).toLocaleString()}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        navigate(
                          `/teacher/class/${classId}/student/${studentId}/quiz/${a.quizId}/results?src=${src}`
                        )
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherStudentDetails;
