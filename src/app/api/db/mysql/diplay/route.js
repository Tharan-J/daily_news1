import { NextResponse } from "next/server";
import connection from "../connection/connection";

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id } = body;

    let rows;

    if (user_id === "admin") {
      [rows] = await connection.execute(
        "SELECT * FROM news ORDER BY date DESC"
      );
    } else {
      [rows] = await connection.execute(
        "SELECT * FROM news WHERE uploaded_by = ? ORDER BY date DESC",
        [user_id]
      );
    }

    // convert any BLOB images to base64 data URIs
    const data = rows.map((item) => {
      if (item.image) {
        const base64 = Buffer.from(item.image).toString("base64");
        return {
          ...item,
          image: `data:image/jpeg;base64,${base64}`,
        };
      }
      return item;
    });

    // return JSON with a 200 status
    return NextResponse.json({ data, total: data.length }, { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from database" },
      { status: 500 }
    );
  }
}
