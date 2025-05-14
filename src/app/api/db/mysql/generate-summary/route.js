// File: app/api/magazine/generate-summary/route.js
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import connection from "../connection/connection";

// Initialize Google Generative AI
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id = "admin" } = body;

    // Fetch active news from database
    const activeNews = await fetchActiveNewsFromDB(user_id);

    if (!activeNews || activeNews.length === 0) {
      return NextResponse.json(
        { summary: "INSIDE THE ISSUE: Latest News | Updates" },
        { status: 200 }
      );
    }

    // Format news data for AI processing
    const newsData = formatNewsForAI(activeNews);

    // Generate summary using AI
    const summary = await generateSummaryWithAI(newsData);

    return NextResponse.json(
      {
        success: true,
        summary: summary.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating summary topic:", error);
    return NextResponse.json(
      {
        error: "Failed to generate issue summary",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch active news from database based on user_id
 * @param {string} user_id - User ID or "admin"
 * @returns {Array} - Active news articles
 */
async function fetchActiveNewsFromDB(user_id) {
  let activeNewsQuery;
  let params = [];

  // Query for active news (top 25 based on priority)
  if (user_id === "admin") {
    activeNewsQuery = `
      SELECT n.* FROM news n 
      JOIN user_priority up ON n.uploaded_by = up.user_id 
      WHERE n.status = 'approved' 
      AND n.date <= CURDATE() 
      AND n.is_published = FALSE 
      ORDER BY up.priority ASC, n.date ASC, n.priority_order ASC, n.submitted_at DESC 
      LIMIT 25
    `;
  } else {
    // For regular users, show only their own news
    activeNewsQuery = `
      SELECT n.* FROM news n 
      JOIN user_priority up ON n.uploaded_by = up.user_id 
      WHERE n.status = 'approved' 
      AND n.date <= CURDATE() 
      AND n.is_published = FALSE 
      AND n.uploaded_by = ?
      ORDER BY up.priority ASC, n.date ASC, n.priority_order ASC, n.submitted_at DESC
    `;
    params = [user_id];
  }

  // Execute the query
  const [activeRows] =
    user_id === "admin"
      ? await connection.execute(activeNewsQuery)
      : await connection.execute(activeNewsQuery, params);

  // Process images (optional - if needed for AI)
  return activeRows.map((item) => {
    // Convert image to text format if needed for AI processing
    if (item.image && Buffer.isBuffer(item.image)) {
      // Skip including the image data in the AI prompt
      return {
        ...item,
        image: "[Image]", // Just a placeholder, we don't need to send actual image data to AI
      };
    }
    return item;
  });
}

/**
 * Format news data for AI consumption
 * @param {Array} newsItems - Array of news items from database
 * @returns {Array} - Formatted news data
 */
function formatNewsForAI(newsItems) {
  return newsItems.map((news) => {
    return {
      title: news.title || "",
    };
  });
}

/**
 * Generate summary using Google Gemini AI
 * @param {Array} newsData - Formatted news data
 * @returns {string} - Generated summary
 */
async function generateSummaryWithAI(newsData) {
  try {
    // Create a prompt with the news data
    const aiResult = await generateText({
      model: google("gemini-2.0-flash"),
      system: `
        You are a newspaper editor creating a concise issue summary.
        Given the news content, generate 3-5 main topics in exactly this format:
        <Topic 1> | <Topic 2> | <Topic 3> | <Topic 4>
        
        Each topic should be 1-3 words only, covering major news themes.
        Don't include any explanations or additional text, just the topics in the format above.
        The topics will be used as "INSIDE THE ISSUE:" header.
      `,
      prompt: JSON.stringify(newsData),
    });

    // Extract the text string from the AI result
    const text =
      typeof aiResult === "string"
        ? aiResult
        : aiResult.text || aiResult.choices?.[0]?.text || "";
    let summary = text.trim();

    // If the AI returned more than the format, extract just the topic line
    if (summary.includes("\n")) {
      const lines = summary.split("\n");
      for (const line of lines) {
        if (line.includes("|")) {
          summary = line.trim();
          break;
        }
      }
    }

    // Remove any "INSIDE THE ISSUE:" prefix if AI included it
    if (summary.toUpperCase().includes("INSIDE THE ISSUE:")) {
      summary = summary.replace(/INSIDE THE ISSUE:/i, "").trim();
    }

    return summary;
  } catch (error) {
    console.error("Error with AI generation:", error);
    // Fallback to basic summary if AI fails
    return generateFallbackSummary(newsData);
  }
}

/**
 * Generate a fallback summary if AI fails
 * @param {Array} newsData - Formatted news data
 * @returns {string} - Basic fallback summary
 */
function generateFallbackSummary(newsData) {
  const categories = new Set();

  // Extract categories or keywords from titles
  newsData.forEach((item) => {
    if (item.category) {
      categories.add(item.category);
    } else if (item.title) {
      // Extract potential keywords from title
      const words = item.title.split(" ");
      for (const word of words) {
        if (word.length > 4 && !isCommonWord(word)) {
          categories.add(word);
          if (categories.size >= 4) break;
        }
      }
    }
  });

  // Convert to array and limit to 4 items
  const topics = Array.from(categories).slice(0, 4);

  if (topics.length === 0) {
    return "Latest News | Updates | Announcements";
  }

  return topics.join(" | ");
}

/**
 * Check if a word is a common word that should be excluded
 * @param {string} word - Word to check
 * @returns {boolean} - True if it's a common word
 */
function isCommonWord(word) {
  const commonWords = [
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "have",
    "has",
    "been",
    "news",
    "today",
    "latest",
  ];
  return commonWords.includes(word.toLowerCase());
}
