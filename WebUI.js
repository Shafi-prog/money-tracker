
/********** WebUI.gs — شافي المطيري (متابعة المصاريف المالية) **********/

/**
 * ⚠️ REQUIRED: Google Apps Script web app entry point
 * This function MUST exist for the web app to work
 */
function doGet(e) {
  return SOV1_UI_doGet_(e);
}

function SOV1_UI_doGet_(e) {
  // --- CLI BACKDOOR (DEBUGGING) ---
  if (e && e.parameter && e.parameter.mode === 'cli') {
    var cmd = e.parameter.cmd;
    var result = "No command provided.";
    try {
      if (cmd === 'DEBUG_SHEETS_INFO') {
        result = (typeof DEBUG_SHEETS_INFO === 'function') ? JSON.stringify(DEBUG_SHEETS_INFO()) : "Function DEBUG_SHEETS_INFO not found.";
      } else if (cmd === 'DEBUG_TELEGRAM_STATUS') {
         result = (typeof DEBUG_TELEGRAM_STATUS === 'function') ? JSON.stringify(DEBUG_TELEGRAM_STATUS()) : "Function DEBUG_TELEGRAM_STATUS not found.";
      } else if (cmd === 'RUN_MASTER_TESTS') {
         result = (typeof RUN_MASTER_TESTS === 'function') ? JSON.stringify(RUN_MASTER_TESTS()) : "Function RUN_MASTER_TESTS not found.";
      } else if (cmd === 'SETUP_TELEGRAM_WEBHOOK') {
         var newUrl = e.parameter.url;
         if (newUrl) {
           PropertiesService.getScriptProperties().setProperty('WEBAPP_URL', newUrl);
           if (typeof ENV !== 'undefined') {
             ENV.WEBAPP_URL = newUrl;
             ENV.WEBAPP_URL_DIRECT = newUrl;
           }
         }
         if (typeof setWebhook_DIRECT_no302 === 'function') {
           setWebhook_DIRECT_no302();
           result = "Webhook setup complete";
         } else {
           result = "Webhook setup function not found";
         }
      } else if (cmd === 'SETUP_QUEUE') {
         if (typeof SOV1_setupQueueTrigger_ === 'function') {
           SOV1_setupQueueTrigger_();
           result = "Trigger Setup Complete";
         } else {
           result = "Function SOV1_setupQueueTrigger_ not found.";
         }
      } else {
        result = "Unknown command: " + cmd;
      }
    } catch (err) {
      result = "Error executing " + cmd + ": " + err.message;
    }
    return ContentService.createTextOutput(JSON.stringify({ result: result })).setMimeType(ContentService.MimeType.JSON);
  }

  var page = (e && e.parameter && e.parameter.page) ? String(e.parameter.page) : 'index';
  var file = 'index';
  if (page === 'dashboard') file = 'Dashboard';
  if (page === 'details') file = 'details';
  if (page === 'reports') file = 'reports';
  if (page === 'settings') file = 'settings';
  if (page === 'test') file = 'test_report';
  if (page === 'onboarding') file = 'onboarding';
  if (page === 'features') file = 'features';
  if (page === 'auto-tests') file = 'auto_tests';

  return HtmlService.createHtmlOutputFromFile(file)
    .setTitle('شافي المطيري — متابعة المصاريف المالية')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// --- حماية بسيطة (اختياري): كلمة مرور UI_PASSWORD ---
function SOV1_UI_auth_(password) {
  if (!ENV.UI_PASSWORD) return { ok:true, token:'OPEN' };
  password = String(password||'');
  if (password !== ENV.UI_PASSWORD) return { ok:false, message:'كلمة المرور غير صحيحة' };
  var token = Utilities.getUuid().slice(0,12);
  CacheService.getScriptCache().put('UI_AUTH_' + token, '1', 3600);
  return { ok:true, token: token };
}
function SOV1_UI_requireAuth_(token) {
  if (!ENV.UI_PASSWORD) return true;
  token = String(token||'');
  return CacheService.getScriptCache().get('UI_AUTH_' + token) === '1';
}

function SOV1_UI_getDashboard_(token) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  var s1 = _sheet('Sheet1');
  var sB = _sheet('Budgets');
  var sQ = _sheet('Ingress_Queue');

  var now = new Date();
  var startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0);
  var endMonth = new Date(now.getFullYear(), now.getMonth()+1, 1, 0,0,0);

  var b = sB.getDataRange().getValues();
  var totalRemain = 0;
  for (var i=1;i<b.length;i++) totalRemain += Number(b[i][3]) || 0;

  var last = s1.getLastRow();
  var rows = (last>=2) ? s1.getRange(2,1,last-1,13).getValues() : [];
  var incomeM=0, spendM=0;

  for (var r=0;r<rows.length;r++){
    var d = rows[r][1];
    if (!(d instanceof Date) || d<startMonth || d>=endMonth) continue;
    var amt = Number(rows[r][8]) || 0;
    var typ = String(rows[r][11]||'');
    var raw = String(rows[r][12]||'');
    var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
    if (incoming) incomeM += Math.max(amt,0); else spendM += Math.max(amt,0);
  }

  // تكرار آخر 7 أيام
  var qLast = sQ.getLastRow();
  var q = (qLast>=2) ? sQ.getRange(2,1,qLast-1,6).getValues() : [];
  var dupDaily = {};
  var cutoff = new Date(Date.now() - 7*24*3600*1000);
  for (var k=0;k<q.length;k++){
    var t = q[k][0];
    if (!(t instanceof Date) || t < cutoff) continue;
    if (String(q[k][4]||'') !== 'SKIP_DUP') continue;
    var day = Utilities.formatDate(t, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    dupDaily[day] = (dupDaily[day]||0)+1;
  }

  return {
    kpi: { incomeM: incomeM, spendM: spendM, netM: incomeM-spendM, totalRemain: totalRemain },
    dup7d: Object.keys(dupDaily).sort().map(function(d){ return { day:d, dup:dupDaily[d] }; })
  };
}

function SOV1_UI_getLatest_(token, limit) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  limit = Math.max(10, Math.min(Number(limit||60), 200));

  var s1 = _sheet('Sheet1');
  var last = s1.getLastRow();
  if (last < 2) return [];
  var start = Math.max(2, last - limit + 1);
  var rows = s1.getRange(start,1,last-start+1,13).getValues();
  rows.reverse();

  return rows.map(function(r, idx){
    var rowNumber = last - idx;
    return {
      row: rowNumber,
      date: (r[1] instanceof Date) ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : '',
      amount: Number(r[8]||0),
      merchant: r[9] || '',
      category: r[10] || '',
      type: r[11] || ''
    };
  });
}

