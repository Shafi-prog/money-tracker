
/********** Sovereign — إصدار ١ | Queue.gs **********
 * Queue + Worker + Trigger
 *
 * لماذا Queue؟
 * - doPost يجب أن يكون سريعًا جدًا (يرد فورًا) لتجنب retries.
 * - المعالجة الثقيلة تتم في Worker عبر Trigger (كل دقيقة).
 *
 * المتطلبات:
 * - Config.gs: _sheet()
 * - Core_Utils.gs: logIngressEvent_(), safeNotify()
 * - Dedup.gs: SOV1_isDuplicatePersistent_(), SOV1_buildFingerprint_() (اختياري)
 * - Flow.gs: executeUniversalFlowV120()
 *****************************************************/

/** إنشاء/تهيئة ورقة الـ Queue */
function SOV1_ensureQueueSheet_() {
  var sh = _sheet('Ingress_Queue');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الوقت', 'المصدر', 'النص', 'meta', 'الحالة', 'البصمة']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('A:A').setNumberFormat('yyyy-MM-dd HH:mm:ss');
  }
  return sh;
}

/**
 * enqueue رسالة جديدة
 * @param {string} source  مثال: "تليجرام (يدوي)" / "قناة الرصد" / "آيفون (POST)"
 * @param {string} text    نص الرسالة الخام
 * @param {Object} meta    بيانات إضافية مثل chatId/updateId
 * @param {string} fingerprint بصمة dedup (اختياري) — يفضل تمريرها من Ingress
 */
function SOV1_enqueue_(source, text, meta, fingerprint) {
  var sh = SOV1_ensureQueueSheet_();
  sh.appendRow([
    new Date(),
    String(source || ''),
    String(text || ''),
    JSON.stringify(meta || {}),
    'NEW',
    String(fingerprint || '')
  ]);
}

/**
 * Worker: يعالج دفعات صغيرة لتجنب timeout
 * - يقرأ صفوف NEW فقط
 * - يغيّر الحالة إلى RUN ثم OK أو SKIP_DUP أو ERR
 * - يستخدم LockService لمنع تشغيل متزامن
 */
function SOV1_processQueueBatch_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;

  try {
    var sh = SOV1_ensureQueueSheet_();
    var last = sh.getLastRow();
    if (last < 2) return;

    // اقرأ دفعة واحدة (Batch read)
    var rows = sh.getRange(2, 1, last - 1, 6).getValues();

    var handled = 0;
    var limit = 15; // عدّل حسب تحمل مشروعك

    for (var i = 0; i < rows.length; i++) {
      if (handled >= limit) break;

      var status = String(rows[i][4] || '');
      if (status !== 'NEW') continue;

      var rowIndex = i + 2;
      var source = String(rows[i][1] || '');
      var text = String(rows[i][2] || '');
      var metaRaw = String(rows[i][3] || '{}');
      var fingerprint = String(rows[i][5] || '');

      var meta = {};
      try { meta = JSON.parse(metaRaw || '{}'); } catch (e) { meta = {}; }

      try {
        // علّم RUN
        sh.getRange(rowIndex, 5).setValue('RUN');

        // إذا لا توجد بصمة، ابنها هنا (اختياري)
        if (!fingerprint && typeof SOV1_buildFingerprint_ === 'function') {
          fingerprint = SOV1_buildFingerprint_(text, false);
          sh.getRange(rowIndex, 6).setValue(fingerprint);
        }

        // حماية ثانية ضد التكرار (Dedup مستمر)
        if (fingerprint && typeof SOV1_isDuplicatePersistent_ === 'function') {
          if (SOV1_isDuplicatePersistent_(fingerprint, 72)) {
            sh.getRange(rowIndex, 5).setValue('SKIP_DUP');
            handled++;
            continue;
          }
        }

        // المعالجة الثقيلة (موجودة في مشروعك)
        // meta.chatId قد يكون مفيدًا لتوجيه الرد
        executeUniversalFlowV120(text, source, meta.chatId || null);

        sh.getRange(rowIndex, 5).setValue('OK');
      } catch (err) {
        sh.getRange(rowIndex, 5).setValue('ERR: ' + String(err).slice(0, 120));
        try { logIngressEvent_('ERROR', 'SOV1_processQueueBatch_', { error: String(err), source: source }, text); } catch (_) {}
      }

      handled++;
    }
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

/**
 * إعداد Trigger لمعالجة الصف كل دقيقة
 * (تشغيل مرة واحدة فقط بعد إضافة الملف)
 */
function SOV1_setupQueueTrigger_() {
  var ts = ScriptApp.getProjectTriggers();
  ts.forEach(function (t) {
    if (t.getHandlerFunction() === 'SOV1_processQueueBatch_') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('SOV1_processQueueBatch_')
    .timeBased()
    .everyMinutes(5)
    .create();

  safeNotify('✅ تم إعداد Trigger لمعالجة Ingress_Queue كل 5 دقائق (محسّن).');
}

/**
 * حذف Trigger معالجة الصف (Queue)
 * استخدم هذه الدالة إذا كنت تستخدم iPhone direct integration
 * ولا تحتاج Queue processing تلقائي
 */
function SOV1_deleteQueueTrigger_() {
  var ts = ScriptApp.getProjectTriggers();
  var deleted = 0;
  
  ts.forEach(function (t) {
    if (t.getHandlerFunction() === 'SOV1_processQueueBatch_') {
      ScriptApp.deleteTrigger(t);
      deleted++;
    }
  });

  if (deleted > 0) {
    safeNotify('✅ تم حذف ' + deleted + ' Trigger لـ SOV1_processQueueBatch_');
    Logger.log('✅ تم حذف Queue Trigger بنجاح - Execution log سيكون نظيفاً الآن');
  } else {
    safeNotify('ℹ️ لا يوجد Queue Trigger مُفعّل');
    Logger.log('ℹ️ لم يتم العثور على Queue Trigger');
  }
  
  return deleted;
}

/**
 * (اختياري) تنظيف الصف: حذف صفوف OK / SKIP_DUP القديمة لتقليل الحجم
 * - keepDays: عدد الأيام التي نحتفظ بها
 */
function SOV1_cleanupQueue_(keepDays) {
  keepDays = keepDays || 14;
  var sh = SOV1_ensureQueueSheet_();
  var last = sh.getLastRow();
  if (last < 2) return;

  var cutoff = new Date(Date.now() - keepDays * 24 * 3600 * 1000);
  var data = sh.getRange(2, 1, last - 1, 6).getValues();

  // نحذف من الأسفل للأعلى
  for (var i = data.length - 1; i >= 0; i--) {
    var dt = data[i][0];
    var status = String(data[i][4] || '');
    if (!(dt instanceof Date)) continue;

    // احذف فقط الحالات النهائية
    if (dt < cutoff && (status === 'OK' || status === 'SKIP_DUP')) {
      sh.deleteRow(i + 2);
    }
  }

  safeNotify('🧹 تم تنظيف Ingress_Queue (الاحتفاظ: ' + keepDays + ' يوم).');
}
