import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const EditorialPage = () => {
  const [newsData, setNewsData] = useState({
    activeNews: [],
    upcomingNews: [],
    publishedNews: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active"); // To toggle between news categories
  const [magazinePages, setMagazinePages] = useState([
    { id: "page1", subheading: "", newsItems: [] },
  ]);
  const [generatingMagazine, setGeneratingMagazine] = useState(false);
  const [magazineResult, setMagazineResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Use a ref to track which items are already in the magazine
  // This avoids race conditions with React state updates
  const usedNewsIdsRef = useRef(new Set());
  
  // Update the ref whenever magazinePages changes
  useEffect(() => {
    const usedIds = new Set(
      magazinePages.flatMap(page => 
        page.newsItems.map(item => item.id)
      )
    );
    usedNewsIdsRef.current = usedIds;
  }, [magazinePages]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const response = await fetch("/api/db/mysql/display", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "admin",
          category: "all", // Fetch all categories at once for better UX
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter out news items that are already in magazine pages using the ref
      const filterUsedNews = (newsItems) => {
        return newsItems.filter(news => !usedNewsIdsRef.current.has(news.id));
      };

      setNewsData({
        activeNews: filterUsedNews(data.activeNews || []),
        upcomingNews: filterUsedNews(data.upcomingNews || []),
        publishedNews: filterUsedNews(data.publishedNews || [])
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      setErrorMessage(`Failed to fetch news: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableNews = () => {
    switch (activeTab) {
      case "active":
        return newsData.activeNews;
      case "upcoming":
        return newsData.upcomingNews;
      case "published":
        return newsData.publishedNews;
      default:
        return [];
    }
  };

  const isNewsItemInMagazine = (newsId) => {
    return usedNewsIdsRef.current.has(newsId);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    // If no destination or same position, do nothing
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }

    // Handle different drag and drop scenarios
    if (
      source.droppableId === "available" &&
      destination.droppableId.startsWith("page")
    ) {
      // Moving from available to a page
      const availableNewsItems = getAvailableNews();
      const newsItem = availableNewsItems[source.index];
      
      // Safety check - ensure the item exists
      if (!newsItem) {
        console.error("Failed to find news item at index", source.index);
        return;
      }
      
      const pageIndex = parseInt(destination.droppableId.replace("page", "")) - 1;

      // Double-check to prevent duplicates - using the ref for the most up-to-date state
      if (isNewsItemInMagazine(newsItem.id)) {
        setErrorMessage(`News item "${newsItem.title}" is already in the magazine layout.`);
        return;
      }

      // Add to usedNewsIds immediately to prevent race conditions
      usedNewsIdsRef.current.add(newsItem.id);
      
      // Remove from source
      setNewsData(prev => {
        const updatedNewsData = { ...prev };
        updatedNewsData[`${activeTab}News`] = 
          updatedNewsData[`${activeTab}News`].filter((_, index) => index !== source.index);
        return updatedNewsData;
      });

      // Add to destination
      setMagazinePages(prev => {
        const newPages = [...prev];
        // Create a deep copy of the news item with a unique instance ID
        const newsItemCopy = {
          ...newsItem,
          _instanceId: `${newsItem.id}-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`,
        };

        if (!newPages[pageIndex]) {
          console.error(`Page at index ${pageIndex} does not exist`);
          return prev;
        }

        newPages[pageIndex].newsItems.splice(destination.index, 0, newsItemCopy);
        return newPages;
      });
    } else if (
      source.droppableId.startsWith("page") &&
      destination.droppableId === "available"
    ) {
      // Moving from a page back to available
      const sourcePageIndex = parseInt(source.droppableId.replace("page", "")) - 1;
      
      // Safety check
      if (!magazinePages[sourcePageIndex] || !magazinePages[sourcePageIndex].newsItems[source.index]) {
        console.error("Source item not found");
        return;
      }
      
      const newsItem = magazinePages[sourcePageIndex].newsItems[source.index];

      // Remove from usedNewsIds ref
      usedNewsIdsRef.current.delete(newsItem.id);
      
      // Remove from source page
      setMagazinePages(prev => {
        const newPages = [...prev];
        newPages[sourcePageIndex].newsItems = newPages[sourcePageIndex].newsItems
          .filter((_, index) => index !== source.index);
        return newPages;
      });

      // Add back to the appropriate available news category
      setNewsData(prev => {
        const updatedNewsData = { ...prev };
        // Strip _instanceId property
        const { _instanceId, ...originalNewsItem } = newsItem;
        
        if (newsItem.is_published) {
          updatedNewsData.publishedNews = [...updatedNewsData.publishedNews, originalNewsItem];
        } else if (new Date(newsItem.date) > new Date()) {
          updatedNewsData.upcomingNews = [...updatedNewsData.upcomingNews, originalNewsItem];
        } else {
          updatedNewsData.activeNews = [...updatedNewsData.activeNews, originalNewsItem];
        }
        
        return updatedNewsData;
      });
    } else if (
      source.droppableId.startsWith("page") &&
      destination.droppableId.startsWith("page")
    ) {
      // Moving between pages or reordering within a page
      const sourcePageIndex = parseInt(source.droppableId.replace("page", "")) - 1;
      const destPageIndex = parseInt(destination.droppableId.replace("page", "")) - 1;
      
      // Safety checks
      if (!magazinePages[sourcePageIndex] || !magazinePages[sourcePageIndex].newsItems[source.index]) {
        console.error("Source item not found");
        return;
      }
      
      if (!magazinePages[destPageIndex]) {
        console.error("Destination page not found");
        return;
      }

      setMagazinePages(prev => {
        const newPages = [...prev];
        // Remove item from source
        const [movedItem] = newPages[sourcePageIndex].newsItems.splice(source.index, 1);
        
        // Add item to destination
        newPages[destPageIndex].newsItems.splice(destination.index, 0, movedItem);
        return newPages;
      });
    }
  };

  const addPage = () => {
    setMagazinePages(prev => [
      ...prev,
      { id: `page${prev.length + 1}`, subheading: "", newsItems: [] },
    ]);
  };

  const removePage = (pageIndex) => {
    if (magazinePages.length === 1) return;

    // Remove news IDs from the used IDs ref for any items on this page
    magazinePages[pageIndex].newsItems.forEach(news => {
      usedNewsIdsRef.current.delete(news.id);
    });

    // Return news items to available
    const removedPage = magazinePages[pageIndex];
    setNewsData(prev => {
      const updatedNewsData = { ...prev };
      
      // Add each news item back to the appropriate category
      removedPage.newsItems.forEach(news => {
        const { _instanceId, ...originalNewsItem } = news;
        
        if (news.is_published) {
          updatedNewsData.publishedNews = [...updatedNewsData.publishedNews, originalNewsItem];
        } else if (new Date(news.date) > new Date()) {
          updatedNewsData.upcomingNews = [...updatedNewsData.upcomingNews, originalNewsItem];
        } else {
          updatedNewsData.activeNews = [...updatedNewsData.activeNews, originalNewsItem];
        }
      });
      
      return updatedNewsData;
    });

    setMagazinePages(prev => prev.filter((_, index) => index !== pageIndex));
  };

  const updatePageDetails = (pageIndex, field, value) => {
    setMagazinePages(prev => {
      const newPages = [...prev];
      newPages[pageIndex] = { ...newPages[pageIndex], [field]: value };
      return newPages;
    });
  };

  const generateMagazine = async () => {
    // Validate if magazine pages have content
    if (magazinePages.some(page => page.newsItems.length === 0)) {
      setErrorMessage("All magazine pages must contain at least one news item.");
      return;
    }
    
    try {
      setGeneratingMagazine(true);
      setErrorMessage(null);
      const formData = new FormData();

      // Add issue details
      formData.append("issue_number", new Date().getFullYear().toString());
      formData.append("issue_date", new Date().toLocaleDateString());

      // Add page details
      magazinePages.forEach((page, pageIndex) => {
        if (pageIndex > 0) {
          // Only add subheading for pages after the first one
          formData.append(`page_${pageIndex}_subheading`, page.subheading || `Section ${pageIndex + 1}`);
        }

        page.newsItems.forEach((news, newsIndex) => {
          formData.append(`page_${pageIndex}_news_${newsIndex}_title`, news.title);
          formData.append(`page_${pageIndex}_news_${newsIndex}_description`, news.description);
          formData.append(`page_${pageIndex}_news_${newsIndex}_image`, news.image);
          formData.append(`page_${pageIndex}_news_${newsIndex}_ref`, news.ref || "");
        });
      });

      const response = await fetch("/api/generate-magazine", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setMagazineResult(result);
        // Mark news items as published
        const newsIds = magazinePages.flatMap((page) => page.newsItems.map((item) => item.id));
        await fetch("/api/db/mysql/mark-published", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newsIds }),
        });
        // Refresh available news
        fetchNews();
      } else {
        throw new Error(result.message || "Failed to generate magazine");
      }
    } catch (error) {
      console.error("Error generating magazine:", error);
      setErrorMessage(`Failed to generate magazine: ${error.message}`);
    } finally {
      setGeneratingMagazine(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editorial Page</h1>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
          <button 
            className="ml-2 text-red-900 font-bold"
            onClick={() => setErrorMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Available News with Tab Selection */}
          <div className="bg-gray-100 p-4 rounded">
            <div className="flex mb-4 border-b">
              <button 
                className={`py-2 px-4 ${activeTab === 'active' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active News
              </button>
              <button 
                className={`py-2 px-4 ${activeTab === 'upcoming' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming News
              </button>
              <button 
                className={`py-2 px-4 ${activeTab === 'published' ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('published')}
              >
                Published News
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">
                {activeTab === 'active' ? 'Active News' : 
                 activeTab === 'upcoming' ? 'Upcoming News' : 'Published News'}
              </h2>
              <button 
                onClick={fetchNews} 
                className="text-blue-500 hover:text-blue-700"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-4 text-center">Loading news items...</div>
            ) : (
              <Droppable droppableId="available">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 max-h-[60vh] overflow-y-auto"
                  >
                    {getAvailableNews().length > 0 ? (
                      getAvailableNews().map((news, index) => (
                        <Draggable
                          key={`available-${news.id}`}
                          draggableId={`available-${news.id}-${index}`} // Make draggableId unique with index
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-3 rounded shadow"
                            >
                              <h3 className="font-medium">
                                {news.title || "Untitled"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {news.description || news.content
                                  ? (news.description || news.content).substring(0, 100) + "..."
                                  : "No description available"}
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                {news.date && (
                                  <p className="text-xs text-gray-500">
                                    Date: {new Date(news.date).toLocaleDateString()}
                                  </p>
                                )}
                                <p className="text-xs bg-gray-200 px-2 py-1 rounded">
                                  {news.uploaded_by || "unknown"}
                                </p>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div className="text-center p-4 text-gray-500">
                        No {activeTab} news available
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>

          {/* Magazine Pages */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Magazine Layout</h2>
            <div className="bg-gray-100 p-4 rounded max-h-[60vh] overflow-y-auto">
              {magazinePages.map((page, pageIndex) => (
                <div key={page.id} className="bg-white p-4 rounded shadow mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold">
                      Page {pageIndex + 1}
                    </h2>
                    {magazinePages.length > 1 && (
                      <button
                        onClick={() => removePage(pageIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove Page
                      </button>
                    )}
                  </div>

                  {pageIndex > 0 && (
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Page Subheading"
                        value={page.subheading}
                        onChange={(e) =>
                          updatePageDetails(pageIndex, "subheading", e.target.value)
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  )}

                  <Droppable droppableId={`page${pageIndex + 1}`}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="min-h-[100px] bg-gray-50 p-2 rounded"
                      >
                        {page.newsItems.length > 0 ? (
                          page.newsItems.map((news, index) => (
                            <Draggable
                              key={news._instanceId}
                              draggableId={news._instanceId}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-white p-3 rounded shadow mb-2"
                                >
                                  <h3 className="font-medium">
                                    {news.title || "Untitled"}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {news.description || news.content
                                      ? (news.description || news.content).substring(0, 100) + "..."
                                      : "No description available"}
                                  </p>
                                  <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-gray-500">
                                      Date: {new Date(news.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs bg-gray-200 px-2 py-1 rounded">
                                      {news.uploaded_by || "unknown"}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="text-center p-4 text-gray-400 italic">
                            Drag news items here
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={addPage}
                className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Page
              </button>

              <button
                onClick={generateMagazine}
                disabled={generatingMagazine || magazinePages.some(page => page.newsItems.length === 0)}
                className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {generatingMagazine ? "Generating..." : "Generate Magazine"}
              </button>
            </div>
          </div>
        </div>
      </DragDropContext>

      {magazineResult && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h2 className="text-xl font-semibold mb-2">
            Magazine Generated Successfully!
          </h2>
          <p>PDF: {magazineResult.pdf}</p>
          <div className="mt-2">
            <h3 className="font-medium">Generated Pages:</h3>
            <ul className="list-disc list-inside">
              {magazineResult.pages.map((page, index) => (
                <li key={index}>{page}</li>
              ))}
            </ul>
          </div>
          <button 
            className="mt-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setMagazineResult(null)}
          >
            Create New Magazine
          </button>
        </div>
      )}
    </div>
  );
};

export default EditorialPage;