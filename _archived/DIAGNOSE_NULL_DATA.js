/**
 * DIAGNOSTIC: Check Script Properties and ENV
 * Run this in Apps Script Editor to diagnose the null data issue
 */
function DIAGNOSE_SHEET_ID_ISSUE() {
  Logger.log('=== DIAGNOSTIC REPORT ===\n');
  
  // 1. Check Script Properties
  Logger.log('1. Script Properties:');
  var props = PropertiesService.getScriptProperties().getProperties();
  Logger.log(JSON.stringify(props, null, 2));
  Logger.log('');
  
  // 2. Check if SHEET_ID exists
  Logger.log('2. SHEET_ID Check:');
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (sheetId) {
    Logger.log('✅ SHEET_ID found: ' + sheetId);
  } else {
    Logger.log('❌ SHEET_ID NOT FOUND in Script Properties!');
    Logger.log('   Run setupSpreadsheetID() to fix this.');
  }
  Logger.log('');
  
  // 3. Check ENV.SHEET_ID
  Logger.log('3. ENV.SHEET_ID:');
  try {
    Logger.log('ENV.SHEET_ID = ' + ENV.SHEET_ID);
    if (!ENV.SHEET_ID || ENV.SHEET_ID === '') {
      Logger.log('❌ ENV.SHEET_ID is empty!');
    } else {
      Logger.log('✅ ENV.SHEET_ID is set');
    }
  } catch (e) {
    Logger.log('❌ Error accessing ENV: ' + e.message);
  }
  Logger.log('');
  
  // 4. Test _ss() function
  Logger.log('4. Testing _ss() function:');
  try {
    var ss = _ss();
    Logger.log('✅ _ss() works!');
    Logger.log('   Sheet Name: ' + ss.getName());
    Logger.log('   Sheet ID: ' + ss.getId());
    Logger.log('   Number of sheets: ' + ss.getSheets().length);
  } catch (e) {
    Logger.log('❌ _ss() failed: ' + e.message);
    Logger.log('   Stack: ' + e.stack);
  }
  Logger.log('');
  
  // 5. Test SOV1_UI_getAllDashboardData
  Logger.log('5. Testing SOV1_UI_getAllDashboardData:');
  try {
    var result = SOV1_UI_getAllDashboardData('OPEN');
    Logger.log('Result success: ' + result.success);
    Logger.log('Result error: ' + result.error);
    Logger.log('Transactions count: ' + (result.transactions ? result.transactions.length : 'null'));
    Logger.log('Budgets count: ' + (result.budgets ? result.budgets.length : 'null'));
    Logger.log('');
    Logger.log('Debug Log:');
    if (result.debugLog) {
      result.debugLog.forEach(function(log) {
        Logger.log('  ' + log);
      });
    }
  } catch (e) {
    Logger.log('❌ Function failed: ' + e.message);
    Logger.log('   Stack: ' + e.stack);
  }
  Logger.log('');
  
  Logger.log('=== END DIAGNOSTIC ===');
}

/**
 * Quick fix: Set SHEET_ID if missing
 */
function FIX_SHEET_ID() {
  var sheetId = '1-_yM5c7bt2ALoSnpDfO1yBhqqof8tyAZv5JlsYxUZ0A';
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', sheetId);
  Logger.log('✅ SHEET_ID set to: ' + sheetId);
  Logger.log('Now test the web app again.');
}
