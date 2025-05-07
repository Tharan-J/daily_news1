"use client";
import { useState, useRef } from "react";

import { PlusCircle, Trash2, Upload, Sparkles, Loader2 } from "lucide-react";

export default function PageContent({ user_id }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  // Use a map instead of a single boolean for loading states
  const [generatingContentMap, setGeneratingContentMap] = useState({});

  const formRef = useRef(null);

  // State for multiple entries
  const [entries, setEntries] = useState([
    {
      id: Date.now(),
      image: null,
      imageBlob: null,
      title: "",
      content: "",
      pageNo: 1,
    },
  ]);

  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    const newEntries = [...entries];
    const url = URL.createObjectURL(file);

    newEntries[index] = {
      ...newEntries[index],
      image: {
        name: file.name,
        url,
        path: file.name,
      },
      imageBlob: file,
      title: newEntries[index].title || file.name.split(".")[0],
    };

    setEntries(newEntries);
    setError(null);
  };

  const handleInputChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: value,
    };
    setEntries(newEntries);
  };

  const addNewEntry = () => {
    setEntries([
      ...entries,
      {
        id: Date.now(),
        image: null,
        imageBlob: null,
        title: "",
        content: "",
        pageNo: entries.length + 1,
      },
    ]);
  };

  const removeEntry = (index) => {
    if (entries.length === 1) {
      // Don't remove the last entry, just clear it
      setEntries([
        {
          id: Date.now(),
          image: null,
          imageBlob: null,
          title: "",
          content: "",
          pageNo: 1,
        },
      ]);
      return;
    }

    const newEntries = entries.filter((_, i) => i !== index);
    // Update page numbers
    newEntries.forEach((entry, i) => {
      entry.pageNo = i + 1;
    });
    setEntries(newEntries);

    // Also clean up any loading states for removed entries
    const updatedGeneratingMap = { ...generatingContentMap };
    delete updatedGeneratingMap[index];
    setGeneratingContentMap(updatedGeneratingMap);
  };

  const generateAIContent = async (index) => {
    const entry = entries[index];

    if (!entry.title) {
      setError("Please enter a title before generating content");
      return;
    }

    // Set loading state for just this specific entry
    setGeneratingContentMap((prev) => ({
      ...prev,
      [index]: true,
    }));

    setError(null);

    try {
      // Fixed: Properly structure the API request with userId
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: {
            title: entry.title,
            userId: user_id, // Use the prop directly instead of formRef
            instruction: entry.content || "Generate news content about this topic",
          },
        }),
      });

      if (!response.ok) {
        let errorText = '';
        try {
          // Try to get more detailed error information
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          // If we can't parse JSON, get the raw text
          errorText = await response.text();
        }
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      // Better logging for debugging
      console.log("AI response:", data);

      // The API returns { content: { title, userId, content } }
      if (data && data.content) {
        const generatedContent = data.content;
        console.log("Generated content:", generatedContent);
        
        const newEntries = [...entries];
        newEntries[index] = {
          ...newEntries[index],
          // Keep the original title if no title in response
          title: generatedContent.title || newEntries[index].title,
          content: generatedContent.content || "",
        };
      
        setEntries(newEntries);
      } else {
        console.error("Unexpected API response format:", data);
        throw new Error("Invalid response format from AI service");
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setError(`Failed to generate content: ${error.message}`);
    } finally {
      // Clear loading state for only this specific entry
      setGeneratingContentMap((prev) => ({
        ...prev,
        [index]: false,
      }));
    }
  };

  const handleSaveToDatabase = async (e) => {
    e.preventDefault();
    setSaveStatus({ loading: true });

    try {
      // Create a FormData object to handle the blobs
      const formData = new FormData();

      // Add user info - Fixed: Use the user_id prop directly
      formData.append("uploaded_by", user_id);

      // Add entries data as JSON (except for the image blobs)
      const entriesData = entries.map((entry, index) => ({
        title: entry.title,
        content: entry.content,
        has_image: !!entry.imageBlob,
        image_index: entry.imageBlob ? index : null,
      }));

      formData.append("entries", JSON.stringify(entriesData));

      // Add the image blobs separately
      entries.forEach((entry, index) => {
        if (entry.imageBlob) {
          formData.append(`image_${index}`, entry.imageBlob, entry.image.name);
        }
      });

      // Send POST request to API route using FormData
      const response = await fetch("/api/db/mysql/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log("Server response:", result);

      setSaveStatus(result);
    } catch (error) {
      console.error("Error saving to database:", error);
      setSaveStatus({
        success: false,
        message: `Error: ${error.message}`,
      });
    }
  };

  return (
    <div className="p-6 w-full bg-white text-black min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-purple-800 text-center">
        BitSathy Daily News
      </h1>
      {user_id && (
        <h2 className="text-lg mb-4 text-gray-700 text-center">
          User ID: {user_id}
        </h2>
      )}

      {error && (
        <div className="flex justify-center">
          <p className="text-red-600 mb-4 p-2 bg-red-100 rounded inline-block">
            {error}
          </p>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSaveToDatabase}
        className="space-y-8 w-full max-w-6xl mx-auto"
      >
        {/* Hidden input for the user ID */}
        <input type="hidden" name="uploaded_by" value={user_id || ""} />

        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="border border-gray-300 rounded-lg p-6 relative shadow-sm max-w-6xl mx-auto"
          >
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                aria-label="Remove entry"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-purple-800">
              Entry #{index + 1}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 h-48 flex flex-col items-center justify-center">
                  {entry.image ? (
                    <div className="relative w-full h-full">
                      <img
                        src={entry.image.url || "/placeholder.svg"}
                        alt={entry.image.name}
                        className="max-w-full max-h-full object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange(index, "image", null)}
                        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                        aria-label="Remove image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-gray-500">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(index, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Topic/Title
                  </label>
                  <input
                    type="text"
                    value={entry.title}
                    onChange={(e) =>
                      handleInputChange(index, "title", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <button
                      type="button"
                      onClick={() => generateAIContent(index)}
                      className="flex items-center text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      {generatingContentMap[index] ? (
                        <>
                          <Loader2 size={12} className="mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} className="mr-1" />
                          Generate with AI
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={entry.content}
                    onChange={(e) =>
                      handleInputChange(index, "content", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black min-h-[100px]"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={addNewEntry}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <PlusCircle className="mr-2" size={18} />
            Add Another Entry
          </button>
        </div>

        <div className="mt-8 max-w-lg mx-auto">
          <button
            type="submit"
            className="w-full px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
            disabled={saveStatus?.loading}
          >
            {saveStatus?.loading ? "Saving..." : "Save All Entries"}
          </button>
        </div>
      </form>

      {saveStatus && !saveStatus.loading && (
        <div className="max-w-lg mx-auto">
          <div
            className={`mt-4 p-3 rounded ${
              saveStatus.success
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {saveStatus.message}
          </div>
        </div>
      )}
    </div>
  );
}