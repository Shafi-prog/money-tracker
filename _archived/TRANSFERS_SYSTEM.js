/**
 * TRANSFERS_SYSTEM.js
 * نظام الحوالات المتقدم - تتبع المدينين والدائنين
 * Transfer system with debtor/creditor tracking
 */

/**
 * إنشاء ورقة الحوالات
 */
function createTransfersSheet() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) {
    throw new Error('SHEET_ID not found');
  }
  
  var ss = SpreadsheetApp.openById(sheetId);
  
  // حذف الورقة القديمة إن وجدت
  var existingSheet = ss.getSheetByName('Transfers_Tracking');
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }
  
  // إنشاء ورقة جديدة
  var sheet = ss.insertSheet('Transfers_Tracking');
  
  // إعداد الرأس
  var headers = [
    'Date',
    'Person Name',
    'Type',           // دائن (له عندي) أو مدين (أنا له)
    'Amount',
    'Status',         // نشط / مسدد
    'Transaction ID',
    'Category',       // للتحقق
    'Notes',
    'Last Updated'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // تنسيق الرأس
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#f59e0b')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  // تنسيق الأعمدة
  sheet.setColumnWidth(1, 120);  // Date
  sheet.setColumnWidth(2, 180);  // Person Name
  sheet.setColumnWidth(3, 100);  // Type
  sheet.setColumnWidth(4, 120);  // Amount
  sheet.setColumnWidth(5, 100);  // Status
  sheet.setColumnWidth(6, 200);  // Transaction ID
  sheet.setColumnWidth(7, 150);  // Category
  sheet.setColumnWidth(8, 250);  // Notes
  sheet.setColumnWidth(9, 150);  // Last Updated
  
  // RTL direction
  sheet.setRightToLeft(true);
  
  // تجميد الصف الأول
  sheet.setFrozenRows(1);
  
  Logger.log('✅ Transfers tracking sheet created');
  return sheet;
}

/**
 * تسجيل حوالة جديدة
 * @param {Object} transferData
 * @returns {Boolean} success
 */
function recordTransfer(transferData) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Transfers_Tracking');
    
    if (!sheet) {
      sheet = createTransfersSheet();
    }
    
    // استخراج اسم الشخص من التفاصيل أو الملاحظات
    var personName = extractPersonName_(transferData);
    
    // تحديد النوع: دائن أو مدين
    var type = determineTransferType_(transferData);
    
    // إضافة الصف
    var row = [
      transferData.date || new Date(),
      personName,
      type,
      transferData.amount || 0,
      'نشط',
      transferData.transactionId || '',
      transferData.category || 'Transfers',
      transferData.notes || '',
      new Date()
    ];
    
    sheet.appendRow(row);
    
    // تنسيق الصف حسب النوع
    var lastRow = sheet.getLastRow();
    var rowRange = sheet.getRange(lastRow, 1, 1, 9);
    
    if (type === 'دائن (له عندي)') {
      rowRange.setBackground('#fee2e2');  // أحمر فاتح
    } else if (type === 'مدين (أنا له)') {
      rowRange.setBackground('#d1fae5');  // أخضر فاتح
    }
    
    Logger.log('✅ Transfer recorded: ' + personName + ' - ' + type + ' - ' + transferData.amount);
    return true;
    
  } catch (e) {
    Logger.log('❌ Error recording transfer: ' + e);
    return false;
  }
}

/**
 * استخراج اسم الشخص من البيانات
 */
function extractPersonName_(data) {
  var text = String(data.merchant || data.notes || data.description || '');
  
  // محاولة استخراج الاسم من نمط "حوالة لـ XXX"
  var patterns = [
    /(?:حوالة|تحويل)[\s]+(?:إلى|لـ|ل)\s*([^؛\n]+)/,
    /(?:من|From)\s*([^؛\n]+)/,
    /لـ\s*(\d+)\s*;\s*([^؛\n]+)/  // نمط الراجحي: "لـ3512;محمد المطيري"
  ];
  
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // إذا لم يتم العثور على اسم، استخدم "غير محدد"
  return 'غير محدد';
}

/**
 * تحديد نوع الحوالة: دائن أو مدين
 */
function determineTransferType_(data) {
  var type = data.transactionType || '';
  var category = data.category || '';
  var text = String(data.merchant || data.notes || '').toLowerCase();
  
  // إذا كان TRANSFER_OUT = أنا حولت لشخص = دائن (له عندي)
  if (type === 'TRANSFER_OUT' || text.match(/صادرة|outgoing|sent/)) {
    return 'دائن (له عندي)';
  }
  
  // إذا كان TRANSFER_IN = شخص حول لي = مدين (أنا له)
  if (type === 'TRANSFER_IN' || text.match(/واردة|وارده|incoming|received|استرجاع/)) {
    return 'مدين (أنا له)';
  }
  
  // افتراضي
  return 'دائن (له عندي)';
}

