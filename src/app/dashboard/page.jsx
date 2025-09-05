"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../../stores/authStore";
import useUIStore from "../../stores/uiStore";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";

export default function DashboardPage() {
  const router = useRouter();

  // Zustand stores
  const {
    user,
    isAuthenticated,
    needsPasswordSetup,
    isLoading,
    refreshSession,
    logout,
  } = useAuthStore();

  const { addToast } = useUIStore();

  useEffect(() => {
    // Refresh session on mount
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      if (needsPasswordSetup) {
        router.push("/set-password");
        return;
      }
    }
  }, [isAuthenticated, needsPasswordSetup, isLoading, router]);

  const handleSignOut = async () => {
    const result = await logout();

    if (result.success) {
      addToast({
        type: "success",
        message: "Signed out successfully",
      });
      router.push("/login");
    } else {
      addToast({
        type: "error",
        message: "Failed to sign out",
      });
    }
  };

  const handleTestToast = () => {
    addToast({
      type: "info",
      message: "This is a test notification!",
      title: "Test Toast",
    });
  };

  const handleRefreshSession = () => {
    refreshSession();
    addToast({
      type: "success",
      message: "Session refreshed successfully",
    });
  };

  if (isLoading || !isAuthenticated || needsPasswordSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-gray-700">Welcome, {user?.name}!</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 text-black">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">User Information</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Name:</span> {user?.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {user?.email}
                  </div>
                  <div>
                    <span className="font-medium">User ID:</span> {user?.id}
                  </div>
                  <div>
                    <span className="font-medium">
                      Password Setup Required:
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${
                        needsPasswordSetup
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {needsPasswordSetup ? "Yes" : "No"}
                    </span>
                  </div>
                  {user?.image && (
                    <div>
                      <span className="font-medium">Profile Image:</span>
                      <img
                        src={user.image}
                        alt="Profile"
                        className="mt-2 h-16 w-16 rounded-full"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">Zustand State Info</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Authentication Status:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${
                        isAuthenticated
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Loading State:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${
                        isLoading
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {isLoading ? "Loading" : "Idle"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    State managed by Zustand
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">Quick Actions</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleTestToast}
                  >
                    Test Toast Notification
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleRefreshSession}
                  >
                    Refresh Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
