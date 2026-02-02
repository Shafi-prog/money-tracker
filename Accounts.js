/**
 * Accounts.js - Complete Account Management (Shafi Jahz Almutiry)
 * Sheet operations + UI CRUD + Pattern seeding
 * Updated to support Unified Accounts Schema (10 columns)
 */

// ═══════════════════════════════════════════════════════════════════════
// SHEET SETUP & CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Ensures the Accounts sheet exists with the correct 10-column structure.
 * Schema: Name, Type, Number, Bank, Balance, LastUpdate, isMine, isInternal, Aliases, Notes
 */
function ensureAccountsSheet_() {
  var sh = _sheet('Accounts');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'تحويل_داخلي', 'أسماء_بديلة', 'ملاحظات', 'الرصيد_الافتتاحي']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    // Format Balance & Opening Balance
    sh.getRange('E:E').setNumberFormat('#,##0.00');
    sh.getRange('K:K').setNumberFormat('#,##0.00');
    // Format Date
    sh.getRange('F:F').setNumberFormat('yyyy-MM-dd HH:mm');
    // Set widths
    sh.setColumnWidth(1, 150); // Name
    sh.setColumnWidth(5, 100); // Balance
    sh.setColumnWidth(9, 200); // Aliases
  }
  return sh;
}

/**
 * Loads accounts index for fast lookup
 * Returns object with { byLast: {}, byAlias: {} }
 */
function loadAccountsIndex_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('ACCOUNTS_INDEX_V2');
  if (cached) { try { return JSON.parse(cached); } catch (e) {} }

  var sh = ensureAccountsSheet_();
  var last = sh.getLastRow();
  var idx = { byLast: {}, byAlias: {} };

  if (last >= 2) {
    // Read 10 columns
    var rows = sh.getRange(2, 1, last - 1, 10).getValues();
    rows.forEach(function (r) {
      // 0:Name, 1:Type, 2:Num, 3:Bank, 4:Balance, 5:LastUpdate, 6:isMine, 7:isInternal, 8:Aliases, 9:Notes
      var obj = {
        name: String(r[0] || ''),
        type: String(r[1] || ''),
        num: String(r[2] || ''),
        bank: String(r[3] || ''),
        balance: Number(r[4] || 0),
        lastUpdate: r[5],
        isMine: String(r[6] || '').toLowerCase() === 'true',
        isInternal: String(r[7] || '').toLowerCase() === 'true',
        aliases: String(r[8] || ''),
        notes: String(r[9] || '')
      };

      // Index by Account Number (Last 4)
      if (obj.num) idx.byLast[obj.num] = obj;

      // Index by Aliases
      String(obj.aliases).split(',')
        .map(function (x) { return x.trim().toLowerCase(); })
        .filter(Boolean)
        .forEach(function (a) { idx.byAlias[a] = obj; });
    });
  }

  cache.put('ACCOUNTS_INDEX_V2', JSON.stringify(idx), 300);
  return idx;
}

function classifyAccountFromText_(text, cardLast) {
  var idx = loadAccountsIndex_();
  var t = String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();

  // 1. Match by card last digits
  if (cardLast && idx.byLast[cardLast]) return { hit: idx.byLast[cardLast], isInternal: !!idx.byLast[cardLast].isInternal };

  // 2. Match by account number
  var accNumMatch = t.match(/(\d{4})/); // Extract 4-digit account number
  if (accNumMatch && idx.byLast[accNumMatch[1]]) {
    return { hit: idx.byLast[accNumMatch[1]], isInternal: !!idx.byLast[accNumMatch[1]].isInternal };
  }

  // 3. Match by account name or bank (exact/partial match)
  var accountKeys = Object.keys(idx.byLast);
  for (var j = 0; j < accountKeys.length; j++) {
    var acc = idx.byLast[accountKeys[j]];
    var accNameLower = (acc.name || '').toLowerCase();
    var accBankLower = (acc.bank || '').toLowerCase();
    
    // Check if text contains account name or bank name
    if (accNameLower && t.indexOf(accNameLower) >= 0) {
      return { hit: acc, isInternal: !!acc.isInternal };
    }
    if (accBankLower && t.indexOf(accBankLower) >= 0) {
      return { hit: acc, isInternal: !!acc.isInternal };
    }
  }

  // 4. Match by aliases
  var keys = Object.keys(idx.byAlias);
  for (var i = 0; i < keys.length; i++) {
    if (t.indexOf(keys[i]) >= 0) return { hit: idx.byAlias[keys[i]], isInternal: !!idx.byAlias[keys[i]].isInternal };
  }

  return { hit: null, isInternal: false };
}

