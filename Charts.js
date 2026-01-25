/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AdvancedDashboard.js - لوحة تحكم متقدمة مع CRUD كامل
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * 🌐 نقطة الدخول للـ Dashboard
 */
function getAdvancedDashboard(e) {
  var template = HtmlService.createTemplate(ADVANCED_DASHBOARD_HTML);
  template.config = {
    appName: ENV.APP_LABEL || 'SJA MoneyTracker',
    owner: ENV.OWNER || 'شافي المطيري',
    version: 'V2.0'
  };
  
  return template.evaluate()
    .setTitle('💰 SJA MoneyTracker')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 📊 API: الحصول على المعاملات
 */
function API_getTransactions(params) {
  params = params || {};
  
  var options = {
    limit: Number(params.limit) || 50,
    offset: Number(params.offset) || 0,
    sortBy: params.sortBy || 'Date',
    sortOrder: params.sortOrder || 'desc'
  };
  
  // Filter
  if (params.search) {
    options.search = String(params.search);
  }
  if (params.category) {
    options.category = String(params.category);
  }
  if (params.dateFrom) {
    options.dateFrom = new Date(params.dateFrom);
  }
  if (params.dateTo) {
    options.dateTo = new Date(params.dateTo);
  }
  
  return getTransactionsFiltered_(options);
}

/**
 * 📊 API: الحصول على معاملات مع فلترة
 * ✅ محدّث للتوافق مع هيكل Sheet1 الجديد
 */
function getTransactionsFiltered_(options) {
  var sheet = _sheet('Sheet1');
  var data = sheet.getDataRange().getValues();
  
  // ✅ أعمدة Sheet1 الجديدة:
  // A=UUID, B=Date, C=Type, D=Category, E=Source, F=AccNum, G=CardNum, H=Amount, I=Merchant, J=Subcat, K=OpType, L=Raw, M=Created
  var COL = {
    UUID: 0,
    Date: 1,
    Type: 2,
    Category: 3,
    Source: 4,
    AccNum: 5,
    CardNum: 6,
    Amount: 7,
    Merchant: 8,
    Subcat: 9,
    OpType: 10,
    Raw: 11
  };
  
  var transactions = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = {
      UUID: data[i][COL.UUID] || '',
      Date: data[i][COL.Date] || '',
      Type: data[i][COL.Type] || '',
      Category: data[i][COL.Category] || '',
      Source: data[i][COL.Source] || '',
      AccNum: data[i][COL.AccNum] || '',
      CardNum: data[i][COL.CardNum] || '',
      Amount: Number(data[i][COL.Amount]) || 0,
      Merchant: data[i][COL.Merchant] || '',
      Subcat: data[i][COL.Subcat] || '',
      OpType: data[i][COL.OpType] || '',
      Raw: data[i][COL.Raw] || '',
      _row: i + 1
    };
    
    // Apply filters
    var include = true;
    
    if (options.search) {
      var searchLower = options.search.toLowerCase();
      var found = String(row.Merchant).toLowerCase().indexOf(searchLower) !== -1 ||
                  String(row.Category).toLowerCase().indexOf(searchLower) !== -1 ||
                  String(row.Raw).toLowerCase().indexOf(searchLower) !== -1;
      if (!found) include = false;
    }
    
    if (options.category && row.Category !== options.category) {
      include = false;
    }
    
    if (options.dateFrom && new Date(row.Date) < options.dateFrom) {
      include = false;
    }
    
    if (options.dateTo && new Date(row.Date) > options.dateTo) {
      include = false;
    }
    
    if (include) transactions.push(row);
  }
  
  // Sort by Date descending
  transactions.sort(function(a, b) {
    var da = new Date(a.Date);
    var db = new Date(b.Date);
    return (db.getTime() || 0) - (da.getTime() || 0);
  });
  
  var total = transactions.length;
  
  // Pagination
  transactions = transactions.slice(options.offset, options.offset + options.limit);
  
  return {
    success: true,
    data: transactions,
    total: total,
    limit: options.limit,
    offset: options.offset,
    hasMore: (options.offset + options.limit) < total
  };
}

/**
 * 🗑️ API: حذف معاملة
 */
