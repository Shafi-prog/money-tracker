
/********** Setup.gs — Money Tracker Admin System **********/
// REPLACES V120 Legacy Setup

function onOpen(e) {
  try {
    var ui = SpreadsheetApp.getUi();
    
    ui.createMenu('MoneyTracker Admin')
      .addItem('🚀 Run Master Verification', 'RUN_MASTER_VERIFICATION')
      .addItem('🧪 Run Automated Checklist', 'RUN_AUTOMATED_CHECKLIST')
.addSeparator()
      .addSubMenu(ui.createMenu('🛠️ Maintenance')
          .addItem('🧹 Clean Unused Sheets', 'CLEAN_SYSTEM_SHEETS')
          .addItem('⚠️ Reset Transaction Data (Keep Config)', 'RESET_SYSTEM_DATA_KEEP_CONFIG')
          .addItem('📋 Clean Test Categories', 'CLEAN_CATEGORIES_SHEET')
      )
      .addSubMenu(ui.createMenu('⚙️ Configuration')
          .addItem('📥 Initial System Setup', 'initialsystem')
          .addItem('🤖 Set Bot Commands', 'SETUP_BOT_COMMANDS')
          .addItem('☁️ Seed Classifier (AR)', 'seedClassifierMap_AR')
      )
      .addSeparator()
      .addItem('🔄 Rebuild Dashboard & Links', 'REBUILD_LINKS_FROM_SHEET1_')
      .addToUi();

    // Auto-schedule the automated checklist the first time a user opens the sheet
    try {
      var props = PropertiesService.getScriptProperties();
      var scheduled = props.getProperty('AUTOTEST_SCHEDULED');
      if (!scheduled) {
        // Schedule a one-time time-based trigger to run in ~1 minute
        ScriptApp.newTrigger('RUN_AUTOMATED_CHECKLIST').timeBased().after(60 * 1000).create();
        props.setProperty('AUTOTEST_SCHEDULED', String(new Date().getTime()));
        SpreadsheetApp.getActiveSpreadsheet().toast('Automated checklist scheduled to run in one minute (first open).', 'Automated Checklist');
      }
    } catch (err) {
      Logger.log('Auto-schedule check failed: ' + err.message);
    }
  } catch (err) {
    console.log('onOpen error: ' + err);
  }
}

/**
 * ⚠️ CORE DATA RESET
 * Wipes Transactions, Debt, and Dashboard history.
 * Preserves: Accounts, Categories, Classifier_Map.
 */
function RESET_SYSTEM_DATA_KEEP_CONFIG() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    '⚠️ WARNING: ERASE DATA?',
    'This will delete ALL transactions, debt records, and reset budget spending.\n\n' +
    'Target: Transactions (Sheet1), Debt_Ledger, Dashboard, Spending Counts.\n\n' +
    'PRESERVED: Accounts, Categories, Classifier Settings.\n\n' +
    'Are you sure?',
    ui.ButtonSet.YES_NO
  );

  if (result == ui.Button.YES) {
    _wipeDataKeepHeaders_();
    ui.alert('✅ System Data Reset Complete.\n\nReady for fresh use.');
  }
}

