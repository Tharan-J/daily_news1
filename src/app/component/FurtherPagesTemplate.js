const FurtherPagesTemplate = {
  baseHtml: `
   <!DOCTYPE html>
 <html>
   <head>
     <title>BITSATHY DailyNews</title>
     <style>
       body {
         font-family: "Times New Roman", Times, serif;
         margin: 0;
         padding: 0;
         background-color: #f9f9f9;
       }
 
       .page {
         top: 25px;
         width: 95%;
         margin: auto;
         padding: 1px;
         position: relative;
       }
       
       .page-number-box {
         position: absolute;
         top: 10px;
         right: 30px;
         border: 2px solid #006666;
         padding: 2px 8px;
         font-weight: bold;
         color: black;
         z-index: 2;
       }
 
       .header-line {
         position: absolute;
         top: 37px; 
         left: 2.5%;
         width: 97.5%;
         border-top: 2.5px solid #006666;
       }
 
       .footer-line {
         border-top: 2px solid #006666;
         /* Only change: position fixed instead of absolute */
         position: fixed;
         bottom: 35px;
         /* Left and width properties remain the same */
         left: 1%;
         width: 98%;
         /* Remove margin-top that could be causing positioning issues */
         margin-top: 0;
       }
 
       .section-title {
         background-color: #b8d1f3;
         border: 3px solid #7898c6;
         text-align: center;
         padding: 10px;
         font-size: 24px;
         color: #00005a;
         font-weight: bold;
         margin: 20px 0;
       }
 
       .news-title {
         color: #00005a;
         font-size: 20px;
         margin: 15px 0 10px 0;
       }
 
       .news-item {
         margin-bottom: 20px;
         display: flex;
         flex-direction: column;
       }
 
       .news-row {
         display: flex;
         gap: 15px;
       }
 
       .news-row-reverse {
         display: flex;
         flex-direction: row-reverse;
         gap: 15px;
       }
 
       .news-image {
         width: 200px;
         height: auto;
         border: 1px solid #999;
       }
 
       .news-text {
         text-align: justify;
         font-size: 14px;
         line-height: 1.3;
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
 
       .footer-text {
         font-weight: bold;
         color: white;
         background-color: #006666;
         padding: 5px 15px;
         /* Only change: position fixed instead of absolute */
         position: fixed;
         bottom: 4px;
         right: 30px;
       }
     </style>
   </head>
   <body>
     <div class="page-number-box">{{PAGE_NUMBER}}</div>
     <div class="header-line"></div>
     <div class="page">
       <div class="section-title">{{SECTION_TITLE}}</div>
 
       <!-- News item with image on left -->
       <div class="news-item">
         <div class="news-title">{{NEWS_TITLE_2}}</div>
         <div class="news-row-reverse">
           <div class="news-text">
             {{NEWS_DESCRIPTION_2}}
             <span class="news-ref">{{NEWS_REF_2}}</span>
           </div>
           <div>
             <img
               src="{{NEWS_IMAGE_SRC_2}}"
               alt="{{NEWS_IMAGE_ALT_2}}"
               class="news-image"
             />
             
           </div>
         </div>
       </div>
 
       <!-- News item with image on right -->
       <div class="news-item">
         <div class="news-title">{{NEWS_TITLE_3}}</div>
         <div class="news-row">
           <div>
             <img
               src="{{NEWS_IMAGE_SRC_3}}"
               alt="{{NEWS_IMAGE_ALT_3}}"
               class="news-image"
             />
             
           </div>
           <div class="news-text">
             {{NEWS_DESCRIPTION_3}}
             <span class="news-ref">{{NEWS_REF_3}}</span>
           </div>
         </div>
       </div>
     </div>
     <div class="footer-line"></div>
     <div class="footer-text">BITSATHY DailyNews</div>
   </body>
 </html>
 `
};
 
export default FurtherPagesTemplate;