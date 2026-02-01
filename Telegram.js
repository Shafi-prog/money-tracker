
/********** Telegram.gs — Sovereign (إصدار ١) **********
 * - إرسال تيليجرام (sendMessage) + لوحة التحكم (Reply Keyboard)
 * - Cache للملخصات لتقليل القراءة من Sheets وتحسين السرعة [2](https://blog.ohheybrian.com/2021/09/using-google-apps-script-as-a-webhook/)
 * - توافق مع دوالك القديمة: V120_sendMenuPanel_ / V120_removeMenuPanel_
 *******************************************************/

function TG_prop_(k, fallback) {
  try { return PropertiesService.getScriptProperties().getProperty(k) || (fallback || ''); }
  catch (e) { return (fallback || ''); }
}

function getHubChatId_() {
  // ✅ Fixed: Check TELEGRAM_CHAT_ID first (main property name)
  var hub = TG_prop_('TELEGRAM_CHAT_ID', '') || TG_prop_('CHANNEL_ID', '') || TG_prop_('ADMIN_CHAT_ID', '') || TG_prop_('CHAT_ID', '') || (ENV.CHAT_ID || '');
  return String(hub || '');
}

function getArchiveChatId_() {
  return String(TG_prop_('ARCHIVE_CHANNEL_ID', '') || '');
}

