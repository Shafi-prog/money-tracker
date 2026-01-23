
/*******************************************************
 * Ingress.gs
 * استقبال الرسائل النصية (SMS) عبر Webhook إلى Google Apps Script
 * 
 * ✅ أفضل الممارسات للأنظمة المالية:
 * 1. معالجة فورية مع LockService لمنع التضارب
 * 2. Fallback إلى Queue عند فشل المعالجة الفورية
 * 3. منع التكرار (Dedup)
 * 4. تجاهل رسائل OTP/Declined/Hold
 * 
 * 📱 ملاحظة iPhone:
 * - iPhone Shortcuts لا يعمل بدون إنترنت
 * - الرسائل التي تصل أثناء انقطاع الإنترنت لن تُرسل
 * - الحل: استخدام تطبيق طرف ثالث مع Local Storage (مستقبلاً)
 *******************************************************/

/**
 * نقطة دخول Webhook (POST)
 * تدعم:
 * 1) Telegram Updates (message, channel_post)
 * 2) JSON: { from, body, date, id, provider }
 * 3) form-urlencoded: body=...&from=... (مثل بعض خدمات الـ forwarder)
 */
function doPost(e) {
  try {
    var rawBody = (e && e.postData && e.postData.contents) ? String(e.postData.contents) : "";
    
    // ✅ تحقق من Telegram Update أولاً
    if (rawBody && rawBody.charAt(0) === '{') {
      try {
        var obj = JSON.parse(rawBody);
        if (obj.update_id || obj.message || obj.channel_post || obj.callback_query) {
          return handleTelegramWebhook_(obj);
        }
      } catch (parseErr) {
        // ليس Telegram، تابع للمعالجة العادية
      }
    }
    
    // معالجة iPhone/SMS العادية
    var req = normalizeRequest_(e);

    // تحقق سريع
    if (!req.body || !String(req.body).trim()) {
      return json_(400, { ok: false, error: "رسالة فارغة" });
    }

    var text = String(req.body).trim();

    // تجاهل OTP / Declined / Hold
    if (shouldIgnoreMessage_(text)) {
      return json_(200, {
        ok: true,
        ignored: true,
        reason: "OTP/Declined/Hold/NonFinancial",
        preview: text.slice(0, 80)
      });
    }

    // منع التكرار
    if (isDuplicate_(req)) {
      return json_(200, {
        ok: true,
        duplicate: true,
        preview: text.slice(0, 80)
      });
    }

    var source = req.source || "iphone";
    var flowResult = null;
    var flowError = null;
    var usedQueue = false;

    // ✅ محاولة معالجة فورية مع Lock
    var lock = LockService.getScriptLock();
    var gotLock = lock.tryLock(5000); // انتظر 5 ثواني كحد أقصى

    if (gotLock) {
      try {
        if (typeof executeUniversalFlowV120 === "function") {
          executeUniversalFlowV120(text, source, null);
          flowResult = "OK";
        } else {
          flowError = "executeUniversalFlowV120 غير موجودة";
        }
      } catch (flowErr) {
        flowError = String(flowErr);
        // ✅ Fallback: أضف للـ Queue عند فشل المعالجة
        try {
          if (typeof SOV1_enqueue_ === "function") {
            SOV1_enqueue_(source, text, { from: req.from, error: flowError }, null);
            usedQueue = true;
            flowError += " (تم إضافته للـ Queue)";
          }
        } catch (qErr) {
          flowError += " | Queue error: " + String(qErr);
        }
      } finally {
        lock.releaseLock();
      }
    } else {
      // ⚠️ لم نحصل على Lock (رسائل متعددة في نفس الوقت)
      // أضف للـ Queue لمعالجتها لاحقاً
      try {
        if (typeof SOV1_enqueue_ === "function") {
          SOV1_enqueue_(source, text, { from: req.from, reason: "Lock busy" }, null);
          usedQueue = true;
          flowResult = "QUEUED";
        } else {
          flowError = "Lock مشغول و Queue غير متاح";
        }
      } catch (qErr) {
        flowError = "Lock مشغول | Queue error: " + String(qErr);
      }
    }

    // ضع بصمة للتكرار بعد نجاح المعالجة
    markDuplicate_(req);

    return json_(200, {
      ok: true,
      processed: !usedQueue,
      queued: usedQueue,
      source: source,
      flowResult: flowResult,
      flowError: flowError,
      preview: text.slice(0, 80)
    });

  } catch (err) {
    return json_(500, {
      ok: false,
      error: String(err && err.stack ? err.stack : err)
    });
  }
}

