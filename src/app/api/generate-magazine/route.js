import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import fs from "fs/promises";
import path from "path";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import puppeteer from "puppeteer";

// Import HTML templates
import MainTemplate from "../../component/MainTemplate";
import FurtherPagesTemplate from "../../component/FurtherPagesTemplate";

async function saveMultipleHtmlPages(aiResponse, outputDir) {
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    // Split the response into page blocks using regex
    const pageRegex = /=== Page: (.*?) ===\s*([\s\S]*?)(?=\s*(?:=== Page:|$))/g;
    const savedFiles = [];
    let match;

    // Extract each page and its content
    while ((match = pageRegex.exec(aiResponse)) !== null) {
      const filename = match[1].trim();
      const content = match[2].trim();

      if (filename && content) {
        // Create full path for the file
        const filePath = path.join(outputDir, filename);

        // Save the file
        await fs.writeFile(filePath, content, "utf-8");

        savedFiles.push({
          filename,
          path: `/generated-pages/${path.relative(
            path.join(process.cwd(), "generated-pages"),
            filePath
          )}`, // Return public path
          content:
            content.length > 200 ? content.substring(0, 200) + "..." : content,
        });

        console.log(`Saved: ${filePath}`);
      }
    }

    return savedFiles;
  } catch (error) {
    console.error("Error saving HTML pages:", error);
    throw error;
  }
}

/**
 * Generates a PDF from a folder of HTML files with proper formatting
 * @param {string} htmlDir - Directory containing HTML files
 * @param {string} outputFilename - Name of the output PDF file
 * @returns {Promise<string>} - Path to the generated PDF file
 */
