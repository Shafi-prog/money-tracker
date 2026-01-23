/**
 * ============================================
 * SJA-V1 | Bank Accounts Configuration
 * ============================================
 * 
 * تعريف جميع البطاقات والحسابات البنكية
 * بناءً على الرسائل النصية الفعلية
 * 
 * By: Shafi Jahz Almutiry
 */

// ================================
// تسجيل جميع البطاقات والحسابات
// ================================

function SJA_registerMyRealAccounts() {
  Logger.log('🚀 بدء تسجيل البطاقات والحسابات الحقيقية...');
  
  var registered = [];
  
  // =====================
  // 1. STC Bank
  // =====================
  
  // بطاقة 3281 - Apple Pay
  registered.push(SJA_registerAccount({
    accountId: '3281',
    type: 'بطاقة رقمية',
    bankName: 'STC Bank',
    last4: '3281',
    phonePattern: 'STC Bank|stc bank',
    smsPattern: '3281|*3281|***3281',
    userId: 'USER1',
    notes: 'Apple Pay - رسائل: شراء Apple Pay، رصيد غير كافي'
  }));
  
  // بطاقة 4495 - VISA
  registered.push(SJA_registerAccount({
    accountId: '4495',
    type: 'بطاقة ائتمان',
    bankName: 'STC Bank',
    last4: '4495',
    phonePattern: 'STC Bank|stc bank',
    smsPattern: '4495|*4495|***4495',
    userId: 'USER1',
    notes: 'VISA - رسائل: Notification، شراء VISA، Upwork'
  }));
  
  // =====================
  // 2. tiqmo
  // =====================
  
  // بطاقة 0305 - MasterCard Apple Pay
  registered.push(SJA_registerAccount({
    accountId: '0305',
    type: 'بطاقة مدى',
    bankName: 'tiqmo',
    last4: '0305',
    phonePattern: 'tiqmo|TIQMO',
    smsPattern: '0305|**0305|XXXX0305|5246XXXXXXXX0305',
    userId: 'USER1',
    notes: 'MasterCard Apple Pay - رسائل: شراء POS، ECOM Purchase، Online Purchase'
  }));
  
  // حساب 9682
  registered.push(SJA_registerAccount({
    accountId: '9682',
    type: 'حساب محفظة',
    bankName: 'tiqmo',
    last4: '9682',
    phonePattern: 'tiqmo|TIQMO',
    smsPattern: '9682|**9682',
    userId: 'USER1',
    notes: 'حساب tiqmo - Account No.'
  }));
  
  // =====================
  // 3. AlrajhiBank (الراجحي)
  // =====================
  
  // حساب 9765 - حساب جاري
  registered.push(SJA_registerAccount({
    accountId: '9765',
    type: 'حساب جاري',
    bankName: 'بنك الراجحي',
    last4: '9765',
    phonePattern: 'AlrajhiBank|الراجحي|Alrajhi',
    smsPattern: '9765|من9765|من:9765',
    userId: 'USER1',
    notes: 'حساب جاري - رسائل: حوالة داخلية صادرة'
  }));
  
  // حساب 9767 - حساب الراتب (الرئيسي)
  registered.push(SJA_registerAccount({
    accountId: '9767',
    type: 'حساب راتب',
    bankName: 'بنك الراجحي',
    last4: '9767',
    phonePattern: 'AlrajhiBank|الراجحي|Alrajhi',
    smsPattern: '9767|من9767|من:9767',
    userId: 'USER1',
    notes: 'حساب الراتب - رسائل: حوالة محلية، شراء انترنت، إضافة أموال للمحافظ'
  }));
  
  // بطاقة 4912 - مدى Apple Pay
  registered.push(SJA_registerAccount({
    accountId: '4912',
    type: 'بطاقة مدى',
    bankName: 'بنك الراجحي',
    last4: '4912',
    phonePattern: 'AlrajhiBank|الراجحي|Alrajhi',
    smsPattern: '4912|*4912|بطاقة:4912',
    userId: 'USER1',
    notes: 'مدى Apple Pay - رسائل: شراء انترنت من Tiqmo'
  }));
  
  // حساب 3512 - حذف USER2 - الحساب ملغي
  // Account removed as requested
  
  // حساب 0005 - مؤسسة لبنات الوقفية
  registered.push(SJA_registerAccount({
    accountId: '0005',
    type: 'حساب خيري',
    bankName: 'مؤسسة لبنات الوقفية',
    last4: '0005',
    phonePattern: 'ALBI|لبنات',
    smsPattern: '0005|الى:0005',
    userId: 'USER1',
    notes: 'حساب خيري - حوالات صادرة'
  }));
  
  // =====================
  // 4. D360 Bank
  // =====================
  
  // بطاقة 3449 - VISA & Mada
  registered.push(SJA_registerAccount({
    accountId: '3449',
    type: 'بطاقة مدى',
    bankName: 'D360 Bank',
    last4: '3449',
    phonePattern: 'D360|d360',
    smsPattern: '3449|*3449|بطاقة:*3449',
    userId: 'USER1',
    notes: 'VISA & Mada - رسائل: شراء دولي، سحب نقدي، عملية مرفوضة'
  }));
  
  // بطاقة 4912 - mada (D360)
  registered.push(SJA_registerAccount({
    accountId: '4912_D360',
    type: 'بطاقة مدى',
    bankName: 'D360 Bank',
    last4: '4912',
    phonePattern: 'D360|d360',
    smsPattern: '*4912|بطاقة:*4912',
    userId: 'USER1',
    notes: 'mada - رسائل: إضافة باستخدام آبل باي'
  }));
  
  // حساب 7815
  registered.push(SJA_registerAccount({
    accountId: '7815',
    type: 'حساب محفظة',
    bankName: 'D360 Bank',
    last4: '7815',
    phonePattern: 'D360|d360',
    smsPattern: '7815|*7815|إلى:*7815',
    userId: 'USER1',
    notes: 'حساب محفظة - يستقبل إضافات'
  }));
  
  Logger.log('✅ تم تسجيل ' + registered.length + ' بطاقة/حساب بنجاح!');
  
  return {
    ok: true,
    count: registered.length,
    accounts: registered
  };
}

