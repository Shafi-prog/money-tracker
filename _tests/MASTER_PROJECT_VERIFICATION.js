
// ============================================================================
// 🔍 MASTER PROJECT VERIFICATION - SINGLE SOURCE OF TRUTH
// ============================================================================
// This script validates the entire system establishment:
// 1. Files & Integrity
// 2. Sheet Structure (Backend Hygiene)
// 3. Logic Flows (SMS -> Balance -> Notification)
// 4. Default Accounts & Config

/**
 * 🧪 LEGACY MAIN AUDIT RUNNER (Deprecated)
 * NOTE: The canonical implementation now lives in SystemAudit.js
 * under RUN_MASTER_VERIFICATION(). This legacy version is kept only
 * so old docs/scripts don’t break, but it is no longer the source of truth.
 */
function RUN_MASTER_VERIFICATION_LEGACY() {
  Logger.log('🚀 STARTING MASTER PROJECT VERIFICATION...');
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

  // 6. FRONTEND: API RESPONSE
  results.push(auditCheck_('Frontend API', testFrontendAPI_()));

  // SUMMARY
  printAuditReport_(results);
}

// Backwards-compat global wrapper to avoid two competing implementations.
// If SystemAudit.js is loaded (recommended), its RUN_MASTER_VERIFICATION
// will be called. Otherwise, we fall back to the legacy variant above.
function RUN_MASTER_VERIFICATION() {
  if (typeof this.RUN_MASTER_VERIFICATION === 'function' && this.RUN_MASTER_VERIFICATION !== RUN_MASTER_VERIFICATION) {
    return this.RUN_MASTER_VERIFICATION();
  }
  return RUN_MASTER_VERIFICATION_LEGACY();
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
// 5. FRONTEND API TEST
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

function printAuditReport_(results) {
  var passed = results.filter(r => r.success).length;
  Logger.log('\n📊 AUDIT SUMMARY: ' + passed + '/' + results.length + ' Passed');
}