/**
 * نقطة فحص (GET) - عرض لوحة التحكم HTML المتقدمة
 */
function doGet(e) {
  // Always route to modern unified UI (index.html)
  // Support ?page parameter for routing within the SPA
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'index';
  var mode = e && e.parameter && e.parameter.mode;
  var ui = e && e.parameter && e.parameter.ui;
  
  // CLI mode for debugging
  if (mode === 'cli') {
    if (!e.parameter) e.parameter = {};
    return SOV1_UI_doGet_(e);
  }
  
  // Classic/legacy UI request
  if (ui === 'classic' || page === 'Dashboard') {
    if (!e.parameter) e.parameter = {};
    e.parameter.page = 'Dashboard';
    return SOV1_UI_doGet_(e);
  }
  
  // Default: Modern unified UI (index.html)
  if (!e.parameter) e.parameter = {};
  e.parameter.page = 'index';
  return SOV1_UI_doGet_(e);
}

/* =====================================================
 * التطبيع (Normalization)
 * ===================================================== */

function normalizeRequest_(e) {
  var nowIso = new Date().toISOString();
  var ct = (e && e.postData && e.postData.type) ? String(e.postData.type) : "";
  var rawBody = (e && e.postData && e.postData.contents) ? String(e.postData.contents) : "";

  var obj = {};
  var source = "unknown";
  var provider = "unknown";

  // 1) JSON
  if (ct.indexOf("application/json") !== -1) {
    source = "json";
    provider = "webhook-json";
    try {
      obj = rawBody ? JSON.parse(rawBody) : {};
    } catch (parseErr) {
      // إذا فشل الـ JSON نحاول اعتباره نصًا
      obj = { body: rawBody };
    }
  } else {
    // 2) form-urlencoded أو parameters
    source = "form";
    provider = "webhook-form";
    obj = {};
    // e.parameter في Apps Script يجمع query+form عادة
    if (e && e.parameter) {
      obj = e.parameter;
    } else if (rawBody) {
      obj = parseQueryString_(rawBody);
    }
  }

  // أسماء حقول شائعة
  var body = pickFirst_(obj, ["body", "message", "text", "sms", "content", "sms_text"]);
  var from = pickFirst_(obj, ["from", "sender", "msisdn", "phone"]);
  var messageId = pickFirst_(obj, ["id", "messageId", "smsId", "sid"]);
  var receivedAt = pickFirst_(obj, ["date", "time", "timestamp", "receivedAt"]) || nowIso;

  // إذا التاريخ رقم (Epoch) نحوله
  receivedAt = normalizeDate_(receivedAt);

  return {
    source: source,
    provider: provider,
    messageId: messageId ? String(messageId) : null,
    from: from ? String(from) : null,
    body: body ? String(body) : null,
    receivedAt: receivedAt,
    raw: {
      contentType: ct || null,
      rawBody: rawBody || null,
      fields: obj || {}
    }
  };
}

function parseQueryString_(qs) {
  var out = {};
  if (!qs) return out;
  qs.split("&").forEach(function (pair) {
    var p = pair.split("=");
    var k = decodeURIComponent((p[0] || "").replace(/\+/g, " ")).trim();
    var v = decodeURIComponent((p[1] || "").replace(/\+/g, " ")).trim();
    if (k) out[k] = v;
  });
  return out;
}

function pickFirst_(obj, keys) {
  if (!obj) return null;
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
      return obj[k];
    }
  }
  return null;
}

