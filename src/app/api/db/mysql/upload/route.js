import { NextResponse } from "next/server";
import connection from "../connection/connection";

export async function POST(request) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Parse the FormData
      const formData = await request.formData();
      console.log(formData);

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

      // Check if user is admin (user_id equals "admin")
      const isAdmin = uploaded_by === "admin";

      // Set status based on user role
      const status = isAdmin ? "approved" : "pending";

      // Current date for all entries
      const currentDate = new Date().toISOString().split("T")[0];

      // Process each entry
      const results = [];

      for (let i = 0; i < entriesData.length; i++) {
        const entry = entriesData[i];

        // Validate entry data - require title and category
        if (!entry.title) {
          return NextResponse.json(
            {
              success: false,
              message: `Missing required field 'title' in entry #${i + 1}`,
            },
            { status: 400 }
          );
        }

        // Get category (default to "other" if not provided)
        const category = entry.category || "other";

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

        // Insert data into the news table with category field
        const [result] = await connection.execute(
          "INSERT INTO news (date, title, image, content, uploaded_by, status, submitted_at, category) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)",
          [
            currentDate,
            entry.title,
            imageBuffer,
            entry.content || "",
            uploaded_by,
            status,
            category,
          ]
        );

        results.push({
          id: result.insertId,
          title: entry.title,
          status: status,
          category: category,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully ${
          status === "approved" ? "published" : "submitted for review"
        }! ${results.length} entries ${
          status === "approved" ? "added to news feed" : "pending approval"
        }.`,
        results: results,
      });
    } else {
      // For backward compatibility, handle JSON requests
      const data = await request.json();

      // Extract data from the request
      const {
        title,
        content,
        uploaded_by,
        imageBase64,
        category = "other",
      } = data;

      // Validate required fields
      if (!title || !uploaded_by) {
        return NextResponse.json(
          { success: false, message: "Missing required fields" },
          { status: 400 }
        );
      }

      // Check if user is admin (user_id equals "admin")
      const isAdmin = uploaded_by === "admin";

      // Set status based on user role
      const status = isAdmin ? "approved" : "pending";

      // Convert base64 image to buffer if it exists
      let imageBuffer = null;
      if (imageBase64 && imageBase64.startsWith("data:image")) {
        const base64Data = imageBase64.split(",")[1];
        imageBuffer = Buffer.from(base64Data, "base64");
      }

      // Current date for the date field
      const currentDate = new Date().toISOString().split("T")[0];

      // Insert data into the news table with category field
      const [result] = await connection.execute(
        "INSERT INTO news (date, title, image, content, uploaded_by, status, submitted_at, category) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)",
        [
          currentDate,
          title,
          imageBuffer,
          content || "",
          uploaded_by,
          status,
          category,
        ]
      );

      return NextResponse.json({
        success: true,
        message:
          status === "approved"
            ? "Document published successfully!"
            : "Document submitted for review!",
        id: result.insertId,
        status: status,
        category: category,
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
