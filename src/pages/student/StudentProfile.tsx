import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { auth } from "@/firebaseConfig";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const StudentProfile = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFullName(user.displayName || "");
        setEmail(user.email || "");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const initials = useMemo(() => {
    if (!fullName) return "U";
    const parts = fullName.trim().split(" ");
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  }, [fullName]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    try {
      const trimmed = fullName.trim() || "Student";
      await updateProfile(auth.currentUser, { displayName: trimmed });
      toast({ title: "Profile updated", description: "Your name has been saved." });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "Could not update profile",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading profile…
      </div>
    );
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
              <Link to="/student/dashboard">Dashboard</Link>
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
          <h1 className="text-4xl font-bold mb-8">My Profile</h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{fullName || "Student"}</CardTitle>
                  {email ? (
                    <Badge className="mt-2" variant="secondary">
                      {email}
                    </Badge>
                  ) : null}
                </CardHeader>
              </Card>
            </div>

            {/* Profile Edit Section */}
            <div className="md:col-span-2 space-y-6">
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
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} disabled />
                  </div>

                  <Button className="bg-gradient-to-r from-primary to-primary/80" onClick={handleSave}>
                    Save Changes
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

export default StudentProfile;
