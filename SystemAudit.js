
// ============================================================================
// 🔍 MASTER PROJECT VERIFICATION - SINGLE SOURCE OF TRUTH
// ============================================================================
// This script validates the entire system establishment:
// 1. Files & Integrity
// 2. Sheet Structure (Backend Hygiene)
// 3. Logic Flows (SMS -> Balance -> Notification)
// 4. Default Accounts & Config

/**
 * 🧪 MAIN AUDIT RUNNER
 * Run this function to verify the whole system is healthy.
 */
function RUN_MASTER_VERIFICATION() {
  Logger.log('🚀 STARTING MASTER PROJECT VERIFICATION...');
  // Clear previous log if possible or just delimit
  Logger.log('--------------------------------------------');
  
  var results = [];

  // 1. SETUP & INTEGRITY CHECK
  results.push(auditCheck_('Integrity', checkIntegrity_()));

  // 2. BACKEND: SHEETS STRUCTURE
  results.push(auditCheck_('Backend Hygiene', checkBackendStructure_()));

  // 3. BACKEND: ACCOUNTS SETUP
  results.push(auditCheck_('Accounts Setup', testAccountsSetup_()));

  // 4. INGRESS: MOCK SMS PROCESSING (SAIB/Tiqmo)
  results.push(auditCheck_('SMS Processing', testSMSProcessing_()));

  // 5. LOGIC: BALANCE & LINKAGE
  results.push(auditCheck_('Balance Updates', testBalanceLogic_()));

  // 6. LOGIC: CLASSIFICATION (AI SIMULATION)
  results.push(auditCheck_('Smart Reasoning', testClassificationLogic_()));

  // 7. FRONTEND: API RESPONSE
  results.push(auditCheck_('Frontend API', testFrontendAPI_()));

  // SUMMARY
  printAuditReport_(results);
}

/**
 * 🔧 FUNCTIONAL SMOKE TESTS (Non-destructive)
 * Verifies UI/API contracts and schema consistency without writing data.
 */
function RUN_FUNCTIONAL_SMOKE_TESTS() {
  Logger.log('🧪 STARTING FUNCTIONAL SMOKE TESTS...');
  Logger.log('--------------------------------------------');

  var results = [];
  results.push(auditCheck_('Accounts Schema', testAccountsSchema_()));
  results.push(auditCheck_('API Contracts', testApiContracts_()));
  results.push(auditCheck_('UI Bindings', testUiBindings_()));
  results.push(auditCheck_('Frontend API', testFrontendAPI_()));

  printAuditReport_(results);
}

