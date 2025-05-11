import { NextResponse } from "next/server";
import connection from "../../db/mysql/connection/connection";

export async function POST(req) {
  try {
    const { user_id, category } = await req.json();

    let query;
    let params = [];

    // Determine which news to fetch based on category
    switch (category) {
      case "active":
        query = `
          SELECT n.* FROM news n 
          JOIN user_priority up ON n.uploaded_by = up.user_id 
          WHERE n.status = 'approved' 
          AND n.date <= CURDATE() 
          AND n.is_published = FALSE 
          ORDER BY up.priority ASC, n.date ASC, n.priority_order ASC, n.submitted_at DESC 
          LIMIT 25
        `;
        break;
      case "upcoming":
        query = `
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
        break;
      case "published":
        query = `
          SELECT * FROM news 
          WHERE status = 'approved' 
          AND is_published = TRUE 
          ORDER BY published_at DESC
        `;
        break;
      default:
        query = `
          SELECT n.* FROM news n 
          JOIN user_priority up ON n.uploaded_by = up.user_id 
          WHERE n.status = 'approved' 
          AND n.is_published = FALSE 
          ORDER BY up.priority ASC, n.date ASC, n.priority_order ASC, n.submitted_at DESC
        `;
    }

    // Execute query
    const [rows] = await connection.execute(query, params);

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

    // Process images for the news items
    const processedNews = processImages(rows);

    // Return the news items
    return NextResponse.json({
      success: true,
      activeNews: category === "active" ? processedNews : [],
      upcomingNews: category === "upcoming" ? processedNews : [],
      publishedNews: category === "published" ? processedNews : [],
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
