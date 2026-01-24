/**
 * Quick Debug Test - Run this function in Apps Script Editor
 * This will test SOV1_UI_getAllDashboardData and return detailed results
 */
function testDashboardAPI() {
  Logger.log('========================================');
  Logger.log('🔍 QUICK DEBUG TEST - Starting...');
  Logger.log('========================================');
  
  try {
    // Test 1: Check if SpreadsheetApp works
    Logger.log('');
    Logger.log('📊 Test 1: SpreadsheetApp Access');
    try {
      var ss = _ss();
      Logger.log('✅ SpreadsheetApp accessible');
      Logger.log('   Spreadsheet Name: ' + ss.getName());
      Logger.log('   Spreadsheet ID: ' + ss.getId());
    } catch (e) {
      Logger.log('❌ SpreadsheetApp FAILED: ' + e.message);
      return;
    }
    
    // Test 2: Check required sheets exist
    Logger.log('');
    Logger.log('📋 Test 2: Required Sheets');
    var requiredSheets = ['Sheet1', 'Budgets', 'Config', 'Accounts'];
    var sheetsStatus = {};
    
    requiredSheets.forEach(function(sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        var lastRow = sheet.getLastRow();
        sheetsStatus[sheetName] = { exists: true, rows: lastRow };
        Logger.log('✅ ' + sheetName + ' exists (rows: ' + lastRow + ')');
      } else {
        sheetsStatus[sheetName] = { exists: false, rows: 0 };
        Logger.log('❌ ' + sheetName + ' MISSING');
      }
    });
    
    // Test 3: Call the actual API function
    Logger.log('');
    Logger.log('🔷 Test 3: Calling SOV1_UI_getAllDashboardData()');
    var result = SOV1_UI_getAllDashboardData('OPEN');
    
    Logger.log('');
    Logger.log('📦 Result received:');
    Logger.log('   Success: ' + result.success);
    Logger.log('   Has Error: ' + (result.error ? 'YES' : 'NO'));
    
    if (result.error) {
      Logger.log('   ❌ Error: ' + result.error);
      if (result.errorStack) {
        Logger.log('   Stack: ' + result.errorStack);
      }
    }
    
    if (result.debugLog && Array.isArray(result.debugLog)) {
      Logger.log('');
      Logger.log('📋 Debug Log from Function:');
      result.debugLog.forEach(function(log) {
        Logger.log('   ' + log);
      });
    }
    
    Logger.log('');
    Logger.log('📊 Data Summary:');
    if (result.dashboard && result.dashboard.kpi) {
      Logger.log('   Dashboard KPI:');
      Logger.log('      Income: ' + result.dashboard.kpi.incomeM);
      Logger.log('      Spend: ' + result.dashboard.kpi.spendM);
      Logger.log('      Net: ' + result.dashboard.kpi.netM);
      Logger.log('      Remaining: ' + result.dashboard.kpi.totalRemain);
    } else {
      Logger.log('   ❌ Dashboard KPI: MISSING');
    }
    
    Logger.log('   Transactions: ' + (result.transactions ? result.transactions.length : 0));
    Logger.log('   Budgets: ' + (result.budgets ? result.budgets.length : 0));
    Logger.log('   Accounts: ' + (result.accounts ? result.accounts.length : 0));
    
    Logger.log('');
    Logger.log('========================================');
    Logger.log('✅ TEST COMPLETE');
    Logger.log('========================================');
    
    return result;
    
  } catch (e) {
    Logger.log('');
    Logger.log('❌❌❌ CRITICAL ERROR IN TEST ❌❌❌');
    Logger.log('Error: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    Logger.log('========================================');
  }
}


/**
 * Add sample data to empty sheets
 */
function addSampleDataIfEmpty() {
  Logger.log('🔧 Checking if sample data needed...');
  
  var ss = _ss();
  
  // Check Sheet1
  var sheet1 = ss.getSheetByName('Sheet1');
  if (!sheet1 || sheet1.getLastRow() < 2) {
    Logger.log('📝 Adding sample transaction to Sheet1...');
    if (!sheet1) {
      sheet1 = ss.insertSheet('Sheet1');
      // Add headers
      sheet1.getRange(1, 1, 1, 13).setValues([[
        'ID', 'التاريخ', 'Col3', 'النوع', 'Col5', 'Col6', 'الحساب', 'Col8', 'المبلغ', 
        'التاجر', 'التصنيف', 'النوع الأصلي', 'النص الأصلي'
      ]]);
    }
    
    // Add sample transaction
    var now = new Date();
    sheet1.appendRow([
      1, now, '', 'شراء', '', '', '1234', '', 100.50, 
      'متجر تجريبي', 'طعام', 'شراء', 'شراء من متجر تجريبي بمبلغ 100.50 ريال'
    ]);
    Logger.log('✅ Sample transaction added');
  } else {
    Logger.log('✅ Sheet1 has data (rows: ' + sheet1.getLastRow() + ')');
  }
  
  // Check Budgets
  var budgets = ss.getSheetByName('Budgets');
  if (!budgets || budgets.getLastRow() < 2) {
    Logger.log('💰 Adding sample budget...');
    if (!budgets) {
      budgets = ss.insertSheet('Budgets');
      budgets.getRange(1, 1, 1, 7).setValues([[
        'التصنيف', 'المخصص', 'المصروف', 'المتبقي', '٪ المستخدم', 'حد التنبيه', 'الحالة'
      ]]);
    }
    
    budgets.appendRow(['طعام', 1000, 0, 1000, 0, 80, 'آمن']);
    Logger.log('✅ Sample budget added');
  } else {
    Logger.log('✅ Budgets has data (rows: ' + budgets.getLastRow() + ')');
  }
  
  // Check Config
  var config = ss.getSheetByName('Config');
  if (!config || config.getLastRow() < 2) {
    Logger.log('⚙️ Creating Config sheet...');
    if (!config) {
      config = ss.insertSheet('Config');
      config.getRange(1, 1, 1, 10).setValues([[
        'Status', 'Name', 'Email', 'Currency', 'Language', 'Salary_Day', 
        'Notifications', 'Auto_Apply_Rules', 'Telegram_Notifications', 'Budget_Alerts'
      ]]);
    }
    
    config.getRange(2, 1, 1, 10).setValues([[
      'ACTIVE', 'Test User', 'test@example.com', 'SAR', 'ar', 1, 
      true, true, true, true
    ]]);
    Logger.log('✅ Config created');
  } else {
    Logger.log('✅ Config exists (rows: ' + config.getLastRow() + ')');
  }
  
  Logger.log('');
  Logger.log('✅ Sample data check complete!');
}
