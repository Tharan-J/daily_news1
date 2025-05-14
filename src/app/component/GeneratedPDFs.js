"use client";
import { useState, useEffect } from "react";
import { FileText, Download, Eye, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GeneratedPDFs() {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchPdfs();
  }, []);

  // Fetch PDF files from the public/generated_pdfs directory
  const fetchPdfs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use a custom API route to list files in the directory
      const response = await fetch("/api/list-generated-pdfs");
      if (!response.ok) {
        throw new Error("Failed to fetch PDFs");
      }
      const data = await response.json();
      setPdfs(data.pdfs || []);
    } catch (error) {
      setError(error.message);
      setPdfs([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfClick = (pdf) => {
    setSelectedPdf(pdf);
  };

  const closePdfViewer = () => {
    setSelectedPdf(null);
  };

  const handleDownload = (pdf) => {
    window.open(`/generated_pdfs/${pdf}`, "_blank");
  };

  const handleViewAsFlipbook = (pdf) => {
    router.push(`/flipbook?pdf=${encodeURIComponent(pdf)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Generated Magazines
      </h1>

      {error && <div className="text-red-600 mb-4">Error: {error}</div>}

      {pdfs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No magazines found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No PDF files found in generated_pdfs folder.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf) => (
            <div
              key={pdf}
              className="card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {pdf}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePdfClick(pdf)}
                      className="btn"
                      title="View PDF"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDownload(pdf)}
                      className="btn"
                      title="Download PDF"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleViewAsFlipbook(pdf)}
                      className="btn"
                      title="View as Flipbook"
                    >
                      <BookOpen size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedPdf}</h2>
              <button
                onClick={closePdfViewer}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`/generated_pdfs/${selectedPdf}`}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
