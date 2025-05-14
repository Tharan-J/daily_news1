const baseHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Daily News - Bannari Amman Institute of Technology</title>
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        background: #f7fdfd;
        font-family: Times New Roman, Times, serif;
        width: 210mm;
        height: 297mm;
        box-sizing: border-box;
        font-size: 18px;
      }
      .main-container {
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        background: #f7fdfd;
      }
      .header-bg {
        background: linear-gradient(90deg, #d4f3ee 0%, #f7fdfd 100%);
        border-bottom: 2px solid #c9e7e5;
        padding-top: 7px;
      }
      .header-row {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: 0 30px;
      }
      .header-left,
      .header-right {
        font-size: 16px;
        color: #00795b;
        font-style: italic;
        margin-bottom: 8px;
      }
      .header-center {
        text-align: center;
      }
      .header-logo {
        width: 70px;
      }
      .header-title-row {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: -4px;
        padding: 4px;
      }
      .header-title,
      .header-title2 {
        font-size: 64px;
        font-family: Times New Roman, Times, serif;
        color: #2ca07a;
        font-style: italic;
        font-weight: bold;
        letter-spacing: 2px;
      }
      .header-title2 {
        margin-left: 12px;
      }
      .header-logo-center {
        width: 60px;
        margin: 0 10px;
      }
      .header-issue {
        background: #00795b;
        color: #fff;
        font-size: 16px;
        padding: 4px 0 4px 18px;
        letter-spacing: 1px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .content {
        padding: 12mm 12mm 10mm 12mm;
      }
      .news-item {
        margin-bottom: 24px;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .news-title {
        color: #1d4e89;
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 6px;
      }
      .news-row {
        display: block;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .news-text {
        font-size: 18px;
        color: #222;
        line-height: 1.7;
        text-align: justify;
      }
      .news-image {
        float: left;
        width: 220px;
        height: 150px;
        margin: 0 18px 12px 0;
      }
      .news-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border: 1.5px solid #b6b6b6;
        margin-bottom: 4px;
      }
      .news-caption {
        font-size: 13px;
        color: #444;
      }
      .news-ref {
        color: #e96c2c;
        font-size: 13px;
      }
      .section-title {
        color: #1d4e89;
        font-size: 22px;
        font-weight: bold;
        margin-top: 28px;
        margin-bottom: 7px;
      }
      .footer-bar {
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        left: 0;
        bottom: 0;
        width: 100%;
        color: #d33333;
        font-size: 15px;
        text-align: center;
        padding: 4px 0 8px 18px;
        border-top: 2px solid #2ca07a;
        letter-spacing: 1px;
      }
    </style>
  </head>
  <body>
    <div class="main-container">
      <div class="header-bg">
        <div class="header-row">
          <div class="header-left">Private Circulation Only</div>
          <div class="header-center"></div>
          <div class="header-right">
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
        {{NEWS_ITEMS}}
      </div>
      <div class="footer-bar">
        Edited by: On the Dean-PDS Feedback and suggestions may be sent to:
        dailynews@bitsathy.ac.in
      </div>
    </div>
  </body>
</html>
`;

// Template for a single news item
const newsItemTemplate = `
<div class="news-item">
  <div class="news-title">{{NEWS_TITLE}}</div>
  <div class="news-row">
    <div class="news-image">
      <img src="{{NEWS_IMAGE_SRC}}" alt="Image filename" />
    </div>
    <div class="news-text">
      {{NEWS_DESCRIPTION}}
      <span class="news-ref">{{NEWS_REF}}</span>
    </div>
  </div>
</div>
`;

export default { baseHtml, newsItemTemplate };
