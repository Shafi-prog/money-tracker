/**
 * HTML_DASHBOARD_ADVANCED.js
 * لوحة تحكم HTML متقدمة - جميع الخدمات بدون الرجوع لـ Sheets
 * Advanced HTML dashboard with full functionality
 */

/**
 * صفحة Dashboard المتقدمة
 */
function getAdvancedDashboard(e) {
  var params = e.parameter || {};
  var page = params.page || 'home';
  
  // توجيه الصفحات
  switch(page) {
    case 'transactions':
      return getTransactionsPage_();
    case 'budgets':
      return getBudgetsPage_();
    case 'accounts':
      return getAccountsPage_();
    case 'transfers':
      return getTransfersPage_();
    case 'stats':
      return getStatsPage_();
    case 'categories':
      return getCategoriesPage_();
    case 'search':
      return getSearchPage_();
    default:
      return getHomePage_();
  }
}

/**
 * صفحة المعاملات - قيد التطوير
 */
function getTransactionsPage_() {
  return HtmlService.createHtmlOutput('<h1>صفحة المعاملات قيد التطوير</h1>');
}

/**
 * صفحة الميزانيات - كاملة
 */
function getBudgetsPage_() {
  if (typeof getBudgetsPageComplete_ === 'function') {
    return getBudgetsPageComplete_();
  }
  return HtmlService.createHtmlOutput('<h1>صفحة الميزانيات قيد التطوير</h1>');
}

/**
 * صفحة الحسابات - كاملة
 */
function getAccountsPage_() {
  if (typeof getAccountsPageComplete_ === 'function') {
    return getAccountsPageComplete_();
  }
  return HtmlService.createHtmlOutput('<h1>صفحة الحسابات قيد التطوير</h1>');
}

/**
 * صفحة الحوالات - كاملة
 */
function getTransfersPage_() {
  if (typeof getTransfersPageComplete_ === 'function') {
    return getTransfersPageComplete_();
  }
  return HtmlService.createHtmlOutput('<h1>صفحة الحوالات قيد التطوير</h1>');
}

/**
 * صفحة الإحصائيات - كاملة
 */
function getStatsPage_() {
  if (typeof getStatsPageComplete_ === 'function') {
    return getStatsPageComplete_();
  }
  return HtmlService.createHtmlOutput('<h1>صفحة الإحصائيات قيد التطوير</h1>');
}

/**
 * صفحة التصنيفات - قيد التطوير
 */
function getCategoriesPage_() {
  return HtmlService.createHtmlOutput('<h1>صفحة التصنيفات قيد التطوير</h1>');
}

/**
 * صفحة البحث - قيد التطوير
 */
function getSearchPage_() {
  return HtmlService.createHtmlOutput('<h1>صفحة البحث قيد التطوير</h1>');
}

/**
 * الصفحة الرئيسية
 */
