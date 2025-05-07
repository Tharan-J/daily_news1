import { NextResponse } from "next/server";
import connection from "../connection/connection";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    console.log(email, password);

    const query = "SELECT * FROM users WHERE user_name = ?";
    const values = [email];

    const [rows] = await connection.execute(query, values);

    if (rows.length > 0) {
      const storedPassword = rows[0].user_password;
      console.log("Stored password:", storedPassword);

      if (storedPassword === password) {
        return NextResponse.json(
          { message: true, user_id: rows[0].user_id },
          { status: 200 }
        );
      } else {
        return NextResponse.json({ message: false }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error processing login request:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