/** تهريب HTML بسيط */
function escHtml_(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sendTelegramLogged_(chatId, text, extra) {
  if (!ENV.TELEGRAM_TOKEN || !chatId) return { ok: false, code: 0, body: 'missing token/chatId' };

  var payload = Object.assign({
    chat_id: String(chatId),
    text: String(text || ''),
    disable_web_page_preview: true
  }, extra || {});

  var resp = UrlFetchApp.fetch('https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/sendMessage', {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  });

  var code = resp.getResponseCode();
  var body = resp.getContentText();

  if (code !== 200) {
    try {
      // Log chat_id and a short preview of the message for diagnostics
      var preview = String(payload.text || '').slice(0, 300);
      logIngressEvent_('ERROR', 'sendMessage', { code: code, chatId: payload.chat_id, preview: preview }, body);
    } catch (e) {}
  }

  return { ok: (code === 200), code: code, body: body };
}

function sendTelegram_(chatId, text) {
  return sendTelegramLogged_(chatId, text, {});
}

/** ===== لوحة التحكم (Reply Keyboard) ===== */
function sendMenuPanel_(chatId) {
  var hub = String(chatId || getHubChatId_());
  if (!hub) return;

  var keyboard = {
    keyboard: [
      ['📊 تقرير', '📅 اليوم', '🗓️ الأسبوع', '🗓️ الشهر'],
      ['🧾 آخر 5', '🧾 آخر 10', '🔎 بحث', '➕ إدخال يدوي']
    ],
    resize_keyboard: true,
    is_persistent: true
  };

  var msg =
    '🧭 <b>لوحة التحكم</b>\n' +
    '• بحث: <code>بحث: كلمة</code>\n' +
    '• إدخال يدوي: <code>أضف: 45.75\nجهة\nتصنيف</code>\n' +
    '• إخفاء اللوحة: <code>/menu_off</code>';

  sendTelegramLogged_(hub, msg, { parse_mode: 'HTML', reply_markup: JSON.stringify(keyboard) });
}

function removeMenuPanel_(chatId) {
  var hub = String(chatId || getHubChatId_());
  if (!hub) return;
  sendTelegramLogged_(hub, '✅ تم إخفاء لوحة التحكم.', { reply_markup: JSON.stringify({ remove_keyboard: true }) });
}

/** توافق مع أسماء مشروعك الحالية */
function V120_sendMenuPanel_(chatId) { return sendMenuPanel_(chatId); }
function V120_removeMenuPanel_(chatId) { return removeMenuPanel_(chatId); }

/** ===== ملخص Budgets (Cache 15 ثانية) ===== */
function sendBudgetsSnapshotToTelegram_(chatId) {
  var hub = String(chatId || getHubChatId_());
  if (!hub) return;
  
  // Check if budget alerts are enabled
  if (typeof areBudgetAlertsEnabled === 'function' && !areBudgetAlertsEnabled()) {
    Logger.log('Budget snapshot skipped - alerts disabled');
    return;
  }

  var cache = CacheService.getScriptCache();
  var cached = cache.get('BUDGET_SNAP');
  if (cached) { sendTelegram_(hub, cached); return; }

  var rows = _sheet('Budgets').getDataRange().getValues();
  if (rows.length < 2) { sendTelegram_(hub, '📊 لا توجد بيانات ميزانيات بعد.'); return; }

  var totalB = 0, totalC = 0, lines = [];
  for (var i = 1; i < rows.length; i++) {
    var cat = rows[i][0] || '';
    var b = Number(rows[i][1]) || 0;
    var c = Number(rows[i][2]) || 0;
    totalB += b; totalC += c;
    lines.push('• ' + cat + ': المتبقي ' + (b - c).toFixed(2));
  }

  var msg =
    '📊 تقرير الميزانيات\n' +
    'الموازنة: ' + totalB.toFixed(2) + ' SAR\n' +
    'المصروف: ' + totalC.toFixed(2) + ' SAR\n' +
    '━━━━━━━━━━━━\n' + lines.join('\n');

  cache.put('BUDGET_SNAP', msg, 15);
  sendTelegram_(hub, msg);
}

/** ===== تقرير أرصدة الحسابات ===== */
function sendAccountsBalanceReport_(chatId) {
  var hub = String(chatId || getHubChatId_());
  if (!hub) return;
  
  if (typeof getAllBalancesHTML_ === 'function') {
    var html = getAllBalancesHTML_();
    if (!html) {
      sendTelegram_(hub, '⚠️ لا توجد أرصدة مسجلة بعد.');
    } else {
      var msg = 
        '💰 <b>رصد مالي - أرصدة الحسابات</b>\n' + 
        html + '\n\n' + 
        '📝 <i>ملاحظة: الأرصدة تقديرية بناءً على العمليات المسجلة</i>';
      sendTelegram_(hub, msg);
    }
  } else {
    // Fallback if Balances.js not loaded or function missing
    sendTelegram_(hub, '⚠️ وظيفة الأرصدة غير متاحة حالياً (Missing Logic).');
  }
}

/** ===== آخر N ===== */
function sendLastNToTelegram_(chatId, n) {
  n = n || 5;
  var s1 = _sheet('Sheet1');
  var last = s1.getLastRow();
  if (last < 2) { sendTelegram_(chatId, 'لا توجد عمليات بعد.'); return; }

  var start = Math.max(2, last - n + 1);
  var rows = s1.getRange(start, 1, last - start + 1, 13).getValues();
  var out = ['🧾 آخر ' + n + ' عمليات:'];

  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    var dt = (r[1] instanceof Date) ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : '';
    out.push('• ' + dt + ' — ' + (Number(r[8]) || 0).toFixed(2) + ' — ' + (r[9] || '') + ' — ' + (r[10] || ''));
  }
  sendTelegram_(chatId, out.join('\n'));
}

