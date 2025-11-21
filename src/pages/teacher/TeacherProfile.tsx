import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const TeacherProfile = () => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const { toast } = useToast();

  // Fetch logged-in teacher
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setFullName(currentUser.displayName || "");
        setEmail(currentUser.email || "");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Save profile updates
  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      if (fullName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: fullName });
      }
      if (email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, email);
      }
      toast({
        title: "Profile updated successfully",
        description: "Your name and email have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Update password
  const handlePasswordChange = async () => {
    if (!auth.currentUser) return;
    const { current, new: newPass, confirm } = passwords;

    if (!current || !newPass || !confirm) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPass !== confirm) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      // Reauthenticate
      const credential = EmailAuthProvider.credential(auth.currentUser.email, current);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPass);

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });

      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      toast({
        title: "Password update failed",
        description:
          error.code === "auth/wrong-password"
            ? "Incorrect current password."
            : error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20 text-muted-foreground">Loading...</div>;
  }

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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Profile</h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {fullName ? fullName[0] : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{fullName || "Teacher"}</CardTitle>
                  <CardDescription>{email}</CardDescription>
                </CardHeader>
              </Card>

              {/* Teaching Stats */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Teaching Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Classes</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Students</span>
                    <span className="font-semibold">84</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quizzes Created</span>
                    <span className="font-semibold">45</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Ensure your account is secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={handlePasswordChange}
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
