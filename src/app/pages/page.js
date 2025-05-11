"use client";
import { useState, useEffect } from "react";
import { Home, Upload, LogOut, FileText, UserCheck, Newspaper } from "lucide-react";
import PageContent from "../component/UploadPage";
import AllData from "../component/ShowContent";
import PendingNews from "../component/PendingNews";
import AdminApproval from "../component/AdminApproval";
import EditorialPage from "../component/EditorialPage";
import { useSearchParams, useRouter } from "next/navigation";

export default function PageWithSidebar() {
  const [active, setActive] = useState("dashboard");
  const [isAdmin, setIsAdmin] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const user_id = searchParams.get("user_id") || "anonymous";

  // In a real app, you would check the user's role from a database or JWT
  useEffect(() => {
    // This is just a placeholder - in a real app, you would verify admin status
    // via a proper authentication system
    const checkAdminStatus = async () => {
      // Example: Check if user_id contains "admin" for demo purposes
      // In a real app, you would check against your authentication system
      setIsAdmin(user_id.toLowerCase().includes("admin"));
    };
    
    checkAdminStatus();
  }, [user_id]);

  useEffect(() => {
    if (active === "logout") {
      // Delay to show message or clear data if needed
      setTimeout(() => {
        router.push("/"); // Adjust this path based on your actual login route
      }, 200); // optional delay
    }
  }, [active, router]);

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <AllData user_id={user_id} />;
      case "upload":
        return <PageContent user_id={user_id} />;
      case "submissions":
        return <PendingNews user_id={user_id} />;
      case "editorial":
        return <EditorialPage user_id={user_id} />;
      case "admin":
        return isAdmin ? <AdminApproval user_id={user_id} /> : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200 max-w-md">
              <h2 className="text-xl font-semibold text-red-700 mb-2">Access Denied</h2>
              <p className="text-gray-700">You don't have permission to access the admin area.</p>
            </div>
          </div>
        );
      case "logout":
        return (
          <p className="text-center mt-10 text-black">
            You have been logged out.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <aside className="w-20 bg-gray-100 flex flex-col items-center justify-center py-4 space-y-6 shadow-lg">
        <button
          onClick={() => setActive("dashboard")}
          className={`p-2 rounded-lg transition-colors text-black ${
            active === "dashboard" ? "bg-purple-200" : "hover:bg-purple-100"
          }`}
          title="Dashboard"
        >
          <Home size={24} />
        </button>
        <button
          onClick={() => setActive("upload")}
          className={`p-2 rounded-lg transition-colors text-black ${
            active === "upload" ? "bg-purple-200" : "hover:bg-purple-100"
          }`}
          title="Upload News"
        >
          <Upload size={24} />
        </button>
        <button
          onClick={() => setActive("submissions")}
          className={`p-2 rounded-lg transition-colors text-black ${
            active === "submissions" ? "bg-purple-200" : "hover:bg-purple-100"
          }`}
          title="My Submissions"
        >
          <FileText size={24} />
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => setActive("editorial")}
              className={`p-2 rounded-lg transition-colors text-black ${
                active === "editorial" ? "bg-purple-200" : "hover:bg-purple-100"
              }`}
              title="Magazine Editorial"
            >
              <Newspaper size={24} />
            </button>
            <button
              onClick={() => setActive("admin")}
              className={`p-2 rounded-lg transition-colors text-black ${
                active === "admin" ? "bg-purple-200" : "hover:bg-purple-100"
              }`}
              title="Admin Approval"
            >
              <UserCheck size={24} />
            </button>
          </>
        )}
        <button
          onClick={() => setActive("logout")}
          className={`p-2 rounded-lg transition-colors text-black ${
            active === "logout" ? "bg-purple-200" : "hover:bg-purple-100"
          }`}
          title="Logout"
        >
          <LogOut size={24} />
        </button>
      </aside>
      <main className="flex-1 bg-white overflow-auto">{renderContent()}</main>
    </div>
  );
}