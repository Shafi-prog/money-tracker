
/********** SeedFormulas.gs — زرع/إصلاح الصيغ **********
 * يوفر:
 * - V120_seedFormulas_()
 * - test_10_seed_formulas() (Wrapper للاسم الموجود في Setup)
 *******************************************************/

function V120_seedFormulas_() {
  // Budgets: المتبقي = الموازنة - المصروف
  var sB = _sheet('Budgets');
  var lastB = sB.getLastRow();
  if (lastB >= 2) {
    sB.getRange(2, 4, lastB - 1, 1).setFormulaR1C1('=RC[-2]-RC[-1]');
    sB.getRange(2, 2, lastB - 1, 3).setNumberFormat('#,##0.00');
  }

  // Debt_Ledger: الرصيد = السابق + (دائن - مدين)
  var sD = _sheet('Debt_Ledger');
  var lastD = sD.getLastRow();
  if (lastD >= 2) {
    sD.getRange(2, 5).setFormula('=D2-C2');
    if (lastD > 2) {
      sD.getRange(3, 5, lastD - 2, 1).setFormulaR1C1('=R[-1]C+RC[-1]-RC[-2]');
    }
    sD.getRange('C:E').setNumberFormat('#,##0.00');
    sD.getRange('A:A').setNumberFormat('yyyy-MM-dd HH:mm');
  }

  SpreadsheetApp.flush();
  safeNotify('✅ Seed formulas: تم زرع/إصلاح صيغ Budgets وDebt_Ledger.');
}

// الاسم الذي يستدعيه Setup الحالي لديك
function test_10_seed_formulas() {
  V120_seedFormulas_();
}