function _wipeDataKeepHeaders_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet1 (Transactions)
  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() > 1) {
    s1.getRange(2, 1, s1.getLastRow() - 1, s1.getLastColumn()).clearContent();
  }
  
  // 2. Debt_Ledger
  var sD = ss.getSheetByName('Debt_Ledger');
  if (sD && sD.getLastRow() > 1) {
    sD.getRange(2, 1, sD.getLastRow() - 1, sD.getLastColumn()).clearContent();
  }

  // 3. Budgets (Reset Spent/Remaining/Links)
  // Structure: Category, Budget, Spent, Remaining, LinkedUUIDs
  var sB = ss.getSheetByName('Budgets');
  if (sB && sB.getLastRow() > 1) {
     var lastRow = sB.getLastRow();
     // Reset 'Spent' (Col 3) to 0
     sB.getRange(2, 3, lastRow - 1, 1).setValue(0);
     // Clear 'LinkedUUIDs' (Col 5)
     if (sB.getLastColumn() >= 5) {
        sB.getRange(2, 5, lastRow - 1, 1).clearContent();
     }
  }
  
  // 4. Dashboard
  var sDash = ss.getSheetByName('Dashboard');
  if (sDash && sDash.getLastRow() > 1) {
     sDash.getRange(2, 1, sDash.getLastRow() - 1, sDash.getLastColumn()).clearContent();
  }
  
  // 5. Ingress_Debug
  var sDeb = ss.getSheetByName('Ingress_Debug');
  if (sDeb && sDeb.getLastRow() > 1) {
    sDeb.getRange(2, 1, sDeb.getLastRow() - 1, sDeb.getLastColumn()).clearContent();
  }
  
  // 6. Queue
  var sQ = ss.getSheetByName('Queue');
  if (sQ && sQ.getLastRow() > 1) {
    sQ.getRange(2, 1, sQ.getLastRow() - 1, sQ.getLastColumn()).clearContent();
  }
}

/** غلاف للتوافق (كما في مشروعك) */
function initialsystem() {
  if (typeof ENSURE_ALL_SHEETS === 'function') return ENSURE_ALL_SHEETS();
  throw new Error('ENSURE_ALL_SHEETS غير موجودة');
}

/**
 * ✅ تفعيل أوامر البوت من مكان واضح
 */
function SETUP_BOT_COMMANDS() {
  // Try finding it in TelegramActions or TelegramCommands
  if (typeof SOV1_setMyCommands_ === 'function') return SOV1_setMyCommands_();
  // Fallback if defined elsewhere
  if (typeof setMyCommands === 'function') return setMyCommands();
  Logger.log('Warning: setMyCommands function not found.');
}

/**
 * 🧹 تنظيف التصنيفات التجريبية
 * يحذف أي تصنيف يحتوي على "اختبار" أو "test"
 */
function CLEAN_CATEGORIES_SHEET() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Categories');
  if (!sh) return { success: false, message: 'Categories sheet not found' };
  
  var data = sh.getDataRange().getValues();
  var rowsDeleted = 0;
  
  // Loop backwards to safely delete rows
  for (var i = data.length - 1; i >= 1; i--) {
    var name = String(data[i][0] || '').toLowerCase();
    if (name.indexOf('اختبار') !== -1 || name.indexOf('test') !== -1) {
      sh.deleteRow(i + 1);
      rowsDeleted++;
    }
  }
  
  return { success: true, count: rowsDeleted };
}

/**
 * 🧹 CLEAN_SYSTEM_SHEETS
 * Deletes unnecessary or test sheets that clutter the backend.
 * Keeps only: Sheet1, Accounts, Budgets, Debt_Ledger, Dashboard, Categories, Classifier_Map, Queue, Ingress_Debug, Transfers_Tracking
 */
function CLEAN_SYSTEM_SHEETS() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allSheets = ss.getSheets();
  var keep = ['Sheet1', 'Accounts', 'Budgets', 'Debt_Ledger', 'Dashboard', 'Categories', 'Classifier_Map', 'Queue', 'Ingress_Debug', 'Transfers_Tracking'];
  
  var deleted = [];
  
  allSheets.forEach(function(sheet) {
    var name = sheet.getName();
    // Delete if not in keep list OR if it starts with 'test_' or 'Copy'
    // BUT be careful not to delete 'Form Responses' if user has one, though script relies on Webhook.
    // Enhanced safety: Only delete if it explicitly looks like junk
    var isJunk = (name.toLowerCase().indexOf('test') === 0) || 
                 (name.indexOf('Copy of') === 0) ||
                 (name.indexOf('Sheet1_legacy') === 0) || 
                 (name.indexOf('Backup_') === 0);
                 
    // Also delete if it's a default 'Sheet1' but we are using 'Sheet1' (conflict?) 
    // No, we keep Sheet1.
    
    if (isJunk && keep.indexOf(name) === -1) {
      try {
        ss.deleteSheet(sheet);
        deleted.push(name);
      } catch (e) {
        Logger.log('Could not delete sheet ' + name + ': ' + e.message);
      }
    }
  });
  
  return { success: true, deleted: deleted };
}