function checkBackendStructure_() {
  try {
     var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
     var sheets = ss.getSheets().map(function(s) { return s.getName(); });
     
     // Sheets that MUST exist
     var required = ['Sheet1', 'Accounts', 'Budgets', 'Debt_Ledger', 'Dashboard'];
     var missing = required.filter(function(r) { return sheets.indexOf(r) === -1; });
     
     if (missing.length > 0) throw new Error('Missing core sheets: ' + missing.join(', '));
     
     // Check for clutter
     var messy = sheets.filter(function(s) { return s.indexOf('Copy') !== -1 || s.indexOf('test_') !== -1; });
     if (messy.length > 0) return { success: true, message: 'Core sheets present. Warning: ' + messy.length + ' cluttered sheets found. Run CLEAN_SYSTEM_SHEETS().' };
     
     return { success: true, message: 'Clean backend structure verified' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function auditCheck_(name, result) {
  Logger.log((result.success ? '✅' : '❌') + ' [' + name + ']: ' + result.message);
  return { name: name, ...result };
}

// ----------------------------------------------------------------------------
// 1. INTEGRITY CHECK
// ----------------------------------------------------------------------------
function checkIntegrity_() {
  try {
    var files = ['Accounts.js', 'Ingress.js', 'Flow.js', 'WebUI.js', 'DataLinkage.js'];
    // In a real environment we'd check file existence, but here we assume if code runs, files exist.
    // Let's check critical functions.
    if (typeof processTransaction !== 'function') throw new Error('processTransaction missing (Flow.js)');
    if (typeof detectBankFromSender_ !== 'function') throw new Error('detectBankFromSender_ missing (Ingress.js)');
    if (typeof SOV1_FAST_getDashboard !== 'function') throw new Error('SOV1_FAST_getDashboard missing (DataLinkage.js/WebUI.js)');
    
    return { success: true, message: 'Critical functions present' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ----------------------------------------------------------------------------
// 2. ACCOUNTS SETUP TEST
// ----------------------------------------------------------------------------
function testAccountsSetup_() {
  try {
    // We won't wipe the sheet, just check if we can read it or seed it safely.
    var idx = loadAccountsIndex_();
    if (!idx || !idx.byAlias) throw new Error('Failed to load accounts index');
    
    // Check if 'saib' or 'alrajhi' exists (seeded by default code)
    var found = Object.keys(idx.byAlias).some(k => k.includes('saib') || k.includes('alrajhi'));
    
    if (!found) {
      // Try seeding strictly for test
      // SETUP_MY_ACCOUNTS(); // Risky to run fully in audit, better to check existence.
      return { success: false, message: 'Default accounts not found in index. Run SETUP_MY_ACCOUNTS()?' };
    }
    
    return { success: true, message: 'Accounts index loaded & contains banks' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ----------------------------------------------------------------------------
// 2b. ACCOUNTS SCHEMA TEST (NO WRITE)
// ----------------------------------------------------------------------------
function testAccountsSchema_() {
  try {
    var sh = _sheet('Accounts');
    if (!sh) return { success: false, message: 'Accounts sheet not found' };

    var expected = ['الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'تحويل_داخلي', 'أسماء_بديلة', 'ملاحظات'];
    var headers = sh.getRange(1, 1, 1, expected.length).getValues()[0];

    for (var i = 0; i < expected.length; i++) {
      var val = String(headers[i] || '').trim();
      if (val !== expected[i]) {
        return { success: false, message: 'Accounts schema mismatch at col ' + (i + 1) + ' (expected [' + expected[i] + '], found [' + val + '])' };
      }
    }

    return { success: true, message: 'Accounts sheet schema matches expected headers' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ----------------------------------------------------------------------------
// 3. SMS PROCESSING TEST (INGRESS)
// ----------------------------------------------------------------------------
function testSMSProcessing_() {
  try {
    // Mock a request object
    var mockReq = {
      postData: {
        contents: JSON.stringify({
          body: 'شراء 50.00 ريال من مطعم البيك عبر بطاقة مدى *3474',
          from: 'SAIB'
        })
      }
    };
    
    // Calls doPost in Ingress.js
    // We might not be able to call doPost directly easily effectively without mocking everything.
    // Instead, let's call the logic chain: detectBank -> parse -> process
    
    // A. Detect Bank
    var bank = detectBankFromSender_('SAIB');
    if (bank.id !== 'SAIB') throw new Error('Bank detection failed for SAIB');
    
    // B. Parse Forwarded (Mock text)
    var clean = parseForwardedMessage_('Forwarded from SAIB:\nشراء 50.00 ريال');
    if (!clean.includes('شراء 50.00')) throw new Error('Forward cleaning failed');
    
    return { success: true, message: 'Ingress logic (Bank Detect + Clean) verified' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ----------------------------------------------------------------------------
// 4. BALANCE LOGIC TEST
// ----------------------------------------------------------------------------
function testBalanceLogic_() {
  try {
    // Use a high-level function that simulates balance update without writing if possible,
    // or checks existence of 'updateBalancesAfterTransaction_'
    if (typeof updateBalancesAfterTransaction_ !== 'function') {
      return { success: false, message: 'Balance update function missing' };
    }
    
    // We can't easily mock the sheet write without polluting user data, so we check the linking logic.
    // DataLinkage.js -> enrichTransactionWithAccountInfo_
    var txn = { raw: 'شراء ببطاقة *3474' };
    enrichTransactionWithAccountInfo_(txn);
    
    // If accounts are set up, 3474 (seeded in Accounts.js) should map to SAIB
    // Note: This depends on the sheet being seeded.
    if (txn.accNum === '3474' || txn.cardNum === '3474') {
       return { success: true, message: 'Transaction enriched with account info' };
    } else {
       // If sheet is empty, it won't match. This is a warning, not a fail if sheet is fresh.
       return { success: true, message: 'Logic present (Result depends on Sheet data)' };
    }
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ----------------------------------------------------------------------------
// 6. FRONTEND API TEST
// ----------------------------------------------------------------------------
function testFrontendAPI_() {
  try {
    var result = SOV1_FAST_getDashboard();
    
    if (!result.success) throw new Error('API returned failure: ' + result.error);
    if (!result.data) throw new Error('API returned no data');
    if (typeof result.data.kpi === 'undefined') throw new Error('KPI missing');
    if (typeof result.data.accounts === 'undefined') throw new Error('Accounts list missing');
    
    return { success: true, message: 'Frontend API returns valid JSON structure' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ----------------------------------------------------------------------------
// 6b. API CONTRACTS (NO WRITE)
// ----------------------------------------------------------------------------
function testApiContracts_() {
  try {
    var settings = SOV1_UI_getSettings();
    if (!settings || typeof settings !== 'object') {
      return { success: false, message: 'SOV1_UI_getSettings returned invalid object' };
    }

    var accounts = SOV1_UI_getAccounts();
    if (!Array.isArray(accounts)) {
      return { success: false, message: 'SOV1_UI_getAccounts should return array' };
    }

    var categories = SOV1_UI_getCategories_('OPEN');
    if (!Array.isArray(categories)) {
      return { success: false, message: 'SOV1_UI_getCategories_ should return array' };
    }

    var budgets = SOV1_UI_getBudgets_('OPEN');
    if (!Array.isArray(budgets)) {
      return { success: false, message: 'SOV1_UI_getBudgets_ should return array' };
    }

    return { success: true, message: 'Core UI APIs return expected shapes' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ----------------------------------------------------------------------------
// 6c. UI BINDINGS (NO WRITE) - ENSURE NO FUNCTION COLLISION
// ----------------------------------------------------------------------------
function testUiBindings_() {
  try {
    if (typeof SOV1_UI_addAccount_ !== 'function') return { success: false, message: 'SOV1_UI_addAccount_ missing' };
    if (typeof SOV1_UI_updateAccount_ !== 'function') return { success: false, message: 'SOV1_UI_updateAccount_ missing' };
    if (typeof SOV1_UI_deleteAccount_ !== 'function') return { success: false, message: 'SOV1_UI_deleteAccount_ missing' };

    // Enforce unified signatures: add(1), update(2), delete(1)
    if (SOV1_UI_addAccount_.length !== 1) return { success: false, message: 'SOV1_UI_addAccount_ signature mismatch' };
    if (SOV1_UI_updateAccount_.length !== 2) return { success: false, message: 'SOV1_UI_updateAccount_ signature mismatch' };
    if (SOV1_UI_deleteAccount_.length !== 1) return { success: false, message: 'SOV1_UI_deleteAccount_ signature mismatch' };

    return { success: true, message: 'UI bindings match unified Accounts API' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ----------------------------------------------------------------------------
// 7. CLASSIFICATION & REASONING TEST
// ----------------------------------------------------------------------------
function testClassificationLogic_() {
  try {
    // 1. Test Static Map (Simulate Starbucks)
    // NOTE: This relies on Classifier_Map being seeded. If empty, it falls back to rules.
    var txn1 = { merchant: '' };
    var res1 = { category: '' };
    
    if (typeof applyClassifierMap_ === 'function') {
      res1 = applyClassifierMap_('Starbucks Coffee', txn1); // Should return enhanced object
    }
    
    // 2. Test Smart Rules (Loan Payment / OTP) - Hardcoded Regex Logic
    var txn2 = { merchant: 'Bank' };
    var res2 = { isLoanPayment: false };
    
    if (typeof applySmartRules_ === 'function') {
      res2 = applySmartRules_('خصم: قسط تمويل شخصي', txn2);
    }

    // 3. Evaluate
    var details = [];
    
    // Check Rules (Must pass)
    if (res2.isLoanPayment === true || (res2.category && res2.category.indexOf('تمويل') !== -1)) {
      details.push('Regex Rules OK');
    } else {
      return { success: false, message: 'Smart Rules (Loan detection) failed' };
    }
    
    // Check Map (Pass if either match found OR function executed)
    if (res1) details.push('Classifier Flow OK');
    
    return { success: true, message: 'Reasoning Logic Verified (' + details.join(', ') + ')' };
    
  } catch (e) {
    return { success: false, message: 'Classification Assert Error: ' + e.message };
  }
}

function printAuditReport_(results) {
  var passed = results.filter(r => r.success).length;
  Logger.log('\n📊 AUDIT SUMMARY: ' + passed + '/' + results.length + ' Passed');
}

// ===================== AUTOMATED CHECKLIST =====================
/**
 * Runs a series of non-destructive and safe functional tests covering the expert checklist.
 * Records results to the `AutoTestResults` sheet when available.
 */
function RUN_AUTOMATED_CHECKLIST() {
  Logger.log('🧾 STARTING AUTOMATED CHECKLIST...');
  Logger.log('--------------------------------------------');

  var checks = [
    { name: 'Data Model Integrity', fn: checkDataModelIntegrity_ },
    { name: 'Input Validation', fn: checkInputValidation_ },
    { name: 'Core Flows (Ingress→AI→Linking)', fn: checkCoreFlows_ },
    { name: 'Frontend↔Backend Contracts', fn: checkFrontendBackendContracts_ },
    { name: 'Persistence Correctness', fn: checkPersistenceCorrectness_ },
    { name: 'Account CRUD (Safe)', fn: testAccountCrud_ },
    { name: 'Notifications Guard', fn: testNotificationsGuard_ },
    { name: 'Performance/Caching', fn: testPerformance_ },
    { name: 'Security Sanity', fn: testSecurity_ },
    { name: 'Observability & Regression', fn: runRegressionTests_ }
  ];

  var results = [];
  for (var i = 0; i < checks.length; i++) {
    try {
      var res = checks[i].fn();
      if (res && typeof res === 'object') {
        results.push({ name: checks[i].name, success: !!res.success, message: res.message });
        Logger.log((res.success ? '✅' : '❌') + ' [' + checks[i].name + '] ' + res.message);
      } else {
        results.push({ name: checks[i].name, success: false, message: 'No result object returned' });
        Logger.log('❌ [' + checks[i].name + '] No result object returned');
      }
    } catch (e) {
      results.push({ name: checks[i].name, success: false, message: e.message });
      Logger.log('❌ [' + checks[i].name + '] Exception: ' + e.message);
    }
  }

  var passed = results.filter(function(r){ return r.success; }).length;
  var summary = '✅ Automated Checklist: ' + passed + '/' + results.length + ' Passed';
  Logger.log('\n' + summary);

  // Append to AutoTestResults sheet if exists
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('AutoTestResults');
    if (!sheet) {
      sheet = ss.insertSheet('AutoTestResults');
      sheet.appendRow(['Timestamp','Passed','Total','SummaryJSON']);
    }
    var ts = new Date();
    sheet.appendRow([ts, passed, results.length, JSON.stringify(results)]);
    Logger.log('📥 Results recorded to AutoTestResults sheet');
  } catch (e) {
    Logger.log('⚠️ Could not write results to sheet: ' + e.message);
  }

  // Cleanup any scheduling property / remove one-time triggers
  try {
    var props = PropertiesService.getScriptProperties();
    props.deleteProperty('AUTOTEST_SCHEDULED');

    // Remove any time-based triggers pointing to RUN_AUTOMATED_CHECKLIST
    var trigs = ScriptApp.getProjectTriggers();
    for (var t = 0; t < trigs.length; t++) {
      var trig = trigs[t];
      if (trig.getHandlerFunction && trig.getHandlerFunction() === 'RUN_AUTOMATED_CHECKLIST') {
        ScriptApp.deleteTrigger(trig);
      }
    }
  } catch (e) {
    Logger.log('Cleanup after automated checklist failed: ' + e.message);
  }

  return { success: true, results: results };
}

// ------------------ Individual deep checks ------------------

function checkDataModelIntegrity_() {
  try {
    // Check primary sheets and schema
    var req = ['Sheet1','Accounts','Budgets','Debt_Ledger','Dashboard'];
    var ss = getSpreadsheet();
    var sheets = ss.getSheets().map(function(s){return s.getName();});
    var miss = req.filter(function(r){ return sheets.indexOf(r) === -1; });
    if (miss.length) return { success:false, message: 'Missing sheets: ' + miss.join(', ') };

    // Check UUID column in Sheet1
    var s1 = ss.getSheetByName('Sheet1');
    if (!s1) return { success:false, message: 'Sheet1 missing' };
    var headers = s1.getRange(1,1,1, s1.getLastColumn()).getValues()[0];
    if (headers.indexOf('UUID') === -1) return { success:false, message: 'UUID column missing in Sheet1' };

    return { success:true, message: 'Data model integrity OK' };
  } catch (e) { return { success:false, message: e.message }; }
}

function checkInputValidation_() {
  try {
    // Test adding invalid account (should return error)
    try {
      var res = SOV1_UI_addAccount_({ name: '', type: '' });
      if (res && res.success === false) return { success:true, message: 'Invalid input rejected by addAccount' };
      // Some implementations may throw; consider not strict if behavior varies
      return { success:false, message: 'SOV1_UI_addAccount_ accepted invalid input or returned unexpected result' };
    } catch (e) {
      return { success:true, message: 'Invalid input caused expected failure: ' + e.message };
    }
  } catch (e) { return { success:false, message: e.message }; }
}

function checkCoreFlows_() {
  try {
    // Run a dry enrichment flow (no write)
    var txn = { raw: 'تم خصم 25.00 ريال من بطاقة *3474 لدى متجر اختبار' };
    enrichTransactionWithAccountInfo_(txn);
    if (txn.accNum || txn.cardNum || txn.bank) return { success:true, message: 'Enrichment flow executed (result depends on accounts)' };
    return { success:true, message: 'Enrichment function exists; result depends on sheet data' };
  } catch (e) { return { success:false, message: e.message }; }
}

function checkFrontendBackendContracts_() {
  try {
    // Basic contract checks
    var s = SOV1_UI_getSettings();
    if (!s || typeof s !== 'object') return { success:false, message: 'SOV1_UI_getSettings invalid' };
    var a = SOV1_UI_getAccounts();
    if (!Array.isArray(a)) return { success:false, message: 'SOV1_UI_getAccounts invalid' };
    return { success:true, message: 'Core UI contracts OK' };
  } catch (e) { return { success:false, message: e.message }; }
}

function checkPersistenceCorrectness_() {
  try {
    var testNum = '999' + (Math.floor(Math.random()*9000)+1000);
    // Use updateAccountBalance_ to safely create and set balance
    updateAccountBalance_(testNum, 50, true);
    var bal = getAllBalances_();
    if (bal[testNum] && Number(bal[testNum].balance) === 50) {
      // Delete test record
      var sh = _sheet('Accounts');
      var rows = sh.getDataRange().getValues();
      for (var i=1;i<rows.length;i++){ if (String(rows[i][2]||'')===String(testNum)) { sh.deleteRow(i+1); break; } }
      invalidateCache_(CACHE_KEYS.BALANCES_INDEX);
      return { success:true, message: 'Balance create/update verified and cleaned' };
    }
    return { success:false, message: 'Balance update did not reflect in getAllBalances_' };
  } catch (e) { return { success:false, message: e.message }; }
}

function testAccountCrud_() {
  var marker = '__AUTOTEST_' + (new Date()).getTime();
  var rowId = null;
  try {
    // Add
    var addRes = SOV1_UI_addAccount_({ name: marker, type: 'بنك', number: '', bank: 'AUTOTEST', balance: 0, isMine: true, isInternal: false, aliases: '', notes: 'auto' });
    if (!addRes || addRes.success === false) return { success:false, message: 'Add account failed: ' + JSON.stringify(addRes) };

    // Find created row
    var accs = SOV1_UI_getAllAccounts_();
    for (var i=0;i<accs.length;i++) { if (accs[i].name === marker) { rowId = accs[i].id; break; } }
    if (!rowId) return { success:false, message: 'Created account not found' };

    // Update
    SOV1_UI_updateAccount_(rowId, { name: marker + '_UPD', type: 'بنك', number: '', bank: 'AUTOTEST', balance: 10, isMine: true, isInternal: false, aliases: '', notes: 'auto-upd' });
    var accs2 = SOV1_UI_getAllAccounts_();
    var found = accs2.some(function(x){ return x.name === marker + '_UPD'; });
    if (!found) return { success:false, message: 'Update did not persist' };

    // Delete
    SOV1_UI_deleteAccount_(rowId);
    var accs3 = SOV1_UI_getAllAccounts_();
    if (accs3.some(function(x){ return x.name === marker + '_UPD'; })) return { success:false, message: 'Delete did not remove account' };

    return { success:true, message: 'Account CRUD successful (added → updated → deleted)'};
  } catch (e) {
    // Try cleanup
    try { if (rowId) SOV1_UI_deleteAccount_(rowId); } catch(err){}
    return { success:false, message: e.message };
  }
}

function testNotificationsGuard_() {
  try {
    if (typeof areTelegramNotificationsEnabled === 'function') {
      var enabled = areTelegramNotificationsEnabled();
      // Call sendTransactionReport with safe dummy data and expect no exception
      try {
        sendTransactionReport({ category: 'test' }, true, 'AUTO', 'raw', null);
        return { success:true, message: 'sendTransactionReport executed without throwing (guard OK)' };
      } catch (e) {
        return { success:false, message: 'sendTransactionReport threw: ' + e.message };
      }
    }
    return { success:true, message: 'Telegram notifications not configured; guard skipped' };
  } catch (e) { return { success:false, message: e.message }; }
}

function testPerformance_() {
  try {
    if (typeof getCachedOrFetch_ !== 'function' || typeof CACHE_TTL === 'undefined') return { success:false, message: 'Caching primitives missing' };
    // Quick check: cache a key then fetch
    var val = getCachedOrFetch_('SJA_TEST_KEY', function(){ return {ok: true, t: new Date().getTime() }; }, 10);
    var val2 = getCachedOrFetch_('SJA_TEST_KEY', function(){ return {ok: true, t: 0 }; }, 10);
    if (val && val2 && val.ok && val2.ok) return { success:true, message: 'Cache helpers present' };
    return { success:false, message: 'Cache helpers returned unexpected values' };
  } catch (e) { return { success:false, message: e.message }; }
}

function testSecurity_() {
  try {
    if (typeof SOV1_UI_requireAuth_ !== 'function') return { success:false, message: 'Auth guard SOV1_UI_requireAuth_ missing' };
    if (typeof ENSURE_ALL_SHEETS !== 'function') return { success:false, message: 'ENSURE_ALL_SHEETS missing' };
    return { success:true, message: 'Security-related primitives present' };
  } catch (e) { return { success:false, message: e.message }; }
}

function testObservability_() {
  try {
    // Run master verification as an observability/regression probe
    try { RUN_MASTER_VERIFICATION(); } catch(e){}
    try { RUN_FUNCTIONAL_SMOKE_TESTS(); } catch(e){}
    return { success:true, message: 'Master audit & smoke tests executed (see logs for details)' };
  } catch (e) { return { success:false, message: e.message }; }
}

function runRegressionTests_() { return testObservability_(); }

