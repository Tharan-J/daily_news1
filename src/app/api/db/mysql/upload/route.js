import { NextResponse } from "next/server";
import connection from "../connection/connection";

export async function POST(request) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Parse the FormData
      const formData = await request.formData();

      // Extract user info
      const uploaded_by = formData.get("uploaded_by");

      // Validate required fields
      if (!uploaded_by) {
        return NextResponse.json(
          { success: false, message: "Missing required field: uploaded_by" },
          { status: 400 }
        );
      }

      // Get entries data from JSON
      const entriesDataJson = formData.get("entries");
      if (!entriesDataJson) {
        return NextResponse.json(
          { success: false, message: "Missing entries data" },
          { status: 400 }
        );
      }

      // Parse entries JSON
      const entriesData = JSON.parse(entriesDataJson);
      if (!Array.isArray(entriesData) || entriesData.length === 0) {
        return NextResponse.json(
          { success: false, message: "Invalid entries data format" },
          { status: 400 }
        );
      }

      // Current date for all entries
      const currentDate = new Date().toISOString().split("T")[0];

      // Process each entry
      const results = [];

      for (let i = 0; i < entriesData.length; i++) {
        const entry = entriesData[i];

        // Validate entry data - only require title now
        if (!entry.title) {
          return NextResponse.json(
            {
              success: false,
              message: `Missing required field 'title' in entry #${i + 1}`,
            },
            { status: 400 }
          );
        }

        // Process image if it exists for this entry
        let imageBuffer = null;
        if (entry.has_image && entry.image_index !== null) {
          const imageFile = formData.get(`image_${entry.image_index}`);

          if (imageFile && imageFile instanceof Blob) {
            // Convert blob to buffer
            const arrayBuffer = await imageFile.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
          }
        }

        // Insert data into the database - removed Page_no field
        const [result] = await connection.execute(
          "INSERT INTO news (date, title, image, content, uploaded_by) VALUES (?, ?, ?, ?, ?)",
          [
            currentDate,
            entry.title,
            imageBuffer,
            entry.content || "",
            uploaded_by,
          ]
        );

        results.push({
          id: result.insertId,
          title: entry.title,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully saved ${results.length} entries!`,
        results: results,
      });
    } else {
      // For backward compatibility, handle JSON requests
      const data = await request.json();

      // Extract data from the request
      const { title, content, uploaded_by, imageBase64 } = data;

      // Validate required fields
      if (!title || !uploaded_by) {
        return NextResponse.json(
          { success: false, message: "Missing required fields" },
          { status: 400 }
        );
      }

      // Convert base64 image to buffer if it exists
      let imageBuffer = null;
      if (imageBase64 && imageBase64.startsWith("data:image")) {
        const base64Data = imageBase64.split(",")[1];
        imageBuffer = Buffer.from(base64Data, "base64");
      }

      // Current date for the date field
      const currentDate = new Date().toISOString().split("T")[0];

      // Insert data into the database - removed Page_no field
      const [result] = await connection.execute(
        "INSERT INTO news (date, title, image, content, uploaded_by) VALUES (?, ?, ?, ?, ?)",
        [currentDate, title, imageBuffer, content || "", uploaded_by]
      );

      return NextResponse.json({
        success: true,
        message: "Document saved successfully!",
        id: result.insertId,
      });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error saving to database: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

// Configure the API route to handle large file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};