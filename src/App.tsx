import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Teacher views
import TeacherStudentDetails from "./pages/teacher/TeacherStudentDetails";
import TeacherAttemptResults from "./pages/teacher/TeacherAttemptResults";

// Pages
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClass from "./pages/teacher/TeacherClass";
import TeacherQuiz from "./pages/teacher/TeacherQuiz";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TeacherClassInsights from "./pages/teacher/TeacherClassInsights";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentQuiz from "./pages/student/StudentQuiz";
import StudentQuizResults from "./pages/student/StudentQuizResults";
import StudentProfile from "./pages/student/StudentProfile";
import StudentAiFeedback from "./pages/student/StudentAiFeedback";
import StudentAiPracticeNew from "./pages/student/StudentAiPracticeNew";
import StudentAiPracticeQuiz from "./pages/student/StudentAiPracticeQuiz";
import StudentAiResults from "./pages/student/StudentAiResults";

// Misc
import NotFound from "./pages/NotFound";

// Initialize Query Client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Student AI */}
          <Route path="/student/ai-feedback" element={<StudentAiFeedback />} />
          <Route path="/student/ai/practice/new" element={<StudentAiPracticeNew />} />
          <Route path="/student/ai/practice/:practiceId" element={<StudentAiPracticeQuiz />} />
          <Route path="/student/ai/quiz/:quizId/results" element={<StudentAiResults />} />

          {/* Teacher insights & student views */}
          <Route path="/teacher/class/:classId/insights" element={<TeacherClassInsights />} />
          <Route path="/teacher/class/:classId/student/:studentId" element={<TeacherStudentDetails />} />
          <Route
            path="/teacher/class/:classId/student/:studentId/quiz/:quizId/results"
            element={<TeacherAttemptResults />}
          />

          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/class/:classId" element={<TeacherClass />} />
          {/* IMPORTANT: quiz edit/view now requires BOTH classId & quizId */}
          <Route path="/teacher/class/:classId/quiz/new" element={<TeacherQuiz />} />
          <Route path="/teacher/class/:classId/quiz/:quizId" element={<TeacherQuiz />} />
          <Route path="/teacher/profile" element={<TeacherProfile />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/class/:classId/quiz/:quizId" element={<StudentQuiz />} />
          <Route path="/student/class/:classId/quiz/:quizId/results" element={<StudentQuizResults />} />
          <Route path="/student/profile" element={<StudentProfile />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
