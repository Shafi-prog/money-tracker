/**
 * RTL_SUPPORT.js
 * إضافة دعم RTL لجميع أوراق Google Sheets
 * RTL (Right-to-Left) support for all sheets
 */

/**
 * تطبيق RTL على جميع الأوراق
 */
function applyRTLToAllSheets() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) {
      throw new Error('SHEET_ID not found');
    }
    
    var ss = SpreadsheetApp.openById(sheetId);
    var sheets = ss.getSheets();
    var count = 0;
    
    Logger.log('بدء تطبيق RTL على جميع الأوراق...\n');
    
    sheets.forEach(function(sheet) {
      var sheetName = sheet.getName();
      
      try {
        // تطبيق RTL
        sheet.setRightToLeft(true);
        
        // تنسيق إضافي للرؤوس
        if (sheet.getLastRow() > 0) {
          var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
          headerRange.setHorizontalAlignment('center');
          headerRange.setFontWeight('bold');
          
          // تلوين الرأس إذا لم يكن ملون
          var currentBg = headerRange.getBackground();
          if (currentBg === '#ffffff' || currentBg === '#fff') {
            headerRange.setBackground('#667eea');
            headerRange.setFontColor('#ffffff');
          }
        }
        
        Logger.log('✅ ' + sheetName);
        count++;
      } catch (e) {
        Logger.log('❌ خطأ في ' + sheetName + ': ' + e);
      }
    });
    
    Logger.log('\n═══════════════════');
    Logger.log('✅ تم تطبيق RTL على ' + count + ' ورقة');
    Logger.log('═══════════════════');
    
    return count;
  } catch (e) {
    Logger.log('❌ خطأ عام: ' + e);
    return 0;
  }
}

/**
 * تطبيق RTL على ورقة معينة
 */
function applyRTLToSheet(sheetName) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      Logger.log('❌ الورقة غير موجودة: ' + sheetName);
      return false;
    }
    
    sheet.setRightToLeft(true);
    Logger.log('✅ تم تطبيق RTL على: ' + sheetName);
    return true;
  } catch (e) {
    Logger.log('❌ خطأ: ' + e);
    return false;
  }
}

/**
 * تنسيق شامل لجميع الأوراق
 */
function formatAllSheets() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheets = ss.getSheets();
    
    Logger.log('بدء التنسيق الشامل...\n');
    
    sheets.forEach(function(sheet) {
      var sheetName = sheet.getName();
      
      try {
        // 1. RTL
        sheet.setRightToLeft(true);
        
        // 2. تجميد الصف الأول
        sheet.setFrozenRows(1);
        
        // 3. تنسيق الرأس
        if (sheet.getLastRow() > 0) {
          var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
          headerRange.setBackground('#667eea');
          headerRange.setFontColor('#ffffff');
          headerRange.setFontWeight('bold');
          headerRange.setHorizontalAlignment('center');
          headerRange.setVerticalAlignment('middle');
        }
        
        // 4. إضافة حدود
        if (sheet.getLastRow() > 0 && sheet.getLastColumn() > 0) {
          var dataRange = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
          dataRange.setBorder(
            true, true, true, true, true, true,
            '#e0e0e0', SpreadsheetApp.BorderStyle.SOLID
          );
        }
        
        // 5. تنسيق خاص حسب الورقة
        formatSheetSpecific_(sheet);
        
        Logger.log('✅ ' + sheetName + ' - منسقة');
      } catch (e) {
        Logger.log('⚠️ ' + sheetName + ' - تحذير: ' + e);
      }
    });
    
    Logger.log('\n✅ تم تنسيق جميع الأوراق');
    return true;
  } catch (e) {
    Logger.log('❌ خطأ: ' + e);
    return false;
  }
}

/**
 * تنسيق خاص لكل ورقة
 */
function formatSheetSpecific_(sheet) {
  var sheetName = sheet.getName();
  
  switch(sheetName) {
    case 'User_USER1':
    case 'Sheet1':
      // تنسيق ورقة المعاملات
      if (sheet.getLastRow() > 1) {
        // عمود المبلغ - محاذاة يسار
        var amountCol = 4; // عمود Amount
        sheet.getRange(2, amountCol, sheet.getLastRow() - 1, 1)
          .setNumberFormat('#,##0.00 "ريال"')
          .setHorizontalAlignment('right');
      }
      break;
      
    case 'Budgets':
      // تنسيق الميزانيات مع ألوان
      if (sheet.getLastRow() > 1) {
        var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
        data.forEach(function(row, index) {
          var budgeted = Number(row[1]) || 0;
          var spent = Number(row[2]) || 0;
          var percentage = budgeted > 0 ? (spent / budgeted * 100) : 0;
          
          var rowNum = index + 2;
          var rowRange = sheet.getRange(rowNum, 1, 1, 3);
          
          if (percentage >= 100) {
            rowRange.setBackground('#fee2e2'); // أحمر فاتح
          } else if (percentage >= 80) {
            rowRange.setBackground('#fef3c7'); // أصفر فاتح
          } else if (percentage >= 50) {
            rowRange.setBackground('#fff7ed'); // برتقالي فاتح
          }
        });
      }
      break;
      
    case 'Transfers_Tracking':
      // تنسيق الحوالات
      if (sheet.getLastRow() > 1) {
        var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
        data.forEach(function(row, index) {
          var type = row[2];
          var status = row[4];
          var rowNum = index + 2;
          var rowRange = sheet.getRange(rowNum, 1, 1, 9);
          
          if (status === 'مسدد') {
            rowRange.setBackground('#f3f4f6'); // رمادي
            rowRange.setFontColor('#9ca3af');
          } else if (type === 'دائن (له عندي)') {
            rowRange.setBackground('#fee2e2'); // أحمر فاتح
          } else if (type === 'مدين (أنا له)') {
            rowRange.setBackground('#d1fae5'); // أخضر فاتح
          }
        });
      }
      break;
      
    case 'Account_Registry':
      // تنسيق الحسابات - تجميع حسب البنك
      if (sheet.getLastRow() > 1) {
        var colors = {
          'STC Bank': '#dbeafe',
          'tiqmo': '#fce7f3',
          'AlrajhiBank': '#dcfce7',
          'D360 Bank': '#fef3c7'
        };
        
        var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
        data.forEach(function(row, index) {
          var bank = row[2];
          if (colors[bank]) {
            sheet.getRange(index + 2, 1, 1, sheet.getLastColumn()).setBackground(colors[bank]);
          }
        });
      }
      break;
  }
}

/**
 * تحديث تنسيق الأوراق تلقائياً
 */
function autoFormatSheets() {
  Logger.log('⏰ بدء التنسيق التلقائي...');
  
  var result = {
    rtl: applyRTLToAllSheets(),
    formatted: formatAllSheets()
  };
  
  Logger.log('\n✅ اكتمل التنسيق التلقائي');
  Logger.log('RTL: ' + result.rtl + ' ورقة');
  
  return result;
}