/**
 * ✅ ENSURE_ALL_SHEETS
 * إنشاء جميع الأوراق المطلوبة بالهيدرات الصحيحة والربط بينها
 */
function ENSURE_ALL_SHEETS() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsCreated = [];
  var sheetsExisted = [];
  var schema = (typeof SCHEMA !== 'undefined') ? SCHEMA : null;

  function ensureSheet_(name, headers) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      if (headers && headers.length) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.setFrozenRows(1);
      sh.setRightToLeft(true);
      sheetsCreated.push(name);
    } else {
      sheetsExisted.push(name);
      if (headers && headers.length && sh.getLastRow() === 0) {
        sh.getRange(1, 1, 1, headers.length).setValues([headers]);
        sh.setFrozenRows(1);
      }
    }
    return sh;
  }

  // ===== 1) Sheet1 =====
  var expectedSheet1 = schema && schema.Sheet1 ? schema.Sheet1.columns : ['UUID','Date','Tag','Day','Week','Source','AccNum','CardNum','Amount','Merchant','Category','Type','Raw'];
  var s1 = ss.getSheetByName('Sheet1');
  if (!s1) {
    s1 = ensureSheet_('Sheet1', expectedSheet1);
  } else {
    sheetsExisted.push('Sheet1');
    if (!_sheetHeaderMatches_(s1, expectedSheet1)) {
      MIGRATE_SHEET1_SCHEMA_();
      s1 = ss.getSheetByName('Sheet1');
    }
  }

  // ===== 2) Budgets =====
  var expectedBudgets = schema && schema.Budgets ? schema.Budgets.columns : ['Category','Budget','Spent','Remaining','LinkedUUIDs'];
  var sB = ensureSheet_('Budgets', expectedBudgets);
  _ensureColumn_(sB, 'LinkedUUIDs', 5);

  // ===== 3) Debt_Ledger =====
  var expectedDebt = schema && schema.Debt_Ledger ? schema.Debt_Ledger.columns : ['UUID','Date','Party','Debit','Credit','Balance','Description','ParentUUID'];
  var sD = ensureSheet_('Debt_Ledger', expectedDebt);
  _ensureColumn_(sD, 'ParentUUID', 8);

  // ===== 4) Dashboard =====
  var expectedDash = schema && schema.Dashboard ? schema.Dashboard.columns : ['UUID','Date','Merchant','Amount','Category','Source'];
  ensureSheet_('Dashboard', expectedDash);

  // ===== 5) Classifier_Map =====
  ensureSheet_('Classifier_Map', ['Key','Category','Type','IsIncoming','AccNum','CardNum']);

  // ===== 6) Accounts =====
  if (typeof ensureAccountsSheet_ === 'function') {
    // Use the unified 10-column Accounts schema from Accounts.js
    ensureAccountsSheet_();
  } else {
    // Fallback: create Accounts with the modern schema expected by DataLinkage
    ensureSheet_('Accounts', ['الاسم','النوع','الرقم','البنك','الرصيد','آخر_تحديث','حسابي','تحويل_داخلي','أسماء_بديلة','ملاحظات']);
  }

  // ===== 7) Queue =====
  ensureSheet_('Queue', ['ID','Source','Text','Meta','Status','Date']);

  // ===== 8) Ingress_Debug =====
  ensureSheet_('Ingress_Debug', ['Time','Level','Path','Meta','Text']);
  
  // ===== 9) Transfers_Tracking =====
  ensureSheet_('Transfers_Tracking', ['UUID','Date','FromAccount','ToAccount','Amount','RelatedUUIDs']);

  var result = {
    created: sheetsCreated,
    existed: sheetsExisted,
    total: sheetsCreated.length + sheetsExisted.length
  };

  Logger.log('✅ ENSURE_ALL_SHEETS completed:');
  Logger.log('   Created: ' + sheetsCreated.join(', '));
  Logger.log('   Existed: ' + sheetsExisted.join(', '));

  return result;
}

