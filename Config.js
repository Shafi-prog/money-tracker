
/********** Config.gs — شافي المطيري (متابعة المصاريف المالية) **********/

const ENV = (function () {
  var p = PropertiesService.getScriptProperties();
  function gp(k, fallback) {
    var v = p.getProperty(k);
    return (v !== null && v !== undefined && String(v).length) ? v : (fallback || '');
  }
  return {
    // الاسم التسويقي الافتراضي
    APP_LABEL: gp('APP_LABEL', 'شافي المطيري — متابعة المصاريف المالية'),
    
    OWNER: gp('OWNER', 'شافي المطيري'),

    // Telegram
    TELEGRAM_TOKEN: gp('TELEGRAM_BOT_TOKEN', ''),
    TG_SECRET_TOKEN: gp('TG_SECRET_TOKEN', ''),
    INGRESS_SECRET: gp('INGRESS_SECRET', ''),

    SHEET_ID: gp('SHEET_ID', ''),

    // Chat IDs - TELEGRAM_CHAT_ID هو الأساسي
    CHAT_ID: gp('TELEGRAM_CHAT_ID', ''),
    CHANNEL_ID: gp('CHANNEL_ID', ''),
    ADMIN_CHAT_ID: gp('ADMIN_CHAT_ID', ''),

    WEBAPP_URL: gp('WEBAPP_URL', ''),

    // Telegram actions mode: off | admin | all
    TG_ACTIONS_MODE: gp('TG_ACTIONS_MODE', 'off'),

    // AI Keys
    GROQ_KEY: gp('GROQ_KEY', ''),
    GEMINI_KEY: gp('GEMINI_KEY', ''),
    GROK_API_KEY: gp('GROK_API_KEY', ''),

    // إعدادات إضافية
    DEBUG_INGRESS: gp('DEBUG_INGRESS', ''),
    MAINTENANCE_MODE: gp('MAINTENANCE_MODE', ''),
    OWN_ACCOUNTS: gp('OWN_ACCOUNTS', ''),

    SALARY_DAY: gp('SALARY_DAY', '27')
  };
})();

function _ss() {
  if (!ENV.SHEET_ID) throw new Error('SHEET_ID غير موجود في Script Properties');
  return SpreadsheetApp.openById(ENV.SHEET_ID);
}

function _sheet(name) {
  var ss = _ss();
  // ✅ إصلاح مهم: OR لإنشاء الورقة إذا لم توجد
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