// ================================
// تعريفات الأنماط الخاصة
// ================================

function SJA_setupSpecialPatterns() {
  Logger.log('🔧 إعداد الأنماط الخاصة...');
  
  var ss = _ss();
  var sheet = ss.getSheetByName('Special_Patterns');
  
  if (!sheet) {
    sheet = ss.insertSheet('Special_Patterns');
    
    // Headers
    sheet.appendRow([
      'Pattern Type',
      'Keywords',
      'Category',
      'Treatment',
      'Notes'
    ]);
    
    // تنسيق
    sheet.getRange(1, 1, 1, 5)
      .setBackground('#ef4444')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  }
  
  // الأنماط الخاصة
  var patterns = [
    // 1. إضافة أموال (من الراتب إلى المحافظ) - لا تُحسب
    ['WALLET_RELOAD', 'إضافة أموال|اضافة باستخدام آبل باى|إضافة باستخدام', 'تحويل داخلي', 'IGNORE', 'لا تُحسب ضمن المصروفات - مجرد نقل أموال'],
    
    // 2. تابي - أقساط
    ['TABBY', 'Tabby|تابي', 'أقساط', 'INSTALLMENT', 'رصد كقسط شهري'],
    
    // 3. تمارا - أقساط
    ['TAMARA', 'Tamara|تمارا', 'أقساط', 'INSTALLMENT', 'رصد كقسط شهري'],
    
    // 4. سداد فواتير
    ['BILL_PAYMENT', 'SAUDI ELECTRICITY|Jawwy|STC|موبايلي|زين', 'فواتير', 'EXPENSE', 'سداد فاتورة'],
    
    // 5. حوالات خيرية
    ['CHARITY', 'لبنات الوقفية|خيري|صدقة', 'تبرعات', 'EXPENSE', 'حوالة خيرية'],
    
    // 6. حوالات شخصية صادرة
    ['TRANSFER_OUT', 'حوالة داخلية صادرة|حوالة محلية صادرة|حوالة دولية', 'حوالات', 'TRANSFER_OUT', 'حوالة صادرة - دائن'],
    
    // 7. حوالات واردة
    ['TRANSFER_IN', 'حوالة وارده|استرجاع', 'حوالات', 'TRANSFER_IN', 'حوالة واردة - مدين'],
    
    // 8. عمليات مرفوضة - تجاهل
    ['DECLINED', 'عملية مرفوضة|رصيد غير كافي|Declined', 'مرفوض', 'IGNORE', 'لا تُحسب - عملية ملغاة'],
    
    // 9. رموز OTP - تجاهل
    ['OTP', 'رمز التحقق|OTP|رمز مؤقت', 'أمان', 'IGNORE', 'رسالة أمان فقط'],
    
    // 10. مشتريات دولية
    ['INTERNATIONAL', 'شراء دولي|USD|KWD|KES', 'مشتريات دولية', 'EXPENSE', 'عملية بعملة أجنبية']
  ];
  
  patterns.forEach(function(p) {
    sheet.appendRow(p);
  });
  
  Logger.log('✅ تم إعداد ' + patterns.length + ' نمط خاص');
  
  return {ok: true, count: patterns.length};
}

