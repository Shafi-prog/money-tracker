/**
 * Setup Script - Run this ONCE to configure the spreadsheet ID
 */
function setupSpreadsheetID() {
  var sheetId = '1-_yM5c7bt2ALoSnpDfO1yBhqqof8tyAZv5JlsYxUZ0A';
  
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', sheetId);
  
  Logger.log('✅ SHEET_ID configured: ' + sheetId);
  Logger.log('Testing connection...');
  
  try {
    var ss = SpreadsheetApp.openById(sheetId);
    Logger.log('✅ Connected to: ' + ss.getName());
    Logger.log('   Sheets: ' + ss.getSheets().map(function(s) { return s.getName(); }).join(', '));
    Logger.log('');
    Logger.log('🎉 Setup complete! You can now deploy the web app.');
  } catch (e) {
    Logger.log('❌ Error connecting: ' + e.message);
    Logger.log('   Make sure the sheet ID is correct and you have access.');
  }
}