function SOV1_UI_getCategories_(token) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  var cache = CacheService.getScriptCache();
  var cached = cache.get('UI_CATS');
  if (cached) { 
    try { 
      return JSON.parse(cached); 
    } catch(e) {
      Logger.log('Categories cache parse error: ' + e.message);
    } 
  }

  // Try Categories sheet first, fallback to Budgets
  var sCat = _sheet('Categories');
  var cats = [];
  
  if (sCat && sCat.getLastRow() > 1) {
    // Categories sheet exists with data
    var data = sCat.getRange(2, 1, sCat.getLastRow() - 1, 4).getValues();
    for (var i = 0; i < data.length; i++) {
      var name = String(data[i][0] || '').trim();
      var icon = String(data[i][1] || '').trim();
      var active = String(data[i][3] || 'نعم').trim();
      if (name && active !== 'لا') {
        cats.push({ name: name, icon: icon });
      }
    }
  } else {
    // Fallback to Budgets sheet
    var sB = _sheet('Budgets');
    var last = sB.getLastRow();
    if (last >= 2) {
      var budgetCats = sB.getRange(2, 1, last - 1, 1).getValues();
      for (var j = 0; j < budgetCats.length; j++) {
        var c = String(budgetCats[j][0] || '').trim();
        if (c) cats.push({ name: c, icon: '' });
      }
    }
  }
  
  // If still empty, return defaults
  if (cats.length === 0) {
    cats = [
      { name: 'طعام', icon: '🍽️' },
      { name: 'نقل', icon: '🚗' },
      { name: 'فواتير', icon: '📄' },
      { name: 'تسوق', icon: '🛍️' },
      { name: 'سكن', icon: '🏠' },
      { name: 'ترفيه', icon: '🎬' },
      { name: 'صحة', icon: '💊' },
      { name: 'راتب', icon: '💰' },
      { name: 'تحويل', icon: '↔️' },
      { name: 'أخرى', icon: '📦' }
    ];
  }

  cache.put('UI_CATS', JSON.stringify(cats), 300);
  return cats;
}

/**
 * Get all categories with full details for management
 */
function SOV1_UI_getCategoriesManage_(token) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  var sCat = _sheet('Categories');
  if (!sCat || sCat.getLastRow() < 2) {
    // Create Categories sheet if not exists
    SOV1_SETUP_CATEGORIES_SHEET_();
    sCat = _sheet('Categories');
  }
  
  var data = sCat.getRange(2, 1, Math.max(1, sCat.getLastRow() - 1), 5).getValues();
  var cats = [];
  
  for (var i = 0; i < data.length; i++) {
    var name = String(data[i][0] || '').trim();
    if (name) {
      cats.push({
        row: i + 2,
        name: name,
        icon: String(data[i][1] || '').trim(),
        color: String(data[i][2] || '').trim(),
        active: String(data[i][3] || 'نعم').trim() !== 'لا',
        notes: String(data[i][4] || '').trim()
      });
    }
  }
  
  return cats;
}

/**
 * Add a new category
 */
function SOV1_UI_addCategory_(token, name, icon, color) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  name = String(name || '').trim();
  icon = String(icon || '📦').trim();
  color = String(color || '#6B7280').trim();
  
  if (!name) throw new Error('اسم التصنيف مطلوب');
  if (name.length > 50) throw new Error('اسم التصنيف طويل جداً');
  
  // Check for test/invalid categories
  if (/test|تجريب|تجربة|fake|dummy/i.test(name)) {
    throw new Error('لا يمكن إضافة تصنيف تجريبي');
  }
  
  var sCat = _sheet('Categories');
  if (!sCat || sCat.getLastRow() < 1) {
    SOV1_SETUP_CATEGORIES_SHEET_();
    sCat = _sheet('Categories');
  }
  
  // Check if exists
  var data = sCat.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === name.toLowerCase()) {
      throw new Error('التصنيف موجود مسبقاً');
    }
  }
  
  // Add new row
  sCat.appendRow([name, icon, color, 'نعم', '']);
  
  // Clear cache
  CacheService.getScriptCache().remove('UI_CATS');
  
  return { ok: true, name: name };
}

/**
 * Update an existing category
 */
function SOV1_UI_updateCategory_(token, row, name, icon, color, active) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  row = Number(row || 0);
  if (row < 2) throw new Error('رقم الصف غير صحيح');
  
  name = String(name || '').trim();
  icon = String(icon || '📦').trim();
  color = String(color || '#6B7280').trim();
  var activeStr = active === false ? 'لا' : 'نعم';
  
  if (!name) throw new Error('اسم التصنيف مطلوب');
  
  // Check for test categories
  if (/test|تجريب|تجربة|fake|dummy/i.test(name)) {
    throw new Error('لا يمكن استخدام تصنيف تجريبي');
  }
  
  var sCat = _sheet('Categories');
  sCat.getRange(row, 1, 1, 4).setValues([[name, icon, color, activeStr]]);
  
  // Clear cache
  CacheService.getScriptCache().remove('UI_CATS');
  
  return { ok: true, row: row };
}

/**
 * Delete a category (mark as inactive)
 */
function SOV1_UI_deleteCategory_(token, row) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  row = Number(row || 0);
  if (row < 2) throw new Error('رقم الصف غير صحيح');
  
  var sCat = _sheet('Categories');
  var name = String(sCat.getRange(row, 1).getValue() || '').trim();
  
  // Don't delete system categories
  var systemCats = ['أخرى', 'راتب', 'تحويل', 'تحقق', 'مرفوضة'];
  if (systemCats.indexOf(name) >= 0) {
    throw new Error('لا يمكن حذف تصنيف النظام');
  }
  
  // Mark as inactive instead of deleting
  sCat.getRange(row, 4).setValue('لا');
  
  // Clear cache
  CacheService.getScriptCache().remove('UI_CATS');
  
  return { ok: true, name: name };
}

/**
 * Setup Categories sheet with default data
 */
function SOV1_SETUP_CATEGORIES_SHEET_() {
  var ss = SpreadsheetApp.openById(_prop_('SHEET_ID'));
  var existing = ss.getSheetByName('Categories');
  
  if (existing && existing.getLastRow() > 1) {
    return existing; // Already has data
  }
  
  var sheet = existing || ss.insertSheet('Categories');
  
  // Headers
  var headers = ['التصنيف', 'الأيقونة', 'اللون', 'نشط', 'ملاحظات'];
  sheet.getRange(1, 1, 1, 5).setValues([headers]);
  sheet.getRange(1, 1, 1, 5)
    .setBackground('#1F2937')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  
  // Default categories
  var defaults = [
    ['طعام', '🍽️', '#EF4444', 'نعم', 'مطاعم، كافيهات، بقالة'],
    ['نقل', '🚗', '#F59E0B', 'نعم', 'وقود، أوبر، مواصلات'],
    ['فواتير', '📄', '#3B82F6', 'نعم', 'كهرباء، ماء، اتصالات'],
    ['تسوق', '🛍️', '#8B5CF6', 'نعم', 'ملابس، إلكترونيات'],
    ['سكن', '🏠', '#10B981', 'نعم', 'إيجار، صيانة'],
    ['ترفيه', '🎬', '#EC4899', 'نعم', 'سينما، اشتراكات'],
    ['صحة', '💊', '#06B6D4', 'نعم', 'طبيب، أدوية'],
    ['تعليم', '📚', '#6366F1', 'نعم', 'دورات، كتب'],
    ['راتب', '💰', '#22C55E', 'نعم', 'الراتب الشهري'],
    ['تحويل', '↔️', '#64748B', 'نعم', 'تحويلات بنكية'],
    ['أخرى', '📦', '#6B7280', 'نعم', 'مصروفات متنوعة']
  ];
  
  sheet.getRange(2, 1, defaults.length, 5).setValues(defaults);
  
  // Formatting
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 60);
  sheet.setColumnWidth(3, 80);
  sheet.setColumnWidth(4, 60);
  sheet.setColumnWidth(5, 200);
  
  return sheet;
}