function _sheetHeaderMatches_(sheet, headers) {
  if (!sheet || !headers || !headers.length) return true;
  var lastCol = sheet.getLastColumn();
  if (lastCol < headers.length) return false;
  var row = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(row[i] || '').trim() !== String(headers[i] || '').trim()) return false;
  }
  return true;
}

function _ensureColumn_(sheet, header, colIndex) {
  if (!sheet) return;
  var lastCol = sheet.getLastColumn();
  var row = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < row.length; i++) {
    if (String(row[i] || '').trim() === header) return;
  }
  var target = Math.max(lastCol + 1, colIndex || (lastCol + 1));
  sheet.getRange(1, target).setValue(header);
}

/**
 * ترحيل Sheet1 إلى مخطط UUID (في حال عدم التطابق)
 */
function MIGRATE_SHEET1_SCHEMA_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Sheet1');
  if (!sheet) return { ok: false, error: 'Sheet1 غير موجود' };

  var expected = (typeof SCHEMA !== 'undefined' && SCHEMA.Sheet1) ? SCHEMA.Sheet1.columns : ['UUID','Date','Tag','Day','Week','Source','AccNum','CardNum','Amount','Merchant','Category','Type','Raw'];
  if (_sheetHeaderMatches_(sheet, expected)) return { ok: true, skipped: true, reason: 'already_match' };

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) {
    sheet.clear();
    sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
    return { ok: true, reset: true };
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  var aliases = {
    UUID: ['uuid','معرف','المعرف','id','معاملة'],
    Date: ['date','التاريخ','تاريخ'],
    Tag: ['tag','النوع','تاج'],
    Day: ['day','اليوم'],
    Week: ['week','الأسبوع'],
    Source: ['source','المصدر'],
    AccNum: ['accnum','رقم_الحساب','رقم الحساب','الحساب'],
    CardNum: ['cardnum','رقم_البطاقة','رقم البطاقة','البطاقة'],
    Amount: ['amount','المبلغ'],
    Merchant: ['merchant','التاجر','الجهة','المستفيد','لدى'],
    Category: ['category','التصنيف','الفئة'],
    Type: ['type','نوع_العملية','نوع العملية'],
    Raw: ['raw','النص_الخام','النص الخام','النص','الرسالة']
  };

  function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,'').replace(/[^\w\u0600-\u06FF]/g,'');}
  function findIndex(keys){
    for (var i=0;i<headers.length;i++){
      var h = norm(headers[i]);
      for (var k=0;k<keys.length;k++){
        if (h === norm(keys[k])) return i;
      }
    }
    return -1;
  }

  var idx = {
    UUID: findIndex(aliases.UUID),
    Date: findIndex(aliases.Date),
    Tag: findIndex(aliases.Tag),
    Day: findIndex(aliases.Day),
    Week: findIndex(aliases.Week),
    Source: findIndex(aliases.Source),
    AccNum: findIndex(aliases.AccNum),
    CardNum: findIndex(aliases.CardNum),
    Amount: findIndex(aliases.Amount),
    Merchant: findIndex(aliases.Merchant),
    Category: findIndex(aliases.Category),
    Type: findIndex(aliases.Type),
    Raw: findIndex(aliases.Raw)
  };

  var newName = 'Sheet1_v2_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
  var sNew = ss.insertSheet(newName);
  sNew.getRange(1, 1, 1, expected.length).setValues([expected]);
  sNew.setFrozenRows(1);
  sNew.setRightToLeft(true);

  var batch = [];
  for (var r=0;r<data.length;r++) {
    var row = data[r];
    var dateVal = (idx.Date >= 0) ? row[idx.Date] : new Date();
    if (!(dateVal instanceof Date)) { try { dateVal = new Date(dateVal); } catch (_) { dateVal = new Date(); } }

    var uuid = (idx.UUID >= 0) ? row[idx.UUID] : '';
    if (!uuid) {
      uuid = (typeof generateShortUUID_ === 'function') ? generateShortUUID_() : Utilities.getUuid();
    }

    var tag = (idx.Tag >= 0) ? row[idx.Tag] : 'V120_AUTO';
    var day = (idx.Day >= 0) ? row[idx.Day] : (typeof getDayName_ === 'function' ? getDayName_(dateVal) : '');
    var week = (idx.Week >= 0) ? row[idx.Week] : (typeof getWeekNumber_ === 'function' ? getWeekNumber_(dateVal) : '');
    var source = (idx.Source >= 0) ? row[idx.Source] : '';
    var acc = (idx.AccNum >= 0) ? row[idx.AccNum] : '';
    var card = (idx.CardNum >= 0) ? row[idx.CardNum] : '';
    var amount = (idx.Amount >= 0) ? row[idx.Amount] : 0;
    var merchant = (idx.Merchant >= 0) ? row[idx.Merchant] : '';
    var category = (idx.Category >= 0) ? row[idx.Category] : '';
    var type = (idx.Type >= 0) ? row[idx.Type] : '';
    var raw = (idx.Raw >= 0) ? row[idx.Raw] : '';

    batch.push([uuid, dateVal, tag, day, week, source, acc, card, amount, merchant, category, type, raw]);
  }

  if (batch.length) {
    sNew.getRange(2, 1, batch.length, expected.length).setValues(batch);
  }

  try {
    sheet.setName('Sheet1_legacy_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm'));
    sNew.setName('Sheet1');
  } catch (e) {
    Logger.log('⚠️ rename failed: ' + e);
  }

  return { ok: true, migrated: true, rows: batch.length, newSheet: sNew.getName() };
}

