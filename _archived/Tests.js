
/***********************
 * Tests.gs — Sovereign (إصدار ١)
 * اختبارات مدمجة للنظام:
 * 1) Dedup: منع التكرار بصمة (تاريخ+وقت+بطاقة+متجر)
 * 2) Queue: enqueue + تشغيل Worker مرة واحدة
 * 3) Dashboard_v2: إعادة بناء لوحة التحكم
 * 4) Telegram Commands: setMyCommands + getMyCommands (اختياري)
 * 5) Webhook Probe: GET سريع لاختبار رابط الويب آب (اختياري)
 ***********************/

/** ورقة لوج خاصة بالاختبارات */
function SOV1_ensureTestsLog_() {
  var sh = _sheet('Tests_Log');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الوقت', 'الاختبار', 'الحالة', 'تفاصيل']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('A:A').setNumberFormat('yyyy-MM-dd HH:mm:ss');
  }
  return sh;
}

function SOV1_testLog_(name, status, details) {
  try {
    var sh = SOV1_ensureTestsLog_();
    sh.appendRow([new Date(), String(name || ''), String(status || ''), String(details || '').slice(0, 1500)]);
  } catch (e) {
    // لا نكسر الاختبار
  }
}

/** توليد رسالة POS قياسية (مثل رسالتك) */
function SOV1_samplePosMessage_() {
  return (
    'شراء POS\n' +
    'بـ 7.75 SAR\n' +
    'من Azoom AlShamal Co\n' +
    'عبر MasterCard **0305 Apple Pay\n' +
    'في 2026-01-19 07:26:07'
  );
}

/** (1) اختبار Dedup — يجب أن تكون false ثم true */
function test_11_dedup_sample_pos() {
  var name = 'test_11_dedup_sample_pos';
  try {
    if (typeof SOV1_buildFingerprint_ !== 'function' || typeof SOV1_isDuplicatePersistent_ !== 'function') {
      throw new Error('Dedup.gs غير مفعّل أو الدوال غير موجودة (SOV1_buildFingerprint_ / SOV1_isDuplicatePersistent_)');
    }

    var msg = SOV1_samplePosMessage_();
    var fp = SOV1_buildFingerprint_(msg, false); // false = بدون مبلغ (حسب شرطك)

    // ملاحظة: إذا سبق نفذت الاختبار اليوم، قد تظهر true من أول مرة
    var first = SOV1_isDuplicatePersistent_(fp, 72);
    var second = SOV1_isDuplicatePersistent_(fp, 72);

    var details =
      'Fingerprint:\n' + fp +
      '\nFirstDup? = ' + first +
      '\nSecondDup? = ' + second +
      '\nالمتوقع غالبًا: false ثم true (إلا إذا سبق إدخال نفس البصمة).';

    SOV1_testLog_(name, 'OK', details);
    safeNotify('✅ Dedup Test انتهى.\n\n' + details);
  } catch (e) {
    SOV1_testLog_(name, 'FAIL', String(e));
    logIngressEvent_('ERROR', name, { error: String(e) }, '');
    safeNotify('❌ فشل Dedup Test:\n' + e);
  }
}

/** (2) اختبار Queue — enqueue فقط */
function test_12_queue_enqueue_only() {
  var name = 'test_12_queue_enqueue_only';
  try {
    if (typeof SOV1_enqueue_ !== 'function') {
      throw new Error('Queue.gs غير مفعّل أو الدالة SOV1_enqueue_ غير موجودة');
    }
    if (typeof SOV1_buildFingerprint_ !== 'function') {
      throw new Error('Dedup.gs غير مفعّل أو الدالة SOV1_buildFingerprint_ غير موجودة');
    }

    var msg = 'شراء POS بـ 1.00 SAR من TEST STORE عبر **0001 في 2026-01-19 10:00:00';
    var fp = SOV1_buildFingerprint_(msg, false);

    SOV1_enqueue_('اختبار Queue', msg, { chatId: ENV.CHAT_ID, note: 'enqueue_only' }, fp);

    var details = 'تمت إضافة صف إلى Ingress_Queue.\nFingerprint=' + fp;
    SOV1_testLog_(name, 'OK', details);
    safeNotify('✅ Queue Enqueue تم.\n' + details);
  } catch (e) {
    SOV1_testLog_(name, 'FAIL', String(e));
    logIngressEvent_('ERROR', name, { error: String(e) }, '');
    safeNotify('❌ فشل Queue Enqueue:\n' + e);
  }
}

