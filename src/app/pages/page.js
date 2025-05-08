"use client";
import { useState, useEffect } from "react";
import { Home, Upload, LogOut } from "lucide-react";
import PageContent from "../component/UploadPage";
import AllData from "../component/ShowContent";
import { useSearchParams, useRouter } from "next/navigation";

export default function PageWithSidebar() {
  const [active, setActive] = useState("dashboard");
  const searchParams = useSearchParams();
  const router = useRouter();
  const user_id = searchParams.get("user_id") || "anonymous";

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
        >
          <Home size={24} />
        </button>
        <button
          onClick={() => setActive("upload")}
          className={`p-2 rounded-lg transition-colors text-black ${
            active === "upload" ? "bg-purple-200" : "hover:bg-purple-100"
          }`}
        >
          <Upload size={24} />
        </button>
        <button
          onClick={() => setActive("logout")}
          className={`p-2 rounded-lg transition-colors text-black ${
            active === "logout" ? "bg-purple-200" : "hover:bg-purple-100"
          }`}
        >
          <LogOut size={24} />
        </button>
      </aside>
      <main className="flex-1 bg-white overflow-auto">{renderContent()}</main>
    </div>
  );
}