/**
 * ============================================
 * Google Sheets Setup V1.0 - إعداد احترافي
 * ============================================
 * 
 * يحتوي على:
 * ✅ Formulas متقدمة
 * ✅ Conditional Formatting
 * ✅ Data Validation
 * ✅ Charts & Visualizations
 * ✅ Pivot Tables
 */

// ================================
// 1. إنشاء جميع الأوراق بالتنسيق
// ================================

function V1_setupAllSheets() {
  var ss = _ss();
  
  Logger.log('🚀 بدء إعداد Google Sheets...');
  
  // حذف الأوراق القديمة إن وجدت
  try {
    var existingSheets = ss.getSheets();
    existingSheets.forEach(function(sheet) {
      if (sheet.getName() !== 'Sheet1') {
        ss.deleteSheet(sheet);
      }
    });
  } catch (e) {
    Logger.log('تحذير: ' + e);
  }
  
  // إنشاء الأوراق الجديدة
  setupSheet1_MasterLog();
  setupUsersSheet();
  setupBudgetsSheet();
  setupClassifierSheet();
  setupDashboardSheet();
  setupAnalyticsSheet();
  setupDebtLedgerSheet();
  setupRunLogSheet();
  
  // تطبيق التنسيق العام
  applyGlobalFormatting();
  
  Logger.log('✅ تم إعداد جميع الأوراق بنجاح!');
  
  return {ok: true, message: 'Setup completed'};
}

// ================================
// 2. Sheet1 - Master Transaction Log
// ================================

function setupSheet1_MasterLog() {
  var ss = _ss();
  var sheet = ss.getSheetByName('Sheet1') || ss.insertSheet('Sheet1');
  
  // Clear existing data
  sheet.clear();
  
  // Headers
  var headers = [
    'Timestamp', 'Merchant', 'Amount', 'Category', 'Type',
    'Source', 'Account/Card', 'AI Details', 'Notes',
    'Budget Used', 'Debt Impact', 'Balance', 'User ID'
  ];
  
  sheet.appendRow(headers);
  
  // تنسيق الـ Headers
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#667eea')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  
  sheet.setFrozenRows(1);
  
  // تنسيق الأعمدة
  sheet.setColumnWidth(1, 150); // Timestamp
  sheet.setColumnWidth(2, 200); // Merchant
  sheet.setColumnWidth(3, 100); // Amount
  sheet.setColumnWidth(4, 150); // Category
  sheet.setColumnWidth(5, 120); // Type
  sheet.setColumnWidth(6, 120); // Source
  sheet.setColumnWidth(7, 120); // Account/Card
  sheet.setColumnWidth(8, 250); // AI Details
  sheet.setColumnWidth(9, 200); // Notes
  sheet.setColumnWidth(10, 120); // Budget Used
  sheet.setColumnWidth(11, 120); // Debt Impact
  sheet.setColumnWidth(12, 120); // Balance
  sheet.setColumnWidth(13, 100); // User ID
  
  // Formula للـ Balance (عمود L)
  // الصيغة: =IF(ROW()=2, C2, L(ROW-1) + IF(C(ROW)<0, ABS(C(ROW)), -C(ROW)))
  sheet.getRange('L2').setFormula('=IF(C2<0, ABS(C2), -C2)');
  sheet.getRange('L3:L1000').setFormula('=L2 + IF(C3<0, ABS(C3), -C3)');
  
  // Conditional Formatting للـ Amount
  var amountRange = sheet.getRange('C2:C1000');
  
  // إيجابي (دخل) = أخضر
  var ruleIncome = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#d1f2eb')
    .setFontColor('#0c6b58')
    .setRanges([amountRange])
    .build();
  
  // سلبي (مصروف) = أحمر
  var ruleExpense = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#f8d7da')
    .setFontColor('#721c24')
    .setRanges([amountRange])
    .build();
  
  var rules = sheet.getConditionalFormatRules();
  rules.push(ruleIncome);
  rules.push(ruleExpense);
  sheet.setConditionalFormatRules(rules);
  
  // Data Validation للـ Category
  var categories = [
    'مطاعم', 'مواد غذائية', 'مواصلات', 'ترفيه', 
    'صحة', 'تعليم', 'فواتير', 'ملابس', 
    'حوالات', 'راتب', 'أخرى'
  ];
  
  var categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(categories)
    .setAllowInvalid(false)
    .build();
  
  sheet.getRange('D2:D1000').setDataValidation(categoryRule);
  
  Logger.log('✅ Sheet1 جاهز');
}

