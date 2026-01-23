
/********** TestReset.gs — Reset شامل للاختبار **********/

function V120_TestReset_FULL_WipeSheet1() {
  V120_TestReset_({ wipeSheet1: true, wipeRunLog: true, wipeIngressDebug: true });
}

function V120_TestReset_LIGHT_KeepSheet1() {
  V120_TestReset_({ wipeSheet1: false, wipeRunLog: false, wipeIngressDebug: true });
}

function V120_TestReset_(opt) {
  opt = opt || {};
  var ss = _ss();

  // Sheet1
  var s1 = _sheet('Sheet1');
  if (opt.wipeSheet1 && s1.getLastRow() > 1) {
    s1.getRange(2, 1, s1.getLastRow() - 1, s1.getLastColumn()).clearContent();
  }

  // Budgets: صفّر المصروف
  var sB = _sheet('Budgets');
  if (sB.getLastRow() > 1) sB.getRange(2, 3, sB.getLastRow() - 1, 1).setValue(0);

  // Debt_Ledger + Debt_Index
  var sD = _sheet('Debt_Ledger');
  if (sD.getLastRow() > 1) sD.getRange(2, 1, sD.getLastRow() - 1, sD.getLastColumn()).clearContent();

  var sIdx = _sheet('Debt_Index');
  if (sIdx.getLastRow() > 1) sIdx.getRange(2, 1, sIdx.getLastRow() - 1, sIdx.getLastColumn()).clearContent();

  // Dashboard
  var sDash = _sheet('Dashboard');
  sDash.clear();
  try {
    var charts = sDash.getCharts();
    for (var i = 0; i < charts.length; i++) sDash.removeChart(charts[i]);
  } catch (e) {}

  // Run_Log (اختياري)
  if (opt.wipeRunLog) {
    var sRun = _sheet('Run_Log');
    if (sRun.getLastRow() > 1) sRun.getRange(2, 1, sRun.getLastRow() - 1, sRun.getLastColumn()).clearContent();
  }

  // Ingress_Debug (اختياري)
  if (opt.wipeIngressDebug) {
    var sDbg = _sheet('Ingress_Debug');
    if (sDbg.getLastRow() > 1) sDbg.getRange(2, 1, sDbg.getLastRow() - 1, sDbg.getLastColumn()).clearContent();
  }

  SpreadsheetApp.flush();
  safeNotify('✅ TestReset: اكتمل (wipeSheet1=' + !!opt.wipeSheet1 + ')');
}
