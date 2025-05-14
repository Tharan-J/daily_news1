import { NextResponse } from "next/server";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import FormData from "form-data";

export async function POST(request) {
  try {
    const { pdfPath } = await request.json();

    if (!pdfPath) {
      throw new Error("No PDF path provided");
    }

    // Get the full local path to the PDF file
    // Modified to handle both absolute paths and paths relative to public directory
    let fullPdfPath;

    if (path.isAbsolute(pdfPath)) {
      // If an absolute path is provided, use it directly
      fullPdfPath = pdfPath;
    } else {
      // For relative paths, check if it should be in the public/generated_pdfs directory
      const publicPath = path.join(
        process.cwd(),
        "public",
        "generated_pdfs",
        pdfPath
      );
      const directPath = path.join(process.cwd(), pdfPath);

      // Try to find the file in the public/generated_pdfs directory first
      try {
        await fs.access(publicPath);
        fullPdfPath = publicPath;
      } catch (publicPathError) {
        // If not found in public/generated_pdfs, try the direct path
        try {
          await fs.access(directPath);
          fullPdfPath = directPath;
        } catch (directPathError) {
          // If still not found, check if pdfPath already includes part of the expected path
          const fileName = path.basename(pdfPath);
          const alternativePath = path.join(
            process.cwd(),
            "public",
            "generated_pdfs",
            fileName
          );

          try {
            await fs.access(alternativePath);
            fullPdfPath = alternativePath;
          } catch (alternativePathError) {
            throw new Error(
              `PDF file not found. Tried paths:\n- ${publicPath}\n- ${directPath}\n- ${alternativePath}`
            );
          }
        }
      }
    }

    console.log("Loading PDF from path:", fullPdfPath);

    // Validate the PDF file before proceeding
    try {
      // Read the first few bytes to check the PDF signature
      const fileHandle = await fs.open(fullPdfPath, "r");
      const buffer = Buffer.alloc(5);
      await fileHandle.read(buffer, 0, 5, 0);
      await fileHandle.close();

      // Check if the file starts with "%PDF-"
      const isPDF = buffer.toString().startsWith("%PDF-");
      if (!isPDF) {
        throw new Error(
          "The file does not appear to be a valid PDF (missing PDF signature)"
        );
      }

      // Also check file size - extremely small files are suspicious
      const stats = await fs.stat(fullPdfPath);
      if (stats.size < 100) {
        throw new Error(
          "The PDF file is suspiciously small and may be corrupted"
        );
      }

      console.log("PDF validation passed");
    } catch (validationError) {
      throw new Error(`PDF validation failed: ${validationError.message}`);
    }

    // Calculate the relative path from the project root to the PDF
    // This helps us determine the public URL through ngrok
    const relativePublicPath = path.relative(process.cwd(), fullPdfPath);

    // Determine if the file is in the public directory
    let publicPdfUrl;

    // Check if your ngrok URL is set in environment variables
    // or use a default placeholder that you should replace with your actual ngrok URL
    const ngrokUrl = process.env.NGROK_URL || "https://your-ngrok-url.ngrok.io";

    // Add cache-busting parameter to prevent caching issues
    const cacheBuster = `cb=${Date.now()}`;

    if (
      relativePublicPath.startsWith("public\\") ||
      relativePublicPath.startsWith("public/")
    ) {
      // If the file is in the public directory, it's directly accessible via web URL
      // Convert Windows-style backslashes to forward slashes for URLs
      const webPath = relativePublicPath
        .replace(/^public[\\\/]/, "/") // Remove 'public\' or 'public/' and add leading slash
        .replace(/\\/g, "/"); // Replace all backslashes with forward slashes

      // Add cache-busting parameter to the URL
      publicPdfUrl = `${ngrokUrl}${webPath}?${cacheBuster}`;

      // Verify the URL is accessible
      try {
        console.log(`Verifying PDF URL accessibility: ${publicPdfUrl}`);
        const verifyResponse = await axios.head(publicPdfUrl, {
          timeout: 5000,
          validateStatus: (status) => status < 400, // Accept any non-error status
        });
        console.log(`URL verification status: ${verifyResponse.status}`);

        // Check content type if available
        const contentType = verifyResponse.headers["content-type"];
        if (contentType && !contentType.includes("pdf")) {
          console.warn(
            `Warning: URL is accessible but content type is ${contentType} instead of application/pdf`
          );
        }
      } catch (verifyError) {
        console.error(
          `Warning: Could not verify PDF URL accessibility: ${verifyError.message}`
        );
        console.log(
          "Will attempt to proceed anyway, but this may cause issues with Heyzine API"
        );
      }
    } else {
      // If the file is not in the public directory, we need to serve it differently
      // For this case, you might want to:
      // 1. Copy it to a temporary location in public
      // 2. Use a separate endpoint to serve the file
      // 3. Fall back to file.io upload as before

      // For now, let's implement a fallback to file.io
      console.log("PDF not in public directory, using file.io as fallback...");
      try {
        // Read the PDF file
        const fileBuffer = await fs.readFile(fullPdfPath);
        const fileName = path.basename(fullPdfPath);

        // Create form data for upload
        const formData = new FormData();
        formData.append("file", fileBuffer, {
          filename: fileName,
          contentType: "application/pdf",
        });

        // Upload the file to file.io
        const uploadResponse = await axios.post("https://file.io", formData, {
          headers: formData.getHeaders(),
          timeout: 15000, // 15 second timeout
        });

        if (!uploadResponse.data.success) {
          throw new Error("Failed to upload PDF to temporary hosting");
        }

        // File.io URLs already have unique identifiers, no need for cache busting
        publicPdfUrl = uploadResponse.data.link;
      } catch (uploadError) {
        throw new Error(
          `Cannot access PDF outside public directory and fallback upload failed: ${uploadError.message}`
        );
      }
    }

    console.log("Public PDF URL:", publicPdfUrl);

    // Heyzine API endpoint
    const heyzineApiUrl = "https://heyzine.com/api1/rest";
    // Your Heyzine API credentials
    const CLIENT_ID = "ec699cd75fe2cd5e";
    const API_KEY = "3c63a2957580283687a009503f4baaade5a9d495.ec699cd75fe2cd5e";

    // Create request body for the API
    // Add a unique title with timestamp to further prevent caching
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .substring(0, 14);
    const requestBody = {
      pdf: publicPdfUrl,
      client_id: CLIENT_ID,
      title: `Daily News Magazine`, // Add timestamp to title to make each conversion unique
      prev_next: true,
      show_info: true,
      format: "html5",
      quality: "high",
      width: 1000,
      height: 700,
    };

    console.log("Request body:", {
      ...requestBody,
      // Hide API key in logs for security
      client_id: "[REDACTED]",
    });
    console.log("Sending request to Heyzine API...");

    try {
      // Add cache control headers to the request
      const headers = {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      };

      // Make request to Heyzine API
      const response = await axios.post(heyzineApiUrl, requestBody, {
        headers,
      });

      console.log("Response status:", response.status);

      if (!response.data) {
        throw new Error("No response data received from Heyzine API");
      }

      // Handle API errors more specifically
      if (response.data.success === false) {
        console.error("Heyzine API Error:", response.data);

        // Handle specific error codes
        if (response.data.code === "-210") {
          throw new Error(
            `Invalid PDF file: ${response.data.msg}. The PDF might be corrupted, password-protected, or cannot be accessed properly through the provided URL.`
          );
        } else {
          throw new Error(
            `Heyzine API Error (${response.data.code}): ${response.data.msg}`
          );
        }
      }

      if (!response.data.url) {
        console.error("Unexpected API response:", response.data);
        throw new Error("Flipbook URL not found in Heyzine API response");
      }

      // Add a small delay to ensure the flipbook is ready
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Add cache-busting to the returned flipbook URL if possible
      let flipbookUrl = response.data.url;
      if (flipbookUrl.includes("?")) {
        flipbookUrl += `&${cacheBuster}`;
      } else {
        flipbookUrl += `?${cacheBuster}`;
      }

      return NextResponse.json({
        success: true,
        flipbookUrl: flipbookUrl,
        thumbnail: response.data.thumbnail,
        pdf: response.data.pdf,
        meta: response.data.meta,
      });
    } catch (apiError) {
      console.error("API Error Details:", {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
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
