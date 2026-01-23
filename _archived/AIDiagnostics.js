
/********** AIDiagnostics.gs — تشخيص AI **********
 * يوفر:
 * - V120_AI_Diagnostics_()
 * - test_AI_Diagnostics()
 *******************************************************/

function V120_AI_Diagnostics_() {
  var samples = [
    'حوالة واردة بـ 2000 SAR من محمد الحربي إلى حساب 8001',
    'شراء POS بـ 120 SAR من متجر تجريبي عبر بطاقة **0305 في 2026-01-19 09:00:00',
    'سحب ATM بمبلغ 400 SAR من بطاقة **4912 في 2026-01-19 12:00:00'
  ];

  var hasProbe = (typeof callAiProbe_ === 'function');
  var hasHybrid = (typeof callAiHybridV120 === 'function');
  var hasClassifier = (typeof applyClassifierMap_ === 'function');

  if (!hasProbe && !hasHybrid) {
    throw new Error('لا توجد دالة AI: callAiProbe_ أو callAiHybridV120 — تأكد من AI.gs');
  }

  var lines = [];
  var s1 = _sheet('Sheet1');

  for (var i = 0; i < samples.length; i++) {
    var text = samples[i];

    var out;
    if (hasProbe) out = callAiProbe_(text);        // {ai, engine}
    else out = { ai: callAiHybridV120(text), engine: 'hybrid' };

    var ai = out.ai || {};
    if (hasClassifier) ai = applyClassifierMap_(text, ai);

    s1.appendRow([
      new Date(),
      'AI_DIAG',
      '-',
      '-',
      'اختبار_AI',
      ai.accNum || '',
      ai.cardNum || '',
      Number(ai.amount || 0),
      ai.merchant || '',
      ai.category || '',
      ai.type || '',
      text
    ]);

    lines.push('• ' + String(out.engine || '').toUpperCase() + ' → ' +
      (ai.type || '-') + ' — ' + (ai.category || '-') + ' — ' +
      Number(ai.amount || 0).toFixed(2) + ' SAR');
  }

  var hub = (typeof getHubChatId_ === 'function') ? getHubChatId_() : (ENV.CHAT_ID || '');
  if (hub && typeof sendTelegram_ === 'function') {
    sendTelegram_(hub, '🤖 نتيجة اختبار الذكاء الاصطناعي:\n' + lines.join('\n'));
  }

  safeNotify('✅ تم اختبار AI. راجع Sheet1 ورسالة تيليجرام.');
}

function test_AI_Diagnostics() {
  V120_AI_Diagnostics_();
}
