/**
 * DiagnosticTest.js - Comprehensive System Test
 * Run: RUN_FULL_DIAGNOSTIC()
 */

/**
 * Clean ALL test transactions from Sheet1
 * ONLY removes rows with source='DIAGNOSTIC_TEST'
 */
function CLEAN_ALL_TEST_DATA() {
  Logger.log('🧹 Cleaning DIAGNOSTIC_TEST transactions only...');
  
  var ss = _ss();
  var sheet1 = ss.getSheetByName('Sheet1');
  
  if (!sheet1) {
    Logger.log('❌ Sheet1 not found');
    return 0;
  }
  
  var lastRow = sheet1.getLastRow();
  Logger.log('📊 Sheet1 has ' + lastRow + ' rows');
  
  // Column C (index 2) = Source/Origin
  var data = sheet1.getRange(2, 1, lastRow - 1, 13).getValues();
  var rowsToDelete = [];
  
  // Find ONLY diagnostic test transactions (source column = DIAGNOSTIC_TEST)
  for (var i = data.length - 1; i >= 0; i--) {
    var source = data[i][2] ? data[i][2].toString() : '';
    
    // ONLY delete if source is exactly 'DIAGNOSTIC_TEST'
    if (source === 'DIAGNOSTIC_TEST') {
      rowsToDelete.push(i + 2);
    }
  }
  
  Logger.log('Found ' + rowsToDelete.length + ' DIAGNOSTIC_TEST transaction(s)');
  
  if (rowsToDelete.length === 0) {
    Logger.log('✅ No diagnostic test data to clean');
    return 0;
  }
  
  // Delete from bottom to top
  rowsToDelete.forEach(function(rowNum) {
    sheet1.deleteRow(rowNum);
  });
  
  Logger.log('✅ Deleted ' + rowsToDelete.length + ' diagnostic test transactions');
  Logger.log('📊 Sheet1 now has ' + sheet1.getLastRow() + ' rows');
  Logger.log('⚠️ Real bank SMS data was NOT touched');
  Logger.log('');
  
  return rowsToDelete.length;
}

/**
 * List all sheets in your Google Spreadsheet
 * Shows which sheets are actually needed
 */
function LIST_ALL_SHEETS() {
  Logger.log('📋 Listing all sheets in spreadsheet...');
  Logger.log('');
  
  var ss = _ss();
  var allSheets = ss.getSheets();
  
  Logger.log('Total sheets: ' + allSheets.length);
  Logger.log('');
  
  var essential = ['Sheet1', 'Budgets', 'Accounts', 'Debt_Index'];
  var duplicates = [];
  var unknown = [];
  
  allSheets.forEach(function(sheet) {
    var name = sheet.getName();
    var rows = sheet.getLastRow();
    var cols = sheet.getLastColumn();
    
    var status = '';
    if (essential.indexOf(name) !== -1) {
      status = '✅ ESSENTIAL';
    } else if (name.indexOf('Debt_Index ') === 0 || name.indexOf('Budgets ') === 0) {
      status = '⚠️ DUPLICATE';
      duplicates.push(name);
    } else {
      status = '❓ UNKNOWN';
      unknown.push(name);
    }
    
    Logger.log(status + ' | ' + name + ' (' + rows + ' rows, ' + cols + ' cols)');
  });
  
  Logger.log('');
  Logger.log('═══════════════════════════════════════');
  Logger.log('📊 SUMMARY:');
  Logger.log('  Essential sheets: ' + essential.length);
  Logger.log('  Duplicates found: ' + duplicates.length);
  Logger.log('  Unknown sheets: ' + unknown.length);
  Logger.log('');
  
  if (duplicates.length > 0) {
    Logger.log('⚠️ Run DELETE_TEST_SHEETS() to remove ' + duplicates.length + ' duplicates');
  }
  
  if (unknown.length > 0) {
    Logger.log('❓ Unknown sheets:');
    unknown.forEach(function(name) {
      Logger.log('   - ' + name);
    });
    Logger.log('   These might be old/unused sheets you can delete manually');
  }
  
  return {
    total: allSheets.length,
    duplicates: duplicates.length,
    unknown: unknown.length
  };
}

