
/********** Control.gs — صيانة وإدارة **********
 * يوفر:
 * - V120_Maintenance_ON / OFF
 * - V120_StopTelegramWebhook_NOW
 ************************************************/

function V120_Maintenance_ON() {
  PropertiesService.getScriptProperties().setProperty('MAINTENANCE_MODE', 'on');
  safeNotify('✅ تم تفعيل وضع الصيانة (MAINTENANCE_MODE=on).');
}

function V120_Maintenance_OFF() {
  PropertiesService.getScriptProperties().setProperty('MAINTENANCE_MODE', 'off');
  safeNotify('✅ تم إلغاء وضع الصيانة (MAINTENANCE_MODE=off).');
}

function V120_StopTelegramWebhook_NOW() {
  var token = ENV.TELEGRAM_TOKEN || PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  if (!token) throw new Error('TELEGRAM_TOKEN غير موجود');

  var resp = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/deleteWebhook', {
    method: 'post',
    payload: { drop_pending_updates: true },
    muteHttpExceptions: true
  });

  safeNotify('deleteWebhook: ' + resp.getResponseCode() + '\n' + resp.getContentText());
}
