/**
 * Diagnostic Test - Run this to verify system status
 */
function testDashboardData() {
  var results = {
    timestamp: new Date(),
    transactions: {},
    budgets: {},
    settings: {},
    sheets: {}
  };
  
  try {
    // Check if sheets exist
    var ss = _ss();
    results.sheets.Sheet1 = ss.getSheetByName('Sheet1') ? 'EXISTS' : 'MISSING';
    results.sheets.Budgets = ss.getSheetByName('Budgets') ? 'EXISTS' : 'MISSING';
    results.sheets.Config = ss.getSheetByName('Config') ? 'EXISTS' : 'MISSING';
    results.sheets.Classifier_Map = ss.getSheetByName('Classifier_Map') ? 'EXISTS' : 'MISSING';
    
    // Check Sheet1 data
    if (ss.getSheetByName('Sheet1')) {
      var s1 = ss.getSheetByName('Sheet1');
      var lastRow = s1.getLastRow();
      results.transactions.totalRows = lastRow;
      results.transactions.dataRows = Math.max(0, lastRow - 1);
      
      if (lastRow > 1) {
        var sampleData = s1.getRange(2, 1, Math.min(3, lastRow - 1), 13).getValues();
        results.transactions.samples = sampleData.map(function(r) {
          return {
            date: r[1],
            amount: r[8],
            merchant: r[9],
            category: r[10]
          };
        });
      }
    }
    
    // Test transactions API
    try {
      var transactions = SOV1_UI_getLatest_('OPEN', 10);
      results.transactions.apiCount = transactions.length;
      results.transactions.apiWorking = true;
    } catch (e) {
      results.transactions.apiError = e.message;
      results.transactions.apiWorking = false;
    }
    
    // Check Budgets data
    if (ss.getSheetByName('Budgets')) {
      var sb = ss.getSheetByName('Budgets');
      var lastRow = sb.getLastRow();
      results.budgets.totalRows = lastRow;
      results.budgets.dataRows = Math.max(0, lastRow - 1);
      
      if (lastRow > 1) {
        var budgetData = sb.getRange(2, 1, lastRow - 1, 4).getValues();
        results.budgets.list = budgetData.map(function(r) {
          return {
            category: r[0],
            limit: r[1],
            spent: r[2],
            remaining: r[3]
          };
        }).filter(function(b) { return b.category; });
      }
    }
    
    // Test budgets API
    try {
      var budgets = SOV1_UI_getBudgets_('OPEN');
      results.budgets.apiCount = budgets.length;
      results.budgets.apiWorking = true;
    } catch (e) {
      results.budgets.apiError = e.message;
      results.budgets.apiWorking = false;
    }
    
    // Test settings
    try {
      var settings = getSettings();
      results.settings.apiWorking = true;
      results.settings.success = settings.success;
      
      if (settings.settings) {
        results.settings.user_name = settings.settings.user_name || 'EMPTY';
        results.settings.user_email = settings.settings.user_email || 'EMPTY';
        results.settings.salary_day = settings.settings.salary_day;
        results.settings.telegram_notifications = settings.settings.telegram_notifications;
        results.settings.budget_alerts = settings.settings.budget_alerts;
      }
      
      // Check Config sheet directly
      if (ss.getSheetByName('Config')) {
        var config = ss.getSheetByName('Config');
        results.settings.config_B2 = config.getRange('B2').getValue() || 'EMPTY';
        results.settings.config_C2 = config.getRange('C2').getValue() || 'EMPTY';
        results.settings.config_F2 = config.getRange('F2').getValue() || 'EMPTY';
        results.settings.config_I2 = config.getRange('I2').getValue() || 'EMPTY';
        results.settings.config_J2 = config.getRange('J2').getValue() || 'EMPTY';
      }
    } catch (e) {
      results.settings.apiError = e.message;
      results.settings.apiWorking = false;
    }
    
    // Test full dashboard API
    try {
      var dashboardData = SOV1_UI_getAllDashboardData('OPEN');
      results.dashboard = {
        success: dashboardData.success || false,
        transactionsCount: (dashboardData.transactions || []).length,
        budgetsCount: (dashboardData.budgets || []).length,
        hasKPI: !!(dashboardData.dashboard && dashboardData.dashboard.kpi)
      };
    } catch (e) {
      results.dashboard = { error: e.message };
    }
    
  } catch (e) {
    results.error = e.message;
    results.stack = e.stack;
  }
  
  // Log detailed results
  Logger.log('=== DIAGNOSTIC TEST RESULTS ===');
  Logger.log(JSON.stringify(results, null, 2));
  
  return results;
}

/**
 * Quick fix: Add sample data if sheets are empty
 */
function addSampleData() {
  var ss = _ss();
  
  // Add sample transaction
  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() < 2) {
    var now = new Date();
    s1.appendRow([
      Utilities.getUuid(),
      now,
      'test-source',
      '',
      '',
      '',
      '',
      '',
      100.00,
      'متجر تجريبي',
      'طعام',
      'مشتريات',
      'تجربة نظام'
    ]);
    Logger.log('✅ Added sample transaction');
  }
  
  // Add sample budget
  var sb = ss.getSheetByName('Budgets');
  if (sb && sb.getLastRow() < 2) {
    sb.appendRow(['طعام', 1000, 0, 1000, 0, 80, 'OK']);
    Logger.log('✅ Added sample budget');
  }
  
  return { success: true, message: 'Sample data added' };
}