/** ===== ملخص اليوم/الأسبوع/الشهر (Cache 15 ثانية) ===== */
function sendPeriodSummary_(chatId, mode) {
  logIngressEvent_('INFO', 'sendPeriodSummary', {chatId: chatId, mode: mode}, 'start');
  // Check if notifications are enabled
  if (typeof areNotificationsEnabled === 'function' && !areNotificationsEnabled()) {
    sendTelegram_(chatId, 'الإشعارات معطلة في الإعدادات. يمكنك تفعيلها من صفحة الإعدادات.');
    return;
  }
  
  var cache = CacheService.getScriptCache();
  var key = 'SUM_' + mode;
  var cached = cache.get(key);
  if (cached) { sendTelegram_(chatId, cached); return; }

  var now = new Date(), start, end;
  if (mode === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  } else if (mode === 'week') {
    var day = now.getDay();
    var offsetToSat = (day + 1) % 7;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsetToSat, 0, 0, 0);
    end   = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    end   = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  }

  var rows = _sheet('Sheet1').getDataRange().getValues();
  var spend = 0, income = 0, byCat = {};

  for (var i = 1; i < rows.length; i++) {
    var d = rows[i][1];
    if (!(d instanceof Date)) continue;
    if (d < start || d >= end) continue;

    var amt = Number(rows[i][8]) || 0;
    var cat = String(rows[i][10] || 'أخرى');
    var typ = String(rows[i][11] || '');
    var raw = String(rows[i][12] || '');
    var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);

    if (incoming) income += Math.max(amt, 0);
    else { spend += Math.max(amt, 0); byCat[cat] = (byCat[cat] || 0) + Math.max(amt, 0); }
  }

  var title = (mode === 'today') ? '📅 ملخص اليوم' : (mode === 'week' ? '🗓️ ملخص الأسبوع' : '🗓️ ملخص الشهر');
  var top = Object.keys(byCat).sort(function(a,b){return byCat[b]-byCat[a];}).slice(0,6)
    .map(function(k){return '• ' + k + ': ' + byCat[k].toFixed(2);});

  var msg =
    title + '\n' +
    'الدخل: ' + income.toFixed(2) + ' SAR\n' +
    'المصروف: ' + spend.toFixed(2) + ' SAR\n' +
    'الصافي: ' + (income - spend).toFixed(2) + ' SAR\n' +
    (top.length ? ('━━━━━━━━━━━━\nأعلى التصنيفات:\n' + top.join('\n')) : '');

  cache.put(key, msg, 15);
  sendTelegram_(chatId, msg);
}

/**
 * حساب إجمالي المصروف للتصنيف أو التاجر في الشهر الحالي (من الراتب للراتب)
 */
function getMonthlySpendFor_(merchantOrCategory, type) {
  type = type || 'merchant'; // 'merchant' أو 'category'
  
  var s1 = _sheet('Sheet1');
  var rows = s1.getDataRange().getValues();
  
  // تحديد بداية الشهر (يوم نزول الراتب - افتراضياً 27)
  var salaryDay = Number(ENV.SALARY_DAY || 27) || 27;
  var now = new Date();
  var start, end;
  
  if (now.getDate() >= salaryDay) {
    start = new Date(now.getFullYear(), now.getMonth(), salaryDay, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, salaryDay, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - 1, salaryDay, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), salaryDay, 0, 0, 0);
  }
  
  var total = 0;
  var count = 0;
  var searchTerm = String(merchantOrCategory || '').toLowerCase();
  
  for (var i = 1; i < rows.length; i++) {
    var d = rows[i][1]; // Date column
    if (!(d instanceof Date)) continue;
    if (d < start || d >= end) continue;
    
    var merchant = String(rows[i][9] || '').toLowerCase();
    var category = String(rows[i][10] || '').toLowerCase();
    var amt = Number(rows[i][8]) || 0;
    
    var match = false;
    if (type === 'merchant' && merchant.indexOf(searchTerm) !== -1) match = true;
    if (type === 'category' && category.indexOf(searchTerm) !== -1) match = true;
    
    if (match) {
      total += amt;
      count++;
    }
  }
  
  return { total: total, count: count };
}

