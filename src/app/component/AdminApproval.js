"use client";
import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Search, Eye } from "lucide-react";

export default function AdminApproval({ user_id }) {
  const [pendingNews, setPendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingNews, setViewingNews] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchAllPendingNews();
  }, []);

  const fetchAllPendingNews = async () => {
    try {
      setLoading(true);
      // In a real app, you'd add authentication verification here
      const response = await fetch(`/api/admin/all-pending-news`);
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

  const approveNews = async (newsId) => {
    try {
      const response = await fetch("/api/admin/approve-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          news_id: newsId,
          status: "approved",
          reviewed_by: user_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve news");
      }

      // Update local state
      setPendingNews((prev) =>
        prev.map((news) =>
          news.id === newsId
            ? {
                ...news,
                status: "approved",
                reviewed_by: user_id,
                reviewed_at: new Date().toISOString(),
              }
            : news
        )
      );

      // Close detail view if open
      if (viewingNews?.id === newsId) {
        setViewingNews(null);
      }
    } catch (err) {
      console.error("Error approving news:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const rejectNews = async (newsId) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      const response = await fetch("/api/admin/approve-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          news_id: newsId,
          status: "declined",
          reviewed_by: user_id,
          rejected_reason: rejectionReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject news");
      }

      // Update local state
      setPendingNews((prev) =>
        prev.map((news) =>
          news.id === newsId
            ? {
                ...news,
                status: "declined",
                reviewed_by: user_id,
                rejected_reason: rejectionReason,
                reviewed_at: new Date().toISOString(),
              }
            : news
        )
      );

      // Close detail view
      setViewingNews(null);
      setRejectionReason("");
    } catch (err) {
      console.error("Error rejecting news:", err);
      alert(`Error: ${err.message}`);
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
      (filterStatus === "all" || news.status === filterStatus) &&
      (news.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        news.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        news.uploaded_by?.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <h1 className="text-2xl font-bold mb-6 text-gray-800">News Approval Dashboard</h1>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 relative">
          <div className="flex items-center border rounded-lg overflow-hidden bg-white">
            <div className="pl-3">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full p-2 outline-none text-sm text-gray-700"
              placeholder="Search by title, content or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg p-2 text-sm outline-none bg-white"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {filteredNews.length === 0 ? (
        <div className="text-center p-10 text-gray-500">
          No news submissions found with the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Title</th>
                <th className="py-3 px-4 text-left">Submitted By</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Submitted</th>
                <th className="py-3 px-4 text-left">Reviewed</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNews.map((news) => (
                <tr key={news.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{news.title}</td>
                  <td className="py-3 px-4">{news.uploaded_by}</td>
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
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingNews(news)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {news.status === "pending" && (
                        <>
                          <button
                            onClick={() => approveNews(news.id)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setViewingNews(news);
                              // Focus rejection reason input
                              setTimeout(() => {
                                document.getElementById("rejectionReason")?.focus();
                              }, 100);
                            }}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Decline"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* News Detail Modal */}
      {viewingNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">News Details</h2>
                <button
                  onClick={() => {
                    setViewingNews(null);
                    setRejectionReason("");
                  }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">{viewingNews.title}</h3>
                  <p className="text-sm text-gray-500">
                    Submitted by {viewingNews.uploaded_by} on {formatDate(viewingNews.submitted_at)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded border">
                  <p className="whitespace-pre-wrap">{viewingNews.content}</p>
                </div>

                {viewingNews.status === "declined" && (
                  <div className="bg-red-50 p-4 rounded border border-red-100">
                    <h4 className="font-medium text-red-800 mb-1">Rejection Reason:</h4>
                    <p className="text-red-700">{viewingNews.rejected_reason}</p>
                  </div>
                )}

                {viewingNews.status === "pending" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                        Rejection Reason (required to decline)
                      </label>
                      <textarea
                        id="rejectionReason"
                        className="w-full border rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                        rows="3"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason if declining this submission..."
                      ></textarea>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => approveNews(viewingNews.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectNews(viewingNews.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}