function getHomePage_() {
  var stats = getQuickStats_();
  var recentTransactions = getRecentTransactions_(5);
  var budgetStatus = getBudgetsSummary_();
  var webAppUrl = ScriptApp.getService().getUrl();
  
  var html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SJA MoneyTracker - Dashboard</title>
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
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .header h1 {
      color: #667eea;
      font-size: 32px;
    }
    
    .header .user-info {
      text-align: left;
      color: #666;
    }
    
    .nav-menu {
      background: white;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      overflow-x: auto;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .nav-menu a {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      white-space: nowrap;
      transition: all 0.3s;
      font-weight: bold;
    }
    
    .nav-menu a:hover {
      background: #5568d3;
      transform: translateY(-2px);
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
    
    .section {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .section h2 {
      color: #667eea;
      margin-bottom: 20px;
      font-size: 24px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
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
    
    .budget-bar {
      background: #e0e0e0;
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 5px;
    }
    
    .budget-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      transition: width 0.3s;
    }
    
    .budget-fill.warning {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }
    
    .budget-fill.danger {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    
    .action-btn {
      padding: 15px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      text-align: center;
      border-radius: 10px;
      text-decoration: none;
      font-weight: bold;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    
    .action-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        text-align: center;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .nav-menu {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>💰 SJA MoneyTracker</h1>
        <p style="color: #666; margin-top: 5px;">نظام متكامل لإدارة المصروفات</p>
      </div>
      <div class="user-info">
        <div style="font-size: 18px; font-weight: bold;">Shafi Jahz Almutiry</div>
        <div style="font-size: 14px; color: #999;">${new Date().toLocaleDateString('ar-SA')}</div>
        <div style="font-size: 14px; color: #999;">${new Date().toLocaleTimeString('ar-SA')}</div>
      </div>
    </div>
    
    <div class="nav-menu">
      <a href="${webAppUrl}">🏠 الرئيسية</a>
      <a href="${webAppUrl}?page=transactions">📝 المعاملات</a>
      <a href="${webAppUrl}?page=budgets">💰 الميزانيات</a>
      <a href="${webAppUrl}?page=accounts">💳 الحسابات</a>
      <a href="${webAppUrl}?page=transfers">🔄 الحوالات</a>
      <a href="${webAppUrl}?page=stats">📊 الإحصائيات</a>
      <a href="${webAppUrl}?page=categories">📂 التصنيفات</a>
      <a href="${webAppUrl}?page=search">🔍 بحث</a>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>💰 مصروفات اليوم</h3>
        <div class="value">${stats.today || '0.00'}</div>
        <div class="label">ريال</div>
      </div>
      
      <div class="stat-card">
        <h3>📅 مصروفات الأسبوع</h3>
        <div class="value">${stats.week || '0.00'}</div>
        <div class="label">ريال</div>
      </div>
      
      <div class="stat-card">
        <h3>📆 مصروفات الشهر</h3>
        <div class="value">${stats.month || '0.00'}</div>
        <div class="label">ريال</div>
      </div>
      
      <div class="stat-card">
        <h3>💳 عدد الحسابات</h3>
        <div class="value">${stats.accounts || '0'}</div>
        <div class="label">حساب/بطاقة</div>
      </div>
    </div>
    
    <div class="section">
      <h2>📝 آخر المعاملات</h2>
      ${generateRecentTransactionsHTML_(recentTransactions)}
      <div style="margin-top: 20px; text-align: center;">
        <a href="${webAppUrl}?page=transactions" class="action-btn" style="display: inline-flex; width: auto;">
          عرض جميع المعاملات
        </a>
      </div>
    </div>
    
    <div class="section">
      <h2>💰 ملخص الميزانيات</h2>
      ${generateBudgetsSummaryHTML_(budgetStatus)}
      <div style="margin-top: 20px; text-align: center;">
        <a href="${webAppUrl}?page=budgets" class="action-btn" style="display: inline-flex; width: auto;">
          عرض جميع الميزانيات
        </a>
      </div>
    </div>
    
    <div class="section">
      <h2>⚡ إجراءات سريعة</h2>
      <div class="quick-actions">
        <a href="${webAppUrl}?page=transfers" class="action-btn">
          🔄 تقرير الحوالات
        </a>
        <a href="${webAppUrl}?page=stats" class="action-btn">
          📈 الإحصائيات المفصلة
        </a>
        <a href="${webAppUrl}?page=search" class="action-btn">
          🔍 بحث في المعاملات
        </a>
        <a href="${webAppUrl}?page=categories" class="action-btn">
          📂 التصنيفات
        </a>
      </div>
    </div>
  </div>
  
  <script>
    // Auto refresh every 5 minutes
    setTimeout(function() {
      location.reload();
    }, 300000);
  </script>
</body>
</html>
  `;
  
  return HtmlService.createHtmlOutput(html)
    .setTitle('SJA MoneyTracker')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * توليد HTML لآخر المعاملات
 */
function generateRecentTransactionsHTML_(transactions) {
  if (!transactions || transactions.length === 0) {
    return '<p style="text-align: center; color: #999;">لا توجد معاملات حديثة</p>';
  }
  
  var html = '<table>';
  html += '<tr>';
  html += '<th>التاريخ</th>';
  html += '<th>التاجر</th>';
  html += '<th>الفئة</th>';
  html += '<th>المبلغ</th>';
  html += '<th>الحساب</th>';
  html += '</tr>';
  
  transactions.forEach(function(tx) {
    html += '<tr>';
    html += '<td>' + tx.date + '</td>';
    html += '<td>' + tx.merchant + '</td>';
    html += '<td>' + tx.category + '</td>';
    html += '<td><strong>' + tx.amount + ' ريال</strong></td>';
    html += '<td>' + tx.account + '</td>';
    html += '</tr>';
  });
  
  html += '</table>';
  return html;
}

/**
 * توليد HTML لملخص الميزانيات
 */
function generateBudgetsSummaryHTML_(budgets) {
  if (!budgets || budgets.length === 0) {
    return '<p style="text-align: center; color: #999;">لا توجد ميزانيات</p>';
  }
  
  var html = '';
  budgets.forEach(function(budget) {
    var percentage = budget.budgeted > 0 ? (budget.spent / budget.budgeted * 100) : 0;
    var barClass = percentage >= 100 ? 'danger' : (percentage >= 80 ? 'warning' : '');
    
    html += '<div style="margin-bottom: 20px;">';
    html += '<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">';
    html += '<strong>' + budget.category + '</strong>';
    html += '<span>' + budget.spent.toFixed(2) + ' / ' + budget.budgeted.toFixed(2) + ' ريال</span>';
    html += '</div>';
    html += '<div class="budget-bar">';
    html += '<div class="budget-fill ' + barClass + '" style="width: ' + Math.min(percentage, 100) + '%"></div>';
    html += '</div>';
    html += '<div style="font-size: 12px; color: #999; margin-top: 5px;">';
    html += 'المتبقي: ' + (budget.budgeted - budget.spent).toFixed(2) + ' ريال (' + percentage.toFixed(1) + '%)';
    html += '</div>';
    html += '</div>';
  });
  
  return html;
}

/**
 * الحصول على آخر المعاملات
 */
function getRecentTransactions_(limit) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('User_USER1');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }
    
    var lastRow = sheet.getLastRow();
    var startRow = Math.max(2, lastRow - limit + 1);
    var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 8).getValues();
    
    return data.reverse().map(function(row) {
      return {
        date: new Date(row[0]).toLocaleDateString('ar-SA'),
        merchant: row[2] || 'غير محدد',
        amount: Math.abs(Number(row[3]) || 0).toFixed(2),
        category: row[4] || 'غير مصنف',
        account: row[5] || 'غير محدد'
      };
    });
  } catch (e) {
    Logger.log('Error getting recent transactions: ' + e);
    return [];
  }
}

/**
 * الحصول على ملخص الميزانيات
 */
function getBudgetsSummary_() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Budgets');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }
    
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    
    return data.map(function(row) {
      return {
        category: row[0],
        budgeted: Number(row[1]) || 0,
        spent: Number(row[2]) || 0
      };
    }).slice(0, 5); // أول 5 ميزانيات
  } catch (e) {
    Logger.log('Error getting budgets summary: ' + e);
    return [];
  }
}
