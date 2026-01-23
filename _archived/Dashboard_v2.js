
/***********************
 * Dashboard_v2.gs — Sovereign (إصدار ١)
 * لوحة عربية أقل زحمة + مؤشرات KPI + تكرار يومي + أعلى بصمات تكرار
 *
 * يعتمد على:
 * - Config.gs: _sheet(), _ss()
 * - Sheet1: سجل العمليات (A:L)
 * - Budgets: التصنيف/الموازنة/المصروف/المتبقي
 * - Ingress_Queue: (الوقت، المصدر، النص، meta، الحالة، البصمة)
 *
 * الهدف:
 * 1) تقليل الزحمة في Dashboard (مؤشرات + جدول ميزانيات مختصر + رسمين فقط)
 * 2) عرض تكرار الرسائل اليومي (SKIP_DUP) بشكل واضح
 * 3) عرض أعلى البصمات تكرارًا (Top fingerprints)
 ***********************/

function SOV1_rebuildDashboard_v2() {
  var ss = _ss();
  var sDash = _sheet('Dashboard');
  var sData = _sheet('Dashboard_Data');
  var s1 = _sheet('Sheet1');
  var sB = _sheet('Budgets');
  var sQ = _sheet('Ingress_Queue');

  // ===== 0) تنظيف Dashboard + Data =====
  try {
    var charts = sDash.getCharts();
    for (var i = 0; i < charts.length; i++) sDash.removeChart(charts[i]);
  } catch (e0) {}

  sDash.clear();
  sData.clear();
  sDash.setRightToLeft(true);
  sData.setRightToLeft(true);

  // ===== 1) قراءة Budgets (Batch) =====
  var budgets = sB.getDataRange().getValues(); // headers + rows
  var totalBudget = 0, totalSpent = 0, totalRemain = 0;

  for (var r = 1; r < budgets.length; r++) {
    totalBudget += Number(budgets[r][1]) || 0;
    totalSpent  += Number(budgets[r][2]) || 0;
    totalRemain += Number(budgets[r][3]) || 0;
  }

  // ===== 2) فترة الشهر الحالي (لملخص المصروف/الدخل) =====
  var now = new Date();
  var startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  var endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);

  // ===== 3) قراءة Sheet1 (Batch) — الأعمدة المهمة: A (تاريخ), H (مبلغ), J (تصنيف), K (نوع), L (نص خام)
  var last1 = s1.getLastRow();
  var rows1 = (last1 >= 2) ? s1.getRange(2, 1, last1 - 1, 12).getValues() : [];

  var incomeM = 0, spendM = 0;
  var dailySpend = {};  // yyyy-MM-dd -> spend
  var dailyIncome = {}; // yyyy-MM-dd -> income
  var byCatSpend = {};  // category -> spend

  for (var i1 = 0; i1 < rows1.length; i1++) {
    var d = rows1[i1][0];
    if (!(d instanceof Date)) continue;
    if (d < startMonth || d >= endMonth) continue;

    var amt = Number(rows1[i1][7]) || 0;
    var cat = String(rows1[i1][9] || 'أخرى');
    var typ = String(rows1[i1][10] || '');
    var raw = String(rows1[i1][11] || '');

    // incoming heuristic (كما كان عندك: وارد/إيداع/استلام)
    var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
    var keyDay = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    if (incoming) {
      incomeM += amt;
      dailyIncome[keyDay] = (dailyIncome[keyDay] || 0) + Math.max(amt, 0);
    } else {
      spendM += amt;
      dailySpend[keyDay] = (dailySpend[keyDay] || 0) + Math.max(amt, 0);
      byCatSpend[cat] = (byCatSpend[cat] || 0) + Math.max(amt, 0);
    }
  }

  var netM = incomeM - spendM;

  // ===== 4) قراءة Ingress_Queue لتكرار الرسائل اليومي =====
  var lastQ = sQ.getLastRow();
  var qRows = (lastQ >= 2) ? sQ.getRange(2, 1, lastQ - 1, 6).getValues() : [];

  var dupDaily = {};     // yyyy-MM-dd -> SKIP_DUP count
  var totalDaily = {};   // yyyy-MM-dd -> total ingested count (NEW/RUN/OK/SKIP_DUP/ERR)
  var fpCounts = {};     // fingerprint -> count (SKIP_DUP فقط)
  var fpLastSeen = {};   // fingerprint -> last Date

  for (var iq = 0; iq < qRows.length; iq++) {
    var t = qRows[iq][0];
    if (!(t instanceof Date)) continue;

    var day = Utilities.formatDate(t, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var status = String(qRows[iq][4] || '');
    var fp = String(qRows[iq][5] || '');

    totalDaily[day] = (totalDaily[day] || 0) + 1;

    if (status === 'SKIP_DUP') {
      dupDaily[day] = (dupDaily[day] || 0) + 1;
      if (fp) {
        fpCounts[fp] = (fpCounts[fp] || 0) + 1;
        fpLastSeen[fp] = fpLastSeen[fp] ? (fpLastSeen[fp] > t ? fpLastSeen[fp] : t) : t;
      }
    }
  }

  // ===== 5) تجهيز جداول Dashboard_Data =====

  // 5.1 KPI
  var kpiHeader = [['الدخل (هذا الشهر)', 'المصروف (هذا الشهر)', 'الصافي', 'إجمالي المتبقي من الميزانيات', 'آخر تحديث']];
  var kpiRow = [[incomeM, spendM, netM, totalRemain, now]];

  sData.getRange(1, 1, 1, 5).setValues(kpiHeader);
  sData.getRange(2, 1, 1, 5).setValues(kpiRow);
  sData.getRange('A2:D2').setNumberFormat('#,##0.00');
  sData.getRange('E2').setNumberFormat('yyyy-MM-dd HH:mm:ss');
  sData.getRange('A1:E1').setFontWeight('bold').setBackground('#f3f3f3');

  // 5.2 الإنفاق اليومي (هذا الشهر)
  var spendDays = Object.keys(dailySpend).sort();
  var dailySpendTable = [['التاريخ', 'المصروف']];
  for (var ds = 0; ds < spendDays.length; ds++) {
    dailySpendTable.push([spendDays[ds], dailySpend[spendDays[ds]]]);
  }
  sData.getRange(4, 1, dailySpendTable.length, 2).setValues(dailySpendTable);
  sData.getRange(4, 2, Math.max(1, dailySpendTable.length - 1), 1).setNumberFormat('#,##0.00');
  sData.getRange(4, 1, 1, 2).setFontWeight('bold').setBackground('#f3f3f3');

  // 5.3 تكرار الرسائل اليومي (SKIP_DUP)
  var dupDays = Object.keys(totalDaily).sort();
  var dailyDupTable = [['التاريخ', 'المستلم اليومي', 'التكرار المتجاهل', 'نسبة التكرار %']];
  for (var dd = 0; dd < dupDays.length; dd++) {
    var dayKey = dupDays[dd];
    var total = totalDaily[dayKey] || 0;
    var dup = dupDaily[dayKey] || 0;
    var pct = total ? (dup / total) * 100 : 0;
    dailyDupTable.push([dayKey, total, dup, pct]);
  }
  // ضع هذا الجدول بدءًا من العمود D (4) صف 4
  sData.getRange(4, 4, dailyDupTable.length, 4).setValues(dailyDupTable);
  sData.getRange(5, 4, Math.max(1, dailyDupTable.length - 1), 1).setNumberFormat('yyyy-MM-dd');
  sData.getRange(5, 5, Math.max(1, dailyDupTable.length - 1), 2).setNumberFormat('0');
  sData.getRange(5, 7, Math.max(1, dailyDupTable.length - 1), 1).setNumberFormat('0.0');
  sData.getRange(4, 4, 1, 4).setFontWeight('bold').setBackground('#f3f3f3');

  // 5.4 أعلى بصمات تكرارًا
  var fps = Object.keys(fpCounts).sort(function(a, b) { return (fpCounts[b] || 0) - (fpCounts[a] || 0); });
  var topN = Math.min(15, fps.length);
  var fpTable = [['البصمة', 'عدد التكرار', 'آخر ظهور']];
  for (var f = 0; f < topN; f++) {
    var k = fps[f];
    fpTable.push([k, fpCounts[k] || 0, fpLastSeen[k] || '']);
  }
  // ضع هذا الجدول بدءًا من الصف 4 العمود I (9)
  sData.getRange(4, 9, fpTable.length, 3).setValues(fpTable);
  sData.getRange(4, 9, 1, 3).setFontWeight('bold').setBackground('#f3f3f3');
  if (fpTable.length > 1) {
    sData.getRange(5, 10, fpTable.length - 1, 1).setNumberFormat('0');
    sData.getRange(5, 11, fpTable.length - 1, 1).setNumberFormat('yyyy-MM-dd HH:mm:ss');
  }

  // 5.5 أعلى التصنيفات إنفاقًا (هذا الشهر) — Top 10
  var cats = Object.keys(byCatSpend).sort(function(a, b){ return (byCatSpend[b]||0) - (byCatSpend[a]||0); });
  var catN = Math.min(10, cats.length);
  var catTable = [['التصنيف', 'المصروف']];
  for (var c = 0; c < catN; c++) catTable.push([cats[c], byCatSpend[cats[c]] || 0]);
  // ضعها بدءًا من الصف 24 العمود A
  sData.getRange(24, 1, catTable.length, 2).setValues(catTable);
  sData.getRange(24, 1, 1, 2).setFontWeight('bold').setBackground('#f3f3f3');
  if (catTable.length > 1) sData.getRange(25, 2, catTable.length - 1, 1).setNumberFormat('#,##0.00');

  // ===== 6) بناء واجهة Dashboard (عرض نظيف) =====

  // العنوان
  sDash.getRange('A1').setValue('لوحة التحكم — ' + (ENV.APP_LABEL || 'Sovereign — إصدار ١'));
  sDash.getRange('A1').setFontWeight('bold').setFontSize(14);

  // KPI cards
  sDash.getRange('A3').setValue('الدخل (هذا الشهر)');     sDash.getRange('B3').setValue(incomeM);
  sDash.getRange('A4').setValue('المصروف (هذا الشهر)');   sDash.getRange('B4').setValue(spendM);
  sDash.getRange('A5').setValue('الصافي');                sDash.getRange('B5').setValue(netM);
  sDash.getRange('A6').setValue('إجمالي المتبقي');        sDash.getRange('B6').setValue(totalRemain);

  sDash.getRange('A3:A6').setFontWeight('bold').setBackground('#f3f3f3');
  sDash.getRange('B3:B6').setNumberFormat('#,##0.00');

  // جدول Budgets مختصر (أعلى 20 صف)
  sDash.getRange('A8').setValue('الميزانيات (Budgets) — مختصر').setFontWeight('bold');
  var bTake = Math.min(21, budgets.length); // header + 20
  if (budgets.length > 0) sDash.getRange(9, 1, bTake, 4).setValues(budgets.slice(0, bTake));
  sDash.getRange('A9:D9').setFontWeight('bold').setBackground('#f3f3f3');
  if (bTake > 1) sDash.getRange(10, 2, bTake - 1, 3).setNumberFormat('#,##0.00');

  // قسم التكرار
  sDash.getRange('F3').setValue('تكرار الرسائل اليومي').setFontWeight('bold');
  var dupShow = dailyDupTable.slice(0, Math.min(16, dailyDupTable.length)); // header + 15
  sDash.getRange(4, 6, dupShow.length, 4).setValues(dupShow); // F:I
  sDash.getRange('F4:I4').setFontWeight('bold').setBackground('#f3f3f3');
  if (dupShow.length > 1) {
    sDash.getRange(5, 7, dupShow.length - 1, 2).setNumberFormat('0');
    sDash.getRange(5, 9, dupShow.length - 1, 1).setNumberFormat('0.0');
  }

  // أعلى بصمات تكرارًا
  sDash.getRange('F22').setValue('أعلى بصمات تكرارًا (Top Fingerprints)').setFontWeight('bold');
  var fpShow = fpTable.slice(0, Math.min(16, fpTable.length)); // header + 15
  sDash.getRange(23, 6, fpShow.length, 3).setValues(fpShow); // F:H
  sDash.getRange('F23:H23').setFontWeight('bold').setBackground('#f3f3f3');
  if (fpShow.length > 1) {
    sDash.getRange(24, 7, fpShow.length - 1, 1).setNumberFormat('0');
    sDash.getRange(24, 8, fpShow.length - 1, 1).setNumberFormat('yyyy-MM-dd HH:mm:ss');
  }

  // أعلى التصنيفات إنفاقًا
  sDash.getRange('A32').setValue('أعلى التصنيفات إنفاقًا (هذا الشهر)').setFontWeight('bold');
  sDash.getRange(33, 1, catTable.length, 2).setValues(catTable);
  sDash.getRange('A33:B33').setFontWeight('bold').setBackground('#f3f3f3');
  if (catTable.length > 1) sDash.getRange(34, 2, catTable.length - 1, 1).setNumberFormat('#,##0.00');

  // ===== 7) الرسوم (حدّها رسمين فقط لتقليل الزحمة) =====
  try {
    // رسم المصروف اليومي (من Dashboard_Data)
    if (dailySpendTable.length > 1) {
      var line = sDash.newChart().asLineChart()
        .addRange(sData.getRange(4, 1, dailySpendTable.length, 2))
        .setOption('title', 'المصروف اليومي (هذا الشهر)')
        .setPosition(8, 10, 0, 0)
        .build();
      sDash.insertChart(line);
    }
  } catch (e1) {}

  try {
    // رسم عمودي للتكرار اليومي (من Dashboard_Data)
    if (dailyDupTable.length > 1) {
      // نرسم فقط عمود "التكرار المتجاهل"
      var col = sDash.newChart().asColumnChart()
        .addRange(sData.getRange(4, 4, dailyDupTable.length, 3)) // التاريخ + المستلم + التكرار
        .setOption('title', 'التكرار المتجاهل يوميًا')
        .setOption('legend', { position: 'bottom' })
        .setPosition(22, 10, 0, 0)
        .build();
      sDash.insertChart(col);
    }
  } catch (e2) {}

  // تحسين العرض
  try {
    sDash.autoResizeColumns(1, 12);
    sDash.setColumnWidths(1, 1, 210);
    sDash.setColumnWidths(2, 1, 140);
    sDash.setColumnWidths(6, 1, 180);
  } catch (e3) {}

  // جاهز
  try { safeNotify('✅ تم بناء Dashboard_v2 بنجاح.'); } catch (e4) {}
}

/**
 * (اختياري) تحديث سريع بدون إعادة بناء الرسوم:
 * يمكنك لاحقًا تطويره ليحدّث Dashboard_Data فقط.
 */
function SOV1_refreshDashboard_v2() {
  SOV1_rebuildDashboard_v2();
}
``
