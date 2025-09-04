"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      console.log("No session, redirecting to login");
      router.push("/login");
      return;
    }

    console.log("Dashboard - Session check:", {
      email: session.user.email,
      needsPasswordSetup: session.user.needsPasswordSetup,
    });

    if (session.user.needsPasswordSetup) {
      console.log("User needs password setup, redirecting...");
      router.push("/set-password");
      return;
    }
  }, [session, status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.user.needsPasswordSetup) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-gray-700">
                Welcome, {session.user.name}!
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium">User Information</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Name:</span> {session.user.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {session.user.email}
                </div>
                <div>
                  <span className="font-medium">User ID:</span>{" "}
                  {session.user.id}
                </div>
                {/* <div>
                  <span className="font-medium">Password Setup Required:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs ${
                      session.user.needsPasswordSetup
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {session.user.needsPasswordSetup ? "Yes" : "No"}
                  </span>
                </div> */}
                {session.user.image && (
                  <div>
                    <span className="font-medium">Profile Image:</span>
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="mt-2 h-16 w-16 rounded-full"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
