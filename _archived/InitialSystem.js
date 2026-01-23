
/********** InitialSystem.gs — التهيئة التنفيذية **********/

function V120_initialSystemSetupImpl_() {
  var ss = _ss();

  // Sheet1
  var s1 = _sheet('Sheet1');
  var h1 = ['التاريخ','المصدر','الفترة١','الفترة٢','القناة/المصدر','رقم الحساب','رقم البطاقة/الطرف','المبلغ','الجهة/التاجر','التصنيف','النوع','النص الخام'];
  if (s1.getLastRow() === 0) s1.appendRow(h1);
  else s1.getRange(1, 1, 1, h1.length).setValues([h1]);
  s1.setFrozenRows(1);
  s1.setRightToLeft(true);
  s1.getRange('A:A').setNumberFormat('yyyy-MM-dd HH:mm');
  s1.getRange('H:H').setNumberFormat('#,##0.00');

  // Budgets
  var sB = _sheet('Budgets');
  var hB = ['التصنيف','الموازنة','المصروف','المتبقي'];
  if (sB.getLastRow() === 0) sB.appendRow(hB);
  else sB.getRange(1, 1, 1, hB.length).setValues([hB]);
  sB.setFrozenRows(1);
  sB.setRightToLeft(true);
  var lastB = Math.max(2, sB.getLastRow());
  if (lastB >= 2) {
    sB.getRange(2, 2, lastB - 1, 3).setNumberFormat('#,##0.00');
    sB.getRange(2, 4, lastB - 1, 1).setFormulaR1C1('=RC[-2]-RC[-1]');
  }
  try { ss.setNamedRange('BudgetCategories', sB.getRange('A2:A')); } catch (e0) {}

  // Debt_Ledger
  var sD = _sheet('Debt_Ledger');
  var hD = ['التاريخ','الطرف','مدين','دائن','الرصيد','وصف'];
  if (sD.getLastRow() === 0) sD.appendRow(hD);
  else sD.getRange(1, 1, 1, hD.length).setValues([hD]);
  sD.setFrozenRows(1);
  sD.setRightToLeft(true);
  sD.getRange('A:A').setNumberFormat('yyyy-MM-dd HH:mm');
  sD.getRange('C:E').setNumberFormat('#,##0.00');
  if (sD.getLastRow() >= 2) {
    sD.getRange(2, 5).setFormula('=D2-C2');
    if (sD.getLastRow() > 2) sD.getRange(3, 5, sD.getLastRow() - 2, 1).setFormulaR1C1('=R[-1]C+RC[-1]-RC[-2]');
  }

  // Dashboard
  var sDash = _sheet('Dashboard');
  sDash.setRightToLeft(true);

  // Debt_Index
  var sIdx = _sheet('Debt_Index');
  var hIdx = ['الطرف','الحساب/الطرف','صافٍ مُستحق لنا (+) / علينا (-)','آخر تحديث'];
  if (sIdx.getLastRow() === 0) sIdx.appendRow(hIdx);
  else sIdx.getRange(1, 1, 1, hIdx.length).setValues([hIdx]);
  sIdx.setFrozenRows(1);
  sIdx.setRightToLeft(true);
  sIdx.getRange('C:C').setNumberFormat('#,##0.00');
  sIdx.getRange('D:D').setNumberFormat('yyyy-MM-dd HH:mm');

  // Classifier_Map (إن وجد)
  var sMap = _sheet('Classifier_Map');
  var hM = ['كلمة مفتاحية','التصنيف','النوع','isIncoming','accNum','cardNum'];
  if (sMap.getLastRow() === 0) sMap.appendRow(hM);
  else sMap.getRange(1, 1, 1, hM.length).setValues([hM]);
  sMap.setRightToLeft(true);

  // Validation على التصنيف في Sheet1 (J)
  try {
    var rule = SpreadsheetApp.newDataValidation()
      .requireFormulaSatisfied('=COUNTIF(BudgetCategories,INDIRECT("RC",FALSE))>0')
      .setAllowInvalid(true)
      .build();
    s1.getRange('J2:J').setDataValidation(rule);
  } catch (e1) {}

  // RTL للجميع
  try { ss.getSheets().forEach(function(sh){ sh.setRightToLeft(true); }); } catch (e2) {}

  safeNotify('✅ initialsystem: تم إعداد الأوراق والصيغ والتنسيقات وRTL.');
}
``
