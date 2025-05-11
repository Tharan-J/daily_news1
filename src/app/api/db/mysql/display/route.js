import { NextResponse } from "next/server";
import connection from "../connection/connection";

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, category = "all" } = body;

    let activeNewsQuery, upcomingNewsQuery, publishedNewsQuery;
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

      // Query for upcoming news (approved but not in top 25)
      upcomingNewsQuery = `
        SELECT n.* FROM news n 
        LEFT JOIN (
          SELECT n2.id FROM news n2
          JOIN user_priority up ON n2.uploaded_by = up.user_id 
          WHERE n2.status = 'approved' 
          AND n2.date <= CURDATE() 
          AND n2.is_published = FALSE 
          ORDER BY up.priority ASC, n2.date ASC, n2.priority_order ASC, n2.submitted_at DESC 
          LIMIT 25
        ) as active ON n.id = active.id
        WHERE n.status = 'approved' 
        AND n.is_published = FALSE
        AND active.id IS NULL
        ORDER BY n.date DESC
      `;

      // Query for published news
      publishedNewsQuery = `
        SELECT * FROM news 
        WHERE status = 'approved' 
        AND is_published = TRUE 
        ORDER BY published_at DESC
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

      upcomingNewsQuery = `
        SELECT * FROM news 
        WHERE status = 'approved' 
        AND is_published = FALSE 
        AND uploaded_by = ? 
        AND date > CURDATE() 
        ORDER BY date ASC
      `;

      publishedNewsQuery = `
        SELECT * FROM news 
        WHERE status = 'approved' 
        AND is_published = TRUE 
        AND uploaded_by = ? 
        ORDER BY published_at DESC
      `;

      params = [user_id, user_id, user_id];
    }

    let activeNews = [],
      upcomingNews = [],
      publishedNews = [];

    // Execute the queries based on the requested category
    if (category === "all" || category === "active") {
      const [activeRows] =
        user_id === "admin"
          ? await connection.execute(activeNewsQuery)
          : await connection.execute(activeNewsQuery, [user_id]);
      activeNews = activeRows;
    }

    if (category === "all" || category === "upcoming") {
      const [upcomingRows] =
        user_id === "admin"
          ? await connection.execute(upcomingNewsQuery)
          : await connection.execute(upcomingNewsQuery, [user_id]);
      upcomingNews = upcomingRows;
    }

    if (category === "all" || category === "published") {
      const [publishedRows] =
        user_id === "admin"
          ? await connection.execute(publishedNewsQuery)
          : await connection.execute(publishedNewsQuery, [user_id]);
      publishedNews = publishedRows;
    }

    // Process images for all news items
    const processImages = (items) => {
      return items.map((item) => {
        if (item.image) {
          const base64 = Buffer.from(item.image).toString("base64");
          return {
            ...item,
            image: `data:image/jpeg;base64,${base64}`,
          };
        }
        return item;
      });
    };

    // Process images for all categories
    const processedActiveNews = processImages(activeNews);
    const processedUpcomingNews = processImages(upcomingNews);
    const processedPublishedNews = processImages(publishedNews);
    // Return JSON with a 200 status
    return NextResponse.json(
      {
        activeNews: processedActiveNews,
        upcomingNews: processedUpcomingNews,
        publishedNews: processedPublishedNews,
        total:
          processedActiveNews.length +
          processedUpcomingNews.length +
          processedPublishedNews.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from database" },
      { status: 500 }
    );
  }
}