function normalizeDate_(value) {
  if (!value) return new Date().toISOString();

  // إذا رقم كبير: epoch milliseconds/seconds
  var s = String(value).trim();
  if (/^\d+$/.test(s)) {
    var n = Number(s);
    if (n > 1000000000000) { // ms
      return new Date(n).toISOString();
    }
    if (n > 1000000000) { // sec
      return new Date(n * 1000).toISOString();
    }
  }

  // محاولة Date.parse
  var t = Date.parse(s);
  if (!isNaN(t)) return new Date(t).toISOString();

  return new Date().toISOString();
}

/* =====================================================
 * تجاهل رسائل OTP/Declined/Hold
 * ===================================================== */

/**
 * يرجع true إذا كانت الرسالة ليست عملية مالية ينبغي إدخالها
 * أمثلة:
 * - OTP / رمز تحقق
 * - Declined / مرفوضة
 * - Hold / معلّقة
 * - Pending / قيد الانتظار
 * - Reversed / تم عكس العملية
 * - رسائل ترويج / تحديثات عامة
 */
function shouldIgnoreMessage_(text) {
  var t = normalizeText_(text);

  // 1) OTP / تحقق
  var otpPatterns = [
    /otp\b/i,
    /one\s*time\s*password/i,
    /رمز\s*(التحقق|التفعيل|الدخول|الأمان|السري)/,
    /كود\s*(التحقق|التفعيل)/,
    /كلمة\s*مرور\s*لمرة\s*واحدة/,
    /لا\s*تشارك\s*(هذا\s*)?الرمز/,
    /\bpasscode\b/i
  ];

  // 2) رفض/تعليق/قيد الانتظار/عكس
  var declineHoldPatterns = [
    /\bdeclined\b/i,
    /\bdenied\b/i,
    /مرفوض/,
    /تم\s*رفض/,
    /تعذر\s*إتمام/,
    /لم\s*تتم\s*(العملية|المعاملة)/,
    /\bhold\b/i,
    /معلّق/,
    /تعليق/,
    /\bpending\b/i,
    /قيد\s*(الانتظار|المعالجة)/,
    /\breversed\b/i,
    /تم\s*عكس/,
    /استرجاع/,
    /\brefunded\b/i,
    /تم\s*إرجاع/
  ];

  // 3) رسائل غير مالية شائعة (اختياري)
  var nonFinancialPatterns = [
    /عرض\s*خاص/,
    /خصم\s*على/,
    /نقاط\s*مكافآت/,
    /تم\s*تغيير\s*كلمة\s*المرور/,
    /تحديث\s*البيانات/,
    /تنبيه\s*أمني/
  ];

  if (matchesAny_(t, otpPatterns)) return true;
  if (matchesAny_(t, declineHoldPatterns)) return true;
  if (matchesAny_(t, nonFinancialPatterns)) return true;

  // قاعدة إضافية: إذا لا يوجد أي رقم مبلغ إطلاقاً غالباً ليست عملية (عدّلها حسب رسائلك)
  // مثال: عملية مالية غالبًا تحتوي مبلغ + عملة
  var hasAmount = /(\d+[.,]\d+|\d+)\s*(sar|riyal|ريال|ر\.س|رس)/i.test(t) || /(\d+[.,]\d+|\d+)/.test(t);
  if (!hasAmount) {
    // لا نجعلها تجاهل قطعي دائمًا، لكن نطبقها كتصفية خفيفة
    // إن رغبت، اجعلها false
    return false;
  }

  return false;
}

function normalizeText_(text) {
  return String(text || "")
    .replace(/\u200f|\u200e/g, "")   // علامات اتجاه
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAny_(text, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    if (patterns[i].test(text)) return true;
  }
  return false;
}

/* =====================================================
 * Dedup (منع التكرار)
 * ===================================================== */

function duplicateKey_(req) {
  var from = req.from || "";
  var body = req.body || "";
  // نافذة زمنية: نقرّب الوقت إلى 2 دقيقة لتقليل تكرار نفس الإرسال
  var d = new Date(req.receivedAt);
  var bucket = Math.floor(d.getTime() / (2 * 60 * 1000)); // 2 min bucket
  return Utilities.base64EncodeWebSafe(from + "|" + body + "|" + bucket);
}

