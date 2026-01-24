/**
 * 🛠️ حذف Queue Trigger المرهق للنظام
 * نفّذ هذه الدالة مرة واحدة من Apps Script Editor
 */
function DELETE_EXHAUSTING_QUEUE_TRIGGER() {
  var ts = ScriptApp.getProjectTriggers();
  var deleted = 0;
  
  ts.forEach(function (t) {
    if (t.getHandlerFunction() === 'SOV1_processQueueBatch_') {
      ScriptApp.deleteTrigger(t);
      deleted++;
      Logger.log('🗑️ حذف Trigger: ' + t.getUniqueId());
    }
  });

  var message = deleted > 0 
    ? '✅ تم حذف ' + deleted + ' Queue Trigger - النظام الآن أقل إرهاقاً'
    : 'ℹ️ لا يوجد Queue Trigger مُفعّل';
    
  Logger.log(message);
  Logger.log('');
  Logger.log('📋 الخطوات التالية:');
  Logger.log('1. ✅ تم: حذف Trigger الذي يعمل كل دقيقة');
  Logger.log('2. 🔄 اختياري: نفّذ SOV1_setupQueueTrigger_() لإنشاء Trigger جديد كل 5 دقائق');
  Logger.log('3. 💡 أو: استخدم iPhone direct integration بدون Queue trigger');
  
  return { success: true, deleted: deleted, message: message };
}
