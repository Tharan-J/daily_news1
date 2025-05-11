"use client";
import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Search } from "lucide-react";

export default function PendingNews({ user_id }) {
  const [pendingNews, setPendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPendingNews();
  }, []);

  const fetchPendingNews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pending-news?user_id=${user_id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch pending news");
      }
      const data = await response.json();
      setPendingNews(data.news || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching pending news:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="text-yellow-500" size={20} />;
      case "approved":
        return <CheckCircle className="text-green-500" size={20} />;
      case "declined":
        return <XCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const filteredNews = pendingNews.filter(
    (news) =>
      news.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-5">
        Error: {error}. Please try again.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Submissions</h1>
      
      <div className="mb-4 relative">
        <div className="flex items-center border rounded-lg overflow-hidden bg-white">
          <div className="pl-3">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full p-2 outline-none text-sm text-gray-700"
            placeholder="Search by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredNews.length === 0 ? (
        <div className="text-center p-10 text-gray-500">
          No submissions found. Start by uploading news!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Title</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Submitted</th>
                <th className="py-3 px-4 text-left">Reviewed</th>
                <th className="py-3 px-4 text-left">Reviewed By</th>
                <th className="py-3 px-4 text-left">Comments</th>
              </tr>
            </thead>
            <tbody>
              {filteredNews.map((news) => (
                <tr key={news.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{news.title}</td>
                  <td className="py-3 px-4">{news.date}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {getStatusIcon(news.status)}
                      <span
                        className={`ml-2 text-xs font-medium py-1 px-2 rounded-full ${getStatusClass(
                          news.status
                        )}`}
                      >
                        {news.status?.charAt(0).toUpperCase() + news.status?.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{formatDate(news.submitted_at)}</td>
                  <td className="py-3 px-4">
                    {news.reviewed_at ? formatDate(news.reviewed_at) : "Not yet"}
                  </td>
                  <td className="py-3 px-4">{news.reviewed_by || "N/A"}</td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate">
                      {news.rejected_reason || (news.status === "approved" ? "Approved" : "N/A")}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}