function isDuplicate_(req) {
  var key = "dup:" + duplicateKey_(req);
  var props = PropertiesService.getScriptProperties();
  return props.getProperty(key) === "1";
}

function markDuplicate_(req) {
  var key = "dup:" + duplicateKey_(req);
  var props = PropertiesService.getScriptProperties();
  props.setProperty(key, "1");
  // تنظيف بسيط: لا يوجد TTL في ScriptProperties، يمكن لاحقًا عمل مهمة تنظيف
}

/* =====================================================
 * enqueue (توافق مع الموجود لديك)
 * ===================================================== */

/**
 * يحاول إدخال الرسالة في الطابور باستخدام أي دالة موجودة سابقًا عندك.
 * عدّل أسماء الدوال هنا إذا كانت مختلفة تماماً في مشروعك.
 */
function enqueueCompat_(payload) {
  // SOV1_enqueue_ (الدالة الرئيسية في Queue.js)
  if (typeof SOV1_enqueue_ === "function") {
    var source = payload.source || payload.provider || "iphone";
    var text = payload.body || "";
    var meta = { from: payload.from, receivedAt: payload.receivedAt, raw: payload.raw };
    return SOV1_enqueue_(source, text, meta, null);
  }

  // إذا لا يوجد أي دالة، نرمي خطأ واضح
  throw new Error("لم يتم العثور على دالة enqueue في المشروع الحالي. أضف SOV1_enqueue_ في Queue.js");
}

/* =====================================================
 * JSON Response helper
 * ===================================================== */

function json_(status, obj) {
  var output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  // Apps Script لا يدعم تعيين status code مباشرة في كل الحالات،
  // لكن نعيد status في الـ JSON ونستخدم 200 غالبًا.
  // إن كان لديك WebApp متقدم يمكنك تجاهل هذه الملاحظة.
  return output;
}

/* =====================================================
 * Telegram Webhook Handler
 * ===================================================== */

/**
 * معالجة رسائل Telegram (من المجموعة أو القناة أو الشات الخاص)
 * يمكنك لصق رسائل SMS هنا وستتم معالجتها!
 */
function handleTelegramWebhook_(update) {
  try {
    // 0) Dedup حسب update_id لمنع تكرار المعالجة
    if (update && update.update_id && isDuplicateTelegramUpdate_(update.update_id)) {
      return json_(200, { ok: true, type: "dup_update" });
    }

    // 1) Callback Query (أزرار)
    if (update.callback_query) {
      if (typeof SOV1_handleCallback_ === "function") {
        SOV1_handleCallback_(update.callback_query);
      }
      return json_(200, { ok: true, type: "callback" });
    }
    
    // 2) Message أو Channel Post
    var msg = update.message || update.channel_post || {};
    var chatId = msg.chat ? String(msg.chat.id) : "";
    var text = msg.text || "";
    
    if (!text || !text.trim()) {
      return json_(200, { ok: true, type: "no_text" });
    }
    
    text = text.trim();

    // Dedup نصوص Telegram لتفادي التكرار عند إعادة الإرسال
    if (isDuplicateTelegramText_(chatId, text)) {
      return json_(200, { ok: true, type: "dup_text" });
    }
    
    // 3) تحقق من الأوامر
    if (text.charAt(0) === '/') {
      return handleTelegramCommand_(chatId, text, msg);
    }
    
    // 4) تحقق من أوامر لوحة التحكم
    var panelResult = handlePanelCommand_(chatId, text);
    if (panelResult) {
      return json_(200, { ok: true, type: "panel_command" });
    }
    
    // 5) ✅ معالجة غير متزامنة (Async Queue) - الحل الجذري للبطء
    // نضعها في الطابور ونعيد 200 OK فوراً
    var source = update.channel_post ? "قناة الرصد" : "تليجرام (يدوي)";
    
    try {
      if (typeof SOV1_enqueue_ === 'function') {
        SOV1_enqueue_(source, text, { chatId: chatId, updateId: update.update_id }, null);
        return json_(200, { ok: true, queued: true });
      } else {
        // Fallback if Queue not found (should not happen in this setup)
        var lock = LockService.getScriptLock();
        if (lock.tryLock(5000)) {
           try {
             executeUniversalFlowV120(text, source, chatId);
           } finally {
             lock.releaseLock();
           }
        }
        return json_(200, { ok: true, processed: true, mode: 'sync_fallback' });
      }
    } catch (e) {
      return json_(500, { ok: false, error: String(e) });
    }
    
  } catch (err) {
    return json_(500, { ok: false, error: String(err) });
  }
}

