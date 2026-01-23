/**
 * WEB_APP_HANDLER.js
 * Enhanced Web App with HTML Dashboard
 * Handles both GET (dashboard) and POST (webhook)
 */

/**
 * Main entry point for Web App (GET requests)
 * Shows HTML dashboard
 */
function doGet_Dashboard(e) {
  var params = e.parameter || {};
  var page = params.page || 'dashboard';
  
  // Route to different pages
  if (page === 'admin') {
    return getAdminPage_();
  } else if (page === 'analytics') {
    return getAnalyticsPage_();
  } else if (page === 'test') {
    return getTestPage_();
  } else {
    return getDashboardPage_();
  }
}

/**
 * Main Dashboard Page
 */
function getDashboardPage_() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('SHEET_ID');
  var owner = props.getProperty('OWNER') || 'SJA';
  var appLabel = props.getProperty('APP_LABEL') || 'MoneyTracker';
  
  var stats = getQuickStats_();
  var webAppUrl = ScriptApp.getService().getUrl();
  
  var html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appLabel} - لوحة التحكم</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      direction: rtl;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      margin-bottom: 30px;
      text-align: center;
    }
    
    .header h1 {
      color: #667eea;
      font-size: 36px;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #666;
      font-size: 18px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      background: #10b981;
      color: white;
      border-radius: 25px;
      font-weight: bold;
      margin-top: 15px;
      font-size: 14px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .stat-card h3 {
      color: #667eea;
      font-size: 16px;
      margin-bottom: 10px;
    }
    
    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    
    .stat-card .label {
      color: #999;
      font-size: 14px;
    }
    
    .info-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .info-card h2 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 24px;
    }
    
    .info-list {
      list-style: none;
    }
    
    .info-list li {
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
    }
    
    .info-list li:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: bold;
      color: #555;
    }
    
    .info-value {
      color: #333;
    }
    
    .nav-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 12px 30px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      transition: background 0.3s;
      display: inline-block;
    }
    
    .btn:hover {
      background: #5568d3;
    }
    
    .btn-secondary {
      background: #10b981;
    }
    
    .btn-secondary:hover {
      background: #059669;
    }
    
    code {
      background: #f3f4f6;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #d946ef;
    }
    
    .webhook-box {
      background: #1f2937;
      color: #10b981;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow-x: auto;
      margin-top: 10px;
    }
    
    @media (max-width: 768px) {
      .header h1 {
        font-size: 28px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 ${appLabel}</h1>
      <p>نظام ذكي لتتبع المصروفات</p>
      <span class="status-badge">🟢 النظام يعمل</span>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>📊 إجمالي المعاملات</h3>
        <div class="value">${stats.totalTransactions}</div>
        <div class="label">معاملة</div>
      </div>
      
      <div class="stat-card">
        <h3>💳 الحسابات المسجلة</h3>
        <div class="value">${stats.totalAccounts}</div>
        <div class="label">بطاقة/حساب</div>
      </div>
      
      <div class="stat-card">
        <h3>🏦 البنوك المتصلة</h3>
        <div class="value">4</div>
        <div class="label">بنك</div>
      </div>
      
      <div class="stat-card">
        <h3>✅ آخر تحديث</h3>
        <div class="value" style="font-size: 20px;">${new Date().toLocaleDateString('ar-SA')}</div>
        <div class="label">${new Date().toLocaleTimeString('ar-SA')}</div>
      </div>
    </div>
    
    <div class="info-card">
      <h2>ℹ️ معلومات النظام</h2>
      <ul class="info-list">
        <li>
          <span class="info-label">المالك</span>
          <span class="info-value">${owner}</span>
        </li>
        <li>
          <span class="info-label">النسخة</span>
          <span class="info-value">${appLabel}</span>
        </li>
        <li>
          <span class="info-label">البنوك</span>
          <span class="info-value">STC Bank, tiqmo, الراجحي, D360</span>
        </li>
        <li>
          <span class="info-label">الحالة</span>
          <span class="info-value">🟢 تعمل بشكل طبيعي</span>
        </li>
      </ul>
    </div>
    
    <div class="info-card">
      <h2>🔗 Webhook Endpoint</h2>
      <p style="margin-bottom: 10px;">استخدم هذا الرابط لإرسال رسائل SMS:</p>
      <div class="webhook-box">${webAppUrl}</div>
      <p style="margin-top: 15px; color: #666; font-size: 14px;">
        📱 قم بتوجيه iPhone Shortcuts إلى هذا الرابط لتتبع تلقائي
      </p>
    </div>
    
    <div class="nav-buttons">
      <a href="${webAppUrl}?page=test" class="btn">🧪 صفحة الاختبار</a>
      <a href="https://docs.google.com/spreadsheets/d/${sheetId}" class="btn btn-secondary" target="_blank">📊 فتح Google Sheets</a>
    </div>
  </div>
</body>
</html>
  `;
  
  return HtmlService.createHtmlOutput(html)
    .setTitle(appLabel + ' - Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Test Page
 */
function getTestPage_() {
  var webAppUrl = ScriptApp.getService().getUrl();
  
  var html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>اختبار النظام</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #f5f5f5;
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    h1 {
      color: #667eea;
      margin-bottom: 20px;
    }
    .test-box {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    textarea {
      width: 100%;
      padding: 15px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      direction: rtl;
      resize: vertical;
      min-height: 150px;
    }
    button {
      background: #667eea;
      color: white;
      padding: 12px 30px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 10px;
    }
    button:hover {
      background: #5568d3;
    }
    #result {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      display: none;
    }
    .success {
      background: #d1fae5;
      border: 2px solid #10b981;
      color: #065f46;
    }
    .error {
      background: #fee2e2;
      border: 2px solid #ef4444;
      color: #991b1b;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 اختبار إرسال SMS</h1>
    
    <div class="test-box">
      <h3>أدخل نص الرسالة:</h3>
      <textarea id="smsText" placeholder="شراء Apple Pay
عبر:*3281
بـ:50 SAR
من:ستاربكس
في: 20/01/26">شراء Apple Pay
عبر:*3281
بـ:50 SAR
من:ستاربكس
في: 20/01/26</textarea>
      
      <button onclick="sendTest()">📤 إرسال الاختبار</button>
      
      <div id="result"></div>
    </div>
    
    <div class="test-box">
      <h3>أمثلة رسائل للاختبار:</h3>
      <button onclick="loadExample(1)">STC Bank</button>
      <button onclick="loadExample(2)">tiqmo</button>
      <button onclick="loadExample(3)">الراجحي</button>
      <button onclick="loadExample(4)">D360</button>
    </div>
    
    <a href="${webAppUrl}" style="display: inline-block; margin-top: 20px; color: #667eea; text-decoration: none;">← العودة للوحة التحكم</a>
  </div>
  
  <script>
    function loadExample(num) {
      var examples = {
        1: 'شراء Apple Pay\\nعبر:*3281\\nبـ:25 SAR\\nمن:ستاربكس\\nفي: 20/01/26',
        2: 'شراء POS\\nبـ 50.00 SAR\\nمن HYPER PANDA\\nعبر MasterCard **0305 Apple Pay\\nفي 2026-01-20',
        3: 'حوالة داخلية صادرة\\nمن9765\\nبـSAR 300\\nلـ3512;محمد المطيري\\n20/1/26 10:32',
        4: 'شراء دولي\\nمبلغ: KWD 4.00 (SAR 49.11)\\nبطاقة: *3449 - VISA (Apple Pay)\\nلدى: KNPC 94'
      };
      document.getElementById('smsText').value = examples[num];
    }
    
    function sendTest() {
      var sms = document.getElementById('smsText').value;
      var resultDiv = document.getElementById('result');
      
      resultDiv.style.display = 'block';
      resultDiv.className = '';
      resultDiv.innerHTML = '⏳ جاري الإرسال...';
      
      fetch('${webAppUrl}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: sms })
      })
      .then(response => response.json())
      .then(data => {
        resultDiv.className = data.success ? 'success' : 'error';
        resultDiv.innerHTML = '✅ تم الإرسال بنجاح!<br>' + 
                             '<small>تحقق من Telegram و Google Sheets</small><br>' +
                             '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
      })
      .catch(error => {
        resultDiv.className = 'error';
        resultDiv.innerHTML = '❌ خطأ: ' + error.message;
      });
    }
  </script>
</body>
</html>
  `;
  
  return HtmlService.createHtmlOutput(html)
    .setTitle('اختبار النظام')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Get quick stats for dashboard
 */
function getQuickStats_() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) {
      return { totalTransactions: 0, totalAccounts: 0 };
    }
    
    var ss = SpreadsheetApp.openById(sheetId);
    
    // Count transactions
    var userSheet = ss.getSheetByName('User_USER1');
    var totalTransactions = 0;
    if (userSheet) {
      totalTransactions = Math.max(0, userSheet.getLastRow() - 1);
    }
    
    // Count accounts
    var accountSheet = ss.getSheetByName('Account_Registry');
    var totalAccounts = 0;
    if (accountSheet) {
      totalAccounts = Math.max(0, accountSheet.getLastRow() - 1);
    }
    
    return {
      totalTransactions: totalTransactions,
      totalAccounts: totalAccounts
    };
  } catch (e) {
    return { totalTransactions: 0, totalAccounts: 0 };
  }
}

/**
 * Admin page (placeholder)
 */
function getAdminPage_() {
  return HtmlService.createHtmlOutput('<h1>Admin Panel - Coming Soon</h1>');
}

/**
 * Analytics page (placeholder)
 */
function getAnalyticsPage_() {
  return HtmlService.createHtmlOutput('<h1>Analytics - Coming Soon</h1>');
}
