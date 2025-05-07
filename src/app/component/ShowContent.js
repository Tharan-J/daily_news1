"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import { X, BookOpen } from "lucide-react";

export default function AllData({ user_id }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedItem, setSelectedItem] = useState(null);
  const [generatingMagazine, setGeneratingMagazine] = useState(false);
  const [magazineResult, setMagazineResult] = useState(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/db/mysql/diplay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user_id }),
      });
      if (!res.ok) throw new Error("Failed to fetch data");
      const result = await res.json();
      setData(result.data);
      setFilteredData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? data.filter((item) =>
          [item.title, item.content, item.uploaded_by]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(term))
        )
      : data;
    setFilteredData(filtered);
  };

  // Handle magazine generation
  const handleGenerateMagazine = async () => {
    try {
      setGeneratingMagazine(true);
      setMagazineResult(null);
  
      const formData = new FormData();
  
      for (let index = 0; index < filteredData.length; index++) {
        const item = filteredData[index];
        formData.append(`newsItem[${index}][title]`, item.title);
        formData.append(`newsItem[${index}][content]`, item.content);
  
        // Convert base64 image to Blob and send as File
        if (item.image?.startsWith("data:image/")) {
          const res = await fetch(item.image);
          const blob = await res.blob();
          const file = new File([blob], `image_${index}.jpg`, { type: blob.type });
          formData.append(`newsItem[${index}][image]`, file);
        }
      }
  
      const response = await fetch("/api/generate-magazine", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate magazine");
      }
  
      const result = await response.json();
      if (result.success) {
        setMagazineResult(result);
      } else {
        throw new Error(result.error || "Failed to generate magazine");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingMagazine(false);
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

  const displayedData = sortByDate(filteredData);

  const isAdmin = user_id === "admin";

  return (
    <div className="min-h-screen bg-white text-black container mx-auto px-4 py-8 relative">
      <Head>
        <title>All Database Data</title>
        <meta
          name="description"
          content="View all news data from the database"
        />
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">News Database</h1>
        
        {isAdmin && (
          <button
            onClick={handleGenerateMagazine}
            disabled={generatingMagazine || displayedData.length === 0}
            className={`flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition ${
              generatingMagazine || displayedData.length === 0 
                ? "opacity-50 cursor-not-allowed" 
                : ""
            }`}
          >
            <BookOpen size={18} />
            {generatingMagazine ? "Generating..." : "Generate Magazine"}
          </button>
        )}
      </div>

      {/* Magazine generation result notification */}
      {magazineResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">Magazine generated successfully!</p>
              <div className="mt-2">
                <a 
                  href={magazineResult.pdfPath} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800 underline mr-4"
                >
                  Download PDF
                </a>
                {magazineResult.mainPage && (
                  <a 
                    href={magazineResult.mainPage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 underline"
                  >
                    View HTML
                  </a>
                )}
              </div>
            </div>
            <button 
              onClick={() => setMagazineResult(null)}
              className="text-green-800 hover:text-green-900"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSearch}
        className="mb-6 flex flex-col md:flex-row md:items-center md:gap-4"
      >
        <div className="flex flex-grow gap-2 mb-4 md:mb-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, content or author..."
            className="flex-grow p-2 border border-gray-300 rounded text-black"
          />
          <button
            type="submit"
            className="bg-purple-500 text-black px-4 py-2 rounded hover:bg-purple-600 transition"
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilteredData(data);
              }}
              className="bg-purple-100 text-black px-4 py-2 rounded hover:bg-purple-200 transition"
            >
              Clear
            </button>
          )}
        </div>
        <div>
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
            <p className="text-center py-8">No news articles found.</p>
          ) : (
            <>
              <p className="mb-4 text-gray-600">
                Showing {displayedData.length} news articles
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedData.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer"
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
                        {formatDate(item.date)} • Page {item.Page_no}
                      </p>
                      <p className="text-gray-700 mt-2 text-sm line-clamp-3">
                        {item.content}
                      </p>
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

                <h2 className="text-2xl font-bold mb-4 text-black">
                  {selectedItem.title}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {formatDate(selectedItem.date)} • Page {selectedItem.Page_no}{" "}
                  • By{" "}
                  <span className="font-medium text-black">
                    {selectedItem.uploaded_by}
                  </span>
                </p>
                <div className="text-gray-700">{selectedItem.content}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}