/**
 * Legacy Seeding Function (Updated to new schema)
 */
function seedAccounts_() {
  Logger.log('Deprecation Warning: Use SETUP_MY_ACCOUNTS instead.');
  return SETUP_MY_ACCOUNTS();
}

/**
 * ✅ Main Setup Function - Populates with default accounts
 */
function SETUP_MY_ACCOUNTS() {
  var sh = ensureAccountsSheet_();
  
  // Clean start if requested, but better to append if not empty or just warn
  if (sh.getLastRow() > 1) {
    Logger.log('⚠️ Accounts sheet already has data. Skipping seed.');
    return { success: true, message: 'يوجد بيانات مسبقة', skipped: true };
  }
  
  // Name, Type, Number, Bank, Balance, LastUpdate, isMine, isInternal, Aliases, Notes
  var myAccounts = [
    // ════════════════════════════════════════════════════════════════════════════════
    // 0. CASH WALLET (نقدي) - Default for manual transactions
    // ════════════════════════════════════════════════════════════════════════════════
    ['نقدي', 'نقدي', 'CASH', 'Cash', 0, new Date(), 'TRUE', 'FALSE', 'نقدي,cash,كاش,محفظة,جيب,نقد', 'المحفظة النقدية'],

    // ════════════════════════════════════════════════════════════════════════════════
    // 1. SAIB (1 Account + 1 Card) -> Single Entity
    // ════════════════════════════════════════════════════════════════════════════════
    ['SAIB', 'بنك', '8001', 'SAIB', 0, new Date(), 'TRUE', 'FALSE', 'SAIB,saib,البنك السعودي للاستثمار,*3474,3474', 'الحساب الرئيسي + بطاقة 3474'],

    // ════════════════════════════════════════════════════════════════════════════════
    // 2. STC Bank (1 Account + 2 Cards) -> Single Entity
    // ════════════════════════════════════════════════════════════════════════════════
    ['STC Bank', 'بنك', '1929', 'STC Bank', 0, new Date(), 'TRUE', 'FALSE', 'STC Bank,STC,stc pay,*3281,3281,*4495,4495', 'حساب 1929 + بطاقات (3281, 4495)'],

    // ════════════════════════════════════════════════════════════════════════════════
    // 3. Tiqmo (1 Account + 1 Card) -> Single Entity
    // ════════════════════════════════════════════════════════════════════════════════
    ['Tiqmo', 'بنك', '9682', 'Tiqmo', 0, new Date(), 'TRUE', 'FALSE', 'Tiqmo,tiqmo,تيقمو,*0305,0305', 'حساب 9682 + بطاقة 0305'],

    // ════════════════════════════════════════════════════════════════════════════════
    // 4. D360 (1 Account + 1 Card) -> Single Entity
    // ════════════════════════════════════════════════════════════════════════════════
    // Note: User provided Card 3449 only. Treating as the main identifier.
    ['D360', 'بنك', '3449', 'D360', 0, new Date(), 'TRUE', 'FALSE', 'D360,d360,دي 360', 'حساب/بطاقة 3449'],

    // ════════════════════════════════════════════════════════════════════════════════
    // 5, 6, 7. Alrajhi (3 Separate Accounts)
    // ════════════════════════════════════════════════════════════════════════════════
    ['الراجحي - 9767', 'بنك', '9767', 'Alrajhi', 0, new Date(), 'TRUE', 'FALSE', 'الراجحي,Alrajhi,ALBI', 'حوالات (محمد الحربي)'],
    ['الراجحي - 9765', 'بنك', '9765', 'Alrajhi', 0, new Date(), 'TRUE', 'FALSE', 'الراجحي,Alrajhi', 'إيداعات (ابتسام)'],
    ['الراجحي - 1626', 'بنك', '1626', 'Alrajhi', 0, new Date(), 'TRUE', 'FALSE', 'الراجحي,Alrajhi', 'حوالات داخلية (جهز)']
  ];
  
  myAccounts.forEach(function(acc) {
    sh.appendRow(acc);
  });
  
  Logger.log('✅ Created ' + myAccounts.length + ' accounts.');
  CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
  
  return { success: true, accounts: myAccounts.length };
}

