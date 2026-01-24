/**
 * ═══════════════════════════════════════════════════════════════════════
 * AUTOMATED_VALIDATION.js - Complete System Validation
 * ═══════════════════════════════════════════════════════════════════════
 * Validates EVERYTHING: Sheets, Columns, Functions, Frontend-Backend sync
 * Run: VALIDATE_COMPLETE_SYSTEM()
 * ═══════════════════════════════════════════════════════════════════════
 */

function VALIDATE_COMPLETE_SYSTEM() {
  var report = {
    timestamp: new Date(),
    sheetsValidation: {},
    functionsValidation: {},
    frontendBackendSync: {},
    criticalIssues: [],
    warnings: [],
    passed: 0,
    failed: 0
  };
  
  Logger.log('🔍 AUTOMATED SYSTEM VALIDATION\n' + '='.repeat(60));
  
  // ═══════════════════════════════════════════════════════════════════════
  // PART 1: VALIDATE SHEETS & COLUMNS
  // ═══════════════════════════════════════════════════════════════════════
  
  Logger.log('\n📊 Part 1: Validating Sheets Structure...\n');
  
  // Expected sheet structure
  var expectedSheets = {
    'Sheet1': {
      requiredColumns: ['تاريخ', 'وقت', 'مبلغ', 'تاجر', 'تصنيف', 'نوع', 'نص أصلي'],
      columnCount: 12,
      description: 'Main transaction ledger'
    },
    'Budgets': {
      requiredColumns: ['Category', 'Limit', 'Spent'],
      columnCount: 4,
      description: 'Budget tracking'
    },
    'Ingress_Queue': {
      requiredColumns: ['Timestamp', 'Text', 'Source', 'Status'],
      columnCount: 5,
      description: 'Message queue'
    },
    'Classifier_Map': {
      requiredColumns: ['Keyword', 'Category'],
      columnCount: 3,
      description: 'Classification rules'
    },
    'Dashboard': {
      requiredColumns: [],
      columnCount: -1,
      description: 'Stats dashboard'
    }
  };
  
  try {
    var ss = SpreadsheetApp.openById(ENV.SHEET_ID);
    report.sheetsValidation.spreadsheetAccess = '✅ SUCCESS';
    report.passed++;
  } catch (e) {
    report.sheetsValidation.spreadsheetAccess = '❌ FAILED: ' + e.message;
    report.criticalIssues.push('Cannot access spreadsheet. Check ENV.SHEET_ID');
    report.failed++;
    Logger.log('❌ CRITICAL: Cannot access spreadsheet!');
    return report;
  }
  
  // Check each sheet
  for (var sheetName in expectedSheets) {
    var expected = expectedSheets[sheetName];
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      report.sheetsValidation[sheetName] = '❌ MISSING';
      report.criticalIssues.push('Sheet "' + sheetName + '" does not exist');
      report.failed++;
      Logger.log('❌ Sheet missing: ' + sheetName);
      continue;
    }
    
    // Check columns
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var missingColumns = [];
    
    for (var i = 0; i < expected.requiredColumns.length; i++) {
      var requiredCol = expected.requiredColumns[i];
      if (headers.indexOf(requiredCol) === -1) {
        missingColumns.push(requiredCol);
      }
    }
    
    if (missingColumns.length > 0) {
      report.sheetsValidation[sheetName] = '⚠️ INCOMPLETE - Missing: ' + missingColumns.join(', ');
      report.warnings.push(sheetName + ' is missing columns: ' + missingColumns.join(', '));
      Logger.log('⚠️ ' + sheetName + ' missing columns: ' + missingColumns.join(', '));
    } else {
      report.sheetsValidation[sheetName] = '✅ OK (' + sheet.getLastRow() + ' rows)';
      report.passed++;
      Logger.log('✅ ' + sheetName + ': OK');
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PART 2: VALIDATE BACKEND FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  
  Logger.log('\n⚙️ Part 2: Validating Backend Functions...\n');
  
  var requiredFunctions = [
    // Core
    'doGet',
    'doPost',
    'executeUniversalFlowV120',
    
    // WebUI Functions (Frontend depends on these)
    'SOV1_UI_doGet_',
    'SOV1_UI_getDashboard_',
    'SOV1_UI_getLatest_',
    'SOV1_UI_getBudgets_',
    'SOV1_UI_addManualTransaction_',
    'SOV1_UI_saveSettings_',
    'SOV1_UI_getSettings_',
    'SOV1_UI_deleteTransaction_',
    'SOV1_UI_getReportData_',
    'SOV1_UI_getAccounts_',
    'SOV1_UI_checkConfig_',
    
    // AI & Processing
    'callAiHybridV120',
    'applyClassifierMap_',
    'syncQuadV120'
  ];
  
  for (var i = 0; i < requiredFunctions.length; i++) {
    var funcName = requiredFunctions[i];
    try {
      var func = eval('typeof ' + funcName);
      if (func === 'function') {
        report.functionsValidation[funcName] = '✅ EXISTS';
        report.passed++;
        Logger.log('✅ Function: ' + funcName);
      } else {
        report.functionsValidation[funcName] = '❌ NOT A FUNCTION';
        report.criticalIssues.push('Function ' + funcName + ' is not defined');
        report.failed++;
        Logger.log('❌ Missing: ' + funcName);
      }
    } catch (e) {
      report.functionsValidation[funcName] = '❌ ERROR: ' + e.message;
      report.criticalIssues.push('Function ' + funcName + ' error: ' + e.message);
      report.failed++;
      Logger.log('❌ Error: ' + funcName);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PART 3: TEST ACTUAL FUNCTION CALLS
  // ═══════════════════════════════════════════════════════════════════════
  
  Logger.log('\n🧪 Part 3: Testing Actual Function Calls...\n');
  
  // Test getDashboard
  try {
    var dashData = SOV1_UI_getDashboard_('OPEN');
    if (dashData && dashData.kpi) {
      report.frontendBackendSync.getDashboard = '✅ WORKS - Returns: ' + JSON.stringify(dashData.kpi);
      report.passed++;
      Logger.log('✅ getDashboard: Working');
    } else {
      report.frontendBackendSync.getDashboard = '⚠️ RETURNS EMPTY';
      report.warnings.push('getDashboard returns no data');
      Logger.log('⚠️ getDashboard: Returns empty');
    }
  } catch (e) {
    report.frontendBackendSync.getDashboard = '❌ ERROR: ' + e.message;
    report.criticalIssues.push('getDashboard fails: ' + e.message);
    report.failed++;
    Logger.log('❌ getDashboard: ' + e.message);
  }
  
  // Test getLatest
  try {
    var txns = SOV1_UI_getLatest_('OPEN', 5);
    report.frontendBackendSync.getLatest = '✅ WORKS - Returns ' + txns.length + ' transactions';
    report.passed++;
    Logger.log('✅ getLatest: ' + txns.length + ' transactions');
  } catch (e) {
    report.frontendBackendSync.getLatest = '❌ ERROR: ' + e.message;
    report.criticalIssues.push('getLatest fails: ' + e.message);
    report.failed++;
    Logger.log('❌ getLatest: ' + e.message);
  }
  
  // Test getBudgets
  try {
    var budgets = SOV1_UI_getBudgets_('OPEN');
    report.frontendBackendSync.getBudgets = '✅ WORKS - Returns ' + budgets.length + ' budgets';
    report.passed++;
    Logger.log('✅ getBudgets: ' + budgets.length + ' budgets');
  } catch (e) {
    report.frontendBackendSync.getBudgets = '❌ ERROR: ' + e.message;
    report.criticalIssues.push('getBudgets fails: ' + e.message);
    report.failed++;
    Logger.log('❌ getBudgets: ' + e.message);
  }
  
  // Test getSettings
  try {
    var settings = SOV1_UI_getSettings_();
    report.frontendBackendSync.getSettings = '✅ WORKS - Name: ' + settings.name;
    report.passed++;
    Logger.log('✅ getSettings: ' + settings.name);
  } catch (e) {
    report.frontendBackendSync.getSettings = '❌ ERROR: ' + e.message;
    report.criticalIssues.push('getSettings fails: ' + e.message);
    report.failed++;
    Logger.log('❌ getSettings: ' + e.message);
  }
  
  // Test getReportData
  try {
    var reportData = SOV1_UI_getReportData_('OPEN', 'monthly');
    if (reportData && !reportData.error) {
      report.frontendBackendSync.getReportData = '✅ WORKS - Income: ' + reportData.income + ', Expenses: ' + reportData.expenses;
      report.passed++;
      Logger.log('✅ getReportData: Working');
    } else {
      report.frontendBackendSync.getReportData = '❌ ERROR: ' + (reportData ? reportData.error : 'null');
      report.failed++;
      Logger.log('❌ getReportData: ' + (reportData ? reportData.error : 'null'));
    }
  } catch (e) {
    report.frontendBackendSync.getReportData = '❌ ERROR: ' + e.message;
    report.criticalIssues.push('getReportData fails: ' + e.message);
    report.failed++;
    Logger.log('❌ getReportData: ' + e.message);
  }
  
  // Test getAccounts
  try {
    var accounts = SOV1_UI_getAccounts_();
    report.frontendBackendSync.getAccounts = '✅ WORKS - Returns ' + accounts.length + ' accounts';
    report.passed++;
    Logger.log('✅ getAccounts: ' + accounts.length + ' accounts');
  } catch (e) {
    report.frontendBackendSync.getAccounts = '❌ ERROR: ' + e.message;
    report.failed++;
    Logger.log('❌ getAccounts: ' + e.message);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PART 4: VERIFY FRONTEND CALLS MATCH BACKEND
  // ═══════════════════════════════════════════════════════════════════════
  
  Logger.log('\n🔄 Part 4: Frontend-Backend Synchronization...\n');
  
  // Check if all frontend calls have backend handlers
  var frontendCalls = [
    'SOV1_UI_getDashboard_',
    'SOV1_UI_getLatest_',
    'SOV1_UI_getBudgets_',
    'SOV1_UI_addManualTransaction_',
    'SOV1_UI_deleteTransaction_',
    'SOV1_UI_saveSettings_',
    'SOV1_UI_getSettings_',
    'SOV1_UI_getReportData_',
    'SOV1_UI_getAccounts_',
    'SOV1_UI_checkConfig_'
  ];
  
  var syncIssues = [];
  for (var i = 0; i < frontendCalls.length; i++) {
    var funcName = frontendCalls[i];
    try {
      var func = eval('typeof ' + funcName);
      if (func !== 'function') {
        syncIssues.push(funcName + ' called by frontend but not implemented');
      }
    } catch (e) {
      syncIssues.push(funcName + ' called by frontend but throws error');
    }
  }
  
  if (syncIssues.length === 0) {
    Logger.log('✅ All frontend calls have backend handlers');
    report.passed++;
  } else {
    Logger.log('❌ Frontend-Backend sync issues: ' + syncIssues.length);
    report.criticalIssues = report.criticalIssues.concat(syncIssues);
    report.failed += syncIssues.length;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // FINAL REPORT
  // ═══════════════════════════════════════════════════════════════════════
  
  Logger.log('\n' + '='.repeat(60));
  Logger.log('📊 VALIDATION SUMMARY');
  Logger.log('='.repeat(60));
  Logger.log('✅ Passed: ' + report.passed);
  Logger.log('❌ Failed: ' + report.failed);
  Logger.log('⚠️ Warnings: ' + report.warnings.length);
  Logger.log('🔴 Critical Issues: ' + report.criticalIssues.length);
  
  if (report.criticalIssues.length > 0) {
    Logger.log('\n🔴 CRITICAL ISSUES:');
    for (var i = 0; i < report.criticalIssues.length; i++) {
      Logger.log('  ' + (i+1) + '. ' + report.criticalIssues[i]);
    }
  }
  
  if (report.warnings.length > 0) {
    Logger.log('\n⚠️ WARNINGS:');
    for (var i = 0; i < report.warnings.length; i++) {
      Logger.log('  ' + (i+1) + '. ' + report.warnings[i]);
    }
  }
  
  var successRate = Math.round((report.passed / (report.passed + report.failed)) * 100);
  Logger.log('\n📈 Success Rate: ' + successRate + '%');
  
  if (successRate >= 90) {
    Logger.log('🎉 SYSTEM STATUS: EXCELLENT - Ready for production');
  } else if (successRate >= 75) {
    Logger.log('✅ SYSTEM STATUS: GOOD - Minor fixes needed');
  } else if (successRate >= 50) {
    Logger.log('⚠️ SYSTEM STATUS: FAIR - Several issues to fix');
  } else {
    Logger.log('🔴 SYSTEM STATUS: POOR - Major issues require attention');
  }
  
  Logger.log('='.repeat(60));
  
  return report;
}

/**
 * Quick test runner
 */
function RUN_VALIDATION() {
  var report = VALIDATE_COMPLETE_SYSTEM();
  
  // Also output JSON for parsing
  Logger.log('\n📄 JSON Report:');
  Logger.log(JSON.stringify(report, null, 2));
  
  return report;
}