/** ===== بطاقة عملية (تُستدعى من Flow) ===== */
function sendTransactionReport(ai, sync, src, raw, destChatId) {
  var hub = String(destChatId || getHubChatId_() || '');
  if (!hub) return;

  // Respect notification settings if notification system is present
  try {
    if (typeof areTelegramNotificationsEnabled === 'function' && !areTelegramNotificationsEnabled()) {
      Logger.log('Telegram transaction report skipped - notifications disabled by settings');
      return;
    }
  } catch (e) {
    Logger.log('Notification settings check failed, sending anyway: ' + e);
  }

  var amount = Number(ai && ai.amount ? ai.amount : 0);
  var merchant = (ai && ai.merchant) ? String(ai.merchant) : 'غير محدد';
  var categoryRaw = (ai && ai.category) ? String(ai.category) : 'أخرى';
  var category = categoryRaw;
  var type = (ai && ai.type) ? String(ai.type) : 'حوالة';
  var isIncoming = !!(ai && ai.isIncoming);
  var accNum = (ai && ai.accNum) ? String(ai.accNum) : '';
  var cardNum = (ai && ai.cardNum) ? String(ai.cardNum) : '';
  
  // استخراج رقم الحساب/البطاقة من النص الخام
  if (!accNum && !cardNum && raw) {
    var cardMatch = String(raw).match(/\*{2,}(\d{4})/);
    if (cardMatch) cardNum = cardMatch[1];
    var accMatch = String(raw).match(/حساب\s*(\d{4})/i);
    if (accMatch) accNum = accMatch[1];
  }
  
  // استخراج اسم المستلم من النص الخام (حوالات داخلية)
  if (raw && (merchant === 'غير محدد' || !merchant)) {
    var nameMatch = String(raw).match(/لـ\d+;([^\n]+)/i);
    if (nameMatch) merchant = nameMatch[1].trim();
  }
  
  // استخراج التاريخ والوقت من النص الخام
  var dateStr = '';
  var timeStr = '';
  if (raw) {
    var dateMatch = String(raw).match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    if (dateMatch) dateStr = dateMatch[1];
    var timeMatch = String(raw).match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (timeMatch) timeStr = timeMatch[1];
  }
  if (!dateStr) dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd/M/yy');
  if (timeStr) dateStr = dateStr + ' ' + timeStr;

  // تحديد نوع العملية للعنوان
  var isTransfer = /حوالة/i.test(type) || /حوالة/i.test(category);
  var isPurchase = /شراء|مشتريات|pos/i.test(type) || /سوبرماركت|متجر|مطعم/i.test(category);
  var isWithdrawal = /سحب/i.test(type);
  
  var operationType = 'عملية';
  if (isTransfer) operationType = 'حوالة';
  else if (isWithdrawal) operationType = 'سحب';

  // Normalize category for display
  if (typeof _normalizeCategoryNameArabic_ === 'function') {
    category = _normalizeCategoryNameArabic_(category) || category;
  }
  if (/^pos$/i.test(category) || /^unknown$/i.test(category)) category = 'أخرى';
  if (isTransfer) category = 'تحويل';

  // الرمز حسب الاتجاه
  var directionEmoji = isIncoming ? '⬇️' : '⬆️';
  
  // حساب إجمالي المصروف للتاجر/الشخص
  var aggregationText = '';
  if (merchant && merchant !== 'غير محدد') {
    var monthlyStats = getMonthlySpendFor_(merchant, 'merchant');
    if (monthlyStats && monthlyStats.total > 0) {
      if (isTransfer) {
        if (isIncoming) {
          aggregationText = 'إجمالي ما تم استلامه من ' + escHtml_(merchant) + '\n';
        } else {
          aggregationText = 'إجمالي ما تم إدانته لـ ' + escHtml_(merchant) + '\n';
        }
      } else {
        aggregationText = 'إجمالي ما تم صرفه من متجر ' + escHtml_(merchant) + '\n';
      }
      aggregationText += '💵 ' + monthlyStats.total.toFixed(2) + ' SAR (' + monthlyStats.count + ' عملية)';
    }
  }
  
  // استخراج البنك من النص الخام (حساباتك فقط)
  var bankName = '';
  if (raw) {
    var rawLower = String(raw).toLowerCase();
    if (/saib|ساب|sabb/i.test(rawLower)) bankName = 'ساب';
    else if (/الراجحي|alrajhi/i.test(rawLower)) bankName = 'الراجحي';
    else if (/tiqmo/i.test(rawLower)) bankName = 'tiqmo';
    else if (/tamara|تمارا/i.test(rawLower)) bankName = 'Tamara';
  }
  
  // تحديد الحساب للعرض
  var accountDisplay = cardNum || accNum || '';
  var accountName = '';
  try {
    if (typeof getAccountInfoForNotification_ === 'function') {
      var accInfo = getAccountInfoForNotification_(ai || {});
      if (accInfo && accInfo.nameEn) accountName = accInfo.nameEn;
    }
  } catch (eAcc) {}
  
  // ===== التنسيق المطلوب =====
  var html = '✅ <b>رصـد مـالـي • ' + escHtml_(operationType) + '</b>\n';
  html += '━━━━━━━━━━━━━━\n';

  var accLabel = accountDisplay ? (accountName ? (accountName + ' • ' + accountDisplay) : accountDisplay) : '';
  var partyLabel = isTransfer ? (isIncoming ? 'من' : 'إلى') : 'المتجر';
  var partyValue = isTransfer ? merchant : merchant;

  var table = [];
  table.push('التاريخ    | ' + dateStr);
  table.push('المبلغ     | ' + amount.toFixed(2) + ' SAR ' + directionEmoji);
  if (accLabel) table.push('الحساب    | ' + accLabel);
  if (bankName) table.push('البنك     | ' + bankName);
  table.push(partyLabel + padLabel_(partyLabel) + ' | ' + partyValue);
  table.push('التصنيف    | ' + category);

  html += '<pre>' + escHtml_(table.join('\n')) + '</pre>';
  
  // عرض جميع الأرصدة الحالية
  if (typeof getAllBalancesHTML_ === 'function') {
    var balancesHTML = getAllBalancesHTML_();
    if (balancesHTML) {
      html += balancesHTML;
    }
  }
  
  // إجمالي المصروف/الإدانة
  if (aggregationText) {
    html += '━━━━━━━━━━━━━━\n';
    html += aggregationText + '\n';
  }
  
  // النص الأصلي مختصر
  var rawPreview = String(raw || '').slice(0, 100);
  if (rawPreview) {
    html += '━━━━━━━━━━━━━━\n';
    html += '📝 النص الأصلي:\n';
    html += '<code>' + escHtml_(rawPreview) + '</code>';
  }

  // ✅ إرسال بدون أزرار - استخدم /commands فقط
  sendTelegramLogged_(hub, html, { parse_mode: 'HTML' });

  var arch = getArchiveChatId_();
  if (arch && arch !== hub) sendTelegramLogged_(arch, html, { parse_mode: 'HTML' });
}

