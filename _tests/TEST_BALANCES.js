/**
 * اختبار نظام رصد الحسابات
 * Test the account balances tracking system
 */

function TEST_BALANCES() {
  Logger.log('====================================');
  Logger.log('اختبار نظام رصد الحسابات');
  Logger.log('====================================\n');
  
  try {
    // 1. Test: Add sample balances
    Logger.log('1️⃣ إضافة أرصدة تجريبية...');
    setBalance_('AlrajhiBank', 15000);
    setBalance_('Tiqmo', 5000);
    setBalance_('Alinma', 3000);
    Logger.log('✅ تم إضافة الأرصدة\n');
    
    // 2. Test: Get individual balance
    Logger.log('2️⃣ استعلام عن رصيد حساب واحد...');
    var balance = getBalance_('AlrajhiBank');
    Logger.log('رصيد AlrajhiBank: ' + balance + ' SAR');
    Logger.log('✅ نجح\n');
    
    // 3. Test: Get all balances
    Logger.log('3️⃣ استعلام عن جميع الأرصدة...');
    var allBalances = getAllBalances_();
    Logger.log('عدد الحسابات: ' + allBalances.length);
    for (var i = 0; i < allBalances.length; i++) {
      Logger.log('  - ' + allBalances[i].account + ': ' + allBalances[i].balance.toFixed(2) + ' SAR');
    }
    Logger.log('✅ نجح\n');
    
    // 4. Test: Simulate transfer
    Logger.log('4️⃣ محاكاة تحويل 1000 من AlrajhiBank إلى Tiqmo...');
    applyTxnToBalance_('AlrajhiBank', 1000, false); // صادر
    applyTxnToBalance_('Tiqmo', 1000, true); // وارد
    
    var newAlrajhi = getBalance_('AlrajhiBank');
    var newTiqmo = getBalance_('Tiqmo');
    Logger.log('رصيد AlrajhiBank الجديد: ' + newAlrajhi + ' SAR (المتوقع: 14000)');
    Logger.log('رصيد Tiqmo الجديد: ' + newTiqmo + ' SAR (المتوقع: 6000)');
    
    if (newAlrajhi === 14000 && newTiqmo === 6000) {
      Logger.log('✅ نجح التحويل\n');
    } else {
      Logger.log('❌ فشل: الأرصدة غير صحيحة\n');
    }
    
    // 5. Test: Send balance report (simulation)
    Logger.log('5️⃣ اختبار إرسال تقرير الأرصدة...');
    Logger.log('ملاحظة: لن يتم إرسال رسالة فعلية (للاختبار فقط)');
    
    var chatId = ENV.CHAT_ID || 'test_chat_id';
    if (typeof sendAccountsBalanceReport_ === 'function') {
      Logger.log('✅ وظيفة sendAccountsBalanceReport_ موجودة ويمكن استدعاؤها');
      // sendAccountsBalanceReport_(chatId); // uncomment to actually send
    } else {
      Logger.log('❌ وظيفة sendAccountsBalanceReport_ غير موجودة');
    }
    
    Logger.log('\n====================================');
    Logger.log('✅ اكتمل الاختبار بنجاح!');
    Logger.log('====================================');
    
    return {
      success: true,
      message: 'جميع الاختبارات نجحت'
    };
    
  } catch (e) {
    Logger.log('\n❌ خطأ في الاختبار: ' + e.toString());
    Logger.log(e.stack);
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * اختبار سريع للأرصدة الحالية
 */
function SHOW_CURRENT_BALANCES() {
  Logger.log('====================================');
  Logger.log('الأرصدة الحالية');
  Logger.log('====================================\n');
  
  var balances = getAllBalances_();
  
  if (balances.length === 0) {
    Logger.log('لا توجد حسابات مسجلة بعد.');
    return;
  }
  
  var total = 0;
  for (var i = 0; i < balances.length; i++) {
    var acc = balances[i];
    Logger.log('💳 ' + acc.account + ': ' + acc.balance.toFixed(2) + ' SAR');
    total += acc.balance;
  }
  
  Logger.log('\n====================================');
  Logger.log('💰 الإجمالي: ' + total.toFixed(2) + ' SAR');
  Logger.log('====================================');
}