/**
 * إعادة بناء الروابط بين Sheet1 و Budgets و Dashboard
 */
function REBUILD_LINKS_FROM_SHEET1_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s1 = ss.getSheetByName('Sheet1');
  var sB = ss.getSheetByName('Budgets');
  var sDash = ss.getSheetByName('Dashboard');
  if (!s1 || !sB || !sDash) return { ok: false, error: 'Missing sheets' };

  var data = s1.getDataRange().getValues();
  if (data.length < 2) return { ok: true, rows: 0 };

  // Dashboard: إعادة بناء
  sDash.clearContents();
  sDash.getRange(1,1,1,6).setValues([['UUID','Date','Merchant','Amount','Category','Source']]);

  var dashRows = [];
  var catTotals = {};
  var catLinks = {};

  for (var i=1;i<data.length;i++) {
    var uuid = String(data[i][0] || '');
    var date = data[i][1];
    var source = data[i][5];
    var amount = Number(data[i][8]) || 0;
    var merchant = data[i][9] || '';
    var category = data[i][10] || '';
    var typ = String(data[i][11] || '');
    var raw = String(data[i][12] || '');
    var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);

    dashRows.push([uuid, date, merchant, amount, category, source]);

    var delta = incoming ? -Math.max(amount,0) : Math.max(amount,0);
    catTotals[category] = (catTotals[category] || 0) + delta;
    if (!catLinks[category]) catLinks[category] = [];
    if (uuid) catLinks[category].push(uuid);
  }

  if (dashRows.length) sDash.getRange(2,1,dashRows.length,6).setValues(dashRows);

  // Budgets: تحديث المصروف والروابط
  var bData = sB.getDataRange().getValues();
  var existingCats = {};
  for (var b=1;b<bData.length;b++) {
    var cat = String(bData[b][0] || '');
    if (!cat) continue;
    existingCats[cat] = b + 1;
  }

  for (var catName in catTotals) {
    if (!existingCats[catName]) {
      var next = sB.getLastRow() + 1;
      sB.getRange(next,1,1,5).setValues([[catName, 0, 0, '=B'+next+'-C'+next, '']]);
      existingCats[catName] = next;
    }
  }

  for (var cat2 in existingCats) {
    var rowIdx = existingCats[cat2];
    var spent = catTotals[cat2] || 0;
    sB.getRange(rowIdx, 3).setValue(spent);
    var links = (catLinks[cat2] || []).join(',');
    sB.getRange(rowIdx, 5).setValue(links);
  }

  return { ok: true, rows: data.length - 1, dashboard: dashRows.length, budgets: Object.keys(existingCats).length };
}