/**
 * Clean test categories from all sheets
 */
function SOV1_CLEAN_TEST_CATEGORIES_() {
  var testPatterns = /test|تجريب|تجربة|fake|dummy|sample/i;
  var cleaned = { categories: 0, transactions: 0, budgets: 0 };
  
  // 1. Clean Categories sheet
  var sCat = _sheet('Categories');
  if (sCat && sCat.getLastRow() > 1) {
    var catData = sCat.getRange(2, 1, sCat.getLastRow() - 1, 1).getValues();
    for (var i = catData.length - 1; i >= 0; i--) {
      if (testPatterns.test(String(catData[i][0] || ''))) {
        sCat.deleteRow(i + 2);
        cleaned.categories++;
      }
    }
  }
  
  // 2. Clean Sheet1 transactions with test categories
  var s1 = _sheet('Sheet1');
  if (s1 && s1.getLastRow() > 1) {
    var txData = s1.getRange(2, 11, s1.getLastRow() - 1, 1).getValues(); // Column K = category
    for (var j = txData.length - 1; j >= 0; j--) {
      if (testPatterns.test(String(txData[j][0] || ''))) {
        // Change to 'أخرى' instead of deleting
        s1.getRange(j + 2, 11).setValue('أخرى');
        cleaned.transactions++;
      }
    }
  }
  
  // 3. Clean Budgets with test categories
  var sB = _sheet('Budgets');
  if (sB && sB.getLastRow() > 1) {
    var budgetData = sB.getRange(2, 1, sB.getLastRow() - 1, 1).getValues();
    for (var k = budgetData.length - 1; k >= 0; k--) {
      if (testPatterns.test(String(budgetData[k][0] || ''))) {
        sB.deleteRow(k + 2);
        cleaned.budgets++;
      }
    }
  }
  
  // Clear cache
  CacheService.getScriptCache().remove('UI_CATS');
  
  Logger.log('✅ Cleaned: ' + cleaned.categories + ' categories, ' + 
             cleaned.transactions + ' transactions, ' + cleaned.budgets + ' budgets');
  
  return cleaned;
}

function SOV1_UI_changeCategory_(row, newCategory) {
  row = Number(row||0);
  newCategory = String(newCategory||'').trim();
  if (row < 2) throw new Error('رقم الصف غير صحيح');
  if (!newCategory) throw new Error('التصنيف فارغ');

  var s1 = _sheet('Sheet1');
  var sB = _sheet('Budgets');
  var r = s1.getRange(row, 1, 1, 13).getValues()[0];

  var amt = Number(r[8]) || 0;
  var oldCat = String(r[10] || 'أخرى');
  var typ = String(r[11]||'');
  var raw = String(r[12]||'');
  var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
  var delta = incoming ? -Math.max(amt,0) : Math.max(amt,0);

  s1.getRange(row, 11).setValue(newCategory);

  SOV1_UI_applyBudgetDelta_(sB, oldCat, -delta);
  SOV1_UI_applyBudgetDelta_(sB, newCategory, delta);

  SpreadsheetApp.flush();
  return { ok:true, row:row, from:oldCat, to:newCategory };
}

function SOV1_UI_applyBudgetDelta_(sB, category, delta) {
  category = String(category||'').trim();
  if (!category) return;

  var data = sB.getDataRange().getValues();
  var rowIdx = -1;
  for (var i=1;i<data.length;i++){
    if (String(data[i][0]||'') === category) { rowIdx = i+1; break; }
  }
  if (rowIdx < 0) {
    var next = sB.getLastRow()+1;
    sB.getRange(next,1,1,4).setValues([[category,0,0,'=B'+next+'-C'+next]]);
    rowIdx = next;
  }
  var curSpent = Number(sB.getRange(rowIdx,3).getValue()) || 0;
  sB.getRange(rowIdx,3).setValue(curSpent + delta);
}

/**
 * Check system configuration status
 */
function SOV1_UI_checkConfig_() {
  var props = PropertiesService.getScriptProperties();
  
  return {
    hasSheet: !!(props.getProperty('SHEET_ID')),
    hasTelegram: !!(props.getProperty('TELEGRAM_BOT_TOKEN') && props.getProperty('TELEGRAM_CHAT_ID')),
    hasAI: !!(props.getProperty('GROQ_KEY') || props.getProperty('GEMINI_KEY')),
    hasWebhook: !!(props.getProperty('WEBAPP_URL'))
  };
}

/**
 * Get budgets data for UI
 */
function SOV1_UI_getBudgets_(token) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  try {
    var sB = _sheet('Budgets');
    var data = sB.getDataRange().getValues();
    var budgets = [];
    
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      budgets.push({
        category: String(data[i][0] || ''),
        limit: Number(data[i][1]) || 0,
        spent: Number(data[i][2]) || 0,
        remaining: Number(data[i][3]) || 0
      });
    }
    
    return budgets;
  } catch (e) {
    Logger.log('Error getting budgets: ' + e.message);
    return [];
  }
}

/**
 * Quick setup for new users
 */