/**
 * Manually update a balance helper
 */
function UPDATE_ACCOUNT_BALANCE(accountNumber, newBalance) {
  if (typeof setBalance_ === 'function') {
    setBalance_(accountNumber, Number(newBalance) || 0);
    Logger.log('✅ Balance updated for ' + accountNumber + ': ' + newBalance);
    return { success: true };
  }
  return { success: false, error: 'setBalance_ not found' };
}

// ═══════════════════════════════════════════════════════════════════════
// UI CRUD FUNCTIONS (Frontend API)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get all accounts for UI
 */
function SOV1_UI_getAllAccounts_() {
  try {
    var sh = ensureAccountsSheet_();
    var last = sh.getLastRow();
    
    if (last < 2) return [];
    
    // Read 10 columns
    var rows = sh.getRange(2, 1, last - 1, 10).getValues();
    var accounts = [];
    
    rows.forEach(function(r, idx) {
      accounts.push({
        id: idx + 2, // Row number
        name: String(r[0] || ''),
        type: String(r[1] || ''),
        number: String(r[2] || ''),
        bank: String(r[3] || ''),
        balance: Number(r[4] || 0),       // Added
        lastUpdate: r[5],                 // Added
        isMine: String(r[6] || '').toLowerCase() === 'true',
        isInternal: String(r[7] || '').toLowerCase() === 'true', // Corrected index
        aliases: String(r[8] || ''),      // Corrected index
        notes: String(r[9] || '')         // Added
      });
    });
    
    return accounts;
  } catch (e) {
    Logger.log('Error getting accounts: ' + e);
    return [];
  }
}

/**
 * Add new account from UI
 */
function SOV1_UI_addAccount_(accountData) {
  try {
    if (!accountData || !accountData.name || !accountData.type) {
      return { success: false, error: 'الاسم والنوع مطلوبان' };
    }
    
    var sh = ensureAccountsSheet_();
    
    var initialBalance = Number(accountData.balance);
    if (isNaN(initialBalance)) initialBalance = 0;

    sh.appendRow([
      accountData.name,
      accountData.type,
      accountData.number || '',
      accountData.bank || '',
      initialBalance,
      new Date(), // Last Update
      accountData.isMine ? 'true' : 'false',
      accountData.isInternal ? 'true' : 'false',
      accountData.aliases || '',
      accountData.notes || ''
    ]);
    
    // Clear cache
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
    CacheService.getScriptCache().remove('SJA_DASH_DATA');

    // Log event for observability
    try { if (typeof logIngressEvent_ === 'function') logIngressEvent_('INFO', 'SOV1_UI_addAccount_', { name: accountData.name, number: accountData.number || '', bank: accountData.bank || '' }, 'account added'); } catch (e) {}
    
    return { success: true, ok: true, message: 'تم إضافة الحساب بنجاح' };
  } catch (e) {
    Logger.log('Error adding account: ' + e);
    return { success: false, ok: false, error: e.message };
  }
}

/**
 * Bulk-extract account info from an array of SMS strings (server-side).
 * @param {Array} smsArray
 */