/**
 * تحديث حالة حوالة (تسديد)
 */
function markTransferAsPaid(transactionId) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Transfers_Tracking');
    
    if (!sheet) {
      return false;
    }
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][5] === transactionId) {  // Transaction ID column
        sheet.getRange(i + 1, 5).setValue('مسدد');
        sheet.getRange(i + 1, 9).setValue(new Date());
        
        // تغيير اللون إلى رمادي
        sheet.getRange(i + 1, 1, 1, 9).setBackground('#f3f4f6');
        
        Logger.log('✅ Transfer marked as paid: ' + transactionId);
        return true;
      }
    }
    
    return false;
  } catch (e) {
    Logger.log('❌ Error marking transfer as paid: ' + e);
    return false;
  }
}

/**
 * الحصول على تقرير الحوالات
 */
function getTransfersReport() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Transfers_Tracking');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return {
        totalCreditors: 0,
        totalDebtors: 0,
        creditorAmount: 0,
        debtorAmount: 0,
        activeTransfers: 0,
        details: []
      };
    }
    
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
    
    var creditors = {};  // دائنين (لهم عندي)
    var debtors = {};    // مدينين (أنا لهم)
    var activeCount = 0;
    
    data.forEach(function(row) {
      var personName = row[1];
      var type = row[2];
      var amount = Number(row[3]) || 0;
      var status = row[4];
      
      // فقط الحوالات النشطة
      if (status === 'نشط') {
        activeCount++;
        
        if (type === 'دائن (له عندي)') {
          creditors[personName] = (creditors[personName] || 0) + amount;
        } else if (type === 'مدين (أنا له)') {
          debtors[personName] = (debtors[personName] || 0) + amount;
        }
      }
    });
    
    // حساب المجاميع
    var creditorAmount = 0;
    var debtorAmount = 0;
    
    Object.keys(creditors).forEach(function(name) {
      creditorAmount += creditors[name];
    });
    
    Object.keys(debtors).forEach(function(name) {
      debtorAmount += debtors[name];
    });
    
    return {
      totalCreditors: Object.keys(creditors).length,
      totalDebtors: Object.keys(debtors).length,
      creditorAmount: creditorAmount,
      debtorAmount: debtorAmount,
      activeTransfers: activeCount,
      creditors: creditors,
      debtors: debtors
    };
    
  } catch (e) {
    Logger.log('❌ Error getting transfers report: ' + e);
    return null;
  }
}

/**
 * إنشاء تقرير نصي للحوالات
 */
function formatTransfersReport() {
  var report = getTransfersReport();
  
  if (!report) {
    return '❌ لا يمكن الوصول إلى بيانات الحوالات';
  }
  
  var text = '📊 *تقرير الحوالات*\n';
  text += '═══════════════════\n\n';
  
  // الدائنين (لهم عندي)
  text += '🔴 *الدائنين (لهم عندي):*\n';
  text += 'عدد الأشخاص: ' + report.totalCreditors + '\n';
  text += 'المبلغ الإجمالي: ' + report.creditorAmount.toFixed(2) + ' ريال\n\n';
  
  if (report.totalCreditors > 0) {
    Object.keys(report.creditors).forEach(function(name) {
      text += '  • ' + name + ': ' + report.creditors[name].toFixed(2) + ' ريال\n';
    });
    text += '\n';
  }
  
  // المدينين (أنا لهم)
  text += '🟢 *المدينين (أنا لهم):*\n';
  text += 'عدد الأشخاص: ' + report.totalDebtors + '\n';
  text += 'المبلغ الإجمالي: ' + report.debtorAmount.toFixed(2) + ' ريال\n\n';
  
  if (report.totalDebtors > 0) {
    Object.keys(report.debtors).forEach(function(name) {
      text += '  • ' + name + ': ' + report.debtors[name].toFixed(2) + ' ريال\n';
    });
    text += '\n';
  }
  
  // الصافي
  var netAmount = report.debtorAmount - report.creditorAmount;
  text += '💰 *الصافي:* ';
  if (netAmount > 0) {
    text += '+' + netAmount.toFixed(2) + ' ريال (لصالحي)\n';
  } else if (netAmount < 0) {
    text += netAmount.toFixed(2) + ' ريال (علي)\n';
  } else {
    text += '0 ريال (متوازن)\n';
  }
  
  text += '\n📝 إجمالي الحوالات النشطة: ' + report.activeTransfers;
  
  return text;
}

/**
 * التحقق من أن المعاملة حوالة بناءً على التصنيف
 */
function isTransferTransaction(category) {
  return category === 'Transfers' || 
         category === 'حوالة' || 
         category === 'تحويل';
}
