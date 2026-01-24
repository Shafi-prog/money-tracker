
/***********************
 * Telegram_Commands.gs — Sovereign (إصدار ١)
 *
 * 1) setMyCommands: لتفعيل قائمة أوامر البوت داخل تيليجرام.
 * 2) answerCallbackQuery: لتسريع استجابة أزرار Inline (حتى لا يبقى شريط التحميل).
 *
 * يعتمد على:
 * - Config.gs: ENV.TELEGRAM_TOKEN
 * - Core_Utils.gs: safeNotify (اختياري)
 ***********************/

/**
 * تفعيل قائمة أوامر البوت (تظهر في واجهة Telegram)
 * شغّلها مرة واحدة بعد كل تغيير للأوامر.
 */
function SOV1_setMyCommands_() {
  if (!ENV.TELEGRAM_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN غير موجود في Script Properties');

  var cmds = [
    { command: 'menu', description: '📊 إظهار لوحة التحكم' },
    { command: 'menu_off', description: '❌ إخفاء لوحة التحكم' },
    { command: 'search', description: '🔎 بحث: /search كلمة' },
    { command: 'add', description: '➕ إدخال يدوي: /add مبلغ ثم جهة ثم تصنيف' },
    { command: 'balances', description: '💳 أرصدة جميع الحسابات' },
    { command: 'today', description: '📅 تقرير اليوم' },
    { command: 'week', description: '🗓️ تقرير الأسبوع' },
    { command: 'month', description: '🗓️ تقرير الشهر' },
    { command: 'status', description: '⚙️ حالة النظام' },
    { command: 'help', description: '❓ مساعدة سريعة' }
  ];

  var url = 'https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/setMyCommands';

  var resp = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ commands: cmds }),
    muteHttpExceptions: true
  });

  var code = resp.getResponseCode();
  var body = resp.getContentText();

  // تنبيه سريع (UI أو Telegram أو Console حسب safeNotify)
  try { if (typeof safeNotify === 'function') safeNotify('setMyCommands: ' + code + '\n' + body); } catch (e) {}
  Logger.log(code);
  Logger.log(body);

  return { code: code, body: body };
}

/**
 * يجب استدعاؤها مباشرة عند وصول callback_query
 * لأن عميل Telegram يعرض progress bar حتى يتم الرد.
 */
function SOV1_answerCallback_(callbackQueryId, text, showAlert) {
  if (!ENV.TELEGRAM_TOKEN) return;
  if (!callbackQueryId) return;

  var url = 'https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/answerCallbackQuery';

  UrlFetchApp.fetch(url, {
    method: 'post',
    payload: {
      callback_query_id: String(callbackQueryId),
      text: String(text || 'تم'),
      show_alert: showAlert ? true : false
      // يمكن إضافة cache_time أو url لاحقًا إذا احتجت
    },
    muteHttpExceptions: true
  });
}

/**
 * (اختياري) قراءة أوامر البوت الحالية للتأكد أنها تمّت
 */
function SOV1_getMyCommands_() {
  if (!ENV.TELEGRAM_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN غير موجود');

  var url = 'https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/getMyCommands';
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  var code = resp.getResponseCode();
  var body = resp.getContentText();

  try { if (typeof safeNotify === 'function') safeNotify('getMyCommands: ' + code + '\n' + body); } catch (e) {}
  Logger.log(code);
  Logger.log(body);

  return { code: code, body: body };
}

/**
 * Alias واضح لتفعيل أوامر البوت
 * 📍 الملف: Telegram_Commands.gs
 */
function SETUP_BOT_COMMANDS() {
  return SOV1_setMyCommands_();
}
