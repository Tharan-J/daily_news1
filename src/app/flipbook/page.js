"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function FlipbookPage() {
  const searchParams = useSearchParams();
  const [flipbookUrl, setFlipbookUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const convertToFlipbook = async () => {
      try {
        const pdfPath = searchParams.get("pdf");
        if (!pdfPath) {
          throw new Error("No PDF path provided");
        }

        const response = await fetch("/api/flipbook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pdfPath }),
        });

        const data = await response.json();

        if (data.success) {
          console.log("Flipbook URL:", data.flipbookUrl);
          setFlipbookUrl(data.flipbookUrl);
        } else {
          throw new Error(data.error || "Failed to convert PDF to flipbook");
        }
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    convertToFlipbook();
  }, [searchParams]);

  const handleIframeLoad = () => {
    console.log("Iframe loaded");
    setIframeLoaded(true);
  };

  const handleIframeError = () => {
    console.error("Iframe failed to load");
    setError("Failed to load flipbook content");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner"></div>
          <p className="text-gray-600">
            Converting your magazine to flipbook...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button onClick={() => window.history.back()} className="btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (flipbookUrl) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        {!iframeLoaded && (
          <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p className="mt-4 text-gray-600">Loading flipbook...</p>
            </div>
          </div>
        )}
        <div className="flex-1 w-full h-full">
          <iframe
            src={flipbookUrl}
            className="w-full h-full border-0"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              border: "none",
              margin: 0,
              padding: 0,
              overflow: "hidden",
            }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return null;
}