/**
 * تشغيل Audit كامل وربط الـ Primary Keys
 */
function RUN_FULL_AUDIT_() {
  var result = {};
  result.ensure = ENSURE_ALL_SHEETS();
  result.rebuild = REBUILD_LINKS_FROM_SHEET1_();
  if (typeof checkDataIntegrity_ === 'function') {
    result.integrity_before = checkDataIntegrity_();
    if (result.integrity_before && !result.integrity_before.healthy && typeof repairDataIntegrity_ === 'function') {
      result.repair = repairDataIntegrity_();
      result.integrity_after = checkDataIntegrity_();
    }
  }
  Logger.log(JSON.stringify(result));
  return result;
}

/**
 * تشغيل جميع المراحل دفعة واحدة بدون توقف
 */
function RUN_ALL_PHASES_() {
  var out = { started: new Date().toISOString() };
  function safeRun_(name, fn) {
    try {
      out[name] = fn();
    } catch (e) {
      out[name] = { error: String(e) };
    }
  }

  safeRun_('ensure', function(){ return ENSURE_ALL_SHEETS(); });
  safeRun_('migrate', function(){ return MIGRATE_SHEET1_SCHEMA_(); });
  safeRun_('rebuild', function(){ return REBUILD_LINKS_FROM_SHEET1_(); });
  safeRun_('audit', function(){ return RUN_FULL_AUDIT_(); });
  safeRun_('setBotCommands', function(){ return SETUP_BOT_COMMANDS(); });

  out.finished = new Date().toISOString();
  Logger.log(JSON.stringify(out));
  return out;
}

/**
 * ✅ processMessage - نقطة دخول موحدة لمعالجة الرسائل
 * تُستدعى من Telegram أو iPhone
 * 📍 الملف: Setup.gs (يستدعي Flow.gs)
 */
function processMessage(text, source, chatId) {
  source = source || 'unknown';
  
  // استخدام processTransaction من Flow.gs
  if (typeof processTransaction === 'function') {
    return processTransaction(text, source, chatId);
  }
  
  throw new Error('processTransaction غير موجودة في Flow.gs');
}

/**
 * ✅ SEED CLASSIFIER (AR)
 * Add basic Arabic Merchants if missing
 */
function seedClassifierMap_AR() {
    var sMap = _sheet('Classifier_Map');
    if (!sMap) return;
    
    var data = sMap.getDataRange().getValues();
    var keys = {};
    for (var i = 1; i < data.length; i++) {
        keys[String(data[i][0]).toLowerCase()] = true;
    }
    
    var newEntries = [
        ['مطعم', 'طعام', '', ''],
        ['كنتاكي', 'طعام', '', ''],
        ['ماكدونالدز', 'طعام', '', ''],
        ['سوبرماركت', 'بقالة', '', ''],
        ['أسواق', 'بقالة', '', ''],
        ['محطة', 'نقل', '', ''],
        ['وقود', 'نقل', '', ''],
        ['صيدلية', 'صحة', '', ''],
        ['stc', 'فواتير', '', ''],
        ['mobily', 'فواتير', '', '']
    ];
    
    newEntries.forEach(function(row) {
        if (!keys[row[0]]) {
            sMap.appendRow([row[0], row[1], row[2], row[3], '', '']);
        }
    });

    return "Seeded " + newEntries.length + " entries.";
}

function _sheet(name) { 
  if (typeof getSpreadsheet === 'function') {
    return getSpreadsheet().getSheetByName(name);
  }
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); 
}