/** (3) اختبار Queue — تشغيل Worker مرة واحدة */
function test_12b_queue_run_worker_once() {
  var name = 'test_12b_queue_run_worker_once';
  try {
    if (typeof SOV1_processQueueBatch_ !== 'function') {
      throw new Error('Queue.gs غير مفعّل أو الدالة SOV1_processQueueBatch_ غير موجودة');
    }

    SOV1_processQueueBatch_();
    var details = 'تم تشغيل Worker مرة واحدة. راجع Ingress_Queue للحالة: OK / SKIP_DUP / ERR';
    SOV1_testLog_(name, 'OK', details);
    safeNotify('✅ Worker تم تشغيله.\n' + details);
  } catch (e) {
    SOV1_testLog_(name, 'FAIL', String(e));
    logIngressEvent_('ERROR', name, { error: String(e) }, '');
    safeNotify('❌ فشل تشغيل Worker:\n' + e);
  }
}

/** (4) اختبار Dashboard_v2 — إعادة بناء لوحة التحكم */
function test_13_dashboard_v2_rebuild() {
  var name = 'test_13_dashboard_v2_rebuild';
  try {
    if (typeof SOV1_rebuildDashboard_v2 !== 'function') {
      throw new Error('Dashboard_v2.gs غير مفعّل أو الدالة SOV1_rebuildDashboard_v2 غير موجودة');
    }
    SOV1_rebuildDashboard_v2();
    var details = 'تم بناء Dashboard_v2 و Dashboard_Data. افتح ورقة Dashboard للتحقق.';
    SOV1_testLog_(name, 'OK', details);
    safeNotify('✅ Dashboard_v2 تم بناؤه.\n' + details);
  } catch (e) {
    SOV1_testLog_(name, 'FAIL', String(e));
    logIngressEvent_('ERROR', name, { error: String(e) }, '');
    safeNotify('❌ فشل بناء Dashboard_v2:\n' + e);
  }
}

/** (5) اختبار Telegram Commands — setMyCommands ثم getMyCommands (اختياري) */
function test_14_telegram_commands() {
  var name = 'test_14_telegram_commands';
  try {
    if (typeof SOV1_setMyCommands_ !== 'function') {
      throw new Error('Telegram_Commands.gs غير مفعّل أو الدالة SOV1_setMyCommands_ غير موجودة');
    }

    var r1 = SOV1_setMyCommands_();
    var details = 'setMyCommands => ' + JSON.stringify(r1 || {});
    if (typeof SOV1_getMyCommands_ === 'function') {
      var r2 = SOV1_getMyCommands_();
      details += '\ngetMyCommands => ' + JSON.stringify(r2 || {});
    }

    SOV1_testLog_(name, 'OK', details);
    safeNotify('✅ Telegram Commands OK.\n' + details);
  } catch (e) {
    SOV1_testLog_(name, 'FAIL', String(e));
    logIngressEvent_('ERROR', name, { error: String(e) }, '');
    safeNotify('❌ فشل Telegram Commands:\n' + e);
  }
}

/** (6) اختبار Webhook GET بسيط (اختياري) */
function test_15_webhook_probe_get() {
  var name = 'test_15_webhook_probe_get';
  try {
    var base = ENV.WEBAPP_URL_DIRECT || ENV.WEBAPP_URL;
    if (!base) throw new Error('لا يوجد WEBAPP_URL_DIRECT أو WEBAPP_URL في Script Properties');

    var secret = ENV.INGRESS_SECRET || '';
    var url = base + '?secret=' + encodeURIComponent(secret);

    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    var code = resp.getResponseCode();
    var body = String(resp.getContentText() || '').slice(0, 250);

    var details = 'GET ' + url + '\ncode=' + code + '\nbody=' + body;
    SOV1_testLog_(name, (code === 200 ? 'OK' : 'WARN'), details);
    safeNotify('✅ Webhook Probe GET انتهى.\n' + details);
  } catch (e) {
    SOV1_testLog_(name, 'FAIL', String(e));
    logIngressEvent_('ERROR', name, { error: String(e) }, '');
    safeNotify('❌ فشل Webhook Probe GET:\n' + e);
  }
}

/** (7) قائمة تشغيل سريع لكل الاختبارات */
function test_99_run_all_sov1_tests() {
  var name = 'test_99_run_all_sov1_tests';
  try {
    test_11_dedup_sample_pos();
    test_12_queue_enqueue_only();
    test_12b_queue_run_worker_once();
    test_13_dashboard_v2_rebuild();
    // Telegram commands اختياري
    // test_14_telegram_commands();
    // Webhook GET اختياري
    // test_15_webhook_probe_get();

    SOV1_testLog_(name, 'OK', 'تم تنفيذ مجموعة الاختبارات الأساسية.');
    safeNotify('✅ تم تنفيذ الاختبارات الأساسية (SOV1). راجع Tests_Log و Ingress_Queue و Dashboard.');
  } catch (e) {
    SOV1_testLog_(name, 'FAIL', String(e));
    safeNotify('❌ فشل تشغيل مجموعة الاختبارات:\n' + e);
  }
}
