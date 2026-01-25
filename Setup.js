
/********** Setup.gs — (كما عندك) + إضافة قائمة SOV1 **********
 * - لم نغيّر مسمياتك القديمة (V120) لأنك تجاهلت تغيير المسمى.
 * - أضفنا SubMenu جديد في النهاية لميزات/اختبارات SOV1.
 * مرجع هيكل قائمتك الأصلية من ملفك المرفق. [1](https://www.webhook.it/guides/webhook-testing-best-practices)
 ***************************************************************/

function onOpen(e) {
  try {
    var ui = SpreadsheetApp.getUi();

    // ===== القائمة الرئيسية (كما عندك) =====
    var menu = ui.createMenu('V120');

    // 1) تشغيل سريع (LIGHT) — افتراضي
    menu.addItem('✅ تشغيل سريع (LIGHT) — افتراضي', 'V120_MasterRun_LIGHT');

    // 2) أهم العمليات اليومية
    menu.addSeparator();
    menu.addSubMenu(
      ui.createMenu('🧩 تشغيل يومي')
        .addItem('🧱 تهيئة أولية (Initial)', 'initialsystem')
        .addItem('🧪 زرع الصيغ (Seed Formulas)', 'test_10_seed_formulas')
        .addItem('🌐 Seed Classifier (AR)', 'seedClassifierMap_AR')
        .addSeparator()
        .addItem('🧮 إعادة احتساب الميزانية (من Sheet1)', 'test_05_recompute_budgets_from_sheet1')
        .addItem('📊 إعادة بناء Dashboard (محسّن)', 'rebuildDashboard')
        .addSeparator()
        .addItem('📊 إرسال Snapshot (Budgets)', 'test_08_send_snapshot')
    );

    // 3) اختبارات وتشخيص
    menu.addSubMenu(
      ui.createMenu('🧪 اختبارات وتشخيص')
        .addItem('🌐 Probe Webhook (GET/POST)', 'test_01_probeWebhook')
        .addItem('🤖 AI Diagnostics', 'test_AI_Diagnostics')
        .addSeparator()
        .addItem('🧪 اختبار شامل موحّد (RUN_COMPREHENSIVE_TEST)', 'RUN_COMPREHENSIVE_TEST')
    );

    // 4) صيانة/إدارة
    menu.addSubMenu(
      ui.createMenu('🛠️ صيانة وإدارة')
        .addItem('🔒 تفعيل وضع الصيانة (ON)', 'V120_Maintenance_ON')
        .addItem('🔓 إلغاء وضع الصيانة (OFF)', 'V120_Maintenance_OFF')
        .addSeparator()
        .addItem('🧹 Reset Ledgers (Debt/Budgets/Dashboard)', 'resetLedgers_KeepHeaders')
        .addSeparator()
        .addItem('🧽 TestReset (LIGHT) — يحافظ على Sheet1', 'V120_TestReset_LIGHT_KeepSheet1')
        .addItem('🧽 TestReset (FULL) — يمسح Sheet1', 'V120_TestReset_FULL_WipeSheet1')
        .addSeparator()
        .addItem('🔁 تعيين/إصلاح Webhook (DIRECT)', 'setWebhook_DIRECT_no302')
        .addItem('⛔ إيقاف Webhook تيليجرام + تصفير Pending', 'V120_StopTelegramWebhook_NOW')
    );

    // 5) متقدم
    menu.addSeparator();
    menu.addSubMenu(
      ui.createMenu('⚡ متقدم')
        .addItem('🧪 تشغيل شامل (FULL) — يمسح Sheet1', 'V120_MasterRun_FULL')
        .addSeparator()
        .addItem('✅ فحص البيئة (Healthcheck)', 'test_00_healthcheck')
    );

    // =========================================================
    // ✅ قائمة إضافية: اختبارات وتحسينات النظام (SOV1)
    // (بدون تغيير مسمياتك الأساسية)
    // =========================================================
    menu.addSeparator();
    menu.addSubMenu(
      ui.createMenu('🟦 اختبارات وتحسينات النظام')
        .addItem('✅ تشغيل جميع الاختبارات (RUN_ALL_TESTS)', 'RUN_ALL_TESTS')
        .addSeparator()
        .addItem('🏷️ إعداد ورقة التصنيفات', 'SOV1_SETUP_CATEGORIES_SHEET_')
        .addItem('🧹 تنظيف التصنيفات التجريبية', 'SOV1_CLEAN_TEST_CATEGORIES_')
        .addSeparator()
        .addItem(' تدقيق وربط البيانات (RUN_FULL_AUDIT_)', 'RUN_FULL_AUDIT_')
        .addItem('🔄 ترحيل Sheet1 للمخطط الجديد', 'MIGRATE_SHEET1_SCHEMA_')
        .addItem('🧩 إعادة بناء الروابط (Sheet1 → Budgets/Dashboard)', 'REBUILD_LINKS_FROM_SHEET1_')
        .addSeparator()
        .addItem('📨 اختبار رسالة Telegram', 'TEST_TELEGRAM_MESSAGE_')
        .addSeparator()
        .addItem('🚀 تشغيل جميع المراحل دفعة واحدة', 'RUN_ALL_PHASES_')
        .addSeparator()
        .addItem('⚙️ إعداد Trigger للـ Queue (كل دقيقة)', 'SOV1_setupQueueTrigger_')
        .addItem('⛔ إيقاف Trigger للـ Queue', 'SOV1_deleteQueueTrigger_')
        .addItem('▶️ تشغيل Worker مرة واحدة (Queue)', 'SOV1_processQueueBatch_')
        .addSeparator()
        .addItem('🤖 تعيين أوامر البوت (setMyCommands)', 'SOV1_setMyCommands_')
        .addItem('📋 عرض أوامر البوت (getMyCommands)', 'SOV1_getMyCommands_')
    );

    menu.addToUi();

  } catch (err) {
    console.log('onOpen error: ' + err);
  }
}

/** غلاف للتوافق (كما في مشروعك) */
function initialsystem() {
  if (typeof V120_runInitial_ === 'function') return V120_runInitial_();
  if (typeof ENSURE_ALL_SHEETS === 'function') return ENSURE_ALL_SHEETS();
  throw new Error('ENSURE_ALL_SHEETS غير موجودة');
}

/**
 * ✅ تفعيل أوامر البوت من مكان واضح
 * 📍 الملف: Setup.gs
 */
function SETUP_BOT_COMMANDS() {
  if (typeof SOV1_setMyCommands_ === 'function') return SOV1_setMyCommands_();
  throw new Error('SOV1_setMyCommands_ غير موجودة في Telegram_Commands.gs');
}

/**
 * ✅ ENSURE_ALL_SHEETS
 * إنشاء جميع الأوراق المطلوبة بالهيدرات الصحيحة والربط بينها
 * 📍 الملف: Setup.gs
 */
function ENSURE_ALL_SHEETS() {
  var ss = _ss();
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
  ensureSheet_('Accounts', ['Account','Bank','Type','Owner','Notes']);

  // ===== 7) Queue =====
  ensureSheet_('Queue', ['ID','Source','Text','Meta','Status','Date']);

  // ===== 8) Ingress_Debug =====
  ensureSheet_('Ingress_Debug', ['Time','Level','Path','Meta','Text']);

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
  var ss = _ss();
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
  var ss = _ss();
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
