"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";

// Wrapper component to provide DragDropContext
const DragDropWrapper = ({ children, onDragEnd }) => {
  return <DragDropContext onDragEnd={onDragEnd}>{children}</DragDropContext>;
};

// News Preview Modal Component
const NewsPreviewModal = ({ news, onClose }) => {
  if (!news) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Background */}
      <div
        className="absolute inset-0 backdrop-blur-md bg-white/30"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-6">
          {news.image && (
            <img
              src={news.image}
              alt={news.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
          )}
          <h2 className="text-2xl font-bold mb-4">{news.title}</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{news.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditorialPage = () => {
  const [activeNews, setActiveNews] = useState([]);
  const [issueNumber, setIssueNumber] = useState("");
  const [issueDate, setIssueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [pages, setPages] = useState([
    { id: "page-1", title: "First Page", news: [], pageNumber: 1 },
  ]);
  const [subheadings, setSubheadings] = useState({}); // { pageId: subheading }
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const router = useRouter();

  // Add a state to store all news items
  const [allNewsItems, setAllNewsItems] = useState({});

  useEffect(() => {
    fetchActiveNews();
  }, []);

  const fetchActiveNews = async () => {
    try {
      const response = await fetch("/api/db/mysql/display", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "admin",
          category: "active",
        }),
      });

      const data = await response.json();
      // Store all news items in the allNewsItems object
      const newsMap = {};
      data.activeNews.forEach((news) => {
        newsMap[news.id] = news;
      });
      setAllNewsItems(newsMap);
      setActiveNews(data.activeNews);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching active news:", error);
      setLoading(false);
    }
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) return;

    // If dropped in the same place
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Moving from available news to a page
    if (source.droppableId === "available-news") {
      const newsItem = activeNews[source.index];
      const targetPageIndex = pages.findIndex(
        (page) => page.id === destination.droppableId
      );

      // Check if news is already in the target page
      if (pages[targetPageIndex].news.includes(newsItem.id)) {
        return;
      }

      const newPages = [...pages];
      newPages[targetPageIndex].news.splice(destination.index, 0, newsItem.id);
      setPages(newPages);

      // Remove from available news
      setActiveNews((prevNews) =>
        prevNews.filter((news) => news.id !== newsItem.id)
      );
      return;
    }

    // Moving between pages
    const sourcePageIndex = pages.findIndex(
      (page) => page.id === source.droppableId
    );
    const destPageIndex = pages.findIndex(
      (page) => page.id === destination.droppableId
    );

    const newPages = [...pages];
    const [removed] = newPages[sourcePageIndex].news.splice(source.index, 1);
    newPages[destPageIndex].news.splice(destination.index, 0, removed);
    setPages(newPages);
  };

  const addNewPage = () => {
    const newPageId = `page-${pages.length + 1}`;
    const newPageNumber = pages.length + 1;
    setPages([
      ...pages,
      { 
        id: newPageId, 
        title: `Page ${newPageNumber}`, 
        news: [],
        pageNumber: newPageNumber
      },
    ]);
  };

  const removePage = (pageId) => {
    if (pages.length <= 1) {
      alert("Cannot remove the last page");
      return;
    }
    
    // Filter out the removed page
    const newPages = pages.filter((page) => page.id !== pageId);
    
    // Update page numbers for remaining pages if needed
    const updatedPages = newPages.map((page, idx) => {
      if (idx === 0) return page; // First page stays as page 1
      
      // For remaining pages, ensure they have sequential page numbers
      return {
        ...page,
        pageNumber: idx + 1
      };
    });
    
    setPages(updatedPages);
  };

  const updatePageTitle = (pageId, newTitle) => {
    setPages(
      pages.map((page) =>
        page.id === pageId ? { ...page, title: newTitle } : page
      )
    );
  };

  const handleSubheadingChange = (pageId, value) => {
    setSubheadings((prev) => ({ ...prev, [pageId]: value }));
  };

  const handlePageNumberChange = (pageId, value) => {
    // Update page number directly in the page object
    setPages(
      pages.map((page) =>
        page.id === pageId ? { ...page, pageNumber: value } : page
      )
    );
  };

  const handleGenerateMagazine = async () => {
    // Collect all selected news IDs
    const allSelectedNews = pages.flatMap((page) => page.news);

    if (allSelectedNews.length === 0) {
      toast.error("Please select at least one news item");
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading("Generating magazine...");

      // Prepare the pages data for the magazine generation
      const pagesData = pages.map((page, idx) => {
        const base = {
          title: page.title,
          news: page.news.map((newsId) => allNewsItems[newsId]),
        };
        if (idx === 0) {
          base.issueNumber = issueNumber;
          base.issueDate = issueDate;
        } else {
          base.sectionTitle = subheadings[page.id] || "";
          base.pageNumber = page.pageNumber || idx + 1;
        }
        return base;
      });

      // Generate the magazine
      const response = await fetch("/api/db/mysql/generate-magazine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pages: pagesData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate magazine");
      }

      const result = await response.json();

      if (result.success) {
        // Mark selected news as published
        const publishResponse = await fetch("/api/db/mysql/mark-published", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newsIds: allSelectedNews,
          }),
        });

        if (!publishResponse.ok) {
          throw new Error("Failed to mark news as published");
        }

        // Dismiss loading toast and show success toast
        toast.dismiss(loadingToast);
        toast.success("Magazine generated successfully!", {
          duration: 3000,
          position: "top-right",
        });
      } else {
        throw new Error(result.error || "Failed to generate magazine");
      }
    } catch (error) {
      console.error("Error generating magazine:", error);
      toast.dismiss();
      toast.error("Failed to generate magazine. Please try again.");
    }
  };

  const getNewsById = (id) => {
    return (
      allNewsItems[id] || {
        id: id,
        title: "Loading...",
        image: null,
      }
    );
  };

  const handleNewsClick = (newsId) => {
    const news = allNewsItems[newsId];
    if (news) {
      setSelectedNews(news);
    }
  };

  const closeNewsPreview = () => {
    setSelectedNews(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <DragDropWrapper onDragEnd={handleDragEnd}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Editorial Page</h1>

        {/* Issue Number and Date Inputs */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Issue Number
            </label>
            <input
              type="text"
              value={issueNumber}
              onChange={(e) => setIssueNumber(e.target.value)}
              className="border rounded px-2 py-1"
              placeholder="Enter Issue Number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Issue Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available News Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available News</h2>
            <Droppable droppableId="available-news">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`grid grid-cols-2 gap-4 max-h-[800px] overflow-y-auto p-4 rounded ${
                    snapshot.isDraggingOver ? "bg-blue-50" : ""
                  }`}
                >
                  {activeNews.map((news, index) => (
                    <Draggable
                      key={`available-${news.id}`}
                      draggableId={`available-${news.id}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`border rounded-lg bg-white shadow-sm transition-shadow cursor-pointer ${
                            snapshot.isDragging
                              ? "shadow-lg"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleNewsClick(news.id)}
                        >
                          {news.image ? (
                            <img
                              src={news.image}
                              alt={news.title}
                              className="w-full h-24 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-200 rounded-t-lg flex items-center justify-center">
                              <span className="text-gray-400">No Image</span>
                            </div>
                          )}
                          <div className="p-2">
                            <h3 className="font-semibold text-sm line-clamp-2">
                              {news.title}
                            </h3>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Page Organization Section */}
          <div className="space-y-8">
            {pages.map((page, idx) => (
              <div key={page.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => updatePageTitle(page.id, e.target.value)}
                    className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={() => removePage(page.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove Page
                  </button>
                </div>
                
                {/* Only show options for pages after the first page */}
                {idx > 0 && (
                  <div className="mb-3 flex gap-4 items-end">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Page Number
                      </label>
                      <input
                        type="number"
                        min={2}
                        value={page.pageNumber || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || parseInt(value) >= 2) {
                            handlePageNumberChange(
                              page.id,
                              value === "" ? "" : parseInt(value)
                            );
                          }
                        }}
                        className="border rounded px-2 py-1 w-20"
                        placeholder="Enter page number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Subheading (optional)
                      </label>
                      <input
                        type="text"
                        value={subheadings[page.id] || ""}
                        onChange={(e) =>
                          handleSubheadingChange(page.id, e.target.value)
                        }
                        className="border rounded px-2 py-1"
                        placeholder="Enter subheading for this page"
                      />
                    </div>
                  </div>
                )}
                
                <Droppable droppableId={page.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`grid grid-cols-2 gap-4 min-h-[100px] p-4 rounded transition-colors ${
                        snapshot.isDraggingOver ? "bg-blue-50" : "bg-gray-50"
                      }`}
                    >
                      {page.news.map((newsId, index) => {
                        const news = getNewsById(newsId);
                        return news ? (
                          <Draggable
                            key={`${page.id}-${newsId}`}
                            draggableId={`${page.id}-${newsId}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`border rounded-lg bg-white shadow-sm transition-shadow cursor-pointer ${
                                  snapshot.isDragging ? "shadow-lg" : ""
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent modal from opening
                                  handleNewsClick(newsId);
                                }}
                              >
                                {news.image ? (
                                  <img
                                    src={news.image}
                                    alt={news.title}
                                    className="w-full h-24 object-cover rounded-t-lg"
                                  />
                                ) : (
                                  <div className="w-full h-24 bg-gray-200 rounded-t-lg flex items-center justify-center">
                                    <span className="text-gray-400">
                                      No Image
                                    </span>
                                  </div>
                                )}
                                <div className="p-2">
                                  <h3 className="font-semibold text-sm line-clamp-2">
                                    {news.title}
                                  </h3>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent modal from opening
                                      const pageIndex = pages.findIndex(
                                        (p) => p.id === page.id
                                      );
                                      const newPages = [...pages];
                                      newPages[pageIndex].news = newPages[
                                        pageIndex
                                      ].news.filter((id) => id !== newsId);
                                      setPages(newPages);
                                      // Add back to available news
                                      setActiveNews((prevNews) => [
                                        ...prevNews,
                                        news,
                                      ]);
                                    }}
                                    className="text-red-600 text-xs mt-1 hover:text-red-800"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ) : null;
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button onClick={addNewPage} className="btn">
            Add New Page
          </button>
          <button onClick={handleGenerateMagazine} className="btn">
            Generate Magazine
          </button>
        </div>
      </div>

      {/* News Preview Modal */}
      {selectedNews && (
        <NewsPreviewModal news={selectedNews} onClose={closeNewsPreview} />
      )}
    </DragDropWrapper>
  );
};

export default EditorialPage;