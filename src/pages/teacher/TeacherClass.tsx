import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { db, auth } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
  arrayUnion,
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Plus, Calendar, CheckCircle2, PlayCircle, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Quiz {
  id: string;
  title: string;
  status?: "draft" | "ongoing" | "completed";
  startDate?: string;
  questions?: {
    question: string;
    options: string[];
    correct: string;
  }[];
  dueDate?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  avgScore: number;
}

interface ClassData {
  id: string;
  name: string;
  students: Student[];
}

const TeacherClass = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quizzes, setQuizzes] = useState({
    draft: [] as Quiz[],
    ongoing: [] as Quiz[],
    completed: [] as Quiz[],
  });
  const [loading, setLoading] = useState(true);

  const [classData, setClassData] = useState<ClassData>({
    id: "",
    name: "",
    students: [],
  });

  // Add Student modal state
  const [addOpen, setAddOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [adding, setAdding] = useState(false);

  // Fetch class details
  useEffect(() => {
    if (!classId) return;

    const fetchClass = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const classRef = collection(db, "teachers", user.uid, "classes");
      const snapshot = await getDocs(classRef);
      const classDoc = snapshot.docs.find((doc) => doc.id === classId);
      if (!classDoc) return;

      const data: any = classDoc.data();
      setClassData({
        id: classDoc.id,
        name: data.name || "Unnamed Class",
        students: Array.isArray(data.students) ? data.students : [],
      });
    };

    fetchClass();
  }, [classId]);

  // Fetch quizzes (live)
  useEffect(() => {
    if (!classId) return;

    const user = auth.currentUser;
    if (!user) return;

    const quizzesRef = collection(db, "teachers", user.uid, "classes", classId, "quizzes");
    const unsubscribe = onSnapshot(quizzesRef, (snapshot) => {
      const allQuizzes: Quiz[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Quiz),
      }));

      setQuizzes({
        draft: allQuizzes.filter((q) => q.status === "draft"),
        ongoing: allQuizzes.filter((q) => q.status === "ongoing"),
        completed: allQuizzes.filter((q) => q.status === "completed"),
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

  if (!classId) {
    return (
      <div className="p-10 text-center text-red-600">
        Error: No class selected. Go back to your{" "}
        <Link to="/teacher/dashboard" className="underline text-primary">
          Dashboard
        </Link>
      </div>
    );
  }

  // === Add Student handler ===
  const handleAddStudent = async () => {
    const teacher = auth.currentUser;
    if (!teacher) {
      toast({ title: "Not logged in", description: "Please login", variant: "destructive" });
      return;
    }
    if (!studentEmail.trim()) {
      toast({ title: "Email required", description: "Enter a student email", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("email", "==", studentEmail.trim().toLowerCase()));
      const res = await getDocs(q);

      if (res.empty) {
        throw new Error("No user found with this email.");
      }

      const userDoc = res.docs[0];
      const userData = userDoc.data() as any;

      if (userData.role && userData.role !== "student") {
        throw new Error("This user is not a student.");
      }

      const studentUid = userDoc.id;
      const studentName = userData.name || "Student";
      const studentRec: Student = {
        id: studentUid,
        name: studentName,
        email: userData.email || studentEmail.trim(),
        avgScore: 0,
      };

      // Update class.students array
      const classDocRef = doc(db, "teachers", teacher.uid, "classes", classId);
      await updateDoc(classDocRef, {
        students: arrayUnion(studentRec),
      });

      // Create enrollment for the student
      await setDoc(
        doc(db, "students", studentUid, "enrollments", classId),
        {
          classId,
          teacherId: teacher.uid,
          joinedAt: new Date(),
        },
        { merge: true }
      );

      const fresh = await getDoc(classDocRef);
      if (fresh.exists()) {
        const data: any = fresh.data();
        setClassData({
          id: classId,
          name: data.name || "Unnamed Class",
          students: Array.isArray(data.students) ? data.students : [],
        });
      }

      toast({ title: "Student added", description: `${studentName} enrolled successfully.` });
      setStudentEmail("");
      setAddOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Add failed",
        description: err?.message || "Could not add student",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

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
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/teacher/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Logout</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{classData.name}</h1>
          <p className="text-muted-foreground">{classData.students.length} students enrolled</p>
        </div>

        {/* Quizzes Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Quizzes</h2>
            <Button
              onClick={() => navigate(`/teacher/class/${classId}/quiz/new`)}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Plus className="h-4 w-4 mr-2" /> Create New Quiz
            </Button>
          </div>

          {loading ? (
            <p>Loading quizzes...</p>
          ) : (
            ["draft", "ongoing", "completed"].map((key) => {
              const labelMap: any = {
                draft: { icon: <Calendar className="h-5 w-5 text-accent" />, label: "Draft" },
                ongoing: { icon: <PlayCircle className="h-5 w-5 text-primary" />, label: "Ongoing" },
                completed: { icon: <CheckCircle2 className="h-5 w-5 text-green-600" />, label: "Completed" },
              };
              const section = (quizzes as any)[key];
              if (section.length === 0) return null;

              return (
                <div key={key} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    {labelMap[key].icon}
                    {labelMap[key].label}
                  </h3>
                  <div className="space-y-3">
                    {section.map((quiz: Quiz) => (
                      <Card key={quiz.id}>
                        <CardContent className="p-6 flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg mb-2">{quiz.title}</h4>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>Due: {quiz.dueDate || "TBD"}</span>
                              <span>{quiz.questions?.length || 0} questions</span>
                            </div>
                          </div>

                          {key === "draft" ? (
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/teacher/class/${classId}/quiz/${quiz.id}`)}
                            >
                              Edit
                            </Button>
                          ) : key === "ongoing" ? (
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/teacher/class/${classId}/quiz/${quiz.id}`)}
                            >
                              View
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Students Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Students</h2>
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>

          {/* Add Student modal */}
          {addOpen && (
            <Card className="mb-6 border border-accent/30">
              <CardContent className="p-4">
                <div className="grid md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Student Email</label>
                    <Input
                      placeholder="student@example.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      type="email"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The email must match a user with <code>role: "student"</code>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddStudent} disabled={adding} className="flex-1">
                      {adding ? "Adding..." : "Add"}
                    </Button>
                    <Button variant="outline" onClick={() => setAddOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student cards — no Insights button, just View Details */}
          <div className="grid md:grid-cols-2 gap-4">
            {classData.students.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-lg">{student.name}</div>
                      <div className="text-sm text-muted-foreground">{student.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/teacher/class/${classId}/student/${student.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
            {classData.students.length === 0 && (
              <div className="text-muted-foreground">No students yet. Add one above.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherClass;