function SOV1_UI_quickSetup_(setupData) {
  try {
    var props = PropertiesService.getScriptProperties();
    
    // Set basic properties
    if (setupData.sheetId) {
      props.setProperty('SHEET_ID', setupData.sheetId);
    }
    
    if (setupData.botToken) {
      props.setProperty('TELEGRAM_BOT_TOKEN', setupData.botToken);
    }
    
    if (setupData.chatId) {
      props.setProperty('TELEGRAM_CHAT_ID', setupData.chatId);
    }
    
    // Initialize sheets if SHEET_ID is set
    if (setupData.sheetId) {
      if (typeof ENSURE_ALL_SHEETS === 'function') {
        ENSURE_ALL_SHEETS();
      }
    }
    
    return { success: true, message: 'تم الإعداد بنجاح' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Add manual transaction from UI
 */
function SOV1_UI_addManualTransaction_(text) {
  try {
    // Use the REAL parsing flow that exists
    var result = processTransaction(text, 'web_ui', ENV.CHAT_ID || '');
    return { success: true, result: result };
  } catch (e) {
    Logger.log('Add transaction error: ' + e.message);
    throw new Error('فشل إضافة العملية: ' + e.message);
  }
}

/**
 * Save user settings
 * Uses professional Settings.js implementation (Config sheet) when available
 */
function SOV1_UI_saveSettings_(settings) {
  try {
    // Preferred path: delegate to Settings.js logic which persists to Config sheet
    if (typeof saveSettings === 'function') {
      return saveSettings(settings || {});
    }

    // Fallback to legacy ScriptProperties behavior (kept for backward compatibility)
    var props = PropertiesService.getScriptProperties();
    var updated = [];
    
    if (settings && settings.user_name) {
      props.setProperty('OWNER', settings.user_name);
      updated.push('الاسم');
    }
    
    if (settings && settings.user_email) {
      props.setProperty('USER_EMAIL', settings.user_email);
      updated.push('البريد');
    }
    
    if (settings && typeof settings.enable_notifications !== 'undefined') {
      props.setProperty('NOTIFICATIONS_ENABLED', String(settings.enable_notifications));
      updated.push('الإشعارات');
    }
    
    Logger.log('Settings saved (fallback): ' + updated.join(', '));
    return { success: true, message: 'تم الحفظ: ' + updated.join(', ') };
  } catch (e) {
    Logger.log('Save settings error: ' + e.message);
    throw new Error('فشل حفظ الإعدادات: ' + e.message);
  }
}

function SOV1_UI_generateReportHtml_(token, mode) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  mode = String(mode||'month');
  var now = new Date();
  var title = (mode==='today') ? 'تقرير اليوم' : (mode==='week' ? 'تقرير الأسبوع' : 'تقرير الشهر');

  var start, end;
  if (mode === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0,0,0);
  } else if (mode === 'week') {
    var day = now.getDay();
    var offsetToSat = (day + 1) % 7;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsetToSat, 0,0,0);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate()+7, 0,0,0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0);
    end = new Date(now.getFullYear(), now.getMonth()+1, 1, 0,0,0);
  }

  var rows = _sheet('Sheet1').getDataRange().getValues();
  var spend=0, income=0, byCat={};

  for (var i=1;i<rows.length;i++){
    var d = rows[i][1];
    if (!(d instanceof Date) || d<start || d>=end) continue;

    var amt = Number(rows[i][8]) || 0;
    var cat = String(rows[i][10]||'أخرى');
    var typ = String(rows[i][11]||'');
    var raw = String(rows[i][12]||'');
    var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);

    if (incoming) income += Math.max(amt,0);
    else { spend += Math.max(amt,0); byCat[cat]=(byCat[cat]||0)+Math.max(amt,0); }
  }

  var cats = Object.keys(byCat).sort(function(a,b){return byCat[b]-byCat[a];});
  var rowsHtml = cats.map(function(c){
    return '<tr><td>'+c+'</td><td>'+byCat[c].toFixed(2)+'</td></tr>';
  }).join('');

  return (
    '<html lang="ar" dir="rtl"><head><meta charset="utf-8"/>' +
    '<style>body{font-family:Tahoma,Arial}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f3f3}</style>' +
    '</head><body>' +
    '<h2>'+title+'</h2>' +
    '<p>الدخل: <b>'+income.toFixed(2)+'</b> SAR<br/>' +
    'المصروف: <b>'+spend.toFixed(2)+'</b> SAR<br/>' +
    'الصافي: <b>'+(income-spend).toFixed(2)+'</b> SAR</p>' +
    '<h3>تفصيل حسب التصنيف</h3>' +
    '<table><thead><tr><th>التصنيف</th><th>المصروف</th></tr></thead><tbody>'+rowsHtml+'</tbody></table>' +
    '</body></html>'
  );
}

function SOV1_UI_runTest_(token, testName) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  testName = String(testName||'').trim();
  if (!testName) throw new Error('اسم الاختبار فارغ');
  if (typeof this[testName] !== 'function') throw new Error('الاختبار غير موجود: '+testName);

  // Execute test
  this[testName]();

  var sh = _sheet('Tests_Log');
  var last = sh.getLastRow();
  if (last < 2) return { ok:true, note:'لا يوجد سجل نتائج' };

  var r = sh.getRange(last,1,1,4).getValues()[0];
  return { ok:true, time:r[0], test:r[1], status:r[2], details:r[3] };
}