// ================================
// 3. Users - إدارة المستخدمين
// ================================

function setupUsersSheet() {
  var ss = _ss();
  var sheet = ss.insertSheet('Users');
  
  sheet.clear();
  
  var headers = [
    'User ID', 'اسم المستخدم', 'Telegram ID', 'الحسابات',
    'البطاقات', 'تاريخ التسجيل', 'حالة', 'إجمالي العمليات',
    'آخر نشاط'
  ];
  
  sheet.appendRow(headers);
  
  // تنسيق Headers
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#764ba2')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // تنسيق الأعمدة
  sheet.setColumnWidth(1, 100); // User ID
  sheet.setColumnWidth(2, 150); // اسم المستخدم
  sheet.setColumnWidth(3, 120); // Telegram ID
  sheet.setColumnWidth(4, 200); // الحسابات
  sheet.setColumnWidth(5, 150); // البطاقات
  sheet.setColumnWidth(6, 150); // تاريخ التسجيل
  sheet.setColumnWidth(7, 100); // حالة
  sheet.setColumnWidth(8, 150); // إجمالي العمليات
  sheet.setColumnWidth(9, 150); // آخر نشاط
  
  // Formula لعدد العمليات (عمود H)
  sheet.getRange('H2').setFormula('=COUNTIF(Sheet1!M:M, A2)');
  
  // Formula لآخر نشاط (عمود I)
  sheet.getRange('I2').setFormula('=IF(COUNTIF(Sheet1!M:M, A2)>0, MAXIFS(Sheet1!A:A, Sheet1!M:M, A2), "")');
  
  // إضافة مستخدمين تجريبيين
  sheet.appendRow([
    'USER1', 'أحمد محمد', '123456789', '9767,1234', '5678', 
    new Date(), 'نشط', '', ''
  ]);
  
  sheet.appendRow([
    'USER2', 'سارة أحمد', '987654321', '4321', '8765', 
    new Date(), 'نشط', '', ''
  ]);
  
  Logger.log('✅ Users جاهز');
}

// ================================
// 4. Budgets - الميزانيات
// ================================

function setupBudgetsSheet() {
  var ss = _ss();
  var sheet = ss.insertSheet('Budgets');
  
  sheet.clear();
  
  var headers = [
    'Category', 'Budgeted', 'Spent', 'Remaining', '% Used',
    'Alert Threshold', 'Status', 'Auto-Budget', 'Period'
  ];
  
  sheet.appendRow(headers);
  
  // تنسيق Headers
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#10b981')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // إضافة ميزانيات افتراضية
  var budgets = [
    ['مطاعم', 500, 0, 0, 0, 80, '', true, 'monthly'],
    ['مواد غذائية', 800, 0, 0, 0, 80, '', true, 'monthly'],
    ['مواصلات', 300, 0, 0, 0, 80, '', true, 'monthly'],
    ['ترفيه', 200, 0, 0, 0, 90, '', true, 'monthly'],
    ['صحة', 400, 0, 0, 0, 80, '', false, 'monthly'],
    ['تعليم', 300, 0, 0, 0, 80, '', false, 'monthly'],
    ['فواتير', 600, 0, 0, 0, 80, '', true, 'monthly'],
    ['ملابس', 250, 0, 0, 0, 80, '', false, 'monthly'],
    ['أخرى', 500, 0, 0, 0, 80, '', false, 'monthly']
  ];
  
  budgets.forEach(function(budget) {
    sheet.appendRow(budget);
  });
  
  // Formulas
  // Spent (عمود C): =SUMIF(Sheet1!D:D, A2, Sheet1!C:C)
  sheet.getRange('C2:C10').setFormula('=SUMIF(Sheet1!D:D, A2, Sheet1!C:C)');
  
  // Remaining (عمود D): =B2-C2
  sheet.getRange('D2:D10').setFormula('=B2-C2');
  
  // % Used (عمود E): =IF(B2>0, (C2/B2)*100, 0)
  sheet.getRange('E2:E10').setFormula('=IF(B2>0, (C2/B2)*100, 0)');
  sheet.getRange('E2:E10').setNumberFormat('0.0"%"');
  
  // Status (عمود G): =IF(E2>=100, "🔴 تجاوز", IF(E2>=F2, "⚠️ تحذير", "✅ جيد"))
  sheet.getRange('G2:G10').setFormula('=IF(E2>=100, "🔴 تجاوز", IF(E2>=F2, "⚠️ تحذير", "✅ جيد"))');
  
  // Conditional Formatting للـ % Used
  var percentRange = sheet.getRange('E2:E10');
  
  var ruleGood = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(50)
    .setBackground('#d1f2eb')
    .setFontColor('#0c6b58')
    .setRanges([percentRange])
    .build();
  
  var ruleWarning = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(50, 79.9)
    .setBackground('#fff3cd')
    .setFontColor('#856404')
    .setRanges([percentRange])
    .build();
  
  var ruleAlert = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(80, 99.9)
    .setBackground('#ffc107')
    .setFontColor('#000000')
    .setRanges([percentRange])
    .build();
  
  var ruleDanger = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(100)
    .setBackground('#f8d7da')
    .setFontColor('#721c24')
    .setRanges([percentRange])
    .build();
  
  var rules = [ruleGood, ruleWarning, ruleAlert, ruleDanger];
  sheet.setConditionalFormatRules(rules);
  
  Logger.log('✅ Budgets جاهز');
}