function API_deleteTransaction(uuid) {
  if (!uuid) return { success: false, error: 'UUID مطلوب' };
  
  var result = deleteTransaction_(uuid);
  
  return {
    success: result.success,
    deleted: result.deleted,
    errors: result.errors
  };
}

/**
 * ✏️ API: تحديث معاملة
 */
function API_updateTransaction(uuid, updates) {
  if (!uuid) return { success: false, error: 'UUID مطلوب' };
  
  var sheet = _sheet('Sheet1');
  var data = sheet.getDataRange().getValues();
  var sB = _sheet('Budgets');
  var sDash = _sheet('Dashboard');
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(uuid)) {
      var rowNum = i + 1;

      var oldAmount = Number(data[i][8]) || 0;
      var oldMerchant = String(data[i][9] || '');
      var oldCategory = String(data[i][10] || '');
      var oldType = String(data[i][11] || '');
      var oldRaw = String(data[i][12] || '');
      var oldIncoming = /(وارد|إيداع|استلام|راتب)/i.test(oldType) || /(وارد|إيداع|استلام|راتب)/i.test(oldRaw);

      var newAmount = (updates.Amount !== undefined) ? Number(updates.Amount) : oldAmount;
      var newMerchant = (updates.Merchant !== undefined) ? String(updates.Merchant) : oldMerchant;
      var newCategory = (updates.Category !== undefined) ? String(updates.Category) : oldCategory;
      var newType = (updates.Type !== undefined) ? String(updates.Type) : oldType;
      var newIncoming = /(وارد|إيداع|استلام|راتب)/i.test(newType) || /(وارد|إيداع|استلام|راتب)/i.test(oldRaw);

      // Update Sheet1
      if (updates.Merchant !== undefined) sheet.getRange(rowNum, 10).setValue(newMerchant);
      if (updates.Category !== undefined) sheet.getRange(rowNum, 11).setValue(newCategory);
      if (updates.Amount !== undefined) sheet.getRange(rowNum, 9).setValue(newAmount);
      if (updates.Type !== undefined) sheet.getRange(rowNum, 12).setValue(newType);

      // Update Budgets (إذا تغيرت التصنيف/المبلغ/النوع)
      var budgetChanged = (newCategory !== oldCategory) || (newAmount !== oldAmount) || (newType !== oldType);
      if (budgetChanged) {
        try {
          var oldInternal = /حوالة داخلية|تحويل داخلي/i.test(oldCategory + ' ' + oldType);
          var newInternal = /حوالة داخلية|تحويل داخلي/i.test(newCategory + ' ' + newType);
          if (!oldInternal && typeof reverseBudgetEntry_ === 'function' && oldCategory) {
            reverseBudgetEntry_(sB, oldCategory, oldAmount, uuid, oldIncoming);
          }
          if (!newInternal && typeof updateBudgetWithUUID_ === 'function' && newCategory) {
            updateBudgetWithUUID_(sB, newCategory, newAmount, newIncoming, uuid);
          }
        } catch (_) {}
      }

      // Update Dashboard row (إن وجد)
      try {
        var dashData = sDash.getDataRange().getValues();
        for (var d = 1; d < dashData.length; d++) {
          if (String(dashData[d][0]) === String(uuid)) {
            sDash.getRange(d + 1, 3).setValue(newMerchant);
            sDash.getRange(d + 1, 4).setValue(newAmount);
            sDash.getRange(d + 1, 5).setValue(newCategory);
            break;
          }
        }
      } catch (_) {}

      return { success: true, row: rowNum };
    }
  }
  
  return { success: false, error: 'لم يتم العثور على المعاملة' };
}

/**
 * ➕ API: إضافة معاملة يدوية
 */
function API_addTransaction(data) {
  var result = insertTransaction_({
    amount: Number(data.amount) || 0,
    merchant: data.merchant || '',
    category: data.category || 'أخرى',
    type: data.type || 'شراء',
    isIncoming: data.isIncoming || false,
    accNum: data.accNum || '',
    cardNum: data.cardNum || ''
  }, 'إدخال يدوي', data.notes || '');
  
  return {
    success: true,
    uuid: result.uuid,
    row: result.sheet1Row
  };
}

/**
 * 📊 API: الحصول على الميزانيات
 */