function SOV1_UI_bulkExtractAccounts_(smsArray) {
  try {
    var out = [];
    smsArray = smsArray || [];
    for (var i = 0; i < smsArray.length; i++) {
      var sms = String(smsArray[i] || '');
      var res = extractAccountFromSMS_(sms);
      out.push({ sms: sms, result: res });
    }
    return { success: true, results: out };
  } catch (e) {
    Logger.log('Error in bulk extract: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Bulk add accounts (array of account objects)
 */
function SOV1_UI_bulkAddAccounts_(accounts) {
  try {
    var results = [];
    accounts = accounts || [];
    for (var j = 0; j < accounts.length; j++) {
      var acc = accounts[j];
      var r = SOV1_UI_addAccount_(acc);
      results.push({ account: acc, result: r });
    }

    // Clear cache and log
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
    try { if (typeof logIngressEvent_ === 'function') logIngressEvent_('INFO','SOV1_UI_bulkAddAccounts_',{count: accounts.length}, 'bulk add'); } catch(e) {}

    return { success: true, results: results };
  } catch (e) {
    Logger.log('Error bulk adding accounts: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Update existing account from UI
 */
function SOV1_UI_updateAccount_(rowId, accountData) {
  try {
    if (!rowId || rowId < 2) return { success: false, error: 'معرف غير صالح' };
    
    var sh = ensureAccountsSheet_();
    if (rowId > sh.getLastRow()) return { success: false, error: 'الحساب غير موجود' };
    
    // Name (1), Type (2), Number (3), Bank (4)
    sh.getRange(rowId, 1, 1, 4).setValues([[
      accountData.name,
      accountData.type,
      accountData.number || '',
      accountData.bank || ''
    ]]);

    // Balance (5) + LastUpdate (6)
    if (accountData.balance !== undefined && accountData.balance !== null && accountData.balance !== '') {
      var newBalance = Number(accountData.balance);
      if (!isNaN(newBalance)) {
        sh.getRange(rowId, 5).setValue(newBalance);
        sh.getRange(rowId, 6).setValue(new Date());
      }
    }
    
    // isMine (7), isInternal (8), Aliases (9), Notes (10)
    sh.getRange(rowId, 7, 1, 4).setValues([[
      accountData.isMine ? 'true' : 'false',
      accountData.isInternal ? 'true' : 'false',
      accountData.aliases || '',
      accountData.notes || ''
    ]]);
    
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
    CacheService.getScriptCache().remove('SJA_DASH_DATA');

    // Log update for observability
    try { if (typeof logIngressEvent_ === 'function') logIngressEvent_('INFO', 'SOV1_UI_updateAccount_', { row: rowId, name: accountData.name, number: accountData.number || '' }, 'account updated'); } catch (e) {}
    
    return { success: true, ok: true, message: 'تم تحديث الحساب بنجاح' };
  } catch (e) {
    Logger.log('Error updating account: ' + e);
    return { success: false, ok: false, error: e.message };
  }
}

/**
 * Delete account
 */
function SOV1_UI_deleteAccount_(rowId) {
  try {
    if (!rowId || rowId < 2) return { success: false, ok: false, error: 'معرف غير صالح' };
    
    var sh = ensureAccountsSheet_();
    sh.deleteRow(rowId);
    
    CacheService.getScriptCache().remove('SJA_DASH_DATA');
    
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
    return { success: true, ok: true, message: 'تم حذف الحساب بنجاح' };
  } catch (e) {
    return { success: false, ok: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CLEANUP HELPERS
// ═══════════════════════════════════════════════════════════════════════

function CLEAN_ACCOUNTS_AUTOFIX_() {
  var sh = ensureAccountsSheet_();
  var last = sh.getLastRow();
  if (last < 2) return { success: true, message: 'No accounts' };

  var rows = sh.getRange(2, 1, last - 1, 10).getValues();

  function normBank(name, bank, aliases) {
    var text = [name, bank, aliases].join(' ');
    if (/الراجحي|Alrajhi|ALBI/i.test(text)) return 'Alrajhi';
    if (/SAIB|ساب|Saudi Investment/i.test(text)) return 'SAIB';
    if (/STC Bank|بنك الاتصالات|\bSTC\b/i.test(text)) return 'STC Bank';
    if (/D360|d360/i.test(text)) return 'D360';
    if (/Tiqmo|تيقمو/i.test(text)) return 'Tiqmo';
    return '';
  }

  function normNumber(num) {
    var n = String(num || '').replace(/\s+/g, '').replace(/^\*+/, '');
    if (/^\d{3}$/.test(n)) n = '0' + n;
    return n;
  }

  var allowed = { 'Alrajhi': true, 'SAIB': true, 'STC Bank': true, 'Tiqmo': true, 'D360': true };
  var seen = {};
  var toDelete = [];
  var toUpdate = [];

  rows.forEach(function(r, idx) {
    var rowId = idx + 2;
    var name = String(r[0] || '');
    var type = String(r[1] || '');
    var number = normNumber(r[2] || '');
    var bank = normBank(name, r[3], r[8]);
    var balance = Number(r[4] || 0);
    var aliases = String(r[8] || '');
    var notes = String(r[9] || '');

    // Drop placeholders, unknown bank, or bad imports
    if (!bank || !allowed[bank]) {
      toDelete.push(rowId);
      return;
    }

    if (!number) {
      toDelete.push(rowId);
      return;
    }

    if (/\bTBD\b|غير محدد|Add last-4/i.test(name + ' ' + notes)) {
      toDelete.push(rowId);
      return;
    }

    if (/MasterCard|Visa/i.test(String(r[3] || ''))) {
      toDelete.push(rowId);
      return;
    }

    var key = bank + '|' + number;
    if (number && seen[key]) {
      // Keep the one with non-zero balance if possible
      if (balance !== 0 && seen[key].balance === 0) {
        toDelete.push(seen[key].rowId);
        seen[key] = { rowId: rowId, balance: balance };
      } else {
        toDelete.push(rowId);
      }
      return;
    }

    seen[key] = { rowId: rowId, balance: balance };

    // Queue normalized updates
    if (String(r[2] || '') !== number || String(r[3] || '') !== bank || String(r[1] || '') !== type) {
      toUpdate.push({ rowId: rowId, number: number, bank: bank, type: type });
    }
  });

  // Apply updates
  toUpdate.forEach(function(u) {
    sh.getRange(u.rowId, 2).setValue(u.type);
    sh.getRange(u.rowId, 3).setValue(u.number);
    sh.getRange(u.rowId, 4).setValue(u.bank);
  });

  // Delete rows bottom-up
  toDelete.sort(function(a, b) { return b - a; }).forEach(function(rowId) {
    sh.deleteRow(rowId);
  });

  CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
  return { success: true, removed: toDelete.length, updated: toUpdate.length };
}

function RESET_ACCOUNTS_CANONICAL_() {
  // Config Updated: 2026-01-31 (Strict 7-Entity Logic)
  var sh = ensureAccountsSheet_();
  var last = sh.getLastRow();
  var existing = last > 1 ? sh.getRange(2, 1, last - 1, 10).getValues() : [];

  function key(bank, number) {
    return String(bank || '').trim().toLowerCase() + '|' + String(number || '').trim();
  }

  var balances = {};
  existing.forEach(function(r) {
    var k = key(r[3], r[2]);
    if (!balances[k]) balances[k] = Number(r[4] || 0);
  });

  var canonical = [
    // ════════════════════════════════════════════════════════════════════════════════
    // 1. SAIB (1 Account + 1 Card) -> Single Entity
    // ════════════════════════════════════════════════════════════════════════════════
    ['SAIB', 'بنك', '8001', 'SAIB', 0, new Date(), 'TRUE', 'FALSE', 'SAIB,saib,البنك السعودي للاستثمار,*3474,3474', 'الحساب الرئيسي + بطاقة 3474'],

    // ════════════════════════════════════════════════════════════════════════════════
    // 2. STC Bank (1 Account + 2 Cards) -> Single Entity
    // ════════════════════════════════════════════════════════════════════════════════
    ['STC Bank', 'بنك', '1929', 'STC Bank', 0, new Date(), 'TRUE', 'FALSE', 'STC Bank,STC,stc pay,*3281,3281,*4495,4495', 'حساب 1929 + بطاقات (3281, 4495)'],

    // ════════════════════════════════════════════════════════════════════════════════
    // 3. Tiqmo (1 Account + 1 Card) -> Single Entity
    // ════════════════════════════════════════════════════════════════════════════════
    ['Tiqmo', 'بنك', '9682', 'Tiqmo', 0, new Date(), 'TRUE', 'FALSE', 'Tiqmo,tiqmo,تيقمو,*0305,0305', 'حساب 9682 + بطاقة 0305'],

    // ════════════════════════════════════════════════════════════════════════════════
    // 4. D360 (1 Account + 1 Card) -> Single Entity
    // ════════════════════════════════════════════════════════════════════════════════
    // Note: User provided Card 3449 only. Treating as the main identifier.
    ['D360', 'بنك', '3449', 'D360', 0, new Date(), 'TRUE', 'FALSE', 'D360,d360,دي 360', 'حساب/بطاقة 3449'],

    // ════════════════════════════════════════════════════════════════════════════════
    // 5, 6, 7. Alrajhi (3 Separate Accounts)
    // ════════════════════════════════════════════════════════════════════════════════
    ['الراجحي - 9767', 'بنك', '9767', 'Alrajhi', 0, new Date(), 'TRUE', 'FALSE', 'الراجحي,Alrajhi,ALBI', 'حوالات (محمد الحربي)'],
    ['الراجحي - 9765', 'بنك', '9765', 'Alrajhi', 0, new Date(), 'TRUE', 'FALSE', 'الراجحي,Alrajhi', 'إيداعات (ابتسام)'],
    ['الراجحي - 1626', 'بنك', '1626', 'Alrajhi', 0, new Date(), 'TRUE', 'FALSE', 'الراجحي,Alrajhi', 'حوالات داخلية (جهز)']
  ];

  canonical.forEach(function(r) {
    var b = balances[key(r[3], r[2])];
    if (typeof b === 'number' && !isNaN(b)) r[4] = b;
  });

  // Clear existing rows
  if (last > 1) sh.deleteRows(2, last - 1);
  // Preserve leading zeros in account/card numbers
  sh.getRange(2, 3, canonical.length, 1).setNumberFormat('@');
  sh.getRange(2, 1, canonical.length, 10).setValues(canonical);

  CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
  return { success: true, count: canonical.length };
}

/**
 * Get account info by number (last 4 digits) - Helper
 */
function getAccountByNumber_(number) {
  if (!number) return null;
  var numStr = String(number).trim();
  
  // Use the cached index for speed
  var idx = loadAccountsIndex_();
  
  // 1. Direct match on Account Number
  if (idx.byLast[numStr]) return idx.byLast[numStr];
  
  // 2. Fallback to Aliases (e.g. Card Numbers linked to account)
  // Check exact string match in alias keys (aliases are stored lowercase in index)
  if (idx.byAlias[numStr.toLowerCase()]) return idx.byAlias[numStr.toLowerCase()];
  
  // 3. Try prepending '*' if not present (common in SMS)
  if (!numStr.startsWith('*')) {
    var starKey = '*' + numStr;
    if (idx.byAlias[starKey.toLowerCase()]) return idx.byAlias[starKey.toLowerCase()];
  }
  
  return null;
}

/**
 * Determine if a transaction is internal (between user's own accounts)
 */
function isInternalTransfer_(fromAccount, toAccount) {
  var fromInfo = getAccountByNumber_(fromAccount);
  var toInfo = getAccountByNumber_(toAccount);
  
  if (!fromInfo || !toInfo) return false;
  
  return fromInfo.isMine && toInfo.isMine;
}

/**
 * Update aliases for an account by account number
 * @param {string} accountNum - The account number to update
 * @param {string} newAliases - Comma-separated list of aliases
 */
function UPDATE_ACCOUNT_ALIASES(accountNum, newAliases) {
  var sh = ensureAccountsSheet_();
  var last = sh.getLastRow();
  
  if (last < 2) return { success: false, error: 'No accounts found' };
  
  var data = sh.getRange(2, 1, last - 1, 11).getValues();
  var found = false;
  
  for (var i = 0; i < data.length; i++) {
    var num = String(data[i][2] || '').trim();
    if (num === String(accountNum).trim()) {
      sh.getRange(i + 2, 9).setValue(newAliases);
      found = true;
      // Clear cache
      CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
      return { success: true, account: num, newAliases: newAliases };
    }
  }
  
  return { success: false, error: 'Account ' + accountNum + ' not found' };
}
