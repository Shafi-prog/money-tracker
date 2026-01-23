
/********** ProbeWebhook.gs — فحص Webhook GET/POST **********
 * يوفر:
 * - V120_probeWebhook_()
 * - test_01_probeWebhook()
 *******************************************************/

function V120_probeWebhook_() {
  var base = ENV.WEBAPP_URL_DIRECT || ENV.WEBAPP_URL || '';
  if (!base) throw new Error('ضع WEBAPP_URL_DIRECT أو WEBAPP_URL في Script Properties.');

  var secret = ENV.INGRESS_SECRET || '';
  var getUrl = base + '?secret=' + encodeURIComponent(secret);
  var postUrl = base + '?secret=' + encodeURIComponent(secret);

  // GET
  var respGet = UrlFetchApp.fetch(getUrl, {
    muteHttpExceptions: true,
    followRedirects: true
  });

  // POST (نص خام)
  var sample = 'حوالة واردة بـ 2000 SAR من محمد الحربي إلى حساب 8001';
  var respPost = UrlFetchApp.fetch(postUrl, {
    method: 'post',
    headers: { 'X-INGRESS-SECRET': String(secret) },
    payload: sample,
    muteHttpExceptions: true,
    followRedirects: true
  });

  var msg =
    'Probe Webhook\n' +
    'GET=' + respGet.getResponseCode() + '\n' +
    'POST=' + respPost.getResponseCode() + '\n' +
    '—\n' +
    'GET body: ' + String(respGet.getContentText() || '').slice(0, 200) + '\n' +
    'POST body: ' + String(respPost.getContentText() || '').slice(0, 200);

  // سجل سريع في Run_Log إن وجد
  try {
    _sheet('Run_Log').appendRow([new Date(), '-', 'Probe Webhook', 'INFO', msg]);
  } catch (e) {}

  safeNotify(msg);
}

function test_01_probeWebhook() {
  V120_probeWebhook_();
}