function API_getBudgets() {
  var sheet = _sheet('Budgets');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var budgets = [];
  for (var i = 1; i < data.length; i++) {
    budgets.push({
      category: data[i][0] || '',
      budget: Number(data[i][1]) || 0,
      spent: Number(data[i][2]) || 0,
      remaining: Number(data[i][3]) || 0
    });
  }
  
  return { success: true, data: budgets };
}

/**
 * 📈 API: الإحصائيات
 * ✅ محدّث للتوافق مع هيكل Sheet1 الجديد
 */
function API_getStats() {
  var sheet = _sheet('Sheet1');
  var data = sheet.getDataRange().getValues();
  
  // أعمدة Sheet1
  var COL = { Date: 1, Amount: 7, Merchant: 8, Category: 9, OpType: 10 };
  
  var stats = {
    totalTransactions: Math.max(0, data.length - 1),
    totalSpent: 0,
    totalIncome: 0,
    todaySpent: 0,
    todayIncome: 0,
    weekSpent: 0,
    weekIncome: 0,
    monthSpent: 0,
    monthIncome: 0,
    categoryBreakdown: {},
    recentTransactions: []
  };
  
  var today = new Date();
  var startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  var startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  for (var i = 1; i < data.length; i++) {
    var date = data[i][COL.Date];
    if (!(date instanceof Date)) {
      try { date = new Date(date); } catch (e) { continue; }
    }
    
    var amount = Number(data[i][COL.Amount]) || 0;
    var category = String(data[i][COL.Category] || 'أخرى');
    var opType = String(data[i][COL.OpType] || '');
    var isIncoming = /(وارد|إيداع|استلام|راتب)/i.test(opType);
    
    if (isIncoming) {
      stats.totalIncome += amount;
      if (date >= startOfDay) stats.todayIncome += amount;
      if (date >= startOfWeek) stats.weekIncome += amount;
      if (date >= startOfMonth) stats.monthIncome += amount;
    } else {
      stats.totalSpent += amount;
      if (date >= startOfDay) stats.todaySpent += amount;
      if (date >= startOfWeek) stats.weekSpent += amount;
      if (date >= startOfMonth) stats.monthSpent += amount;
      
      // Category breakdown
      if (!stats.categoryBreakdown[category]) {
        stats.categoryBreakdown[category] = 0;
      }
      stats.categoryBreakdown[category] += amount;
    }
  }
  
  // Recent 10
  var recent = [];
  for (var i = Math.max(1, data.length - 10); i < data.length; i++) {
    recent.push({
      UUID: data[i][0],
      Date: data[i][1],
      Amount: data[i][7],
      Merchant: data[i][8],
      Category: data[i][9]
    });
  }
  stats.recentTransactions = recent.reverse();
  
  return { success: true, data: stats };
}

/**
 * 🛡️ API: فحص سلامة البيانات
 */
function API_checkIntegrity() {
  return checkDataIntegrity_();
}

/**
 * 🔧 API: إصلاح البيانات
 */
function API_repairIntegrity() {
  return repairDataIntegrity_();
}

/**
 * 🧪 API: تشغيل الاختبارات
 */
function API_runTests() {
  return RUN_MASTER_TESTS();
}

/**
 * 📂 API: الحصول على التصنيفات
 */