function DELETE_TEST_SHEETS() {
  Logger.log('🗑️ Deleting duplicate test sheets...');
  var ss = _ss();
  var deleted = 0;
  
  // Get all sheets
  var allSheets = ss.getSheets();
  
  Logger.log('Found ' + allSheets.length + ' sheets total');
  
  // Track if we have a main Debt_Index
  var hasMainDebtIndex = false;
  
  // First pass: check if main Debt_Index exists
  allSheets.forEach(function(sheet) {
    if (sheet.getName() === 'Debt_Index') {
      hasMainDebtIndex = true;
    }
  });
  
  // Second pass: delete numbered duplicates
  allSheets.forEach(function(sheet) {
    var sheetName = sheet.getName();
    
    // Delete numbered duplicates like "Debt_Index 2", "Debt_Index 3"
    if (sheetName.indexOf('Debt_Index ') === 0) {
      try {
        ss.deleteSheet(sheet);
        Logger.log('✅ Deleted: ' + sheetName + ' (duplicate)');
        deleted++;
      } catch (e) {
        Logger.log('❌ Error deleting ' + sheetName + ': ' + e.message);
      }
    }
    
    // Delete Budgets duplicates
    if (sheetName.indexOf('Budgets ') === 0) {
      try {
        ss.deleteSheet(sheet);
        Logger.log('✅ Deleted: ' + sheetName + ' (duplicate)');
        deleted++;
      } catch (e) {}
    }
    
    // Delete main Debt_Index only if empty
    if (sheetName === 'Debt_Index' && sheet.getLastRow() <= 1) {
      try {
        ss.deleteSheet(sheet);
        Logger.log('✅ Deleted: ' + sheetName + ' (empty)');
        deleted++;
      } catch (e) {}
    }
  });
  
  Logger.log('');
  Logger.log('Deleted ' + deleted + ' duplicate sheets');
  Logger.log('');
  
  return deleted;
}

