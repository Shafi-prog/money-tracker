/**
 * Test the Web App API by calling it directly
 * Run this to verify the deployment works
 */
function testWebAppAPI() {
  Logger.log('========================================');
  Logger.log('🧪 Testing Web App API - Version 95');
  Logger.log('========================================');
  
  try {
    // Test 1: Call SOV1_UI_getAllDashboardData directly
    Logger.log('\n📊 Test 1: Direct API Call');
    var result = SOV1_UI_getAllDashboardData('OPEN');
    
    Logger.log('Result Type: ' + typeof result);
    Logger.log('Is Null: ' + (result === null));
    Logger.log('Is Undefined: ' + (result === undefined));
    
    if (result) {
      Logger.log('✅ API returned data');
      Logger.log('Success: ' + result.success);
      
      if (result.debugLog) {
        Logger.log('\n📋 Debug Log:');
        result.debugLog.forEach(function(log) {
          Logger.log('  ' + log);
        });
      }
      
      Logger.log('\n📊 Data Summary:');
      Logger.log('  Transactions: ' + (result.transactions ? result.transactions.length : 'null'));
      Logger.log('  Budgets: ' + (result.budgets ? result.budgets.length : 'null'));
      Logger.log('  Dashboard: ' + (result.dashboard ? 'OK' : 'null'));
      
      if (result.dashboard && result.dashboard.kpi) {
        Logger.log('  KPI Income: ' + result.dashboard.kpi.incomeM);
        Logger.log('  KPI Spend: ' + result.dashboard.kpi.spendM);
      }
      
    } else {
      Logger.log('❌ API returned NULL or UNDEFINED');
    }
    
    // Test 2: Call doGet to simulate web app request
    Logger.log('\n📱 Test 2: Simulate Web App Request (doGet)');
    var mockRequest = { parameter: {} };
    var htmlOutput = doGet(mockRequest);
    
    Logger.log('doGet returned: ' + typeof htmlOutput);
    Logger.log('Is HtmlOutput: ' + (htmlOutput && htmlOutput.getContent));
    
    if (htmlOutput && htmlOutput.getContent) {
      var content = htmlOutput.getContent();
      Logger.log('HTML Length: ' + content.length + ' characters');
      Logger.log('Contains Alpine.js: ' + content.indexOf('Alpine') > -1);
      Logger.log('Contains refreshData: ' + content.indexOf('refreshData') > -1);
    }
    
    // Test 3: Check Config sheet
    Logger.log('\n⚙️ Test 3: Config Sheet Check');
    var ss = _ss();
    var config = ss.getSheetByName('Config');
    
    if (config) {
      Logger.log('✅ Config sheet exists');
      Logger.log('  Rows: ' + config.getLastRow());
      if (config.getLastRow() >= 2) {
        Logger.log('  Name: ' + config.getRange('B2').getValue());
        Logger.log('  Email: ' + config.getRange('C2').getValue());
        Logger.log('  Currency: ' + config.getRange('D2').getValue());
      }
    } else {
      Logger.log('❌ Config sheet missing - will auto-create on getSettings()');
    }
    
    Logger.log('\n========================================');
    Logger.log('✅ TEST COMPLETE');
    Logger.log('========================================');
    
    return {
      success: true,
      apiWorks: result !== null,
      configExists: config !== null,
      transactionCount: result && result.transactions ? result.transactions.length : 0
    };
    
  } catch (e) {
    Logger.log('\n❌❌❌ ERROR ❌❌❌');
    Logger.log('Error: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    Logger.log('========================================');
    
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Quick test to verify basic functionality
 */
function quickTest() {
  Logger.log('🔍 Quick Test Started...');
  
  try {
    // Test authentication
    var authResult = SOV1_UI_requireAuth_('OPEN');
    Logger.log('Auth: ' + authResult);
    
    // Test getting settings (will auto-create Config if missing)
    var settings = getSettings();
    Logger.log('Settings: ' + JSON.stringify(settings).substring(0, 100));
    
    // Test getting dashboard data
    var data = SOV1_UI_getAllDashboardData('OPEN');
    Logger.log('Data received: ' + (data !== null));
    Logger.log('Data success: ' + (data && data.success));
    
    Logger.log('✅ Quick test passed!');
    
  } catch (e) {
    Logger.log('❌ Quick test failed: ' + e.message);
  }
}
