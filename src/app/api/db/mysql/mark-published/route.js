import { NextResponse } from "next/server";
import connection from "../connection/connection";

export async function POST(req) {
  try {
    const body = await req.json();
    const { newsIds } = body;
    
    if (!Array.isArray(newsIds) || newsIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid newsIds provided" },
        { status: 400 }
      );
    }

    // Create placeholders for the SQL query
    const placeholders = newsIds.map(() => "?").join(",");
    
    // Update the news items to mark them as published
    const [result] = await connection.execute(
      `UPDATE news 
       SET is_published = TRUE, 
           published_at = NOW() 
       WHERE id IN (${placeholders})`,
      [...newsIds]
    );

    return NextResponse.json(
      { 
        success: true, 
        message: `${result.affectedRows} news items marked as published`,
        affectedRows: result.affectedRows
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to mark news as published" },
      { status: 500 }
    );
  }
}