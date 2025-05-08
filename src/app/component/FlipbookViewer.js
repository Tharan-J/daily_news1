'use client';

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";


// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function FlipbookViewer({ pdfUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [pagesRendered, setPagesRendered] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to handle document load success
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
  }

  // Track rendered pages
  function onRenderSuccess(pageNumber) {
    setPagesRendered(prev => {
      if (!prev.includes(pageNumber)) {
        return [...prev, pageNumber];
      }
      return prev;
    });
  }

  // Custom page component for FlipBook
  const FlipBookPage = ({ pageNumber }) => {
    return (
      <div className="page-container bg-white shadow-lg rounded">
        <Page 
          pageNumber={pageNumber} 
          width={600}
          onRenderSuccess={() => onRenderSuccess(pageNumber)}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      {loading && <div className="text-xl font-medium my-10">Loading PDF...</div>}
      
      <Document 
        file={pdfUrl} 
        onLoadSuccess={onDocumentLoadSuccess}
        error={<div className="text-red-500 my-10">Error loading PDF! Please try again.</div>}
      >
        {numPages && (
          <div className="flipbook-container mt-6">
            <HTMLFlipBook 
              width={600} 
              height={800} 
              size="stretch"
              minWidth={300}
              maxWidth={800}
              minHeight={400}
              maxHeight={1000}
              drawShadow={true}
              flippingTime={1000}
              usePortrait={true}
              startPage={0}
              showCover={true}
              className="mx-auto"
            >
              {Array.from(new Array(numPages), (_, index) => (
                <div key={`page_${index + 1}`} className="page">
                  <FlipBookPage pageNumber={index + 1} />
                </div>
              ))}
            </HTMLFlipBook>
          </div>
        )}
      </Document>
      
      {numPages && (
        <div className="mt-4 text-center text-sm text-gray-600">
          {pagesRendered.length}/{numPages} pages loaded
        </div>
      )}
    </div>
  );
}