// ================================
// تحليل الرسالة وتطبيق الأنماط
// ================================

function SJA_analyzeMessage(smsText) {
  var ss = _ss();
  var sheet = ss.getSheetByName('Special_Patterns');
  
  if (!sheet) {
    return {type: 'NORMAL', treatment: 'EXPENSE'};
  }
  
  var data = sheet.getDataRange().getValues();
  
  // تخطي الـ header
  for (var i = 1; i < data.length; i++) {
    var keywords = data[i][1].split('|');
    
    for (var k = 0; k < keywords.length; k++) {
      if (smsText.indexOf(keywords[k]) !== -1) {
        return {
          type: data[i][0],           // Pattern Type
          category: data[i][2],       // Category
          treatment: data[i][3],      // Treatment
          matched: keywords[k],
          notes: data[i][4]
        };
      }
    }
  }
  
  return {type: 'NORMAL', treatment: 'EXPENSE'};
}

// ================================
// Setup كامل
// ================================

function SJA_setupBankingSystem() {
  Logger.log('🚀 بدء إعداد النظام البنكي الكامل...');
  
  // 1. إنشاء Account Registry
  SJA_setupAccountRegistry();
  
  // 2. تسجيل جميع الحسابات
  var result = SJA_registerMyRealAccounts();
  
  // 3. إعداد الأنماط الخاصة
  SJA_setupSpecialPatterns();
  
  Logger.log('✅ تم إعداد النظام البنكي بنجاح!');
  Logger.log('📊 إحصائيات:');
  Logger.log('   - عدد الحسابات: ' + result.count);
  Logger.log('   - البنوك: STC Bank, tiqmo, الراجحي, D360');
  Logger.log('   - الأنماط الخاصة: 10');
  
  return {
    ok: true,
    accounts: result.count,
    message: 'Banking system ready'
  };
}

// ================================
// اختبار الأنماط
// ================================

function SJA_testBankPatterns() {
  Logger.log('🧪 اختبار الأنماط البنكية...');
  
  var testMessages = [
    // STC Bank
    'شراء Apple Pay\nعبر:*3281\nبـ:8 SAR\nمن:LMSAT KHOZAM\nفي: 19/01/26 22:49',
    'Notification: استرجاع\nTransaction: Upwork -864635839REF\nCard: ***4495\nAmount: 227.57 USD',
    
    // tiqmo
    'شراء POS\nبـ 5.00 SAR\nمن ZAWYAT ALSAER ALADEL\nعبر MasterCard **0305 Apple Pay',
    'إضافة أموال\nمبلغ 1000.00 ريال\nمن آبل باي\nفي 2026-01-14 19:47:49',
    
    // الراجحي
    'حوالة داخلية صادرة\nمن9765\nبـSAR 300\nلـ3512;محمد المطيري',
    'شراء انترنت\nبطاقة:4912;مدى-ابل باي\nمن:9767\nمبلغ:SAR 1000\nلدى:Tiqmo',
    
    // D360
    'شراء دولي\nمبلغ: KWD 4.00 (SAR 49.11)\nبطاقة: *3449 - VISA (Apple Pay)',
    'عملية مرفوضة: الرصيد غير كافي\nمبلغ: SAR 238.55\nبطاقة:*3449'
  ];
  
  testMessages.forEach(function(msg, idx) {
    Logger.log('\n--- اختبار ' + (idx + 1) + ' ---');
    Logger.log('الرسالة: ' + msg.substring(0, 50) + '...');
    
    // 1. كشف الحساب
    var account = SJA_detectAccountFromSMS(msg);
    if (account) {
      Logger.log('✅ الحساب: ' + account.accountId + ' (' + account.bankName + ')');
      Logger.log('   المستخدم: ' + account.userId);
    } else {
      Logger.log('❌ لم يتم التعرف على الحساب');
    }
    
    // 2. تحليل النمط
    var analysis = SJA_analyzeMessage(msg);
    Logger.log('📊 النمط: ' + analysis.type + ' → ' + analysis.treatment);
    if (analysis.category) {
      Logger.log('   التصنيف: ' + analysis.category);
    }
  });
  
  Logger.log('\n✅ انتهى الاختبار');
}