/**
 * منع تكرار تحديثات Telegram حسب update_id
 */
function isDuplicateTelegramUpdate_(updateId) {
  if (!updateId) return false;
  var cache = CacheService.getScriptCache();
  var key = 'tg_upd_' + updateId;
  if (cache.get(key)) return true;
  cache.put(key, '1', 6 * 60 * 60); // 6 ساعات
  return false;
}

/**
 * منع تكرار نص Telegram خلال مدة قصيرة
 */
function isDuplicateTelegramText_(chatId, text) {
  if (!text) return false;
  var norm = String(text).replace(/\s+/g, ' ').trim();
  var basis = String(chatId || '') + '|' + norm;
  var sig = Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, basis)
  ).slice(0, 24);

  var cache = CacheService.getScriptCache();
  var key = 'tg_txt_' + sig;
  if (cache.get(key)) return true;
  cache.put(key, '1', 15 * 60); // 15 دقيقة
  return false;
}

/**
 * اختبار إدخال رسالة Telegram بدون Webhook
 * 📍 الملف: Ingress.gs
 */
function TEST_TELEGRAM_MESSAGE_() {
  var text = 'شراء انترنت\nمبلغ: SAR 239.05\nبطاقة: *3449 - mada (Ecommerce)\nلدى: MADFU\nفي: 15:19 2026-01-11';
  var chatId = (typeof getHubChatId_ === 'function') ? getHubChatId_() : (ENV.CHAT_ID || ENV.ADMIN_CHAT_ID || ENV.CHANNEL_ID || '');
  var res = executeUniversalFlowV120(text, 'TEST_TELEGRAM', chatId);
  Logger.log(JSON.stringify(res));
  return res;
}

/**
 * معالجة أوامر Telegram (تبدأ بـ /)
 */
