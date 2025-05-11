import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import puppeteer from "puppeteer";
import MainTemplate from "@/app/component/MainTemplate";
import MainTemplate2 from "@/app/component/MainTemplate2";
import FurtherPagesTemplate from "@/app/component/FurtherPagesTemplate";
import { PDFDocument } from "pdf-lib";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const pages = [];
    const pdfs = [];
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Create directories if they don't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const generatedPagesDir = path.join(
      process.cwd(),
      "public",
      "generated_pages"
    );
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(generatedPagesDir, { recursive: true });

    // Process each page
    let pageIndex = 0;
    while (formData.has(`page_${pageIndex}_news_0_title`)) {
      const pageData = {
        newsItems: [],
        subheading: formData.get(`page_${pageIndex}_subheading`) || "",
      };

      let newsIndex = 0;
      while (formData.has(`page_${pageIndex}_news_${newsIndex}_title`)) {
        const newsItem = {
          title: formData.get(`page_${pageIndex}_news_${newsIndex}_title`),
          description: formData.get(
            `page_${pageIndex}_news_${newsIndex}_description`
          ),
          image: formData.get(`page_${pageIndex}_news_${newsIndex}_image`),
          ref: formData.get(`page_${pageIndex}_news_${newsIndex}_ref`),
        };
        pageData.newsItems.push(newsItem);
        newsIndex++;
      }

      // Generate HTML for the page
      let html;
      if (pageIndex === 0) {
        // Main page template
        if (pageData.newsItems.length === 2) {
          html = MainTemplate.replace("{{TITLE1}}", pageData.newsItems[0].title)
            .replace("{{DESCRIPTION1}}", pageData.newsItems[0].description)
            .replace("{{IMAGE1}}", pageData.newsItems[0].image)
            .replace("{{REF1}}", pageData.newsItems[0].ref)
            .replace("{{TITLE2}}", pageData.newsItems[1].title)
            .replace("{{DESCRIPTION2}}", pageData.newsItems[1].description)
            .replace("{{IMAGE2}}", pageData.newsItems[1].image)
            .replace("{{REF2}}", pageData.newsItems[1].ref);
        } else if (pageData.newsItems.length === 3) {
          html = MainTemplate2.replace(
            "{{TITLE1}}",
            pageData.newsItems[0].title
          )
            .replace("{{DESCRIPTION1}}", pageData.newsItems[0].description)
            .replace("{{IMAGE1}}", pageData.newsItems[0].image)
            .replace("{{REF1}}", pageData.newsItems[0].ref)
            .replace("{{TITLE2}}", pageData.newsItems[1].title)
            .replace("{{DESCRIPTION2}}", pageData.newsItems[1].description)
            .replace("{{IMAGE2}}", pageData.newsItems[1].image)
            .replace("{{REF2}}", pageData.newsItems[1].ref)
            .replace("{{TITLE3}}", pageData.newsItems[2].title)
            .replace("{{DESCRIPTION3}}", pageData.newsItems[2].description)
            .replace("{{IMAGE3}}", pageData.newsItems[2].image)
            .replace("{{REF3}}", pageData.newsItems[2].ref);
        }
      } else {
        // Further pages template
        html = FurtherPagesTemplate.replace("{{SUBTITLE}}", pageData.subheading)
          .replace("{{TITLE1}}", pageData.newsItems[0].title)
          .replace("{{DESCRIPTION1}}", pageData.newsItems[0].description)
          .replace("{{IMAGE1}}", pageData.newsItems[0].image)
          .replace("{{REF1}}", pageData.newsItems[0].ref)
          .replace("{{TITLE2}}", pageData.newsItems[1].title)
          .replace("{{DESCRIPTION2}}", pageData.newsItems[1].description)
          .replace("{{IMAGE2}}", pageData.newsItems[1].image)
          .replace("{{REF2}}", pageData.newsItems[1].ref);
      }

      // Save the HTML file
      const htmlPath = path.join(
        generatedPagesDir,
        `page_${pageIndex + 1}.html`
      );
      await fs.writeFile(htmlPath, html);
      pages.push(`/generated_pages/page_${pageIndex + 1}.html`);

      // Generate PDF for this page
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20mm",
          right: "20mm",
          bottom: "20mm",
          left: "20mm",
        },
      });
      pdfs.push(pdf);
      pageIndex++;
    }

    // Merge PDFs if there are multiple pages
    let finalPdf;
    if (pdfs.length > 1) {
      const mergedPdf = await PDFDocument.create();
      for (const pdfBytes of pdfs) {
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      finalPdf = await mergedPdf.save();
    } else {
      finalPdf = pdfs[0];
    }

    // Save the final PDF
    const pdfPath = path.join(uploadsDir, "magazine.pdf");
    if (!finalPdf) {
      throw new Error("No PDF data generated");
    }
    await fs.writeFile(pdfPath, finalPdf);

    await browser.close();

    return NextResponse.json({
      success: true,
      pdf: "/uploads/magazine.pdf",
      pages: pages,
    });
  } catch (error) {
    console.error("Error generating magazine:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
