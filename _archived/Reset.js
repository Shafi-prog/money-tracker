
/********** Reset.gs — Reset Ledgers (مع الحفاظ على الهيدر) **********/

function resetLedgers_KeepHeaders() {
  var ss = _ss();

  // Debt_Ledger
  var sD = ss.getSheetByName('Debt_Ledger') || ss.insertSheet('Debt_Ledger');
  if (sD.getLastRow() > 1) sD.getRange(2, 1, sD.getLastRow() - 1, sD.getLastColumn()).clearContent();

  // Debt_Index
  var sIdx = ss.getSheetByName('Debt_Index') || ss.insertSheet('Debt_Index');
  if (sIdx.getLastRow() > 1) sIdx.getRange(2, 1, sIdx.getLastRow() - 1, sIdx.getLastColumn()).clearContent();

  // Dashboard
  var sDash = ss.getSheetByName('Dashboard') || ss.insertSheet('Dashboard');
  sDash.clear();
  try {
    var charts = sDash.getCharts();
    for (var i = 0; i < charts.length; i++) sDash.removeChart(charts[i]);
  } catch (e) {}

  // Budgets: تصفير المصروف فقط
  var sB = ss.getSheetByName('Budgets') || ss.insertSheet('Budgets');
  var lastB = sB.getLastRow();
  if (lastB > 1) sB.getRange(2, 3, lastB - 1, 1).setValue(0);

  SpreadsheetApp.flush();
  safeNotify('✅ Reset Ledgers: تم تصفير Debt_Ledger وDebt_Index وتصفير مصروف Budgets ومسح Dashboard.');
}
``
