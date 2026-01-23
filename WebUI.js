
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
  if (cached) { try { return JSON.parse(cached); } catch(e){} }

  var sB = _sheet('Budgets');
  var last = sB.getLastRow();
  if (last < 2) return [];
  var cats = sB.getRange(2,1,last-1,1).getValues().map(function(x){return String(x[0]||'').trim();}).filter(Boolean);

  cache.put('UI_CATS', JSON.stringify(cats), 300);
  return cats;
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
    var result = executeUniversalFlowV120(text, 'web_ui', ENV.CHAT_ID || '');
    return { success: true, result: result };
  } catch (e) {
    Logger.log('Add transaction error: ' + e.message);
    throw new Error('فشل إضافة العملية: ' + e.message);
  }
}

/**
 * Save user settings
 */
function SOV1_UI_saveSettings_(settings) {
  try {
    var props = PropertiesService.getScriptProperties();
    var updated = [];
    
    if (settings && settings.name) {
      props.setProperty('OWNER', settings.name);
      updated.push('الاسم');
    }
    
    if (settings && settings.email) {
      props.setProperty('USER_EMAIL', settings.email);
      updated.push('البريد');
    }
    
    if (settings && typeof settings.notifications !== 'undefined') {
      props.setProperty('NOTIFICATIONS_ENABLED', String(settings.notifications));
      updated.push('الإشعارات');
    }
    
    Logger.log('Settings saved: ' + updated.join(', '));
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
  var rows = s1.getRange(start,1,last-start+1,12).getValues();

  var header = ['التاريخ','القناة/المصدر','المبلغ','التاجر','التصنيف','النوع','النص الخام'];
  var lines = [header.join(',')];

  rows.forEach(function(r){
    var date = (r[0] instanceof Date) ? Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : '';
    var src = String(r[4]||'').replace(/"/g,'""');
    var amt = Number(r[7]||0).toFixed(2);
    var merch = String(r[8]||'').replace(/"/g,'""');
    var cat = String(r[9]||'').replace(/"/g,'""');
    var typ = String(r[10]||'').replace(/"/g,'""');
    var raw = String(r[11]||'').replace(/"/g,'""');
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
       var date = row[0]; 
       var amount = Number(row[7]) || 0; 
       var merchant = String(row[8]||''); 
       var category = String(row[9]||'');
       var typ = String(row[10]||'');
       var raw = String(row[11]||'');

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
      // monthly by default
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    var income = 0;
    var expenses = 0;
    var byCategory = {};
    var txCount = 0;
    
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var date = row[0];
      var amount = Number(row[7]) || 0;
      var category = String(row[9] || 'أخرى');
      var typ = String(row[10] || '');
      var raw = String(row[11] || '');
      
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
// OPTIMIZED: Single API call to get all dashboard data at once
// ============================================================================

function SOV1_UI_getAllDashboardData(token) {
  try {
    token = token || 'OPEN';
    
    // Get all data in parallel from sheets (more efficient)
    var dashboard = SOV1_UI_getDashboard_(token);
    var transactions = SOV1_UI_getLatest_(token, 50);
    var budgets = SOV1_UI_getBudgets_(token);
    var accounts = SOV1_UI_getAccounts_();
    
    return {
      success: true,
      dashboard: dashboard,
      transactions: transactions,
      budgets: budgets,
      accounts: accounts
    };
  } catch (e) {
    Logger.log('Error in SOV1_UI_getAllDashboardData: ' + e);
    return {
      success: false,
      error: e.message,
      dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, recent: [], budgets: [] },
      transactions: [],
      budgets: [],
      accounts: []
    };
  }
}

