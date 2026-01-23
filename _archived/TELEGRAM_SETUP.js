/**
 * TELEGRAM_SETUP.js
 * إعداد Telegram Bot بشكل صحيح
 * Setup Telegram Bot properly with webhook and commands
 */

/**
 * إعداد Webhook لـ Telegram Bot
 */
function SETUP_TELEGRAM_WEBHOOK() {
  try {
    var botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN غير موجود في Script Properties');
    }
    
    // الحصول على URL الخاص بـ Web App
    var webAppUrl = ScriptApp.getService().getUrl();
    
    Logger.log('🔧 إعداد Telegram Webhook...');
    Logger.log('Web App URL: ' + webAppUrl);
    
    // إعداد Webhook
    var url = 'https://api.telegram.org/bot' + botToken + '/setWebhook';
    var payload = {
      url: webAppUrl,
      drop_pending_updates: true
    };
    
    var options = {
      method: /** @type {const} */ ('post'),
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('✅ تم إعداد Webhook بنجاح!');
      Logger.log('Webhook URL: ' + webAppUrl);
      return {
        success: true,
        message: 'تم إعداد Webhook بنجاح',
        webhookUrl: webAppUrl
      };
    } else {
      Logger.log('❌ خطأ: ' + result.description);
      throw new Error('فشل إعداد Webhook: ' + result.description);
    }
    
  } catch (e) {
    Logger.log('❌ خطأ في SETUP_TELEGRAM_WEBHOOK: ' + e.message);
    throw e;
  }
}

/**
 * حذف Webhook (للاختبار)
 */
function DELETE_TELEGRAM_WEBHOOK() {
  try {
    var botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN غير موجود');
    }
    
    var url = 'https://api.telegram.org/bot' + botToken + '/deleteWebhook';
    var options = {
      method: /** @type {const} */ ('post'),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('✅ تم حذف Webhook');
      return { success: true };
    } else {
      Logger.log('❌ خطأ: ' + result.description);
      throw new Error(result.description);
    }
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    throw e;
  }
}

/**
 * التحقق من حالة Webhook
 */
function CHECK_TELEGRAM_WEBHOOK() {
  try {
    var botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN غير موجود');
    }
    
    var url = 'https://api.telegram.org/bot' + botToken + '/getWebhookInfo';
    var options = {
      method: /** @type {const} */ ('get'),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('📊 معلومات Webhook:');
      Logger.log('  URL: ' + result.result.url);
      Logger.log('  Pending Updates: ' + result.result.pending_update_count);
      Logger.log('  Last Error: ' + (result.result.last_error_message || 'لا يوجد'));
      Logger.log('  Last Error Date: ' + (result.result.last_error_date || 'لا يوجد'));
      
      return result.result;
    } else {
      Logger.log('❌ خطأ: ' + result.description);
      throw new Error(result.description);
    }
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    throw e;
  }
}

/**
 * إرسال رسالة اختبار
 */
function TEST_TELEGRAM_MESSAGE() {
  try {
    var chatId = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');
    if (!chatId) {
      throw new Error('TELEGRAM_CHAT_ID غير موجود');
    }
    
    var text = '✅ *اختبار الاتصال*\n\n';
    text += 'تم إرسال هذه الرسالة بنجاح!\n';
    text += 'التاريخ: ' + new Date().toLocaleString('ar-SA');
    
    var keyboard = {
      inline_keyboard: [
        [
          { text: '📊 اليوم', callback_data: 'cmd_today' },
          { text: '📅 الأسبوع', callback_data: 'cmd_week' }
        ],
        [
          { text: '💰 الميزانيات', callback_data: 'cmd_budgets' },
          { text: '🔄 الحوالات', callback_data: 'cmd_transfers' }
        ]
      ]
    };
    
    if (typeof sendTelegramWithKeyboard_ === 'function') {
      sendTelegramWithKeyboard_(chatId, text, keyboard);
      Logger.log('✅ تم إرسال رسالة اختبار بنجاح');
      return { success: true };
    } else {
      throw new Error('sendTelegramWithKeyboard_ غير موجودة');
    }
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    throw e;
  }
}

/**
 * إعداد أوامر البوت في BotFather
 * هذا يعطيك القائمة لنسخها ولصقها في BotFather
 */
function GET_BOTFATHER_COMMANDS() {
  var commands = [
    'start - البدء',
    'help - المساعدة',
    'menu - القائمة الرئيسية',
    'today - مصروفات اليوم',
    'week - مصروفات الأسبوع',
    'month - مصروفات الشهر',
    'year - مصروفات السنة',
    'summary - ملخص شامل',
    'budgets - جميع الميزانيات',
    'budget - تفاصيل ميزانية',
    'accounts - قائمة الحسابات',
    'balance - الأرصدة',
    'transfers - تقرير الحوالات',
    'debts - المدينين والدائنين',
    'categories - التصنيفات',
    'top - أكثر الفئات صرفاً',
    'stats - إحصائيات شاملة',
    'trends - الاتجاهات',
    'search - بحث في المعاملات',
    'last - آخر المعاملات',
    'settings - الإعدادات',
    'export - تصدير البيانات'
  ];
  
  Logger.log('📋 الأوامر لـ BotFather:');
  Logger.log('═══════════════════════════════════');
  Logger.log('انسخ والصق في BotFather بعد الأمر /setcommands:\n');
  
  var commandText = commands.join('\n');
  Logger.log(commandText);
  
  Logger.log('\n═══════════════════════════════════');
  Logger.log('✅ انتهى - انسخ الأوامر أعلاه');
  
  return commandText;
}

/**
 * إعداد شامل لـ Telegram
 */
function COMPLETE_TELEGRAM_SETUP() {
  try {
    Logger.log('🚀 بدء إعداد Telegram الشامل...');
    
    // 1. إعداد Webhook
    Logger.log('\n1️⃣ إعداد Webhook...');
    var webhookResult = SETUP_TELEGRAM_WEBHOOK();
    Logger.log('✅ Webhook جاهز');
    
    // 2. التحقق من الإعداد
    Logger.log('\n2️⃣ التحقق من Webhook...');
    CHECK_TELEGRAM_WEBHOOK();
    
    // 3. إرسال رسالة اختبار
    Logger.log('\n3️⃣ إرسال رسالة اختبار...');
    TEST_TELEGRAM_MESSAGE();
    
    // 4. عرض الأوامر لـ BotFather
    Logger.log('\n4️⃣ أوامر BotFather...');
    GET_BOTFATHER_COMMANDS();
    
    Logger.log('\n✅ تم إعداد Telegram بنجاح!');
    Logger.log('📱 تحقق من Telegram - يجب أن تصلك رسالة اختبار');
    
    return {
      success: true,
      message: 'تم إعداد Telegram بنجاح',
      webhookUrl: webhookResult.webhookUrl
    };
    
  } catch (e) {
    Logger.log('❌ خطأ في COMPLETE_TELEGRAM_SETUP: ' + e.message);
    throw e;
  }
}
