/**
 * HTML_PAGES_COMPLETE.js
 * جميع صفحات HTML المتقدمة - كاملة وجاهزة
 * All advanced HTML pages - complete and ready
 */

/**
 * صفحة الميزانيات
 */
function getBudgetsPageComplete_() {
  var budgets = getBudgetsData_();
  var webAppUrl = ScriptApp.getService().getUrl();
  
  var html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SJA - الميزانيات</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      direction: rtl;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: white;
      padding: 20px 30px;
      border-radius: 15px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { color: #667eea; font-size: 28px; }
    .back-btn {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
    }
    .budget-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .budget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .budget-name {
      font-size: 20px;
      font-weight: bold;
      color: #333;
    }
    .budget-percentage {
      font-size: 24px;
      font-weight: bold;
    }
    .budget-bar {
      background: #e0e0e0;
      height: 25px;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .budget-fill {
      height: 100%;
      transition: width 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .budget-details {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #666;
    }
    .green { background: #4caf50; }
    .yellow { background: #ff9800; }
    .orange { background: #ff5722; }
    .red { background: #f44336; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 الميزانيات</h1>
      <a href="${webAppUrl}" class="back-btn">← الرئيسية</a>
    </div>
    ${budgets}
  </div>
</body>
</html>`;
  
  return HtmlService.createHtmlOutput(html);
}

/**
 * صفحة الحوالات
 */
function getTransfersPageComplete_() {
  var transfers = getTransfersData_();
  var webAppUrl = ScriptApp.getService().getUrl();
  
  var html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SJA - الحوالات</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      direction: rtl;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: white;
      padding: 20px 30px;
      border-radius: 15px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { color: #667eea; font-size: 28px; }
    .back-btn {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      text-align: center;
    }
    .summary-card h3 {
      color: #666;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .creditor { color: #f44336; }
    .debtor { color: #4caf50; }
    .net { color: #667eea; }
    .transfers-section {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .transfers-section h2 {
      color: #667eea;
      margin-bottom: 20px;
      font-size: 22px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: right;
      border-bottom: 1px solid #f0f0f0;
    }
    th {
      background: #f8f9fa;
      font-weight: bold;
      color: #333;
    }
    tr:hover {
      background: #f8f9fa;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔄 الحوالات</h1>
      <a href="${webAppUrl}" class="back-btn">← الرئيسية</a>
    </div>
    ${transfers}
  </div>
</body>
</html>`;
  
  return HtmlService.createHtmlOutput(html);
}

/**
 * صفحة الحسابات
 */
function getAccountsPageComplete_() {
  var accounts = getAccountsHTML_();
  var webAppUrl = ScriptApp.getService().getUrl();
  
  var html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SJA - الحسابات</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      direction: rtl;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: white;
      padding: 20px 30px;
      border-radius: 15px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { color: #667eea; font-size: 28px; }
    .back-btn {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
    }
    .bank-section {
      background: white;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .bank-name {
      font-size: 22px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    .account-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
    }
    .account-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-right: 4px solid #667eea;
    }
    .account-number {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    .account-type {
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 الحسابات المسجلة</h1>
      <a href="${webAppUrl}" class="back-btn">← الرئيسية</a>
    </div>
    ${accounts}
  </div>
</body>
</html>`;
  
  return HtmlService.createHtmlOutput(html);
}

/**
 * صفحة الإحصائيات
 */
function getStatsPageComplete_() {
  var stats = getStatsHTML_();
  var webAppUrl = ScriptApp.getService().getUrl();
  
  var html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SJA - الإحصائيات</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      direction: rtl;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: white;
      padding: 20px 30px;
      border-radius: 15px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { color: #667eea; font-size: 28px; }
    .back-btn {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
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
      text-align: center;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 الإحصائيات</h1>
      <a href="${webAppUrl}" class="back-btn">← الرئيسية</a>
    </div>
    ${stats}
  </div>
</body>
</html>`;
  
  return HtmlService.createHtmlOutput(html);
}

/**
 * جلب بيانات الميزانيات
 */
function getBudgetsData_() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Budgets');
    
    if (!sheet) {
      return '<div class="budget-card"><p>لا توجد ميزانيات</p></div>';
    }
    
    var data = sheet.getDataRange().getValues();
    var html = '';
    
    for (var i = 1; i < data.length; i++) {
      var category = data[i][0];
      var budgeted = Number(data[i][1]) || 0;
      var spent = Number(data[i][2]) || 0;
      var remaining = budgeted - spent;
      var percentage = budgeted > 0 ? (spent / budgeted * 100) : 0;
      
      var colorClass = 'green';
      if (percentage >= 100) colorClass = 'red';
      else if (percentage >= 80) colorClass = 'orange';
      else if (percentage >= 50) colorClass = 'yellow';
      
      html += `
      <div class="budget-card">
        <div class="budget-header">
          <div class="budget-name">${category}</div>
          <div class="budget-percentage ${colorClass}">${percentage.toFixed(0)}%</div>
        </div>
        <div class="budget-bar">
          <div class="budget-fill ${colorClass}" style="width: ${Math.min(percentage, 100)}%">
            ${spent.toFixed(0)} / ${budgeted.toFixed(0)}
          </div>
        </div>
        <div class="budget-details">
          <span>المتبقي: ${remaining.toFixed(2)} ريال</span>
          <span>المخصص: ${budgeted.toFixed(2)} ريال</span>
        </div>
      </div>`;
    }
    
    return html;
    
  } catch (e) {
    return '<div class="budget-card"><p>خطأ: ' + e.message + '</p></div>';
  }
}

/**
 * جلب بيانات الحوالات
 */
function getTransfersData_() {
  try {
    if (typeof getTransfersReport === 'function') {
      var report = getTransfersReport();
      
      var html = `
      <div class="summary-cards">
        <div class="summary-card">
          <h3>🔴 الدائنين (لهم عندي)</h3>
          <div class="value creditor">${report.totalCreditors || 0}</div>
          <p>${(report.creditorAmount || 0).toFixed(2)} ريال</p>
        </div>
        <div class="summary-card">
          <h3>🟢 المدينين (أنا لهم)</h3>
          <div class="value debtor">${report.totalDebtors || 0}</div>
          <p>${(report.debtorAmount || 0).toFixed(2)} ريال</p>
        </div>
        <div class="summary-card">
          <h3>💰 الصافي</h3>
          <div class="value net">${(report.netAmount || 0).toFixed(2)}</div>
          <p>ريال</p>
        </div>
      </div>`;
      
      // إضافة جدول التفاصيل
      html += '<div class="transfers-section"><h2>التفاصيل</h2>';
      html += '<p>تقرير الحوالات متاح عبر Telegram: /transfers</p>';
      html += '</div>';
      
      return html;
    }
    
    return '<p>لا توجد بيانات حوالات</p>';
    
  } catch (e) {
    return '<p>خطأ: ' + e.message + '</p>';
  }
}

/**
 * جلب HTML الحسابات
 */
function getAccountsHTML_() {
  var html = '';
  
  var banks = [
    {
      name: 'AlRajhi Bank 🏦',
      accounts: [
        { number: '9767', type: 'حساب راتب' },
        { number: '9765', type: 'حساب جاري' },
        { number: '4912', type: 'بطاقة مدى' },
        { number: '0005', type: 'حساب خيري' }
      ]
    },
    {
      name: 'STC Bank 💳',
      accounts: [
        { number: '3281', type: 'Apple Pay' },
        { number: '4495', type: 'بطاقة VISA' }
      ]
    },
    {
      name: 'tiqmo 🎯',
      accounts: [
        { number: '0305', type: 'MasterCard Apple Pay' },
        { number: '9682', type: 'محفظة' }
      ]
    },
    {
      name: 'D360 💰',
      accounts: [
        { number: '3449', type: 'VISA & Mada' },
        { number: '7815', type: 'محفظة' }
      ]
    }
  ];
  
  for (var i = 0; i < banks.length; i++) {
    html += '<div class="bank-section">';
    html += '<div class="bank-name">' + banks[i].name + '</div>';
    html += '<div class="account-grid">';
    
    for (var j = 0; j < banks[i].accounts.length; j++) {
      html += '<div class="account-card">';
      html += '<div class="account-number">' + banks[i].accounts[j].number + '</div>';
      html += '<div class="account-type">' + banks[i].accounts[j].type + '</div>';
      html += '</div>';
    }
    
    html += '</div></div>';
  }
  
  return html;
}

/**
 * جلب HTML الإحصائيات
 */
function getStatsHTML_() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('User_USER1');
    
    if (!sheet) {
      return '<div class="stat-card"><p>لا توجد بيانات</p></div>';
    }
    
    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, Math.max(1, lastRow - 1), 8).getValues();
    
    var totalTransactions = data.length;
    var totalAmount = 0;
    
    for (var i = 0; i < data.length; i++) {
      totalAmount += Math.abs(Number(data[i][7]) || 0);
    }
    
    var avgTransaction = totalTransactions > 0 ? (totalAmount / totalTransactions) : 0;
    
    var html = '<div class="stats-grid">';
    html += '<div class="stat-card"><h3>📝 عدد المعاملات</h3>';
    html += '<div class="value">' + totalTransactions + '</div>';
    html += '<div class="label">معاملة</div></div>';
    
    html += '<div class="stat-card"><h3>💰 الإجمالي</h3>';
    html += '<div class="value">' + totalAmount.toFixed(2) + '</div>';
    html += '<div class="label">ريال</div></div>';
    
    html += '<div class="stat-card"><h3>📊 متوسط المعاملة</h3>';
    html += '<div class="value">' + avgTransaction.toFixed(2) + '</div>';
    html += '<div class="label">ريال</div></div>';
    
    html += '<div class="stat-card"><h3>💳 الحسابات</h3>';
    html += '<div class="value">14</div>';
    html += '<div class="label">حساب مسجل</div></div>';
    
    html += '</div>';
    
    return html;
    
  } catch (e) {
    return '<div class="stat-card"><p>خطأ: ' + e.message + '</p></div>';
  }
}
