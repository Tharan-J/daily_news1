'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the FlipbookViewer component to avoid SSR issues
const FlipbookViewer = dynamic(() => import('../component/FlipbookViewer'), {
  ssr: false,
  loading: () => <div className="text-center py-20">Loading viewer...</div>
});

export default function FlipbookPage() {
  const searchParams = useSearchParams();
  const pdfPath = searchParams.get('pdf');
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!pdfPath) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Error: No PDF specified</h1>
        <p className="mt-4">Please specify a PDF file using the 'pdf' query parameter.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">PDF Flipbook</h1>
      
      {isClient && (
        <div className="flex justify-center">
          <FlipbookViewer pdfUrl={pdfPath} />
        </div>
      )}
    </div>
  );
}