async function generatePdfFromHtmlDir(htmlDir, outputFilename) {
  try {
    // Get all HTML files in the directory
    const files = await fs.readdir(htmlDir);
    const htmlFiles = files
      .filter((file) => file.endsWith(".html"))
      // Sort files naturally if they are numbered (page1.html, page2.html, etc.)
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/) || [0]);
        const numB = parseInt(b.match(/\d+/) || [0]);
        return numA - numB;
      });

    if (htmlFiles.length === 0) {
      throw new Error("No HTML files found in the directory");
    }

    // Ensure the directory for PDFs exists
    const pdfDir = path.join(process.cwd(), "public", "pdfs");
    await fs.mkdir(pdfDir, { recursive: true });

    // Generate PDF path
    const pdfPath = path.join(pdfDir, outputFilename);

    // Launch a headless browser with specific settings
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // Create a new page with A4 dimensions
    const page = await browser.newPage();
    await page.setViewport({
      width: 1000,
      height: 1400,
      deviceScaleFactor: 2,
    });

    // Set custom styles for PDF output
    const styles = `
      @page {
        margin: 0;
        size: A4;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
      }
      .pdf-page {
        width: 100%;
        height: 100%;
        page-break-after: always;
        position: relative;
        box-sizing: border-box;
        padding: 30px;
      }
      .pdf-page:last-child {
        page-break-after: avoid;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      .header, .footer {
        padding: 5px 30px;
        text-align: center;
      }
      .header {
        border-bottom: 1px solid #ddd;
      }
      .footer {
        border-top: 1px solid #ddd;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
      }
    `;

    // Process each HTML file into a PDF
    const pdfs = [];
    for (const file of htmlFiles) {
      const filePath = path.join(htmlDir, file);
      console.log(`Processing file: ${filePath}`);

      // Read the HTML content
      const htmlContent = await fs.readFile(filePath, "utf-8");

      // Create a temporary file path for each page's PDF
      const tempPdfPath = path.join(
        pdfDir,
        `temp_${file.replace(".html", ".pdf")}`
      );

      // Navigate to a blank page
      await page.goto("about:blank");

      // Set the content with styles
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      // Ensure images are loaded
      await page.evaluateHandle("document.fonts.ready");

      // Generate PDF for this page
      await page.pdf({
        path: tempPdfPath,
        width: "1000px",
        height: "1400px",
        printBackground: true,
        margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
      });

      pdfs.push(tempPdfPath);
    }

    // Merge PDFs if there are multiple pages
    if (pdfs.length > 1) {
      // Use Puppeteer to merge PDFs
      // For production, consider using a dedicated PDF library like pdf-lib or pdf-merge
      const { PDFDocument } = await import("pdf-lib");

      const mergedPdf = await PDFDocument.create();

      for (const pdfPath of pdfs) {
        const pdfBytes = await fs.readFile(pdfPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      await fs.writeFile(pdfPath, mergedPdfBytes);

      // Clean up temporary PDFs
      for (const tempPdf of pdfs) {
        await fs.unlink(tempPdf);
      }
    } else if (pdfs.length === 1) {
      // Just rename the single PDF
      await fs.rename(pdfs[0], pdfPath);
    }

    // Close browser
    await browser.close();

    console.log(`✅ Combined PDF saved as ${pdfPath}`);

    // Return the public path to the PDF
    return `/pdfs/${outputFilename}`;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

// Template options list
const templateOptions = [
  `
  <div class="news-item flex gap-4">
    <div class="w-1/3">
      <img
        src="{{NEWS_IMAGE_SRC}}"
        alt="Image filename"
        class="rounded-md w-full h-auto"
      />
    </div>
    <div class="flex-1">
      <div class="news-title">{{ NEWS_TITLE }}</div>
      <div class="news-text">
        {{ NEWS_DESCRIPTION }}
        <span class="news-ref">{{ NEWS_REF }}</span>
      </div>
    </div>
  </div>
  `,
  `
  <div class="news-item flex gap-4 flex-row-reverse">
    <div class="w-1/3">
      <img
        src="{{NEWS_IMAGE_SRC}}"
        alt="Image filename"
        class="rounded-md w-full h-auto"
      />
    </div>
    <div class="flex-1">
      <div class="news-title">{{ NEWS_TITLE }}</div>
      <div class="news-text">
        {{ NEWS_DESCRIPTION }}
        <span class="news-ref">{{ NEWS_REF }}</span>
      </div>
    </div>
  </div>
  `,
  `
  <div class="news-item flex gap-4">
    <div class="w-1/3 flex flex-col gap-2">
      <img
        src="{{NEWS_IMAGE_SRC_1}}"
        alt="Image 1"
        class="rounded-md w-full h-auto"
      />
      <img
        src="{{NEWS_IMAGE_SRC_2}}"
        alt="Image 2"
        class="rounded-md w-full h-auto"
      />
    </div>
    <div class="flex-1">
      <div class="news-title">{{ NEWS_TITLE }}</div>
      <div class="news-text">
        {{ NEWS_DESCRIPTION }}
        <span class="news-ref">{{ NEWS_REF }}</span>
      </div>
    </div>
  </div>
  `,
  `
  <div class="news-item relative">
    <div class="news-title mb-2">{{ NEWS_TITLE }}</div>
    <div class="relative">
      <img
        src="{{NEWS_IMAGE_SRC_1}}"
        alt="Top right image"
        class="w-1/3 float-right ml-4 mb-2 rounded-md"
      />
      <p class="news-text">
        {{ NEWS_DESCRIPTION }}
        <img
          src="{{NEWS_IMAGE_SRC_2}}"
          alt="Bottom left image"
          class="w-1/3 float-left mr-4 mt-2 rounded-md"
        />
        <span class="news-ref block clear-both mt-4">{{ NEWS_REF }}</span>
      </p>
    </div>
  </div>
  `,
];

export async function POST(req) {
  try {
    // Create directories for uploaded files and generated pages if they don't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const generatedDir = path.join(process.cwd(), "generated-pages");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(generatedDir, { recursive: true });

    // Parse multipart form data
    const formData = await req.formData();

    // Process news items from form data
    const newsItems = [];
    const imageFilePaths = [];

    // Get all keys from formData to identify news items
    const keys = Array.from(formData.keys());
    const newsItemIndices = new Set(
      keys
        .filter((key) => key.startsWith("newsItem["))
        .map((key) => {
          const match = key.match(/newsItem\[(\d+)\]/);
          return match ? parseInt(match[1]) : null;
        })
        .filter((index) => index !== null)
    );

    // Process each news item
    for (const index of newsItemIndices) {
      const title = formData.get(`newsItem[${index}][title]`);
      const content = formData.get(`newsItem[${index}][content]`);
      const imageFile = formData.get(`newsItem[${index}][image]`);

      let imagePath = null;

      // Process image if provided
      if (imageFile && imageFile instanceof Blob) {
        const fileExt = imageFile.name.split(".").pop().toLowerCase();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = path.join(uploadDir, fileName);

        // Convert Blob to Buffer
        const buffer = Buffer.from(await imageFile.arrayBuffer());

        // Save the file
        await writeFile(filePath, buffer);

        // Store the public path
        imagePath = `/uploads/${fileName}`;
        imageFilePaths.push(imagePath);
      }

      newsItems.push({
        title,
        content,
        imagePath,
      });
    }

    // Validate input
    if (!newsItems || newsItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid news items provided",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Initialize Google Generative AI
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Convert templates to string for AI context
    const mainTemplateStr = JSON.stringify(MainTemplate);
    const furtherPagesTemplateStr = JSON.stringify(FurtherPagesTemplate);
    const templateOptionsStr = JSON.stringify(templateOptions);

    // Format news items for the AI prompt
    const formattedNewsItems = newsItems
      .map(
        (item, index) => `
      NEWS ITEM #${index + 1}:
      - TITLE: ${item.title}
      - CONTENT: ${item.content}
      - IMAGE PATH: ${item.imagePath || "None"}
    `
      )
      .join("\n");

    // Query AI for template selection and HTML generation
    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: `
      You are a web page generator. I'll provide you with multiple news items and HTML templates.

Input Variables:

${formattedNewsItems}

MAIN TEMPLATE: ${mainTemplateStr}

FURTHER PAGES TEMPLATE: ${furtherPagesTemplateStr}

TEMPLATE OPTIONS: ${templateOptionsStr}

Your task:

Analyze each news item's title length and content length, and based on that:

Choose the most visually balanced template from the templateOptionsStr

Short items should use compact templates to conserve space

Long items should use spacious or image-supported templates

Compose HTML Pages using the templates:

Page 1 must use MainTemplateStr

Prefer up to 2 news items per page, but if content is short, allow up to 3

Completely fill each page — avoid under-utilized space

Format Content Cleanly:

Use medium font sizes similar to the second PDF

Ensure good visual balance of text and images per section

Structure your response like this:

php-template
Copy
Edit
=== Page: page1.html ===
<!DOCTYPE html>
<html>
...full HTML content for page 1...
</html>

=== Page: page2.html ===
<!DOCTYPE html>
<html>
...full HTML content for page 2...
</html>
Inside the first page’s header:
Replace the following block:

html
Copy
Edit
<div class="header-issue">
  <b> THE ISSUE:</b> &nbsp;
  <span class="issue-summary">{{ISSUE_SUMMARY}}</span>
</div>
With a summary like:

php-template
Copy
Edit
placement | day skill | <topic 3> | <topic 4>
Based on the major themes in the news titles.

Replace image variables like {{NEWS_IMAGE_SRC}}, {{NEWS_IMAGE_SRC_1}}, etc. with the corresponding actual image path values from each news item (e.g., /uploads/xyz.jpg). Do not generate placeholder images or leave them empty.

Include CSS suitable for PDF output:

Medium readable font sizes

Styles for clean layouts

Ensure .page-break class is used between full pages

Return only valid HTML content, no markdown, no extra comments.
`,
    });

    console.log(text);
    // Extract HTML from AI response
    const generatedHtml = text.trim();

    // Create a folder name based on the first news title for grouping related pages
    const firstTitle = newsItems[0]?.title || "news";
    const safeFolderName =
      firstTitle
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .trim("-") +
      "-" +
      Date.now();

    const outputDir = path.join(
      process.cwd(),
      "generated-pages",
      safeFolderName
    );

    // Save multiple HTML pages
    const savedPages = await saveMultipleHtmlPages(generatedHtml, outputDir);

    // Generate PDF from the HTML pages
    const pdfFilename = `${safeFolderName}.pdf`;
    const pdfPath = await generatePdfFromHtmlDir(outputDir, pdfFilename);

    // Include image references in response data
    const newsItemsWithImageInfo = newsItems.map((item) => ({
      title: item.title,
      content: item.content.substring(0, 100) + "...",
      imagePath: item.imagePath,
    }));

    // Return success response with file paths and images info
    return new Response(
      JSON.stringify({
        success: true,
        pages: savedPages,
        mainPage: savedPages.length > 0 ? savedPages[0].path : null,
        pdfPath: pdfPath, // Add the PDF path to the response
        newsItems: newsItemsWithImageInfo,
        images: imageFilePaths,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating pages:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