function handleTelegramCommand_(chatId, text, msg) {
  var cmd = text.split(/\s+/)[0].toLowerCase();
  
  switch (cmd) {
    case '/menu':
    case '/start':
      if (typeof sendMenuPanel_ === "function") sendMenuPanel_(chatId);
      break;
      
    case '/menu_off':
      if (typeof removeMenuPanel_ === "function") removeMenuPanel_(chatId);
      break;
      
    case '/today':
    case '/اليوم':
      if (typeof sendTodayReport_ === "function") sendTodayReport_(chatId);
      else if (typeof SOV1_sendDailyReport_ === "function") SOV1_sendDailyReport_(chatId);
      break;

    case '/week':
    case '/الأسبوع':
      if (typeof sendPeriodSummary_ === "function") sendPeriodSummary_(chatId, 'week');
      break;

    case '/month':
    case '/الشهر':
      if (typeof sendPeriodSummary_ === "function") sendPeriodSummary_(chatId, 'month');
      break;
      
    case '/last':
    case '/آخر':
      if (typeof SOV1_sendLastActionCard_ === "function") SOV1_sendLastActionCard_(chatId);
      break;
      
    case '/budgets':
    case '/ميزانية':
      if (typeof sendBudgetsSnapshotToTelegram_ === "function") sendBudgetsSnapshotToTelegram_();
      break;

    case '/search':
      if (typeof searchTransactions_ === 'function') {
        var q = text.replace(/^\/search/i, '').trim();
        if (!q) sendTelegram_(chatId, '🔎 اكتب: /search كلمة');
        else searchTransactions_(chatId, q);
      }
      break;

    case '/add':
      if (typeof addManualTransaction_ === 'function') {
        var payload = text.replace(/^\/add/i, '').trim();
        if (!payload) sendTelegram_(chatId, '➕ الصيغة: /add مبلغ | جهة | تصنيف');
        else addManualTransaction_(chatId, payload);
      }
      break;
      
    case '/help':
    case '/مساعدة':
      sendTelegram_(chatId, 
        "📋 <b>الأوامر المتاحة:</b>\n\n" +
        "/menu - إظهار لوحة التحكم\n" +
        "/today - تقرير اليوم\n" +
        "/week - تقرير الأسبوع\n" +
        "/month - تقرير الشهر\n" +
        "/last - آخر عملية\n" +
        "/budgets - ملخص الميزانية\n\n" +
        "💡 <b>لمعالجة رسالة SMS:</b>\n" +
        "فقط الصقها هنا وسيتم معالجتها تلقائياً!"
      );
      break;

    case '/status':
      if (typeof API_getStats === 'function') {
        var r = API_getStats();
        if (r && r.success && r.data) {
          sendTelegram_(chatId,
            '📊 حالة النظام\n' +
            'عدد العمليات: ' + r.data.totalTransactions + '\n' +
            'مصروف اليوم: ' + Number(r.data.todaySpent || 0).toFixed(2) + ' SAR\n' +
            'مصروف الشهر: ' + Number(r.data.monthSpent || 0).toFixed(2) + ' SAR'
          );
        }
      }
      break;
      
    default:
      // أمر غير معروف - ربما رسالة عادية
      break;
  }
  
  return json_(200, { ok: true, type: "command", cmd: cmd });
}

/**
 * معالجة أوامر لوحة التحكم (الأزرار)
 */
function handlePanelCommand_(chatId, text) {
  var t = text.trim();
  
  if (t === '📊 تقرير' || t === '📅 اليوم') {
    if (typeof sendTodayReport_ === "function") sendTodayReport_(chatId);
    else if (typeof SOV1_sendDailyReport_ === "function") SOV1_sendDailyReport_(chatId);
    return true;
  }

  if (t === '🗓️ الأسبوع') {
    if (typeof sendPeriodSummary_ === "function") sendPeriodSummary_(chatId, 'week');
    return true;
  }

  if (t === '🗓️ الشهر') {
    if (typeof sendPeriodSummary_ === "function") sendPeriodSummary_(chatId, 'month');
    return true;
  }
  
  if (t === '🧾 آخر 5' || t === '🧾 آخر 10') {
    var n = t.indexOf('5') !== -1 ? 5 : 10;
    if (typeof sendLastNTransactions_ === "function") sendLastNTransactions_(chatId, n);
    return true;
  }
  
  if (t.indexOf('بحث:') === 0 || t.indexOf('🔎') !== -1) {
    var query = t.replace(/^(بحث:|🔎\s*بحث)/i, '').trim();
    if (query && typeof searchTransactions_ === "function") {
      searchTransactions_(chatId, query);
    }
    return true;
  }

  if (t.indexOf('➕') === 0 || t.indexOf('إدخال يدوي') !== -1) {
    sendTelegram_(chatId, '➕ الصيغة: /add مبلغ | جهة | تصنيف');
    return true;
  }
  
  return false; // ليس أمر لوحة تحكم
}

/* =====================================================
 * اختبار محلي داخل Apps Script
 * ===================================================== */

function _test_shouldIgnoreMessage() {
  var samples = [
    "رمز التحقق الخاص بك هو 123456 لا تشاركه مع أحد",
    "Transaction Declined for SAR 120.00 at STORE",
    "تم تعليق العملية Hold بمبلغ 50 ريال",
    "تم شراء بمبلغ 14.50 ريال من مطعم",
    "SAR 75.00 spent at Carrefour"
  ];
  samples.forEach(function (s) {
    Logger.log("%s => ignore=%s", s, shouldIgnoreMessage_(s));
  });
}
