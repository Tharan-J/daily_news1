import { NextResponse } from "next/server";
import axios from "axios";
import fs from "fs";
import path from "path";

export async function POST(request) {
  try {
    const { pdfPath } = await request.json();

    // Construct the full path to the PDF file
    const fullPdfPath = path.join(process.cwd(), "public", pdfPath);
    console.log("Full PDF Path:", fullPdfPath);

    // Verify the PDF file exists and is readable
    if (!fs.existsSync(fullPdfPath)) {
      throw new Error(`PDF file not found at path: ${fullPdfPath}`);
    }

    // Read the PDF file and verify it's a valid PDF
    const pdfBuffer = fs.readFileSync(fullPdfPath);
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("PDF file is empty");
    }

    // Check if the file starts with the PDF magic number
    const isPdf = pdfBuffer.slice(0, 4).toString("hex") === "25504446";
    if (!isPdf) {
      throw new Error("File is not a valid PDF");
    }

    // Heyzine API endpoint
    const heyzineApiUrl = "https://heyzine.com/api1/rest";

    // Your Heyzine API credentials
    const CLIENT_ID = "ec699cd75fe2cd5e";
    const API_KEY = "3c63a2957580283687a009503f4baaade5a9d495.ec699cd75fe2cd5e";

    // Create a public URL for the PDF
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new Error(
        "NEXT_PUBLIC_BASE_URL environment variable is not set. Please set it to a public URL (e.g., ngrok URL for development)"
      );
    }

    const pdfUrl = `${baseUrl}${pdfPath}`;
    console.log("PDF URL:", pdfUrl);

    // Verify the URL is publicly accessible
    try {
      const urlCheck = await axios.head(pdfUrl);
      console.log("URL accessibility check:", {
        status: urlCheck.status,
        headers: urlCheck.headers,
      });
    } catch (urlError) {
      console.error("URL accessibility check failed:", {
        message: urlError.message,
        response: urlError.response?.data,
        status: urlError.response?.status,
      });
      throw new Error(
        `PDF URL is not publicly accessible: ${urlError.message}`
      );
    }

    // Create request body for the API
    const requestBody = {
      pdf: pdfUrl,
      client_id: CLIENT_ID,
      title: "Daily News Magazine",
      prev_next: true,
      show_info: true,
      format: "html5",
      quality: "high",
      width: 1000,
      height: 700,
    };

    console.log("Request body:", requestBody);
    console.log("Sending request to Heyzine API...");

    try {
      // Make request to Heyzine API
      const response = await axios.post(heyzineApiUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Full API Response:", response);
      console.log("Response data:", response.data);
      console.log("Response status:", response.status);

      if (!response.data) {
        throw new Error("No response data received from Heyzine API");
      }

      if (response.data.error) {
        throw new Error(`Heyzine API Error: ${response.data.error}`);
      }

      if (!response.data.url) {
        console.error("Unexpected API response:", response.data);
        throw new Error("Flipbook URL not found in Heyzine API response");
      }

      // Add a small delay to ensure the flipbook is ready
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return NextResponse.json({
        success: true,
        flipbookUrl: response.data.url,
        thumbnail: response.data.thumbnail,
        pdf: response.data.pdf,
        meta: response.data.meta,
      });
    } catch (apiError) {
      console.error("API Error Details:", {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        headers: apiError.response?.headers,
        config: {
          url: apiError.config?.url,
          method: apiError.config?.method,
          headers: apiError.config?.headers,
          data: apiError.config?.data,
        },
      });
      throw apiError;
    }
  } catch (error) {
    console.error("Error converting PDF to flipbook:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.response?.data || "No additional details available",
      },
      { status: 500 }
    );
  }
}