function API_getCategories() {
  var sheet = _sheet('Sheet1');
  var data = sheet.getDataRange().getValues();
  
  var categories = {};
  for (var i = 1; i < data.length; i++) {
    var cat = String(data[i][10] || '');
    if (cat) categories[cat] = (categories[cat] || 0) + 1;
  }
  
  var result = [];
  for (var c in categories) {
    result.push({ name: c, count: categories[c] });
  }
  
  result.sort(function(a, b) { return b.count - a.count; });
  
  return { success: true, data: result };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 HTML Template
// ═══════════════════════════════════════════════════════════════════════════════

var ADVANCED_DASHBOARD_HTML = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>💰 SJA MoneyTracker</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <!-- Alpine.js -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
  
  <style>
    * { font-family: 'Tajawal', sans-serif; }
    .glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
    .gradient-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .gradient-success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
    .gradient-danger { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }
    .gradient-warning { background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); }
    .card-shadow { box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
    .hover-lift { transition: transform 0.3s, box-shadow 0.3s; }
    .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    [x-cloak] { display: none !important; }
  </style>
</head>
<body class="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">

<div x-data="dashboard()" x-init="init()" x-cloak class="container mx-auto px-4 py-8">
  
  <!-- Header -->
  <header class="text-center mb-8">
    <h1 class="text-4xl font-bold text-white mb-2">💰 <?= config.appName ?></h1>
    <p class="text-purple-300"><?= config.owner ?> • <?= config.version ?></p>
  </header>

  <!-- Stats Cards -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="gradient-primary rounded-2xl p-6 text-white card-shadow hover-lift">
      <div class="text-3xl font-bold" x-text="formatMoney(stats.monthSpent)">0</div>
      <div class="text-sm opacity-80">مصروفات الشهر</div>
    </div>
    <div class="gradient-success rounded-2xl p-6 text-white card-shadow hover-lift">
      <div class="text-3xl font-bold" x-text="formatMoney(stats.monthIncome)">0</div>
      <div class="text-sm opacity-80">دخل الشهر</div>
    </div>
    <div class="gradient-warning rounded-2xl p-6 text-white card-shadow hover-lift">
      <div class="text-3xl font-bold" x-text="formatMoney(stats.todaySpent)">0</div>
      <div class="text-sm opacity-80">مصروفات اليوم</div>
    </div>
    <div class="glass rounded-2xl p-6 text-white card-shadow hover-lift border border-white/20">
      <div class="text-3xl font-bold" x-text="stats.totalTransactions">0</div>
      <div class="text-sm opacity-80">إجمالي المعاملات</div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
    <button @click="tab='transactions'" :class="tab==='transactions' ? 'bg-purple-600' : 'bg-white/10'" 
            class="px-6 py-2 rounded-full text-white font-medium transition">📋 المعاملات</button>
    <button @click="tab='budgets'" :class="tab==='budgets' ? 'bg-purple-600' : 'bg-white/10'"
            class="px-6 py-2 rounded-full text-white font-medium transition">💰 الميزانيات</button>
    <button @click="tab='analytics'" :class="tab==='analytics' ? 'bg-purple-600' : 'bg-white/10'"
            class="px-6 py-2 rounded-full text-white font-medium transition">📊 التحليلات</button>
    <button @click="tab='tools'" :class="tab==='tools' ? 'bg-purple-600' : 'bg-white/10'"
            class="px-6 py-2 rounded-full text-white font-medium transition">🔧 الأدوات</button>
  </div>

  <!-- Transactions Tab -->
  <div x-show="tab==='transactions'" class="glass rounded-2xl p-6 card-shadow">
    
    <!-- Search & Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <input type="text" x-model="search" @input.debounce.300ms="loadTransactions()"
             placeholder="🔍 بحث..." class="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20">
      
      <select x-model="filterCategory" @change="loadTransactions()"
              class="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20">
        <option value="">كل التصنيفات</option>
        <template x-for="cat in categories" :key="cat.name">
          <option :value="cat.name" x-text="cat.name + ' (' + cat.count + ')'"></option>
        </template>
      </select>
      
      <button @click="showAddModal=true" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
        ➕ إضافة
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-white">
        <thead class="border-b border-white/20">
          <tr>
            <th class="py-3 px-2 text-right">التاريخ</th>
            <th class="py-3 px-2 text-right">التاجر</th>
            <th class="py-3 px-2 text-right">المبلغ</th>
            <th class="py-3 px-2 text-right">التصنيف</th>
            <th class="py-3 px-2 text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          <template x-for="tx in transactions" :key="tx.UUID || tx._row">
            <tr class="border-b border-white/10 hover:bg-white/5">
              <td class="py-3 px-2" x-text="formatDate(tx.Date)"></td>
              <td class="py-3 px-2" x-text="tx.Merchant || '-'"></td>
              <td class="py-3 px-2 font-bold" :class="tx.Amount > 0 ? 'text-red-400' : 'text-green-400'"
                  x-text="formatMoney(tx.Amount)"></td>
              <td class="py-3 px-2">
                <span class="px-2 py-1 bg-purple-600/50 rounded-full text-sm" x-text="tx.Category || '-'"></span>
              </td>
              <td class="py-3 px-2 text-center">
                <button @click="editTransaction(tx)" class="px-2 py-1 bg-blue-600 rounded hover:bg-blue-700">✏️</button>
                <button @click="confirmDelete(tx)" class="px-2 py-1 bg-red-600 rounded hover:bg-red-700 mr-1">🗑️</button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex justify-between items-center mt-6">
      <span class="text-white/60" x-text="'عرض ' + transactions.length + ' من ' + totalTransactions"></span>
      <div class="flex gap-2">
        <button @click="prevPage()" :disabled="currentPage===0" 
                class="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50 text-white">السابق</button>
        <button @click="nextPage()" :disabled="!hasMore"
                class="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50 text-white">التالي</button>
      </div>
    </div>
  </div>

  <!-- Budgets Tab -->
  <div x-show="tab==='budgets'" class="glass rounded-2xl p-6 card-shadow">
    <h2 class="text-2xl font-bold text-white mb-6">💰 الميزانيات</h2>
    
    <div class="grid gap-4">
      <template x-for="b in budgets" :key="b.category">
        <div class="bg-white/5 rounded-xl p-4">
          <div class="flex justify-between mb-2">
            <span class="text-white font-medium" x-text="b.category"></span>
            <span class="text-white/60" x-text="formatMoney(b.spent) + ' / ' + formatMoney(b.budget)"></span>
          </div>
          <div class="w-full bg-white/10 rounded-full h-3">
            <div class="h-3 rounded-full transition-all" 
                 :class="(b.spent / b.budget) > 0.9 ? 'bg-red-500' : (b.spent / b.budget) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'"
                 :style="'width:' + Math.min(100, (b.spent / b.budget) * 100) + '%'"></div>
          </div>
          <div class="text-sm text-white/40 mt-1" x-text="'متبقي: ' + formatMoney(b.remaining)"></div>
        </div>
      </template>
    </div>
  </div>

  <!-- Analytics Tab -->
  <div x-show="tab==='analytics'" class="glass rounded-2xl p-6 card-shadow">
    <h2 class="text-2xl font-bold text-white mb-6">📊 التحليلات</h2>
    
    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-white/5 rounded-xl p-4">
        <h3 class="text-white font-medium mb-4">توزيع المصاريف حسب التصنيف</h3>
        <canvas id="categoryChart"></canvas>
      </div>
      
      <div class="bg-white/5 rounded-xl p-4">
        <h3 class="text-white font-medium mb-4">الدخل مقابل المصاريف</h3>
        <canvas id="incomeExpenseChart"></canvas>
      </div>
    </div>
  </div>

  <!-- Tools Tab -->
  <div x-show="tab==='tools'" class="glass rounded-2xl p-6 card-shadow">
    <h2 class="text-2xl font-bold text-white mb-6">🔧 أدوات النظام</h2>
    
    <div class="grid md:grid-cols-2 gap-4">
      <button @click="checkIntegrity()" class="p-4 bg-blue-600/50 rounded-xl text-white text-right hover:bg-blue-600/70 transition">
        <div class="text-xl mb-1">🛡️ فحص سلامة البيانات</div>
        <div class="text-sm opacity-70">التحقق من ترابط الأوراق</div>
      </button>
      
      <button @click="repairIntegrity()" class="p-4 bg-orange-600/50 rounded-xl text-white text-right hover:bg-orange-600/70 transition">
        <div class="text-xl mb-1">🔧 إصلاح البيانات</div>
        <div class="text-sm opacity-70">حذف البيانات اليتيمة</div>
      </button>
      
      <button @click="runTests()" class="p-4 bg-purple-600/50 rounded-xl text-white text-right hover:bg-purple-600/70 transition">
        <div class="text-xl mb-1">🧪 تشغيل الاختبارات</div>
        <div class="text-sm opacity-70">اختبار جميع وظائف النظام</div>
      </button>
      
      <button @click="exportData()" class="p-4 bg-green-600/50 rounded-xl text-white text-right hover:bg-green-600/70 transition">
        <div class="text-xl mb-1">📤 تصدير البيانات</div>
        <div class="text-sm opacity-70">تصدير CSV</div>
      </button>
    </div>
    
    <!-- Results Panel -->
    <div x-show="toolResult" class="mt-6 p-4 bg-white/5 rounded-xl">
      <pre class="text-green-400 text-sm overflow-x-auto" x-text="JSON.stringify(toolResult, null, 2)"></pre>
    </div>
  </div>

  <!-- Add Modal -->
  <div x-show="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4" @click.outside="showAddModal=false">
      <h3 class="text-xl font-bold text-white mb-4">➕ إضافة معاملة</h3>
      
      <div class="space-y-4">
        <input type="number" x-model="newTx.amount" placeholder="المبلغ" 
               class="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20">
        <input type="text" x-model="newTx.merchant" placeholder="التاجر"
               class="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20">
        <select x-model="newTx.category" class="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20">
          <option value="">اختر التصنيف</option>
          <template x-for="cat in categories" :key="cat.name">
            <option :value="cat.name" x-text="cat.name"></option>
          </template>
        </select>
        <textarea x-model="newTx.notes" placeholder="ملاحظات"
                  class="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"></textarea>
      </div>
      
      <div class="flex gap-2 mt-6">
        <button @click="addTransaction()" class="flex-1 py-2 bg-green-600 text-white rounded-lg">حفظ</button>
        <button @click="showAddModal=false" class="flex-1 py-2 bg-white/10 text-white rounded-lg">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- Delete Confirm Modal -->
  <div x-show="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
      <h3 class="text-xl font-bold text-white mb-4">🗑️ تأكيد الحذف</h3>
      <p class="text-white/70 mb-6">
        سيتم حذف هذه المعاملة من جميع الأوراق المرتبطة (Sheet1, Dashboard, Debt_Ledger, Budgets)
      </p>
      <div class="flex gap-2">
        <button @click="deleteTransaction()" class="flex-1 py-2 bg-red-600 text-white rounded-lg">حذف نهائي</button>
        <button @click="showDeleteModal=false" class="flex-1 py-2 bg-white/10 text-white rounded-lg">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- Loading -->
  <div x-show="loading" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="text-white text-xl">⏳ جاري التحميل...</div>
  </div>

</div>

<script>
function dashboard() {
  return {
    tab: 'transactions',
    loading: false,
    
    // Data
    stats: { monthSpent: 0, monthIncome: 0, todaySpent: 0, totalTransactions: 0, categoryBreakdown: {} },
    transactions: [],
    budgets: [],
    categories: [],
    
    // Pagination
    currentPage: 0,
    pageSize: 20,
    totalTransactions: 0,
    hasMore: false,
    
    // Filters
    search: '',
    filterCategory: '',
    
    // Modals
    showAddModal: false,
    showDeleteModal: false,
    selectedTx: null,
    newTx: { amount: '', merchant: '', category: '', notes: '' },
    
    // Tools
    toolResult: null,
    
    // Charts
    categoryChart: null,
    incomeExpenseChart: null,
    
    async init() {
      this.loading = true;
      await Promise.all([
        this.loadStats(),
        this.loadTransactions(),
        this.loadBudgets(),
        this.loadCategories()
      ]);
      this.loading = false;
    },
    
    async loadStats() {
      const result = await this.callAPI('API_getStats');
      if (result.success) this.stats = result.data;
      this.updateCharts();
    },
    
    async loadTransactions() {
      const params = {
        limit: this.pageSize,
        offset: this.currentPage * this.pageSize,
        search: this.search,
        category: this.filterCategory
      };
      const result = await this.callAPI('API_getTransactions', params);
      if (result.success) {
        this.transactions = result.data;
        this.totalTransactions = result.total;
        this.hasMore = result.hasMore;
      }
    },
    
    async loadBudgets() {
      const result = await this.callAPI('API_getBudgets');
      if (result.success) this.budgets = result.data;
    },
    
    async loadCategories() {
      const result = await this.callAPI('API_getCategories');
      if (result.success) this.categories = result.data;
    },
    
    nextPage() {
      this.currentPage++;
      this.loadTransactions();
    },
    
    prevPage() {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.loadTransactions();
      }
    },
    
    confirmDelete(tx) {
      this.selectedTx = tx;
      this.showDeleteModal = true;
    },
    
    async deleteTransaction() {
      if (!this.selectedTx?.UUID) return;
      
      this.loading = true;
      const result = await this.callAPI('API_deleteTransaction', this.selectedTx.UUID);
      this.loading = false;
      
      if (result.success) {
        this.showDeleteModal = false;
        this.selectedTx = null;
        await this.init();
        alert('✅ تم الحذف من: ' + result.deleted.join(', '));
      } else {
        alert('❌ فشل الحذف: ' + result.error);
      }
    },
    
    async addTransaction() {
      if (!this.newTx.amount) return alert('المبلغ مطلوب');
      
      this.loading = true;
      const result = await this.callAPI('API_addTransaction', this.newTx);
      this.loading = false;
      
      if (result.success) {
        this.showAddModal = false;
        this.newTx = { amount: '', merchant: '', category: '', notes: '' };
        await this.init();
        alert('✅ تمت الإضافة بنجاح');
      }
    },
    
    editTransaction(tx) {
      // Simple edit via prompt
      const newMerchant = prompt('التاجر:', tx.Merchant || '');
      const newCategory = prompt('التصنيف:', tx.Category || '');
      
      if (newMerchant !== null || newCategory !== null) {
        this.callAPI('API_updateTransaction', tx.UUID, {
          Merchant: newMerchant || tx.Merchant,
          Category: newCategory || tx.Category
        }).then(() => this.loadTransactions());
      }
    },
    
    async checkIntegrity() {
      this.loading = true;
      this.toolResult = await this.callAPI('API_checkIntegrity');
      this.loading = false;
    },
    
    async repairIntegrity() {
      if (!confirm('سيتم حذف البيانات اليتيمة. متأكد؟')) return;
      this.loading = true;
      this.toolResult = await this.callAPI('API_repairIntegrity');
      this.loading = false;
    },
    
    async runTests() {
      alert('سيتم تشغيل الاختبارات. هذا قد يستغرق دقيقة...');
      this.loading = true;
      this.toolResult = await this.callAPI('API_runTests');
      this.loading = false;
    },
    
    exportData() {
      // Export transactions as CSV
      let csv = 'UUID,Date,Amount,Merchant,Category,Type\\n';
      this.transactions.forEach(tx => {
        csv += [tx.UUID, tx.Date, tx.Amount, tx.Merchant, tx.Category, tx.Type].join(',') + '\\n';
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'transactions.csv';
      link.click();
    },
    
    updateCharts() {
      // Category Chart
      const catCtx = document.getElementById('categoryChart');
      if (catCtx && this.stats.categoryBreakdown) {
        const labels = Object.keys(this.stats.categoryBreakdown);
        const data = Object.values(this.stats.categoryBreakdown);
        
        if (this.categoryChart) this.categoryChart.destroy();
        this.categoryChart = new Chart(catCtx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: ['#667eea', '#764ba2', '#11998e', '#38ef7d', '#f7971e', '#eb3349']
            }]
          },
          options: { plugins: { legend: { labels: { color: '#fff' } } } }
        });
      }
      
      // Income/Expense Chart
      const ieCtx = document.getElementById('incomeExpenseChart');
      if (ieCtx) {
        if (this.incomeExpenseChart) this.incomeExpenseChart.destroy();
        this.incomeExpenseChart = new Chart(ieCtx, {
          type: 'bar',
          data: {
            labels: ['اليوم', 'الأسبوع', 'الشهر'],
            datasets: [
              { label: 'المصروفات', data: [this.stats.todaySpent, this.stats.weekSpent, this.stats.monthSpent], backgroundColor: '#eb3349' },
              { label: 'الدخل', data: [this.stats.todayIncome, this.stats.weekIncome, this.stats.monthIncome], backgroundColor: '#38ef7d' }
            ]
          },
          options: { scales: { y: { ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } }, plugins: { legend: { labels: { color: '#fff' } } } }
        });
      }
    },
    
    formatMoney(n) {
      return (Number(n) || 0).toFixed(2) + ' SAR';
    },
    
    formatDate(d) {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('ar-SA');
    },
    
    async callAPI(fn, ...args) {
      return new Promise((resolve) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(e => resolve({ success: false, error: e.message }))
          [fn](...args);
      });
    }
  };
}
</script>

</body>
</html>`;