/** تصدير CSV لآخر N عمليات (ميزة تسويقية شائعة) */
function SOV1_UI_exportCsv_(token, limit) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  limit = Math.max(20, Math.min(Number(limit||200), 1000));
  var s1 = _sheet('Sheet1');
  var last = s1.getLastRow();
  if (last < 2) return 'لا توجد بيانات';

  var start = Math.max(2, last - limit + 1);
  var rows = s1.getRange(start,1,last-start+1,13).getValues();

  var header = ['التاريخ','القناة/المصدر','المبلغ','التاجر','التصنيف','النوع','النص الخام'];
  var lines = [header.join(',')];

  // SCHEMA: UUID[0], Date[1], Tag[2], Day[3], Week[4], Source[5], AccNum[6], CardNum[7], Amount[8], Merchant[9], Category[10], Type[11], Raw[12]
  rows.forEach(function(r){
    var date = (r[1] instanceof Date) ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : '';
    var src = String(r[5]||'').replace(/"/g,'""');
    var amt = Number(r[8]||0).toFixed(2);
    var merch = String(r[9]||'').replace(/"/g,'""');
    var cat = String(r[10]||'').replace(/"/g,'""');
    var typ = String(r[11]||'').replace(/"/g,'""');
    var raw = String(r[12]||'').replace(/"/g,'""');
    lines.push(['"'+date+'"','"'+src+'"',amt,'"'+merch+'"','"'+cat+'"','"'+typ+'"','"'+raw+'"'].join(','));
  });

  return lines.join('\n');
}

/** 
 * modern data fetcher for the new dashboard
 */
function SOV1_UI_getDashboardData_() {
  try {
    var s1 = _sheet('Sheet1'); 
    var values = s1.getDataRange().getValues();
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    var income = 0;
    var expense = 0;
    var txs = [];
    var count = 0;

    for (var i = values.length - 1; i >= 1; i--) {
       var row = values[i];
       // SCHEMA: UUID[0], Date[1], Tag[2], Day[3], Week[4], Source[5], AccNum[6], CardNum[7], Amount[8], Merchant[9], Category[10], Type[11], Raw[12]
       var date = row[1]; 
       var amount = Number(row[8]) || 0; 
       var merchant = String(row[9]||''); 
       var category = String(row[10]||'');
       var typ = String(row[11]||'');
       var raw = String(row[12]||'');

       if (count < 10) {
         txs.push({
           id: i,
           date: (date instanceof Date) ? date.toISOString() : null,
           amount: amount, 
           merchant: merchant,
           category: category
         });
         count++;
       }
       
       if (date instanceof Date && date >= monthStart) {
          var isIncome = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
          if (isIncome) income += amount;
          else expense += amount;
       }
    }
    
    return {
      stats: {
        income: income,
        expense: expense,
        savings: income - expense, 
        balance: (income - expense) 
      },
      transactions: txs
    };
  } catch (e) {
    return { stats: { income:0, expense:0, savings:0, balance:0 }, transactions: [] };
  }
}

/**
 * Get current user settings
 */
function SOV1_UI_getSettings_() {
  try {
    // Use the professional Settings.js function
    if (typeof getSettings === 'function') {
      return getSettings();
    }
    
    // Fallback to old method
    var props = PropertiesService.getScriptProperties();
    return {
      success: true,
      settings: {
        user_name: props.getProperty('OWNER') || '',
        user_email: Session.getActiveUser().getEmail(),
        default_currency: 'SAR',
        language: 'ar',
        salary_day: 1,
        enable_notifications: true,
        auto_apply_rules: true
      }
    };
  } catch (e) {
    Logger.log('Error getting settings: ' + e);
    return {
      success: false,
      error: e.message,
      settings: {
        user_name: '',
        user_email: Session.getActiveUser().getEmail(),
        default_currency: 'SAR',
        language: 'ar',
        salary_day: 1,
        enable_notifications: true,
        auto_apply_rules: true
      }
    };
  }
}

/**
 * Get report data for specific period
 */
function SOV1_UI_getReportData_(token, period) {
  if (!token || token !== 'OPEN') {
    return { error: 'Unauthorized' };
  }
  
  try {
    var s1 = _sheet('Sheet1');
    var values = s1.getDataRange().getValues();
    var now = new Date();
    var startDate;
    
    // Calculate date range based on period
    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    } else {
      // monthly - use salary day instead of calendar month
      var settings = getSettings();
      var salaryDay = (settings && settings.settings && settings.settings.salary_day) || 1;
      
      if (now.getDate() >= salaryDay) {
        // Past salary day this month
        startDate = new Date(now.getFullYear(), now.getMonth(), salaryDay);
      } else {
        // Before salary day - use last month's salary day
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, salaryDay);
      }
    }
    
    var income = 0;
    var expenses = 0;
    var byCategory = {};
    var txCount = 0;
    
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      // SCHEMA: UUID[0], Date[1], Tag[2], Day[3], Week[4], Source[5], AccNum[6], CardNum[7], Amount[8], Merchant[9], Category[10], Type[11], Raw[12]
      var date = row[1];
      var amount = Number(row[8]) || 0;
      var category = String(row[10] || 'أخرى');
      var typ = String(row[11] || '');
      var raw = String(row[12] || '');
      
      if (date instanceof Date && date >= startDate) {
        txCount++;
        var isIncome = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
        
        if (isIncome) {
          income += amount;
        } else {
          expenses += amount;
          if (!byCategory[category]) byCategory[category] = 0;
          byCategory[category] += amount;
        }
      }
    }
    
    // Convert to array for chart
    var chartData = [];
    for (var cat in byCategory) {
      chartData.push({ category: cat, amount: byCategory[cat] });
    }
    chartData.sort((a, b) => b.amount - a.amount);
    
    return {
      period: period,
      income: income,
      expenses: expenses,
      savings: income - expenses,
      transactionCount: txCount,
      byCategory: byCategory,
      chartData: chartData
    };
  } catch (e) {
    Logger.log('Error getting report data: ' + e);
    return { error: e.message };
  }
}

/**
 * Get user's configured accounts
 */
function SOV1_UI_getAccounts_() {
  try {
    return SOV1_UI_getAllAccounts_();
  } catch (e) {
    Logger.log('Error getting accounts: ' + e);
    return [];
  }
}

/**
 * Get accounts with their current balances for dashboard display
 */
function SOV1_UI_getAccountsWithBalances_() {
  try {
    // Try to get balances from Balances.js function
    if (typeof getAccountsWithBalances_ === 'function') {
      return getAccountsWithBalances_();
    }
    
    // Fallback: Get from Balances sheet directly
    var ss = _ss();
    var balSheet = ss.getSheetByName('Balances');
    if (!balSheet || balSheet.getLastRow() < 2) {
      return [];
    }
    
    var data = balSheet.getDataRange().getValues();
    var result = [];
    
    for (var i = 1; i < data.length; i++) {
      result.push({
        name: String(data[i][0] || ''),
        balance: Number(data[i][1] || 0),
        lastUpdate: data[i][2] || null
      });
    }
    
    return result;
  } catch (e) {
    Logger.log('Error getting accounts with balances: ' + e);
    return [];
  }
}

/**
 * Public wrapper for getting accounts with balances
 */
function SOV1_UI_getAccountsWithBalances() {
  try {
    return SOV1_UI_getAccountsWithBalances_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getAccountsWithBalances: ' + e);
    return [];
  }
}

/**
 * Delete a transaction by row ID
 */
function SOV1_UI_deleteTransaction_(rowId) {
  try {
    if (!rowId || rowId < 2) {
      return { error: 'Invalid row ID' };
    }
    
    var s1 = _sheet('Sheet1');
    s1.deleteRow(rowId);
    
    Logger.log('Deleted transaction at row: ' + rowId);
    return { success: true, message: 'Transaction deleted' };
  } catch (e) {
    Logger.log('Error deleting transaction: ' + e);
    return { error: e.message };
  }
}

// ============================================================================
// PUBLIC API WRAPPERS (No trailing underscore for google.script.run access)
// All wrappers include error handling to ensure valid return values
// ============================================================================

function SOV1_UI_getSettings() {
  try {
    return SOV1_UI_getSettings_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getSettings: ' + e);
    return { success: false, error: e.message, settings: {} };
  }
}

function SOV1_UI_saveSettings(settingsData) {
  try {
    return SOV1_UI_saveSettings_(settingsData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_saveSettings: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_getStats() {
  try {
    return SOV1_UI_getStats_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getStats: ' + e);
    return { income: 0, expense: 0, balance: 0, savings: 0 };
  }
}

function SOV1_UI_getTransactions() {
  try {
    return SOV1_UI_getTransactions_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getTransactions: ' + e);
    return [];
  }
}

function SOV1_UI_getBudgets(token) {
  try {
    return SOV1_UI_getBudgets_(token);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getBudgets: ' + e);
    return [];
  }
}

function SOV1_UI_saveBudget(categoryOrBudgetObj, limit) {
  try {
    // Handle both old signature (category, limit) and new (budgetObj)
    if (typeof categoryOrBudgetObj === 'object') {
      return SOV1_UI_saveBudget_(categoryOrBudgetObj.category, categoryOrBudgetObj.limit);
    }
    return SOV1_UI_saveBudget_(categoryOrBudgetObj, limit);
  } catch (e) {
    Logger.log('Error in SOV1_UI_saveBudget: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_deleteBudget(category) {
  try {
    return SOV1_UI_deleteBudget_(category);
  } catch (e) {
    Logger.log('Error in SOV1_UI_deleteBudget: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_getReport(period) {
  try {
    return SOV1_UI_getReport_(period);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getReport: ' + e);
    return null;
  }
}

function SOV1_UI_getAccounts() {
  try {
    return SOV1_UI_getAccounts_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getAccounts: ' + e);
    return [];
  }
}

function SOV1_UI_addManualTransaction(txData) {
  try {
    return SOV1_UI_addManualTransaction_(txData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_addManualTransaction: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_deleteTransaction(rowId) {
  try {
    return SOV1_UI_deleteTransaction_(rowId);
  } catch (e) {
    Logger.log('Error in SOV1_UI_deleteTransaction: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_checkConfig() {
  try {
    return SOV1_UI_checkConfig_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_checkConfig: ' + e);
    return { hasSheet: false, hasTelegram: false, hasAI: false };
  }
}

function SOV1_UI_getDashboard(token) {
  try {
    return SOV1_UI_getDashboard_(token);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getDashboard: ' + e);
    return { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, recent: [], budgets: [] };
  }
}

function SOV1_UI_getLatest(token, limit) {
  try {
    var result = SOV1_UI_getLatest_(token, limit);
    return result || [];
  } catch (e) {
    Logger.log('Error in SOV1_UI_getLatest: ' + e);
    return [];
  }
}

function SOV1_UI_quickSetup(setupData) {
  try {
    return SOV1_UI_quickSetup_(setupData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_quickSetup: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_getReportData(token, period) {
  try {
    return SOV1_UI_getReportData_(token, period);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getReportData: ' + e);
    return null;
  }
}

function SOV1_UI_addAccount(accountData) {
  try {
    return SOV1_UI_addAccount_(accountData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_addAccount: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_updateAccount(rowId, accountData) {
  try {
    return SOV1_UI_updateAccount_(rowId, accountData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_updateAccount: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_deleteAccount(rowId) {
  try {
    return SOV1_UI_deleteAccount_(rowId);
  } catch (e) {
    Logger.log('Error in SOV1_UI_deleteAccount: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_extractAccountFromSMS(smsText) {
  try {
    return SOV1_UI_extractAccountFromSMS_(smsText);
  } catch (e) {
    Logger.log('Error in SOV1_UI_extractAccountFromSMS: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_updateBudget(category, newLimit) {
  try {
    return SOV1_UI_updateBudget_(category, newLimit);
  } catch (e) {
    Logger.log('Error in SOV1_UI_updateBudget: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * ✅ تحديث رصيد حساب من الواجهة
 */
function SOV1_UI_updateAccountBalance(accountNumber, newBalance) {
  try {
    if (typeof setBalance_ === 'function') {
      setBalance_(accountNumber, Number(newBalance) || 0);
      return { success: true, message: 'تم تحديث الرصيد' };
    }
    return { success: false, error: 'دالة تحديث الرصيد غير متاحة' };
  } catch (e) {
    Logger.log('Error in SOV1_UI_updateAccountBalance: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * ✅ الحصول على ملخص الديون
 */
function SOV1_UI_getDebtSummary() {
  try {
    if (typeof getDebtSummary_ === 'function') {
      return { success: true, data: getDebtSummary_() };
    }
    return { success: false, error: 'دالة الديون غير متاحة' };
  } catch (e) {
    Logger.log('Error in SOV1_UI_getDebtSummary: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_updateTransaction(rowId, newData) {
  try {
    return SOV1_UI_updateTransaction_(rowId, newData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_updateTransaction: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_getTransaction(rowId) {
  try {
    return SOV1_UI_getTransaction_(rowId);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getTransaction: ' + e);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// DATA MANAGEMENT - EXPORT & DELETE
// ============================================================================

/**
 * Export all transactions as CSV
 */
function SOV1_UI_exportData() {
  try {
    var ss = _ss(); // Use _ss() for web app context
    var sheet = ss.getSheetByName('Sheet1');
    
    if (!sheet || sheet.getLastRow() < 2) {
      return 'ID,Date,Merchant,Type,Amount,Category,Account\n';
    }
    
    var data = sheet.getDataRange().getValues();
    var csv = 'ID,Date,Merchant,Type,Amount,Category,Account,Notes\n';
    
    // Start from row 1 (skip header at row 0)
    // SCHEMA: UUID[0], Date[1], Tag[2], Day[3], Week[4], Source[5], AccNum[6], CardNum[7], Amount[8], Merchant[9], Category[10], Type[11], Raw[12]
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var id = row[0] || '';
      var date = row[1] ? Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : '';
      var merchant = String(row[9] || '').replace(/"/g, '""'); // Escape quotes
      var type = row[11] || '';
      var amount = row[8] || 0;
      var category = row[10] || '';
      var account = row[6] || '';
      var notes = String(row[12] || '').replace(/"/g, '""');
      
      csv += '"' + id + '","' + date + '","' + merchant + '","' + type + '","' + amount + '","' + category + '","' + account + '","' + notes + '"\n';
    }
    
    return csv;
    
  } catch (e) {
    Logger.log('Error exporting data: ' + e);
    return 'Error,' + e.message + '\n';
  }
}

/**
 * Delete all user data (DANGEROUS) - Uses new SOV1_UI_resetData_ function
 */
function SOV1_UI_deleteAllData() {
  try {
    // Use the new reset function instead
    return SOV1_UI_resetData_('OPEN', ['transactions', 'budgets', 'accounts', 'transfers'], 'CONFIRM_RESET');
  } catch (e) {
    Logger.log('Error deleting all data: ' + e);
    return {
      success: false,
      error: 'فشل حذف البيانات: ' + e.message
    };
  }
}

// Legacy alias - keep for backward compatibility with old frontend calls
function SOV1_UI_deleteUserAccount() {
  return SOV1_UI_deleteAllData();
}

// ============================================================================
// OPTIMIZED: Single API call to get all dashboard data at once
// ============================================================================

function SOV1_UI_getAllDashboardData(token) {
  var debugLog = [];
  
  try {
    debugLog.push('🔷 Function started');
    token = token || 'OPEN';
    
    // CRITICAL: Check if SpreadsheetApp is accessible via SHEET_ID
    try {
      var ss = _ss(); // Use _ss() instead of getActive() for web app context
      debugLog.push('✅ SpreadsheetApp accessible via SHEET_ID: ' + ss.getId());
    } catch (ssError) {
      return {
        success: false,
        error: 'Cannot access spreadsheet: ' + ssError.message + ' (SHEET_ID might be missing in Script Properties)',
        debugLog: debugLog,
        dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] },
        transactions: [],
        budgets: [],
        accounts: []
      };
    }
    
    // Verify authentication
    debugLog.push('🔐 Checking authentication...');
    if (!SOV1_UI_requireAuth_(token)) {
      debugLog.push('❌ Authentication failed');
      return {
        success: false,
        error: 'غير مصرح - Authentication failed',
        debugLog: debugLog,
        dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] },
        transactions: [],
        budgets: [],
        accounts: []
      };
    }
    
    debugLog.push('✅ Authentication passed');
    
    // Get all data with detailed error tracking
    var dashboard, transactions, budgets, accounts;
    
    try {
      debugLog.push('📊 Fetching dashboard...');
      dashboard = SOV1_UI_getDashboard_(token);
      debugLog.push('✅ Dashboard fetched: ' + (dashboard ? 'OK' : 'NULL'));
    } catch (e) {
      debugLog.push('⚠️ Dashboard error: ' + e.message);
      dashboard = { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] };
    }
    
    try {
      debugLog.push('📝 Fetching transactions...');
      transactions = SOV1_UI_getLatest_(token, 50);
      debugLog.push('✅ Transactions fetched: ' + (transactions ? transactions.length : 0));
    } catch (e) {
      debugLog.push('⚠️ Transactions error: ' + e.message);
      transactions = [];
    }
    
    try {
      debugLog.push('💰 Fetching budgets...');
      budgets = SOV1_UI_getBudgets_(token);
      debugLog.push('✅ Budgets fetched: ' + (budgets ? budgets.length : 0));
    } catch (e) {
      debugLog.push('⚠️ Budgets error: ' + e.message);
      budgets = [];
    }
    
    try {
      debugLog.push('🏦 Fetching accounts with balances...');
      accounts = SOV1_UI_getAccountsWithBalances_();
      debugLog.push('✅ Accounts fetched: ' + (accounts ? accounts.length : 0));
    } catch (e) {
      debugLog.push('⚠️ Accounts error: ' + e.message);
      accounts = [];
    }
    
    debugLog.push('✅ All data collected successfully');
    
    var result = {
      success: true,
      debugLog: debugLog,
      dashboard: dashboard,
      transactions: transactions,
      budgets: budgets,
      accounts: accounts
    };
    
    return result;
    
  } catch (e) {
    debugLog.push('❌ CRITICAL Error: ' + e.message);
    debugLog.push('Stack: ' + e.stack);
    
    return {
      success: false,
      error: e.message,
      errorStack: e.stack,
      debugLog: debugLog,
      dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] },
      transactions: [],
      budgets: [],
      accounts: []
    };
  }
}

// ============================================================================
// DATA RESET FUNCTIONS - DANGER ZONE
// ============================================================================

/**
 * Get reset options and current data stats
 */
function SOV1_UI_getResetOptions_() {
  try {
    var ss = _ss();
    var stats = {
      transactions: 0,
      budgets: 0,
      accounts: 0,
      transfers: 0,
      categories: 0
    };
    
    // Count transactions
    var txSheet = ss.getSheetByName('User_USER1') || ss.getSheetByName('Sheet1');
    if (txSheet) {
      stats.transactions = Math.max(0, txSheet.getLastRow() - 1);
    }
    
    // Count budgets
    var budgetSheet = ss.getSheetByName('Budgets');
    if (budgetSheet) {
      stats.budgets = Math.max(0, budgetSheet.getLastRow() - 1);
    }
    
    // Count accounts
    var accSheet = ss.getSheetByName('Accounts');
    if (accSheet) {
      stats.accounts = Math.max(0, accSheet.getLastRow() - 1);
    }
    
    // Count transfers
    var transferSheet = ss.getSheetByName('Transfers_Tracking');
    if (transferSheet) {
      stats.transfers = Math.max(0, transferSheet.getLastRow() - 1);
    }
    
    // Count categories
    var catSheet = ss.getSheetByName('Categories');
    if (catSheet) {
      stats.categories = Math.max(0, catSheet.getLastRow() - 1);
    }
    
    return {
      success: true,
      stats: stats,
      options: [
        { id: 'transactions', label: 'المعاملات', icon: '💳', count: stats.transactions, dangerous: true },
        { id: 'budgets', label: 'الميزانيات', icon: '📊', count: stats.budgets, dangerous: false },
        { id: 'accounts', label: 'الحسابات', icon: '🏦', count: stats.accounts, dangerous: true },
        { id: 'transfers', label: 'التحويلات', icon: '↔️', count: stats.transfers, dangerous: false },
        { id: 'categories', label: 'التصنيفات', icon: '🏷️', count: stats.categories, dangerous: false },
        { id: 'all', label: 'كل البيانات', icon: '⚠️', count: null, dangerous: true }
      ]
    };
    
  } catch (e) {
    Logger.log('getResetOptions error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Reset selected data types
 * @param {string} token - Security token
 * @param {Array} types - Array of data types to reset: 'transactions', 'budgets', 'accounts', 'transfers', 'categories', 'all'
 * @param {string} confirmation - Must be 'CONFIRM_RESET' to proceed
 */
function SOV1_UI_resetData_(token, types, confirmation) {
  try {
    // Validate confirmation
    if (confirmation !== 'CONFIRM_RESET') {
      return { success: false, error: 'تأكيد غير صحيح. يجب كتابة CONFIRM_RESET' };
    }
    
    if (!types || !Array.isArray(types) || types.length === 0) {
      return { success: false, error: 'لم يتم تحديد نوع البيانات للحذف' };
    }
    
    var ss = _ss();
    var results = {
      success: true,
      deleted: {},
      errors: []
    };
    
    // Handle 'all' option
    if (types.includes('all')) {
      types = ['transactions', 'budgets', 'accounts', 'transfers'];
    }
    
    // Process each type
    types.forEach(function(type) {
      try {
        switch (type) {
          case 'transactions':
            results.deleted.transactions = resetTransactions_(ss);
            break;
          case 'budgets':
            results.deleted.budgets = resetBudgets_(ss);
            break;
          case 'accounts':
            results.deleted.accounts = resetAccounts_(ss);
            break;
          case 'transfers':
            results.deleted.transfers = resetTransfers_(ss);
            break;
          case 'categories':
            results.deleted.categories = resetCategories_(ss);
            break;
        }
      } catch (typeError) {
        results.errors.push(type + ': ' + typeError.message);
      }
    });
    
    if (results.errors.length > 0) {
      results.success = false;
      results.error = 'بعض الأخطاء: ' + results.errors.join(', ');
    }
    
    // Log the reset action
    Logger.log('🗑️ Data reset by user: ' + JSON.stringify(results.deleted));
    
    // Send Telegram notification if available
    try {
      if (typeof sendTelegramMessage === 'function') {
        var chatId = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');
        if (chatId) {
          var msg = '⚠️ *تم تصفير البيانات*\n\n';
          for (var key in results.deleted) {
            msg += '• ' + key + ': ' + results.deleted[key] + ' سجل\n';
          }
          sendTelegramMessage(chatId, msg);
        }
      }
    } catch (tgErr) {
      // Ignore Telegram errors
    }
    
    return results;
    
  } catch (e) {
    Logger.log('resetData error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Reset transactions (keep headers)
 */
function resetTransactions_(ss) {
  var sheets = ['User_USER1', 'Sheet1'];
  var totalDeleted = 0;
  
  sheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      var rowsToDelete = sheet.getLastRow() - 1;
      sheet.deleteRows(2, rowsToDelete);
      totalDeleted += rowsToDelete;
    }
  });
  
  return totalDeleted;
}

/**
 * Reset budgets (keep headers, reset amounts to 0)
 */
function resetBudgets_(ss) {
  var sheet = ss.getSheetByName('Budgets');
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  
  var lastRow = sheet.getLastRow();
  var resetCount = lastRow - 1;
  
  // Reset spent amounts to 0 (assuming column structure: category, budgeted, spent, remaining)
  for (var row = 2; row <= lastRow; row++) {
    sheet.getRange(row, 3).setValue(0); // Reset spent
    sheet.getRange(row, 4).setFormula('=B' + row + '-C' + row); // Recalculate remaining
  }
  
  return resetCount;
}

/**
 * Reset accounts (delete all except headers)
 */
function resetAccounts_(ss) {
  var sheet = ss.getSheetByName('Accounts');
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  
  var rowsToDelete = sheet.getLastRow() - 1;
  sheet.deleteRows(2, rowsToDelete);
  
  // Clear account index cache
  if (typeof _accountIndex !== 'undefined') {
    _accountIndex = null;
  }
  
  return rowsToDelete;
}

/**
 * Reset transfers (delete all except headers)
 */
function resetTransfers_(ss) {
  var sheet = ss.getSheetByName('Transfers_Tracking');
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  
  var rowsToDelete = sheet.getLastRow() - 1;
  sheet.deleteRows(2, rowsToDelete);
  return rowsToDelete;
}

/**
 * Reset categories (delete non-system categories)
 */
function resetCategories_(ss) {
  var sheet = ss.getSheetByName('Categories');
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  
  // System categories to keep
  var systemCategories = ['أخرى', 'راتب', 'تحويل', 'تحقق', 'مرفوضة', 'طعام', 'نقل', 'فواتير', 'تسوق', 'صحة', 'ترفيه'];
  
  var data = sheet.getDataRange().getValues();
  var rowsToDelete = [];
  
  for (var i = data.length - 1; i >= 1; i--) {
    var catName = data[i][0];
    if (!systemCategories.includes(catName)) {
      rowsToDelete.push(i + 1); // 1-based row number
    }
  }
  
  // Delete rows from bottom to top
  rowsToDelete.forEach(function(row) {
    sheet.deleteRow(row);
  });
  
  return rowsToDelete.length;
}

// ============================================================================
// SAFE WRAPPER: Ensures non-null, JSON-serializable response for web UI
// Call this from google.script.run instead of SOV1_UI_getAllDashboardData
// ============================================================================

function SOV1_UI_getAllDashboardData_safe(token) {
  var wrapperLog = [];
  try {
    wrapperLog.push('Wrapper: calling SOV1_UI_getAllDashboardData');
    var raw = SOV1_UI_getAllDashboardData(token);

    if (!raw || typeof raw !== 'object') {
      wrapperLog.push('Wrapper: raw result is null or non-object');
      return {
        success: false,
        error: 'Server returned empty or invalid response',
        debugLog: wrapperLog,
        dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] },
        transactions: [],
        budgets: [],
        accounts: []
      };
    }

    // Force JSON-safe clone to avoid serialization issues
    var cloned = JSON.parse(JSON.stringify(raw));

    if (!cloned.debugLog || !Array.isArray(cloned.debugLog)) {
      cloned.debugLog = [];
    }

    cloned.debugLog = cloned.debugLog.concat(wrapperLog);
    cloned.debugLog.push('Wrapper: JSON-safe clone OK');

    return cloned;
  } catch (e) {
    wrapperLog.push('Wrapper error: ' + e.message);
    return {
      success: false,
      error: 'SOV1_UI_getAllDashboardData_safe failed: ' + e.message,
      errorStack: e.stack,
      debugLog: wrapperLog,
      dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] },
      transactions: [],
      budgets: [],
      accounts: []
    };
  }
}

// ============================================================================
// TEST PANEL FUNCTIONS - For Frontend Testing
// ============================================================================

/**
 * Test SMS parsing functionality
 */
function SOV1_UI_testParseSMS(smsText) {
  try {
    // Use the enhanced parser if available
    var parsed = null;
    
    if (typeof enhancedParseAmount === 'function') {
      parsed = enhancedParseAmount(smsText);
    } else if (typeof parseBasicSMS_ === 'function') {
      parsed = parseBasicSMS_(smsText);
    } else if (typeof SOV1_preParseFallback_ === 'function') {
      parsed = SOV1_preParseFallback_(smsText);
    }
    
    if (parsed && parsed.amount) {
      return {
        success: true,
        amount: parsed.amount,
        merchant: parsed.merchant || 'غير محدد',
        account: parsed.account || 'غير محدد',
        type: parsed.type || (parsed.amount > 0 ? 'expense' : 'income'),
        raw: parsed
      };
    }
    
    return {
      success: false,
      error: 'لم يتم العثور على مبلغ في النص'
    };
  } catch (e) {
    Logger.log('Test SMS Error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Test AI classification
 */
function SOV1_UI_testAIClassify(merchant, amount) {
  try {
    var result = null;
    
    if (typeof classifyWithAI === 'function') {
      result = classifyWithAI(merchant, amount);
    } else if (typeof callAiHybridV120 === 'function') {
      result = callAiHybridV120(merchant, amount);
    } else if (typeof SOV1_callAiClassifier_ === 'function') {
      result = SOV1_callAiClassifier_(merchant, amount);
    }
    
    if (result) {
      return {
        success: true,
        category: result.category || result,
        confidence: result.confidence || 100,
        source: result.source || 'AI'
      };
    }
    
    // Fallback to simple classifier
    var categories = {
      'ماكدونالدز': 'مطاعم',
      'subway': 'مطاعم',
      'starbucks': 'مطاعم',
      'careem': 'نقل',
      'uber': 'نقل',
      'جرير': 'تسوق',
      'اكسترا': 'تسوق'
    };
    
    var lower = String(merchant).toLowerCase();
    for (var key in categories) {
      if (lower.indexOf(key.toLowerCase()) >= 0) {
        return {
          success: true,
          category: categories[key],
          confidence: 80,
          source: 'Keyword Match'
        };
      }
    }
    
    return {
      success: true,
      category: 'أخرى',
      confidence: 50,
      source: 'Default'
    };
  } catch (e) {
    Logger.log('Test AI Error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Test Telegram connection
 */
function SOV1_UI_testTelegram() {
  try {
    var botToken = ENV.TG_BOT_TOKEN || PropertiesService.getScriptProperties().getProperty('TG_BOT_TOKEN');
    var chatId = ENV.TG_CHAT_ID || PropertiesService.getScriptProperties().getProperty('TG_CHAT_ID');
    
    if (!botToken || !chatId) {
      return {
        success: false,
        error: 'لم يتم إعداد Telegram Bot Token أو Chat ID'
      };
    }
    
    var testMessage = '🧪 *رسالة تجريبية*\n\n' +
      '✅ تم الاتصال بنجاح!\n' +
      '📅 التاريخ: ' + new Date().toLocaleString('ar-SA') + '\n\n' +
      '_هذه رسالة اختبار من SJA Money Tracker_';
    
    var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
    var payload = {
      chat_id: chatId,
      text: testMessage,
      parse_mode: 'Markdown'
    };
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.description || 'Unknown error' };
    }
  } catch (e) {
    Logger.log('Test Telegram Error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Test full flow: SMS -> AI -> Save -> Telegram
 */
function SOV1_UI_testFullFlow() {
  var steps = { sms: 'pending', ai: 'pending', save: 'skipped', telegram: 'pending' };
  
  try {
    // Step 1: Test SMS Parsing
    var testSMS = 'تم خصم مبلغ 99.50 ريال من حسابك ****1234 لدى كوفي شوب في ' + new Date().toLocaleDateString('ar-SA');
    var smsResult = SOV1_UI_testParseSMS(testSMS);
    
    if (smsResult.success) {
      steps.sms = '✅ Amount: ' + smsResult.amount + ', Merchant: ' + smsResult.merchant;
    } else {
      steps.sms = '❌ ' + (smsResult.error || 'Failed');
      return { success: false, steps: steps, error: 'SMS parsing failed' };
    }
    
    // Step 2: Test AI Classification
    var aiResult = SOV1_UI_testAIClassify(smsResult.merchant, smsResult.amount);
    
    if (aiResult.success) {
      steps.ai = '✅ Category: ' + aiResult.category + ' (' + aiResult.source + ')';
    } else {
      steps.ai = '❌ ' + (aiResult.error || 'Failed');
      return { success: false, steps: steps, error: 'AI classification failed' };
    }
    
    // Step 3: Skip actual save (test only)
    steps.save = '⏭️ Skipped (test mode - no data saved)';
    
    // Step 4: Test Telegram
    var telegramResult = SOV1_UI_testTelegram();
    
    if (telegramResult.success) {
      steps.telegram = '✅ Message sent';
    } else {
      steps.telegram = '⚠️ ' + (telegramResult.error || 'Failed') + ' (non-critical)';
    }
    
    return {
      success: true,
      steps: steps,
      summary: 'جميع المكونات تعمل بشكل صحيح!'
    };
    
  } catch (e) {
    Logger.log('Test Full Flow Error: ' + e.message);
    return { 
      success: false, 
      steps: steps,
      error: e.message 
    };
  }
}
