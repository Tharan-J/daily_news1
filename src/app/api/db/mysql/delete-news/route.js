import { NextResponse } from "next/server";
import connection from "../connection/connection";

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, rejected_reason, reviewed_by } = body;

    if (!id) {
      return NextResponse.json(
        { error: "News ID is required" },
        { status: 400 }
      );
    }

    // Update status to declined instead of deleting
    const [result] = await connection.execute(
      `UPDATE news 
       SET status = 'declined', 
           rejected_reason = ?, 
           reviewed_by = ?, 
           reviewed_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [rejected_reason, reviewed_by, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "News item not found or could not be updated" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "News item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete news item" },
      { status: 500 }
    );
  }
}