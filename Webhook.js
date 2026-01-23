
/********** Webhook.gs — Sovereign (إصدار ١) **********/

/**
 * إعداد Webhook للتليجرام
 * شغل هذه الدالة مرة واحدة بعد نشر Web App
 */
function SETUP_TELEGRAM_WEBHOOK() {
  var token = ENV.TELEGRAM_TOKEN;
  if (!token) {
    Logger.log('❌ TELEGRAM_BOT_TOKEN غير موجود في Script Properties!');
    throw new Error('TELEGRAM_BOT_TOKEN غير موجود');
  }
  
  // الحصول على URL - نجرب من Properties أولاً ثم من ScriptApp
  var webAppUrl = ENV.WEBAPP_URL || '';
  
  // إذا لم يكن موجوداً في Properties، نحاول من ScriptApp
  if (!webAppUrl) {
    webAppUrl = ScriptApp.getService().getUrl() || '';
  }
  
  // ❗ التحقق من أن الرابط صالح (يحتوي /exec)
  if (!webAppUrl || webAppUrl.indexOf('/exec') === -1) {
    Logger.log('═══════════════════════════════════════════════════════════════════════');
    Logger.log('❌ مشكلة! الرابط غير صالح أو يستخدم /dev');
    Logger.log('═══════════════════════════════════════════════════════════════════════');
    Logger.log('');
    Logger.log('🛠️ الحل:');
    Logger.log('1. انسخ رابط Web App المنشور (الذي يحتوي /exec)');
    Logger.log('2. اذهب إلى Project Settings (⚙️) > Script Properties');
    Logger.log('3. أضف Property جديد:');
    Logger.log('   Name: WEBAPP_URL');
    Logger.log('   Value: (الصق رابط /exec هنا)');
    Logger.log('4. شغل هذه الدالة مرة أخرى');
    Logger.log('');
    Logger.log('📍 الرابط الحالي: ' + (webAppUrl || '(فارغ)'));
    throw new Error('أضف WEBAPP_URL في Script Properties - راجع التعليمات في Logs');
  }
  
  Logger.log('📍 Web App URL: ' + webAppUrl);
  
  // حذف Webhook القديم
  var deleteResp = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/deleteWebhook', {
    method: 'post',
    payload: { drop_pending_updates: true },
    muteHttpExceptions: true
  });
  Logger.log('🗑️ Delete old webhook: ' + deleteResp.getContentText());
  
  // إعداد Webhook جديد
  var setResp = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/setWebhook', {
    method: 'post',
    payload: {
      url: webAppUrl,
      allowed_updates: JSON.stringify(['message', 'channel_post', 'callback_query']),
      max_connections: 40,
      drop_pending_updates: false
    },
    muteHttpExceptions: true
  });
  Logger.log('✅ Set webhook: ' + setResp.getContentText());
  
  // التحقق من الإعداد
  var infoResp = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getWebhookInfo', {
    muteHttpExceptions: true
  });
  var info = JSON.parse(infoResp.getContentText());
  Logger.log('ℹ️ Webhook info: ' + JSON.stringify(info, null, 2));
  
  if (info.ok && info.result && info.result.url) {
    Logger.log('🎉 Webhook تم إعداده بنجاح!');
    Logger.log('📍 URL: ' + info.result.url);
    Logger.log('⏰ آخر خطأ: ' + (info.result.last_error_message || 'لا يوجد'));
    
    // إرسال رسالة تأكيد
    try {
      var chatId = ENV.CHAT_ID || ENV.CHANNEL_ID;
      if (chatId) {
        sendTelegram_(chatId, '✅ تم إعداد Webhook بنجاح!\n📍 ' + webAppUrl);
      }
    } catch (e) {}
    
    return { success: true, url: info.result.url };
  } else {
    Logger.log('❌ فشل إعداد Webhook');
    return { success: false, error: info };
  }
}

/**
 * فحص حالة Webhook
 */
function CHECK_WEBHOOK_STATUS() {
  var token = ENV.TELEGRAM_TOKEN;
  if (!token) {
    Logger.log('❌ TELEGRAM_BOT_TOKEN غير موجود!');
    return { ok: false, error: 'No token' };
  }
  
  var resp = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getWebhookInfo', {
    muteHttpExceptions: true
  });
  
  var info = JSON.parse(resp.getContentText());
  
  Logger.log('═══════════════════════════════════════');
  Logger.log('📊 حالة Webhook:');
  Logger.log('═══════════════════════════════════════');
  
  if (info.ok && info.result) {
    var r = info.result;
    Logger.log('✅ URL: ' + (r.url || '(غير مضبوط)'));
    Logger.log('📬 رسائل معلقة: ' + (r.pending_update_count || 0));
    Logger.log('⏰ آخر خطأ: ' + (r.last_error_message || 'لا يوجد'));
    Logger.log('📅 تاريخ آخر خطأ: ' + (r.last_error_date ? new Date(r.last_error_date * 1000) : 'لا يوجد'));
  }
  
  return info;
}

function setWebhook_DIRECT_no302() {
  var base = ENV.WEBAPP_URL_DIRECT || ENV.WEBAPP_URL || '';
  if (!base) throw new Error('ضع WEBAPP_URL_DIRECT أو WEBAPP_URL في Script Properties.');

  var url = base + '?secret=' + encodeURIComponent(ENV.INGRESS_SECRET || '');

  // deleteWebhook ثم setWebhook
  UrlFetchApp.fetch('https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/deleteWebhook', {
    method: 'post',
    payload: { drop_pending_updates: true },
    muteHttpExceptions: true
  });

  var resp = UrlFetchApp.fetch('https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/setWebhook', {
    method: 'post',
    payload: {
      url: url,
      allowed_updates: JSON.stringify(['message', 'channel_post', 'callback_query']),
      max_connections: 40,
      drop_pending_updates: true,
      secret_token: (ENV.TG_SECRET_TOKEN || '')
    },
    muteHttpExceptions: true
  });

  var info = UrlFetchApp.fetch('https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/getWebhookInfo', {
    muteHttpExceptions: true
  });

  safeNotify('setWebhook(DIRECT): ' + resp.getContentText() + '\ninfo: ' + info.getContentText());
}
