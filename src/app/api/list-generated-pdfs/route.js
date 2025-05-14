import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Path to the public/generated_pdfs directory
    const pdfDir = path.join(process.cwd(), "public", "generated_pdfs");
    // Read all files in the directory
    const files = fs.readdirSync(pdfDir);
    // Filter for PDF files only
    const pdfs = files.filter((file) => file.endsWith(".pdf"));
    return NextResponse.json({ pdfs });
  } catch (error) {
    return NextResponse.json({ pdfs: [], error: error.message }, { status: 500 });
  }
}