const MainTemplate = {
  baseHtml: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Daily News - Bannari Amman Institute of Technology</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: "Times New Roman", Times, serif;
      background-color: #f9f9f9;
    }

    .header-bg {
      background: linear-gradient(90deg, #d4f3ee 0%, #f7fdfd 100%);
      border-bottom: 2px solid #c9e7e5;
      padding: 6px 0;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 24px;
      font-size: 14px;
      color: #00795b;
      font-style: italic;
    }

    .header-title-row {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: -2px;
    }

    .header-title, .header-title2 {
      font-size: 56px;
      font-style: italic;
      font-weight: bold;
      color: #2ca07a;
      letter-spacing: 1.5px;
    }

    .header-title2 {
      margin-left: 10px;
    }

    .header-logo-center {
      width: 50px;
      margin: 0 12px;
    }

    .header-issue {
      background: #00795b;
      color: #fff;
      padding: 6px 18px;
      font-size: 15px;
      letter-spacing: 0.5px;
      text-align: center;
    }

    .content {
      padding: 22px;
    }

    .news-item {
      margin-bottom: 20px;
    }

    .news-title {
      font-size: 22px;
      font-weight: bold;
      color: #1d4e89;
      margin-bottom: 8px;
    }

    .news-row {
      display: flex;
      gap: 16px;
    }

    .news-text {
      font-size: 15px;
      flex: 2;
      text-align: justify;
      line-height: 1.5;
      color: #333;
    }

    .news-image {
      flex: 1;
      text-align: center;
    }

    .news-image img {
      width: 200px;
      border: 1.5px solid #b6b6b6;
    }

    .news-ref {
      display: block;
      font-size: 12px;
      color: #e96c2c;
      margin-top: 4px;
    }

    .footer-bar {
     position: absolute;
     bottom: 0;
      width: 100%;
      border-top: 2px solid #2ca07a;
      font-size: 14px;
      color: #d33333;
      text-align: center;
      padding: 6px 12px;
      margin-top: 25px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header-bg">
      <div class="header-row">
        <div>Private Circulation Only</div>
        <div>
          Issue No: <span class="issue-number">{{ISSUE_NUMBER}}</span><br />
          <span class="issue-date">{{ISSUE_DATE}}</span>
        </div>
      </div>
      <div class="header-title-row">
        <span class="header-title">Daily</span>
        <img class="header-logo-center" src="{{LOGO_SRC}}" alt="BIT Logo" />
        <span class="header-title2">News</span>
      </div>
      <div class="header-issue">
        <b> THE ISSUE:</b> &nbsp;
        <span class="issue-summary">{{ISSUE_SUMMARY}}</span>
      </div>
    </div>

    <div class="content">
      <!-- Example news block -->
      <div class="news-item">
        <div class="news-title">{{NEWS_TITLE}}</div>
        <div class="news-row">
          <div class="news-image">
            <img src="{{NEWS_IMAGE_SRC}}" alt="News Image" />
          </div>
          <div class="news-text">
            {{NEWS_DESCRIPTION}}
            <span class="news-ref">{{NEWS_REF}}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      Edited by: On the Dean-PDS. Feedback and suggestions may be sent to: dailynews@bitsathy.ac.in
    </div>
  </div>
</body>
</html>
  `,
};

export default MainTemplate;