/** ===== تقرير اليوم ===== */
function sendTodayReport_(chatId) {
  sendPeriodSummary_(chatId, 'today');
}

/** Alias للتوافق */
function SOV1_sendDailyReport_(chatId) {
  sendTodayReport_(chatId);
}

/** ===== بحث في المعاملات ===== */
function searchTransactions_(chatId, query) {
  query = String(query || '').trim().toLowerCase();
  if (!query) {
    sendTelegram_(chatId, '🔎 الرجاء تحديد كلمة البحث.\nمثال: بحث: جرير');
    return;
  }
  
  var rows = _sheet('Sheet1').getDataRange().getValues();
  var matches = [];
  
  for (var i = Math.max(1, rows.length - 100); i < rows.length; i++) {
    var merchant = String(rows[i][9] || '').toLowerCase();
    var category = String(rows[i][10] || '').toLowerCase();
    var raw = String(rows[i][12] || '').toLowerCase();
    
    if (merchant.indexOf(query) !== -1 || category.indexOf(query) !== -1 || raw.indexOf(query) !== -1) {
      matches.push({
        date: rows[i][1],
        amount: Number(rows[i][8]) || 0,
        merchant: rows[i][9] || '',
        category: rows[i][10] || ''
      });
    }
  }
  
  if (matches.length === 0) {
    sendTelegram_(chatId, '🔎 لم يتم العثور على نتائج لـ: ' + query);
    return;
  }
  
  var out = ['🔎 <b>نتائج البحث عن:</b> ' + query + '\n'];
  var take = Math.min(10, matches.length);
  
  for (var j = matches.length - 1; j >= Math.max(0, matches.length - take); j--) {
    var m = matches[j];
    var dt = (m.date instanceof Date) ? Utilities.formatDate(m.date, Session.getScriptTimeZone(), 'MM/dd') : '';
    out.push('• ' + dt + ' — ' + m.amount.toFixed(2) + ' — ' + m.merchant);
  }
  
  if (matches.length > take) {
    out.push('\n📊 عدد النتائج الكلي: ' + matches.length);
  }
  
  sendTelegramLogged_(chatId, out.join('\n'), { parse_mode: 'HTML' });
}

