import { NextResponse } from "next/server";
import connection from "../../db/mysql/connection/connection";

export async function POST(request) {
  try {
    const data = await request.json();
    const { news_id, status, reviewed_by, rejected_reason } = data;

    // Validate required fields
    if (!news_id || !status || !reviewed_by) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate status enum values
    if (!["approved", "declined"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    // If status is declined, rejected_reason is required
    if (status === "declined" && !rejected_reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Rejection reason is required when declining",
        },
        { status: 400 }
      );
    }

    // Update the news status
    await connection.execute(
      `UPDATE news 
       SET status = ?, 
           reviewed_at = NOW(), 
           reviewed_by = ?, 
           rejected_reason = ? 
       WHERE id = ?`,
      [status, reviewed_by, rejected_reason || null, news_id]
    );

    // If approved, copy to the main news table
    if (status === "approved") {
      // Get the pending news entry
      const [rows] = await connection.execute(
        "SELECT date, title, image, content, uploaded_by FROM news WHERE id = ?",
        [news_id]
      );

      if (rows.length > 0) {
        const newsItem = rows[0];

        // Insert into the main news table
        await connection.execute(
          "INSERT INTO news (date, title, image, content, uploaded_by) VALUES (?, ?, ?, ?, ?)",
          [
            newsItem.date,
            newsItem.title,
            newsItem.image,
            newsItem.content,
            newsItem.uploaded_by,
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `News ${
        status === "approved" ? "approved" : "declined"
      } successfully!`,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error updating news: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
