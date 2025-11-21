import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Users, BookOpen, Plus, Sparkles, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { auth, db } from "@/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type ClassItem = {
  id: string;
  name: string;
  description?: string;
  // NOTE: can be number (legacy) or array of student objects (new)
  students?: any;
  quizzes?: number;
  createdAt?: any;
};

const TeacherDashboard = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const [quizCounts, setQuizCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const perClassUnsubsRef = useRef<(() => void)[]>([]);

  // helper: normalize students -> number
  const studentsCountOf = (c: ClassItem) =>
    Array.isArray(c.students) ? c.students.length : (typeof c.students === "number" ? c.students : 0);

  // Subscribe to auth + classes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // cleanup existing per-class listeners
      perClassUnsubsRef.current.forEach((u) => u());
      perClassUnsubsRef.current = [];
      setQuizCounts({});

      if (!user) {
        setClasses([]);
        setLoading(false);
        return;
      }

      const classesCol = collection(db, "teachers", user.uid, "classes");
      const qClasses = query(classesCol);

      const unsubscribeClasses = onSnapshot(
        qClasses,
        (snap) => {
          const arr: ClassItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          setClasses(arr);
          setLoading(false);

          // Reset per-class listeners
          perClassUnsubsRef.current.forEach((u) => u());
          perClassUnsubsRef.current = [];

          // Subscribe to each class’s quizzes
          arr.forEach((c) => {
            const quizzesCol = collection(db, "teachers", user.uid, "classes", c.id, "quizzes");
            const unsub = onSnapshot(quizzesCol, (qsnap) => {
              setQuizCounts((prev) => ({
                ...prev,
                [c.id]: qsnap.size,
              }));
            });
            perClassUnsubsRef.current.push(unsub);
          });
        },
        (err) => {
          console.error("classes onSnapshot error:", err);
          toast({
            title: "Error",
            description: "Failed to load classes",
            variant: "destructive",
          });
          setLoading(false);
        }
      );

      perClassUnsubsRef.current.push(unsubscribeClasses);
    });

    return () => {
      unsubscribeAuth();
      perClassUnsubsRef.current.forEach((u) => u());
      perClassUnsubsRef.current = [];
    };
  }, [toast]);

  const openCreate = () => {
    setClassName("");
    setClassDescription("");
    setCreating(true);
  };

  const closeCreate = () => setCreating(false);

  const handleCreateClass = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Not logged in", description: "Please login", variant: "destructive" });
      return;
    }
    if (!className.trim()) {
      toast({ title: "Name required", description: "Please enter a class name", variant: "destructive" });
      return;
    }

    try {
      const classesCol = collection(db, "teachers", user.uid, "classes");
      await addDoc(classesCol, {
        name: className.trim(),
        description: classDescription.trim() || null,
        // Start with empty array so we’re consistent going forward
        students: [],
        createdAt: serverTimestamp(),
      });

      toast({ title: "Class created", description: `Created "${className}"` });
      setCreating(false);
    } catch (err: any) {
      console.error("create class error", err);
      toast({
        title: "Create failed",
        description: err?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    if (!confirm("Delete this class? This cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "teachers", user.uid, "classes", classId));
      toast({ title: "Deleted", description: "Class deleted" });
    } catch (err: any) {
      console.error("delete class error", err);
      toast({
        title: "Delete failed",
        description: err?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const totalQuizzes = Object.values(quizCounts).reduce((a, b) => a + (b || 0), 0);
  const totalStudents = classes.reduce((sum, c) => sum + studentsCountOf(c), 0);

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
            <Link to="/teacher/profile">
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your classes and track student progress</p>
        </div>

        {/* Stats (3 cards) */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Classes</CardDescription>
              <CardTitle className="text-3xl">{classes.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{totalStudents} students</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Quizzes</CardDescription>
              <CardTitle className="text-3xl">{totalQuizzes}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Across all classes</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="pb-3">
              <CardDescription>AI Insights</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-accent" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="h-auto p-0 text-accent" asChild>
                <Link to="/teacher/ai-feedback">View insights</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Classes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Classes</h2>
            <Button className="bg-gradient-to-r from-primary to-primary/80" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </div>

          {/* Create form */}
          {creating && (
            <Card className="mb-6 mt-6 shadow-md border border-border">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Class Name</label>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="e.g. Grade 10 - Logic A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description (optional)</label>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={classDescription}
                      onChange={(e) => setClassDescription(e.target.value)}
                      placeholder="Short description"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <Button className="bg-gradient-to-r from-primary to-primary/80" onClick={handleCreateClass}>
                    Create
                  </Button>
                  <Button variant="outline" onClick={closeCreate}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center text-muted-foreground">Loading classes...</div>
            ) : classes.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground">No classes yet. Create one above.</div>
            ) : (
              classes.map((classItem) => {
                const quizCount = quizCounts[classItem.id] ?? 0;
                const studentCount = studentsCountOf(classItem);
                return (
                  <Card key={classItem.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{classItem.name}</span>
                        <Badge variant="secondary">{studentCount} students</Badge>
                      </CardTitle>
                      <CardDescription>{quizCount} quizzes assigned</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" asChild>
                          <Link to={`/teacher/class/${classItem.id}`}>View Class</Link>
                        </Button>
                        <Button variant="ghost" onClick={() => handleDeleteClass(classItem.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