function padLabel_(label) {
  var base = '        ';
  var len = String(label || '').length;
  return base.slice(Math.min(len, base.length));
}

/** ===== إدخال يدوي سريع ===== */
function addManualTransaction_(chatId, payload) {
  var s = String(payload || '').trim();
  if (!s) {
    sendTelegram_(chatId, '➕ الصيغة: /add مبلغ | جهة | تصنيف');
    return;
  }

  var parts = s.split('|').map(function(x){return x.trim();}).filter(Boolean);
  if (parts.length < 3) parts = s.split(/[\n،,]/).map(function(x){return x.trim();}).filter(Boolean);
  if (parts.length < 3) {
    sendTelegram_(chatId, '➕ الصيغة: /add مبلغ | جهة | تصنيف');
    return;
  }

  var amountStr = normalizeNumber_(parts[0]).replace(/[^0-9.\-]/g, '');
  var amt = Number(amountStr);
  if (!isFinite(amt) || amt === 0) {
    sendTelegram_(chatId, '❌ المبلغ غير صالح');
    return;
  }

  var merchant = parts[1];
  var category = parts.slice(2).join(' | ');
  var isIncoming = amt < 0;
  var amount = Math.abs(amt);

  var ai = {
    merchant: merchant,
    amount: amount,
    currency: 'SAR',
    category: category,
    type: isIncoming ? 'حوالة' : 'مشتريات',
    isIncoming: isIncoming,
    accNum: '',
    cardNum: ''
  };

  var sync = (typeof insertTransaction_ === 'function')
    ? insertTransaction_(ai, 'MANUAL', 'Manual: ' + s)
    : saveTransaction(ai, 'Manual: ' + s, 'MANUAL');

  ai.uuid = sync && sync.uuid ? sync.uuid : '';
  sendTransactionReport(ai, sync, 'MANUAL', 'Manual: ' + s, chatId);
  sendTelegram_(chatId, '✅ تم تسجيل الإدخال اليدوي');
}

/** ===== آخر N معاملات ===== */
function sendLastNTransactions_(chatId, n) {
  sendLastNToTelegram_(chatId, n);
}

/** ===== إرسال أرصدة جميع الحسابات ===== */
function sendAllBalancesToTelegram_(chatId) {
  // Reuse the function we added previously
  if (typeof sendAccountsBalanceReport_ === 'function') {
    return sendAccountsBalanceReport_(chatId);
  }

  // Fallback implementation if specific function is missing
  chatId = String(chatId || getHubChatId_());
  if (!chatId) return;

  if (typeof getAllBalancesHTML_ === 'function') {
    var html = getAllBalancesHTML_();
    if (html) {
      sendTelegram_(chatId, '<b>💳 الأرصدة الحالية (تقديرية)</b>\n' + html);
      return;
    }
  }

  sendTelegram_(chatId, '⚠️ تعذر جلب الأرصدة.');
}

// Backward compatibility alias
var sendSovereignReportV120 = sendTransactionReport;
