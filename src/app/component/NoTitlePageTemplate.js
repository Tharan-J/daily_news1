const NoTitlePageTemplate = {
    baseHtml: `
      <!DOCTYPE html>
  <html>
    <head>
      <title>BITSATHY DailyNews</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body {
          font-family: "Times New Roman", Times, serif;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
          font-size: 18px;
        }
        table.page-table {
          width: 210mm;
          height: 297mm;
          margin: 0 auto;
          border-collapse: collapse;
          background: #f9f9f9;
          page-break-after: always;
        }
        td.header-cell, td.footer-cell {
          padding: 0;
          vertical-align: top;
        }
        td.content-cell {
          padding: 18px 24px 18px 24px;
          vertical-align: top;
          height: 100%;
        }
        .header-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-top: 18px;
          padding: 0 24px 0 24px;
          width: calc(100% - 48px);
        }
        .page-number-box {
          border: 2px solid #006666;
          padding: 2px 14px;
          font-weight: bold;
          color: black;
          background: #fff;
          min-width: 40px;
          min-height: 32px;
          text-align: center;
          margin-left: 18px;
          font-size: 20px;
          box-sizing: border-box;
          order: 2;
        }
        .header-line {
          flex: 1;
          border-top: 2.5px solid #006666;
          height: 0;
          margin: 0;
        }
        .news-title {
          color: #00005a;
          font-size: 28px;
          margin: 15px 0 10px 0;
          font-weight: bold;
        }
        .news-item {
          margin-bottom: 28px;
          display: block;
          break-inside: avoid;
          page-break-inside: avoid;
          clear: both;
        }
        .news-row {
  display: block;
  break-inside: avoid;
  page-break-inside: avoid;
}
.news-image {
  float: left;
  width: 220px;
  height: 150px;
  margin: 0 18px 12px 0;
  border: 1.5px solid #b6b6b6;
}
.news-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  margin-bottom: 4px;
}
        .news-text {
          text-align: justify;
          font-size: 18px;
          line-height: 1.7;
        }
        .news-caption {
          font-size: 10px;
          text-align: center;
          font-style: italic;
          color: #555;
          margin-top: 4px;
        }
        .news-ref {
          font-size: 12px;
          color: #555;
          text-align: right;
        }
        .clearfix::after {
          content: "";
          display: table;
          clear: both;
        }
        .footer-line {
          margin: 30px 24px 0 24px;
          width: calc(100% - 48px);
          border-top: 2px solid #006666;
        }
        .footer-text {
          font-weight: bold;
          color: white;
          background-color: #006666;
          padding: 5px 15px;
          margin: 8px 24px 8px 0;
          display: inline-block;
          float: right;
        }
      </style>
    </head>
    <body>
      <table class="page-table">
        <tr>
          <td class="header-cell">
            <div class="header-row">
              <div class="header-line"></div>
              <div class="page-number-box">{{PAGE_NUMBER}}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="content-cell">
            {{NEWS_ITEMS}}
          </td>
        </tr>
        <tr>
          <td class="footer-cell">
            <div class="footer-line"></div>
            <div class="footer-text">BITSATHY DailyNews</div>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `,
  
    // Template for a single news item with image on left
    newsItemTemplate: `
      <div class="news-item clearfix">
        <div class="news-title">{{NEWS_TITLE}}</div>
        <div class="news-row">
          <div class="news-image">
            <img src="{{NEWS_IMAGE_SRC}}" alt="{{NEWS_IMAGE_ALT}}" />
          </div>
          <div class="news-text">
            {{NEWS_DESCRIPTION}}
            <span class="news-ref">{{NEWS_REF}}</span>
          </div>
        </div>
      </div>
    `,
  };
  
  export default NoTitlePageTemplate;
  