// ================================
// 5. Classifier_Map - التصنيف الذكي
// ================================

function setupClassifierSheet() {
  var ss = _ss();
  var sheet = ss.insertSheet('Classifier_Map');
  
  sheet.clear();
  
  var headers = [
    'Merchant Pattern', 'Category', 'Type', 'Budget Category',
    'Priority', 'Auto-Apply', 'User ID', 'Notes'
  ];
  
  sheet.appendRow(headers);
  
  // تنسيق Headers
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#ef4444')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // أمثلة التصنيف
  var classifiers = [
    ['ماكدونالدز|McDonald', 'مطاعم', 'مشتريات', 'مطاعم', 1, true, null, 'Fast food'],
    ['ستاربكس|Starbucks', 'مطاعم', 'مشتريات', 'مطاعم', 1, true, null, 'Coffee'],
    ['كارفور|Carrefour', 'مواد غذائية', 'مشتريات', 'مواد غذائية', 1, true, null, 'Supermarket'],
    ['بندة|Panda', 'مواد غذائية', 'مشتريات', 'مواد غذائية', 1, true, null, 'Supermarket'],
    ['أوبر|Uber', 'مواصلات', 'مشتريات', 'مواصلات', 1, true, null, 'Ride'],
    ['كريم|Careem', 'مواصلات', 'مشتريات', 'مواصلات', 1, true, null, 'Ride'],
    ['نتفليكس|Netflix', 'ترفيه', 'اشتراك', 'ترفيه', 1, true, null, 'Streaming'],
    ['Apple|iTunes', 'ترفيه', 'مشتريات', 'ترفيه', 1, true, null, 'Digital'],
    ['STC|موبايلي|زين', 'فواتير', 'فاتورة', 'فواتير', 1, true, null, 'Telecom'],
    ['كهرباء|SEC', 'فواتير', 'فاتورة', 'فواتير', 1, true, null, 'Utility'],
    ['راتب|Salary', 'راتب', 'دخل', 'راتب', 1, true, null, 'Income'],
    ['حوالة|Transfer', 'حوالات', 'تحويل', 'حوالات', 2, true, null, 'Transfer']
  ];
  
  classifiers.forEach(function(classifier) {
    sheet.appendRow(classifier);
  });
  
  // تنسيق الأعمدة
  sheet.setColumnWidth(1, 200); // Pattern
  sheet.setColumnWidth(2, 120); // Category
  sheet.setColumnWidth(3, 120); // Type
  sheet.setColumnWidth(4, 150); // Budget
  sheet.setColumnWidth(5, 80); // Priority
  sheet.setColumnWidth(6, 100); // Auto-Apply
  sheet.setColumnWidth(7, 100); // User ID
  sheet.setColumnWidth(8, 200); // Notes
  
  Logger.log('✅ Classifier_Map جاهز');
}

// ================================
// 6. Dashboard - لوحة المعلومات
// ================================

