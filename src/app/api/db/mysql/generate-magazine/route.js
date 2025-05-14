import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { promises as fsPromises } from "fs";
import MainTemplate from "../../../../component/MainTemplate";
import FurtherPagesTemplate from "../../../../component/FurtherPagesTemplate";
import NoTitlePageTemplate from "../../../../component/NoTitlePageTemplate";
import { PDFDocument } from "pdf-lib";
import fetch from "node-fetch";

export async function POST(request) {
  try {
    const { pages } = await request.json();

    // Fetch issue summary from generate-summary API
    let issueSummary = "";
    try {
      const summaryRes = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/api/db/mysql/generate-summary`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: "admin" }),
        }
      );
      const summaryData = await summaryRes.json();
      if (summaryData && summaryData.summary) {
        issueSummary = summaryData.summary;
      }
    } catch (e) {
      console.error("Failed to fetch issue summary:", e);
    }

    // Generate HTML for main page and all further pages (concatenated)
    let mainPageHtml = await generateMainTemplate({
      ...pages[0],
      issueSummary,
    });
    let furtherPagesHtml = "";
    for (let i = 1; i < pages.length; i++) {
      furtherPagesHtml += await generateFurtherPagesTemplate(pages[i]);
    }

    // Paths
    const date = new Date().toISOString().split("T")[0];
    const pdfDir = path.join(process.cwd(), "public", "generated_pdfs");
    await fsPromises.mkdir(pdfDir, { recursive: true });
    const mainHtmlPath = path.join(pdfDir, "main_page.html");
    const furtherHtmlPath = path.join(pdfDir, "further_pages.html");
    const mainPdfPath = path.join(pdfDir, "main_page.pdf");
    const furtherPdfPath = path.join(pdfDir, "further_pages.pdf");
    const finalPdfPath = path.join(pdfDir, `DailyNews_${date}.pdf`);

    // Write HTML files
    await fsPromises.writeFile(mainHtmlPath, mainPageHtml, "utf-8");
    await fsPromises.writeFile(furtherHtmlPath, furtherPagesHtml, "utf-8");

    // Puppeteer: generate PDFs
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    // Main page PDF
    await page.goto("file://" + mainHtmlPath);
    await page.pdf({
      path: mainPdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });
    // Further pages PDF
    await page.goto("file://" + furtherHtmlPath);
    await page.pdf({
      path: furtherPdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });
    await browser.close();

    // Merge PDFs using pdf-lib
    const mergedPdf = await PDFDocument.create();
    // Add main page
    const mainPdfBytes = await fsPromises.readFile(mainPdfPath);
    const mainDoc = await PDFDocument.load(mainPdfBytes);
    const mainPages = await mergedPdf.copyPages(
      mainDoc,
      mainDoc.getPageIndices()
    );
    mainPages.forEach((p) => mergedPdf.addPage(p));
    // Add further pages
    const furtherPdfBytes = await fsPromises.readFile(furtherPdfPath);
    const furtherDoc = await PDFDocument.load(furtherPdfBytes);
    const furtherPages = await mergedPdf.copyPages(
      furtherDoc,
      furtherDoc.getPageIndices()
    );
    furtherPages.forEach((p) => mergedPdf.addPage(p));
    const mergedPdfBytes = await mergedPdf.save();
    await fsPromises.writeFile(finalPdfPath, mergedPdfBytes);

    // Clean up only the intermediate PDFs (keep HTML files for debugging)
    await fsPromises.unlink(mainPdfPath).catch(() => {});
    await fsPromises.unlink(furtherPdfPath).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Magazine generated successfully",
      pdfUrl: `/generated-pdfs/DailyNews_${date}.pdf`,
      filename: `DailyNews_${date}.pdf`,
    });
  } catch (error) {
    console.error("Error generating magazine:", error);
    return NextResponse.json(
      { error: "Failed to generate magazine" },
      { status: 500 }
    );
  }
}

async function generateMainTemplate(page) {
  // Get the base HTML from the template
  let htmlContent = MainTemplate.baseHtml;

  // Replace header placeholders
  htmlContent = htmlContent
    .replace("{{ISSUE_NUMBER}}", page.issueNumber || "")
    .replace("{{ISSUE_DATE}}", page.issueDate || "")
    .replace(
      "{{LOGO_SRC}}",
      process.env.NEXT_PUBLIC_BASE_URL + "/uploads/logo.png"
    )
    .replace("{{ISSUE_SUMMARY}}", page.issueSummary || "");

  // Generate news items HTML
  const newsItemsHtml = page.news
    .map((news, index) => {
      let newsItemHtml = MainTemplate.newsItemTemplate;
      return newsItemHtml
        .replace("{{NEWS_TITLE}}", news.title || "")
        .replace("{{NEWS_IMAGE_SRC}}", news.image || "")
        .replace("{{NEWS_DESCRIPTION}}", news.content || "")
        .replace("{{NEWS_REF}}", news.reference || "");
    })
    .join("");

  // Replace the news items placeholder
  htmlContent = htmlContent.replace("{{NEWS_ITEMS}}", newsItemsHtml);

  return htmlContent;
}

async function generateFurtherPagesTemplate(page) {
  // For pages after the first page, choose template based on whether there's a title
  // Check if the section has a title
  const hasSectionTitle = page.sectionTitle && page.sectionTitle.trim() !== "";
  
  // Choose template based on whether there's a section title
  // Use NoTitlePageTemplate when section title is missing
  const template = hasSectionTitle ? FurtherPagesTemplate : NoTitlePageTemplate;
  let htmlContent = template.baseHtml;

  // Replace page number
  htmlContent = htmlContent.replace("{{PAGE_NUMBER}}", page.pageNumber || "");

  // Only replace section title if using FurtherPagesTemplate
  if (template === FurtherPagesTemplate) {
    htmlContent = htmlContent.replace(
      "{{SECTION_TITLE}}",
      page.sectionTitle || ""
    );
  }

  // Generate news items HTML
  const newsItemsHtml = page.news
    .map((news) => {
      let newsItemHtml = template.newsItemTemplate;
      
      // Only include news title if it exists and we're using FurtherPagesTemplate
      if ((!news.title || news.title.trim() === "") && template === FurtherPagesTemplate) {
        newsItemHtml = newsItemHtml.replace(
          '<div class="news-title">{{NEWS_TITLE}}</div>',
          ""
        );
      }
      
      return newsItemHtml
        .replace("{{NEWS_TITLE}}", news.title || "")
        .replace("{{NEWS_IMAGE_SRC}}", news.image || "")
        .replace("{{NEWS_IMAGE_ALT}}", news.title || "News image")
        .replace("{{NEWS_DESCRIPTION}}", news.content || "")
        .replace("{{NEWS_REF}}", news.reference || "");
    })
    .join("");

  // Replace the news items placeholder
  htmlContent = htmlContent.replace("{{NEWS_ITEMS}}", newsItemsHtml);

  return htmlContent;
}
