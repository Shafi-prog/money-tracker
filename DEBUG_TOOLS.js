
/**
 * DEBUG_TOOLS.js
 * Tools for verifying system status via CLI (clasp run)
 */

/**
 * 📊 Lists all sheets, row counts, and column headers.
 * Run via: clasp run DEBUG_SHEETS_INFO
 */
function DEBUG_SHEETS_INFO() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var output = [];
  
  output.push('╔═══════════════════════════════════════════════════════════════════════╗');
  output.push('║                   📊 Project Sheets Report                            ║');
  output.push('╚═══════════════════════════════════════════════════════════════════════╝');
  
  sheets.forEach(function(sheet) {
    var name = sheet.getName();
    var id = sheet.getSheetId();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = [];
    
    if (lastCol > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    }
    
    output.push('\n📄 Sheet: [' + name + '] (ID: ' + id + ')');
    output.push('   Stats: ' + lastRow + ' rows, ' + lastCol + ' columns');
    output.push('   Headers: ' + JSON.stringify(headers));
  });
  
  console.log(output.join('\n'));
  return output.join('\n');
}

/**
 * 📤 Checks Telegram Webhook Status and simulates a command.
 * Run via: clasp run DEBUG_TELEGRAM_STATUS
 */
function DEBUG_TELEGRAM_STATUS() {
  var token = (typeof ENV !== 'undefined' && ENV.TELEGRAM_TOKEN) ? ENV.TELEGRAM_TOKEN : PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) throw new Error('No TELEGRAM_BOT_TOKEN found in ENV or ScriptProperties.');
  
  var response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getWebhookInfo');
  Logger.log('Webhook Info: ' + response.getContentText());
  
  var me = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getMe');
  Logger.log('Bot Info: ' + me.getContentText());
  
  return JSON.parse(response.getContentText());
}

/**
 * 🚀 Wrapper to run the Master Test Suite
 * Run via: clasp run RUN_MASTER_TESTS
 */
function DEBUG_RUN_TESTS() {
  if (typeof RUN_MASTER_TESTS === 'function') {
    return RUN_MASTER_TESTS();
  } else {
    throw new Error('RUN_MASTER_TESTS function not found!');
  }
}
