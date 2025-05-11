const baseHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Magazine Page</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        body {
            margin: 0;
            padding: 20mm;
            font-family: Arial, sans-serif;
            box-sizing: border-box;
            width: 210mm;
            min-height: 297mm;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .issue-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .main-news {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .news-item {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
        }
        .news-item.large {
            grid-column: 1 / -1;
        }
        .news-item img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            margin-bottom: 10px;
        }
        .news-item.large img {
            height: 300px;
        }
        .news-item h2 {
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        .news-item.large h2 {
            font-size: 24px;
        }
        .news-item p {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
        }
        .news-item.large p {
            font-size: 16px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily News</h1>
    </div>
    <div class="issue-info">
        <div>Issue #{{ISSUE_NUMBER}}</div>
        <div>{{ISSUE_DATE}}</div>
    </div>
    <div class="summary">
        <h2>{{ISSUE_SUMMARY}}</h2>
    </div>
    <div class="main-news">
        <div class="news-item large">
            <img src="{{NEWS_IMAGE_SRC}}" alt="{{NEWS_TITLE}}">
            <h2>{{NEWS_TITLE}}</h2>
            <p>{{NEWS_DESCRIPTION}}</p>
            <div class="ref">{{NEWS_REF}}</div>
        </div>
        <div class="news-item">
            <img src="{{NEWS_IMAGE_SRC_2}}" alt="{{NEWS_TITLE_2}}">
            <h2>{{NEWS_TITLE_2}}</h2>
            <p>{{NEWS_DESCRIPTION_2}}</p>
            <div class="ref">{{NEWS_REF_2}}</div>
        </div>
        <div class="news-item">
            <img src="{{NEWS_IMAGE_SRC_3}}" alt="{{NEWS_TITLE_3}}">
            <h2>{{NEWS_TITLE_3}}</h2>
            <p>{{NEWS_DESCRIPTION_3}}</p>
            <div class="ref">{{NEWS_REF_3}}</div>
        </div>
    </div>
    <div class="footer">
        <p>© 2024 Daily News. All rights reserved.</p>
    </div>
</body>
</html>
`;

export default { baseHtml };