function setupDashboardSheet() {
  var ss = _ss();
  var sheet = ss.insertSheet('Dashboard');
  
  sheet.clear();
  
  // العنوان
  sheet.getRange('A1:E1').merge()
    .setValue('💰 MoneyTracker V1.0 - Dashboard')
    .setBackground('#667eea')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(16)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  
  sheet.setRowHeight(1, 50);
  
  // الإحصائيات الرئيسية
  var stats = [
    ['Metric', 'Value', 'Formula', 'Last Updated', 'Change'],
    ['إجمالي الدخل (الشهر)', '', '=SUMIF(Sheet1!C:C, "<0")', '', ''],
    ['إجمالي المصروفات (الشهر)', '', '=SUMIF(Sheet1!C:C, ">0")', '', ''],
    ['الصافي (الشهر)', '', '=B3+B4', '', ''],
    ['عدد العمليات (الشهر)', '', '=COUNTA(Sheet1!A:A)-1', '', ''],
    ['متوسط المصروف', '', '=B4/B6', '', ''],
    ['أكبر مصروف', '', '=MAX(Sheet1!C:C)', '', ''],
    ['أصغر مصروف', '', '=MIN(FILTER(Sheet1!C:C, Sheet1!C:C>0))', '', ''],
    ['الرصيد الحالي', '', '=INDEX(Sheet1!L:L, COUNTA(Sheet1!L:L))', '', '']
  ];
  
  var startRow = 3;
  stats.forEach(function(row, idx) {
    sheet.getRange(startRow + idx, 1, 1, row.length).setValues([row]);
    
    if (idx === 0) {
      // Header
      sheet.getRange(startRow, 1, 1, row.length)
        .setBackground('#764ba2')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
    } else {
      // Formula
      if (row[2]) {
        sheet.getRange(startRow + idx, 2).setFormula(row[2]);
      }
      // تنسيق الأرقام
      sheet.getRange(startRow + idx, 2).setNumberFormat('#,##0.00');
    }
  });
  
  // تنسيق الأعمدة
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 300);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 100);
  
  // إضافة Chart
  createDashboardChart(sheet);
  
  Logger.log('✅ Dashboard جاهز');
}

// ================================
// 7. Analytics - التحليلات
// ================================

function setupAnalyticsSheet() {
  var ss = _ss();
  var sheet = ss.insertSheet('Analytics');
  
  sheet.clear();
  
  // Pivot Table للتصنيفات
  sheet.getRange('A1').setValue('📊 تحليل المصروفات حسب التصنيف');
  sheet.getRange('A1:C1').merge()
    .setBackground('#10b981')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  
  sheet.appendRow(['Category', 'Total', 'Count', '% of Total', 'Avg']);
  
  // سيتم ملؤها ديناميكياً
  
  Logger.log('✅ Analytics جاهز');
}

// ================================
// 8. Debt_Ledger - سجل الديون
// ================================

function setupDebtLedgerSheet() {
  var ss = _ss();
  var sheet = ss.insertSheet('Debt_Ledger');
  
  sheet.clear();
  
  var headers = [
    'Date', 'Creditor/Debtor', 'Credit (+)', 'Debit (-)', 
    'Balance', 'Notes', 'User ID'
  ];
  
  sheet.appendRow(headers);
  
  // تنسيق
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#ef4444')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Formula للـ Balance
  sheet.getRange('E2').setFormula('=C2-D2');
  sheet.getRange('E3:E1000').setFormula('=E2+C3-D3');
  
  Logger.log('✅ Debt_Ledger جاهز');
}

// ================================
// 9. Run_Log - سجل التشغيل
// ================================

function setupRunLogSheet() {
  var ss = _ss();
  var sheet = ss.insertSheet('Run_Log');
  
  sheet.clear();
  
  var headers = [
    'Timestamp', 'Function', 'Status', 'Duration (ms)',
    'Error', 'Details', 'User'
  ];
  
  sheet.appendRow(headers);
  
  // تنسيق
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#6c757d')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  
  Logger.log('✅ Run_Log جاهز');
}

// ================================
// 10. إنشاء Chart
// ================================

function createDashboardChart(sheet) {
  var chartBuilder = sheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(sheet.getRange('A4:B12'))
    .setPosition(14, 1, 0, 0)
    .setOption('title', 'توزيع المصروفات')
    .setOption('width', 600)
    .setOption('height', 400)
    .setOption('pieHole', 0.4)
    .setOption('colors', ['#667eea', '#764ba2', '#10b981', '#ffc107', '#ef4444']);
  
  sheet.insertChart(chartBuilder.build());
}

// ================================
// 11. تنسيق عام
// ================================

function applyGlobalFormatting() {
  var ss = _ss();
  var sheets = ss.getSheets();
  
  sheets.forEach(function(sheet) {
    // تطبيق خط Arial حجم 10
    var range = sheet.getDataRange();
    range.setFontFamily('Arial')
      .setFontSize(10);
    
    // محاذاة النص للأعمدة العربية
    // (يمكن تحسينها حسب الحاجة)
  });
  
  Logger.log('✅ تم تطبيق التنسيق العام');
}

// ================================
// 12. وظيفة الإعداد السريع
// ================================

function quickSetup() {
  return V1_setupAllSheets();
}
