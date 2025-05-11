"use client";
import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  BookOpen,
  Calendar,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AllData({ user_id }) {
  // News categories
  const [activeNews, setActiveNews] = useState([]);
  const [upcomingNews, setUpcomingNews] = useState([]);
  const [publishedNews, setPublishedNews] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  // Date filters
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered data
  const [filteredActiveNews, setFilteredActiveNews] = useState([]);
  const [filteredUpcomingNews, setFilteredUpcomingNews] = useState([]);
  const [filteredPublishedNews, setFilteredPublishedNews] = useState([]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/db/mysql/display", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id, category: "all" }),
      });

      if (!res.ok) throw new Error("Failed to fetch data");

      const result = await res.json();

      setActiveNews(result.activeNews || []);
      setUpcomingNews(result.upcomingNews || []);
      setPublishedNews(result.publishedNews || []);

      setFilteredActiveNews(result.activeNews || []);
      setFilteredUpcomingNews(result.upcomingNews || []);
      setFilteredPublishedNews(result.publishedNews || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Get current data based on active tab
  const getCurrentData = useCallback(() => {
    switch (activeTab) {
      case "active":
        return filteredActiveNews;
      case "upcoming":
        return filteredUpcomingNews;
      case "published":
        return filteredPublishedNews;
      default:
        return filteredActiveNews;
    }
  }, [
    activeTab,
    filteredActiveNews,
    filteredUpcomingNews,
    filteredPublishedNews,
  ]);

  // Apply filters to all categories
  const applyFilters = useCallback(() => {
    const filterData = (data) => {
      const term = searchTerm.trim().toLowerCase();

      let filtered = [...data];

      // Filter by search term if present
      if (term) {
        filtered = filtered.filter((item) =>
          [item.title, item.content, item.uploaded_by]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(term))
        );
      }

      // Filter by date range if present
      if (startDate || endDate) {
        filtered = filtered.filter((item) => {
          const itemDate = new Date(item.date);
          const afterStartDate = startDate ? itemDate >= startDate : true;
          const beforeEndDate = endDate ? itemDate <= endDate : true;
          return afterStartDate && beforeEndDate;
        });
      }

      return filtered;
    };

    setFilteredActiveNews(filterData(activeNews));
    setFilteredUpcomingNews(filterData(upcomingNews));
    setFilteredPublishedNews(filterData(publishedNews));
  }, [activeNews, upcomingNews, publishedNews, searchTerm, startDate, endDate]);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters();
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setStartDate(null);
    setEndDate(null);
    setFilteredActiveNews(activeNews);
    setFilteredUpcomingNews(upcomingNews);
    setFilteredPublishedNews(publishedNews);
  };

  // Effect to apply filters when tab changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle delete confirmation
  const handleDeleteConfirm = (e) => {
    e.stopPropagation();
    if (!deleteReason.trim()) {
      return;
    }

    deleteNewsItem(deletingItem.id, deleteReason);
  };

  // Delete news item function
  const deleteNewsItem = async (id, reason) => {
    try {
      setIsDeleting(true);
      const response = await fetch("/api/db/mysql/delete-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          rejected_reason: reason,
          reviewed_by: user_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete news item");
      }

      // Update local state after successful deletion
      const updateCategory = (items) => items.filter((item) => item.id !== id);

      setActiveNews(updateCategory(activeNews));
      setUpcomingNews(updateCategory(upcomingNews));
      setPublishedNews(updateCategory(publishedNews));

      setFilteredActiveNews(updateCategory(filteredActiveNews));
      setFilteredUpcomingNews(updateCategory(filteredUpcomingNews));
      setFilteredPublishedNews(updateCategory(filteredPublishedNews));

      // Close modals
      setShowDeleteConfirm(false);
      setSelectedItem(null);
      setDeletingItem(null);
      setDeleteReason("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Sort function
  const sortByDate = (items) => {
    return [...items].sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return sortOrder === "asc" ? da - db : db - da;
    });
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const displayedData = sortByDate(getCurrentData());

  const isAdmin = user_id === "admin";

  // Function to handle opening the delete confirmation dialog
  const handleDeleteClick = (e, item) => {
    e.stopPropagation();
    setDeletingItem(item);
    setShowDeleteConfirm(true);
  };

  // Get appropriate message for current tab
  const getEmptyMessage = () => {
    switch (activeTab) {
      case "active":
        return "No active news articles found.";
      case "upcoming":
        return "No upcoming news articles found.";
      case "published":
        return "No published news articles found.";
      default:
        return "No news articles found.";
    }
  };

  // Get appropriate count message for current tab
  const getCountMessage = () => {
    const count = displayedData.length;
    switch (activeTab) {
      case "active":
        return `Showing ${count} active news articles`;
      case "upcoming":
        return `Showing ${count} upcoming news articles`;
      case "published":
        return `Showing ${count} published news articles`;
      default:
        return `Showing ${count} news articles`;
    }
  };

  return (
    <div className="min-h-screen bg-white text-black container mx-auto px-4 py-8 relative">
      <Head>
        <title>News Database</title>
        <meta
          name="description"
          content="View all news data from the database"
        />
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">News Database</h1>
      </div>

      {/* Category tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("active")}
              className={`inline-flex items-center gap-2 p-4 border-b-2 rounded-t-lg ${
                activeTab === "active"
                  ? "text-purple-600 border-purple-600"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              <CheckCircle size={16} />
              Active News ({filteredActiveNews.length})
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`inline-flex items-center gap-2 p-4 border-b-2 rounded-t-lg ${
                activeTab === "upcoming"
                  ? "text-purple-600 border-purple-600"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              <Clock size={16} />
              Upcoming News ({filteredUpcomingNews.length})
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("published")}
              className={`inline-flex items-center gap-2 p-4 border-b-2 rounded-t-lg ${
                activeTab === "published"
                  ? "text-purple-600 border-purple-600"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              <BookOpen size={16} />
              Published News ({filteredPublishedNews.length})
            </button>
          </li>
        </ul>
      </div>

      <form onSubmit={handleSearch} className="mb-6 space-y-4">
        {/* Search and date filter row */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="flex flex-grow gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, content or author..."
              className="flex-grow p-2 border border-gray-300 rounded text-black"
            />
          </div>

          {/* Date filter */}
          <div className="flex flex-grow md:flex-grow-0 items-center gap-2">
            <div className="relative">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Start Date"
                className="p-2 border border-gray-300 rounded text-black w-full"
              />
              <Calendar
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
            <span className="text-gray-500">to</span>
            <div className="relative">
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="End Date"
                className="p-2 border border-gray-300 rounded text-black w-full"
              />
              <Calendar
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Sort and buttons row */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-purple-100 text-black px-4 py-2 rounded hover:bg-purple-200 transition"
            >
              Reset Filters
            </button>
          </div>

          <div className="flex items-center">
            <label className="mr-2 text-black">Sort by:</label>
            <select
              value={sortOrder}
              onChange={handleSortChange}
              className="p-2 border border-gray-300 rounded text-black"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </form>

      {loading && <p className="text-center py-4">Loading data...</p>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {displayedData.length === 0 ? (
            <p className="text-center py-8">{getEmptyMessage()}</p>
          ) : (
            <>
              <p className="mb-4 text-gray-600">{getCountMessage()}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedData.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer relative"
                  >
                    {item.image && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder-image.jpg")
                          }
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h2 className="text-xl font-semibold mb-2 text-black">
                        {item.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Uploaded by: {item.uploaded_by}
                      </p>
                      <p className="text-gray-700 mt-2 text-sm line-clamp-3">
                        {item.content}
                      </p>
                    </div>

                    {/* Status indicator */}
                    <div className="absolute top-2 right-2">
                      {activeTab === "active" && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                      {activeTab === "upcoming" && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Upcoming
                        </span>
                      )}
                      {activeTab === "published" && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Published
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popup Image */}
              {selectedItem.image && (
                <div className="h-64 w-full overflow-hidden">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = "/placeholder-image.jpg")
                    }
                  />
                </div>
              )}

              <div className="p-6 relative">
                {/* Close Button */}
                <button
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition"
                  onClick={() => setSelectedItem(null)}
                >
                  <X size={20} />
                </button>

                {/* Delete Button (only for non-published news) */}
                {activeTab !== "published" && (
                  <button
                    className="absolute top-2 right-10 p-1 rounded-full hover:bg-red-100 text-red-500 transition"
                    onClick={(e) => handleDeleteClick(e, selectedItem)}
                  >
                    <Trash2 size={20} />
                  </button>
                )}

                {/* Status indicator */}
                <div className="mb-2">
                  {selectedItem.is_published && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                      Published
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {formatDate(selectedItem.date)}
                  </span>
                </div>

                <h2 className="text-2xl font-bold mb-2 text-black">
                  {selectedItem.title}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  By{" "}
                  <span className="font-medium text-black">
                    {selectedItem.uploaded_by}
                  </span>
                </p>
                <div className="text-gray-700">{selectedItem.content}</div>

                {/* Show publication date if available */}
                {selectedItem.published_at && (
                  <p className="mt-4 text-sm text-gray-500">
                    Published on: {formatDate(selectedItem.published_at)}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 text-red-500">
                  <AlertTriangle size={24} />
                  <h3 className="text-xl font-bold">Delete News Article</h3>
                </div>

                <p className="mb-4">
                  Are you sure you want to delete "{deletingItem?.title}"? This
                  action cannot be undone.
                </p>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Reason for deletion:
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-black"
                    rows="3"
                    placeholder="Please provide a reason for deleting this article..."
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteReason("");
                      setDeletingItem(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center gap-2 ${
                      isDeleting || !deleteReason.trim()
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting || !deleteReason.trim()}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
