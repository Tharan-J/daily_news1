import { NextResponse } from "next/server";
import connection from "../db/mysql/connection/connection";

export async function GET(request) {
  try {
    // Get user ID from query parameters
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Query to get all pending news for this user
    const [rows] = await connection.execute(
      `SELECT id, date, title, content, status, 
       submitted_at, reviewed_at, reviewed_by, rejected_reason 
       FROM news 
       WHERE uploaded_by = ? 
       ORDER BY submitted_at DESC`,
      [user_id]
    );

    // Process the image data for frontend display
    const newsWithProcessedData = rows.map((row) => {
      // Convert dates to strings
      return {
        ...row,
        date: row.date ? row.date.toISOString().split("T")[0] : null,
        // Don't return the image in the list view for performance
      };
    });

    return NextResponse.json({
      success: true,
      news: newsWithProcessedData,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error fetching data: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
