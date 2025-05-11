import { NextResponse } from "next/server";
import connection from "../../db/mysql/connection/connection";

export async function GET(request) {
  try {
    // In a real app, you'd add authentication verification here
    // to ensure only admins can access this endpoint

    // Query to get all pending news entries
    const [rows] = await connection.execute(
      `SELECT id, date, title, content, status, 
       uploaded_by, submitted_at, reviewed_at, reviewed_by, rejected_reason 
       FROM news 
       ORDER BY submitted_at DESC`
    );

    // Process the data for frontend display
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
