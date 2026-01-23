
/********** MasterRun.gs — تشغيل شامل (LIGHT/FULL) **********/

function V120_MasterRun_LIGHT() {
  V120_MasterRun_({
    wipeSheet1: false,
    wipeRunLog: false,
    wipeIngressDebug: true,
    resetLedgers: false,
    seedClassifier: true,
    probeWebhook: true,
    runAI: true,
    rebuildDash: true,
    maintenanceDuringRun: true
  });
}

function V120_MasterRun_FULL() {
  V120_MasterRun_({
    wipeSheet1: true,
    wipeRunLog: true,
    wipeIngressDebug: true,
    resetLedgers: true,
    seedClassifier: true,
    probeWebhook: true,
    runAI: true,
    rebuildDash: true,
    maintenanceDuringRun: true
  });
}

function V120_MasterRun_(opt) {
  opt = opt || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  var started = new Date();
  var runId = Utilities.getUuid().slice(0, 8);

  try {
    ensureRunLogSheet_();

    if (opt.wipeRunLog) clearRunLog_();

    runLog_(runId, 'بدء التشغيل الشامل', 'INFO', { opt: opt });

    // فحص البيئة
    step_(runId, 'فحص البيئة', function () {
      var required = ['SHEET_ID', 'TELEGRAM_TOKEN'];
      var missing = [];
      required.forEach(function (k) { if (!ENV[k]) missing.push(k); });
      if (missing.length) throw new Error('خصائص ناقصة: ' + missing.join(', '));
    });

    // وضع الصيانة أثناء التشغيل
    if (opt.maintenanceDuringRun) {
      step_(runId, 'تفعيل وضع الصيانة', function () { setMaintenanceMode_('on'); });
    }

    // Reset اختباري
    step_(runId, 'Reset اختباري', function () {
      V120_TestReset_({
        wipeSheet1: !!opt.wipeSheet1,
        wipeRunLog: false,
        wipeIngressDebug: !!opt.wipeIngressDebug
      });
    });

    // تهيئة أولية
    step_(runId, 'تهيئة أولية', function () { initialsystem(); });

    // زرع الصيغ
    step_(runId, 'زرع الصيغ', function () { test_10_seed_formulas(); });

    // Reset Ledgers
    if (opt.resetLedgers) {
      step_(runId, 'Reset Ledgers', function () { resetLedgers_KeepHeaders(); });
    }

    // Seed Classifier
    if (opt.seedClassifier && typeof seedClassifierMap_AR === 'function') {
      step_(runId, 'Seed Classifier (AR)', function () { seedClassifierMap_AR(); });
    }

    // Probe Webhook
    if (opt.probeWebhook && typeof test_01_probeWebhook === 'function') {
      step_(runId, 'Probe Webhook', function () { test_01_probeWebhook(); });
    }

    // AI Diagnostics
    if (opt.runAI && typeof test_AI_Diagnostics === 'function') {
      step_(runId, 'AI Diagnostics', function () { test_AI_Diagnostics(); });
    }

    // Dashboard
    if (opt.rebuildDash && typeof SOV1_rebuildDashboard_v2 === 'function') {
      step_(runId, 'إعادة بناء Dashboard_v2', function () { SOV1_rebuildDashboard_v2(); });
    } else if (opt.rebuildDash && typeof rebuildDashboard === 'function') {
      step_(runId, 'إعادة بناء Dashboard', function () { rebuildDashboard(); });
    }

    // Queue trigger (مفيد)
    if (typeof SOV1_setupQueueTrigger_ === 'function') {
      step_(runId, 'إعداد Trigger للـ Queue', function () { SOV1_setupQueueTrigger_(); });
    }

    // Telegram Ping
    step_(runId, 'Telegram Ping', function () {
      var hub = (typeof getHubChatId_ === 'function') ? getHubChatId_() : (ENV.CHAT_ID || '');
      if (!hub) throw new Error('لا يوجد CHAT_ID/CHANNEL_ID للإرسال');
      sendTelegram_(hub, '✅ MasterRun OK\nRunId: ' + runId + '\nالوقت: ' + started.toLocaleString());
    });

    // إلغاء الصيانة
    if (opt.maintenanceDuringRun) {
      step_(runId, 'إلغاء وضع الصيانة', function () { setMaintenanceMode_('off'); });
    }

    runLog_(runId, 'انتهاء التشغيل الشامل', 'OK', { durationSec: Math.round((new Date() - started) / 1000) });

  } catch (e) {
    runLog_(runId, 'فشل التشغيل الشامل', 'ERROR', { error: String(e) });
    throw e;
  } finally {
    try { setMaintenanceMode_('off'); } catch (e2) {}
    lock.releaseLock();
  }
}

function setMaintenanceMode_(mode) {
  mode = String(mode || '').toLowerCase();
  PropertiesService.getScriptProperties().setProperty('MAINTENANCE_MODE', mode === 'on' ? 'on' : 'off');
}

function step_(runId, name, fn) {
  var t0 = new Date();
  runLog_(runId, name, 'RUN', {});
  try {
    fn();
    runLog_(runId, name, 'OK', { ms: (new Date() - t0) });
  } catch (e) {
    runLog_(runId, name, 'FAIL', { ms: (new Date() - t0), error: String(e) });
    throw e;
  }
}

function ensureRunLogSheet_() {
  var sh = _sheet('Run_Log');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الوقت', 'RunId', 'المرحلة', 'الحالة', 'تفاصيل']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('A:A').setNumberFormat('yyyy-MM-dd HH:mm:ss');
  }
}

function clearRunLog_() {
  var sh = _sheet('Run_Log');
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
}

function runLog_(runId, stage, status, details) {
  var sh = _sheet('Run_Log');
  var s = '';
  try { s = JSON.stringify(details || {}); } catch (e) { s = String(details || ''); }
  sh.appendRow([new Date(), String(runId), String(stage), String(status), s.slice(0, 1500)]);
}