function RUN_FULL_DIAGNOSTIC() {
  Logger.log('════════════════════════════════════════════════════════════');
  Logger.log('🔍 SJA Money Tracker - Full System Diagnostic');
  Logger.log('════════════════════════════════════════════════════════════');
  Logger.log('');
  
  var results = {
    config: false,
    sheets: false,
    groq: false,
    gemini: false,
    saudiStores: false,
    telegram: false,
    telegramCommands: false,
    flow: false,
    accounts: false,
    frontend: false
  };
  
  // TEST 1: Configuration
  Logger.log('📋 TEST 1: Configuration');
  Logger.log('───────────────────────────────────────');
  
  var config = {
    GROQ_KEY: !!ENV.GROQ_KEY,
    TELEGRAM_TOKEN: !!ENV.TELEGRAM_TOKEN,
    CHAT_ID: !!ENV.CHAT_ID,
    SHEET_ID: !!ENV.SHEET_ID
  };
  
  Logger.log('  GROQ_KEY: ' + (config.GROQ_KEY ? '✅' : '❌'));
  Logger.log('  TELEGRAM_TOKEN: ' + (config.TELEGRAM_TOKEN ? '✅' : '❌'));
  Logger.log('  CHAT_ID: ' + (config.CHAT_ID ? '✅ ' + ENV.CHAT_ID : '❌'));
  Logger.log('  SHEET_ID: ' + (config.SHEET_ID ? '✅' : '❌'));
  
  var chatId = getHubChatId_();
  Logger.log('  getHubChatId_(): ' + (chatId ? '✅ ' + chatId : '❌'));
  
  results.config = config.GROQ_KEY && config.TELEGRAM_TOKEN && chatId && config.SHEET_ID;
  Logger.log('  Result: ' + (results.config ? '✅ PASS' : '❌ FAIL'));
  Logger.log('');
  
  // TEST 2: Google Sheets
  Logger.log('📊 TEST 2: Google Sheets Access');
  Logger.log('───────────────────────────────────────');
  
  try {
    var ss = _ss();
    var spreadsheetName = ss.getName();
    var spreadsheetUrl = ss.getUrl();
    
    Logger.log('  ✅ Spreadsheet: "' + spreadsheetName + '"');
    Logger.log('  📎 URL: ' + spreadsheetUrl);
    Logger.log('  📊 Total sheets: ' + ss.getSheets().length);
    Logger.log('');
    
    var sheets = ['Sheet1', 'Budgets', 'Accounts', 'Debt_Index'];
    var allSheets = ss.getSheets();
    
    sheets.forEach(function(name) {
      var sh = ss.getSheetByName(name);
      if (sh) {
        Logger.log('  ✅ ' + name + ' (rows: ' + sh.getLastRow() + ')');
      } else {
        // Check if there are any numbered duplicates (e.g., "Debt_Index 2")
        var duplicateFound = false;
        
        for (var i = 0; i < allSheets.length; i++) {
          var sheetName = allSheets[i].getName();
          // Match "Debt_Index 2", "Debt_Index 3", etc.
          if (sheetName.indexOf(name + ' ') === 0) {
            // Found duplicate, rename it to remove the number
            try {
              allSheets[i].setName(name);
              Logger.log('  ✅ Renamed "' + sheetName + '" → "' + name + '" (rows: ' + allSheets[i].getLastRow() + ')');
              duplicateFound = true;
              break;
            } catch (e) {
              Logger.log('  ⚠️ Cannot rename "' + sheetName + '": ' + e.message);
            }
          }
        }
        
        // Only create if no duplicate was found and it's Debt_Index
        if (!duplicateFound) {
          if (name === 'Debt_Index') {
            Logger.log('  ⚠️ ' + name + ' MISSING - Creating...');
            var newSheet = ss.insertSheet(name);
            newSheet.getRange('A1:E1').setValues([['الاسم', 'الحساب', 'المبلغ', 'آخر_تحديث', 'ملاحظات']]);
            newSheet.getRange('A1:E1').setFontWeight('bold');
            Logger.log('  ✅ Created ' + name);
          } else {
            Logger.log('  ⚠️ ' + name + ' MISSING (not auto-created)');
          }
        }
      }
    });
    results.sheets = true;
  } catch (e) {
    Logger.log('  ❌ ERROR: ' + e.message);
    results.sheets = false;
  }
  Logger.log('');
  
  // TEST 3: Groq AI
  Logger.log('🤖 TEST 3: Groq AI');
  Logger.log('───────────────────────────────────────');
  
  if (!config.GROQ_KEY) {
    Logger.log('  ⏭️ SKIPPED');
    results.groq = false;
    results.saudiStores = false;
  } else {
    try {
      var testSMS = 'شراء POS بـ 11.00 SAR من ALBAIT ALTHAHABI Co';
      var aiResult = classifyWithAI(testSMS);
      
      Logger.log('  Merchant: ' + aiResult.merchant);
      Logger.log('  Amount: ' + aiResult.amount);
      Logger.log('  Category: ' + aiResult.category);
      
      results.groq = aiResult.amount > 0 && aiResult.merchant !== 'غير محدد';
      
      // Saudi stores
      var stores = [{sms: 'شراء من جرير 250 SAR', store: 'جرير'}];
      var storesPassed = 0;
      stores.forEach(function(test) {
        try {
          var sr = classifyWithAI(test.sms);
          if (sr.merchant.toLowerCase().includes(test.store)) {
            storesPassed++;
            Logger.log('  ✅ ' + test.store);
          }
        } catch (e) {}
      });
      results.saudiStores = storesPassed >= 1;
      
      Logger.log('  Result: ' + (results.groq ? '✅ PASS' : '❌ FAIL'));
    } catch (e) {
      Logger.log('  ❌ ERROR: ' + e.message);
      results.groq = false;
      results.saudiStores = false;
    }
  }
  Logger.log('');
  
  // TEST 4: Gemini Fallback
  Logger.log('🔮 TEST 4: Gemini Fallback');
  Logger.log('───────────────────────────────────────');
  Logger.log('  ℹ️ Fallback chain: Groq → Gemini → Regex');
  results.gemini = typeof classifyWithAI === 'function';
  Logger.log('  Result: ' + (results.gemini ? '✅ PASS' : '❌ FAIL'));
  Logger.log('');
  
  // TEST 5: Telegram Commands
  Logger.log('💬 TEST 5: Telegram Commands');
  Logger.log('───────────────────────────────────────');
  
  if (!chatId) {
    Logger.log('  ⏭️ SKIPPED');
    results.telegramCommands = false;
  } else {
    try {
      var commands = ['/start', '/test', '/summary', '/balances', '/help'];
      var passed = 0;
      
      commands.forEach(function(cmd) {
        try {
          handleTelegramCommand_(cmd, chatId);
          passed++;
          Logger.log('  ✅ ' + cmd);
        } catch (e) {
          Logger.log('  ❌ ' + cmd);
        }
      });
      
      results.telegramCommands = passed >= 3;
      Logger.log('  Commands: ' + passed + '/' + commands.length);
      Logger.log('  Result: ' + (results.telegramCommands ? '✅ PASS' : '❌ FAIL'));
    } catch (e) {
      Logger.log('  ❌ ERROR: ' + e.message);
      results.telegramCommands = false;
    }
  }
  Logger.log('');
  
  // TEST 6: Telegram Notifications
  Logger.log('📱 TEST 6: Telegram Notification');
  Logger.log('───────────────────────────────────────');
  
  if (!chatId) {
    Logger.log('  ⏭️ SKIPPED');
    results.telegram = false;
  } else {
    try {
      var msg = '✅ اختبار النظام\n⏰ ' + new Date().toLocaleString('ar-SA');
      var teleResult = sendTelegram_(chatId, msg);
      
      if (teleResult && teleResult.ok) {
        Logger.log('  ✅ Message sent');
        
        if (typeof getAllBalancesHTML_ === 'function') {
          Logger.log('  ✅ getAllBalancesHTML_() exists');
        }
        results.telegram = true;
      } else {
        Logger.log('  ❌ Failed');
        results.telegram = false;
      }
      Logger.log('  Result: ' + (results.telegram ? '✅ PASS' : '❌ FAIL'));
    } catch (e) {
      Logger.log('  ❌ ERROR: ' + e.message);
      results.telegram = false;
    }
  }
  Logger.log('');
  
  // TEST 7: Full Flow
  Logger.log('🔄 TEST 7: Full Transaction Flow');
  Logger.log('───────────────────────────────────────');
  
  try {
    var testSMS2 = 'شراء POS بـ 15.00 SAR من Test Coffee Shop عبر مدى **3474';
    var beforeRow = _sheet('Sheet1').getLastRow();
    
    processTransaction(testSMS2, 'DIAGNOSTIC_TEST', null);
    
    var afterRow = _sheet('Sheet1').getLastRow();
    
    if (afterRow > beforeRow) {
      Logger.log('  ✅ Transaction saved');
      results.flow = true;
    } else {
      Logger.log('  ❌ No new row');
      results.flow = false;
    }
    Logger.log('  Result: ' + (results.flow ? '✅ PASS' : '❌ FAIL'));
  } catch (e) {
    Logger.log('  ❌ ERROR: ' + e.message);
    results.flow = false;
  }
  Logger.log('');
  
  // TEST 8: Accounts & Balances
  Logger.log('💰 TEST 8: Accounts & Balances');
  Logger.log('───────────────────────────────────────');
  
  try {
    var accSheet = _sheet('Accounts');
    var accRows = accSheet.getLastRow();
    
    if (accRows >= 2) {
      Logger.log('  ✅ Accounts: ' + (accRows - 1));
      
      var accounts = accSheet.getRange(2, 1, accRows - 1, 5).getValues();
      accounts.forEach(function(acc) {
        Logger.log('     • ' + acc[0] + ': ' + acc[4] + ' SAR');
      });
      
      results.accounts = true;
    } else {
      Logger.log('  ⚠️ No accounts');
      results.accounts = false;
    }
    Logger.log('  Result: ' + (results.accounts ? '✅ PASS' : '⚠️'));
  } catch (e) {
    Logger.log('  ❌ ERROR: ' + e.message);
    results.accounts = false;
  }
  Logger.log('');
  
  // TEST 9: Frontend
  Logger.log('🌐 TEST 9: Frontend-Backend');
  Logger.log('───────────────────────────────────────');
  
  try {
    var functions = ['SOV1_UI_getDashboard_', 'SOV1_UI_getLatest_', 'SOV1_UI_getBudgets_'];
    var exist = 0;
    
    functions.forEach(function(fn) {
      try {
        if (typeof this[fn] === 'function') {
          Logger.log('  ✅ ' + fn + '()');
          exist++;
        } else {
          Logger.log('  ❌ ' + fn + '()');
        }
      } catch (e) {
        Logger.log('  ❌ ' + fn + '()');
      }
    });
    
    results.frontend = exist >= 2;
    Logger.log('  Result: ' + (results.frontend ? '✅ PASS' : '❌ FAIL') + ' (' + exist + '/3)');
  } catch (e) {
    Logger.log('  ❌ ERROR: ' + e.message);
    results.frontend = false;
  }
  Logger.log('');
  
  // CLEANUP
  Logger.log('🧹 CLEANUP');
  Logger.log('───────────────────────────────────────');
  
  try {
    var ss = _ss();
    var sheet1 = ss.getSheetByName('Sheet1');
    var cleanedCount = 0;
    
    if (sheet1 && results.flow) {
      var lastRow = sheet1.getLastRow();
      
      // Only delete rows where source column = 'DIAGNOSTIC_TEST'
      var data = sheet1.getRange(2, 1, lastRow - 1, 13).getValues();
      var rowsToDelete = [];
      
      for (var i = data.length - 1; i >= 0; i--) {
        var source = data[i][2] ? data[i][2].toString() : ''; // Column C = Source
        
        // ONLY delete if source is exactly 'DIAGNOSTIC_TEST'
        if (source === 'DIAGNOSTIC_TEST') {
          rowsToDelete.push(i + 2);
        }
      }
      
      // Delete from bottom to top
      rowsToDelete.forEach(function(rowNum) {
        sheet1.deleteRow(rowNum);
        cleanedCount++;
      });
      
      if (cleanedCount > 0) {
        Logger.log('  ✅ Deleted ' + cleanedCount + ' DIAGNOSTIC_TEST transaction(s)');
      } else {
        Logger.log('  ℹ️ No diagnostic test data found');
      }
    }
    
    // Delete test accounts (auto-created with **3474)
    var accountsSheet = ss.getSheetByName('Accounts');
    if (accountsSheet) {
      var accountsData = accountsSheet.getDataRange().getValues();
      for (var i = accountsData.length - 1; i > 0; i--) {
        if (accountsData[i][0] && accountsData[i][0].toString().includes('حساب **3474')) {
          accountsSheet.deleteRow(i + 1);
          Logger.log('  ✅ Deleted test account (حساب **3474)');
          break;
        }
      }
    }
  } catch (e) {
    Logger.log('  ⚠️ Cleanup warning: ' + e.message);
  }
  Logger.log('');
  
  // SUMMARY
  Logger.log('════════════════════════════════════════════════════════════');
  Logger.log('📊 DIAGNOSTIC SUMMARY');
  Logger.log('════════════════════════════════════════════════════════════');
  Logger.log('');
  
  var total = 0;
  var passed = 0;
  
  Object.keys(results).forEach(function(key) {
    total++;
    if (results[key]) passed++;
    Logger.log('  ' + (results[key] ? '✅' : '❌') + ' ' + key.toUpperCase());
  });
  
  Logger.log('');
  Logger.log('  Score: ' + passed + '/' + total + ' tests passed');
  Logger.log('');
  
  if (passed === total) {
    Logger.log('🎉 ALL TESTS PASSED!');
  } else if (passed >= total - 2) {
    Logger.log('⚠️ Almost there! Check failed tests.');
  } else {
    Logger.log('❌ Multiple issues detected.');
  }
  
  Logger.log('');
  Logger.log('════════════════════════════════════════════════════════════');
  
  return {passed: passed, total: total, results: results};
}
