/********** SJA-V1 | TEST_REAL_BANK_SMS.js – Real Bank SMS Test Suite **********/

/**
 * Comprehensive test suite based on REAL SMS messages from:
 * - SAIB (Saudi Investment Bank)
 * - STC Bank/Pay
 * - AlRajhi Bank
 * - Tiqmo
 * - Tamara (Installments/Commitments)
 * 
 * Tests AI categorization accuracy against known expected results
 */

// ============================================
// REAL SMS TEST CASES - FROM Banks SMS.txt
// ============================================
var REAL_SMS_TESTS = [
  
  // ========== SAIB BANK ==========
  {
    id: 1,
    bank: 'SAIB',
    sms: 'شراء انترنت\nبSAR 737.00\nلدىD360 \nمدى ابل X3474 \nمن8001 \nب09-13 05:41',
    expected: {
      category: 'محافظ',
      type: 'شراء',
      isIncoming: false,
      amount: 737.00,
      merchant: 'D360',
      card: '3474',
      account: '8001'
    }
  },
  {
    id: 2,
    bank: 'SAIB',
    sms: 'شراء POS\nبSAR 2.00\nمنAmani Mo \nمدى ابل X3474 \nب09-19 20:26',
    expected: {
      category: 'مشتريات عامة',
      type: 'مشتريات',
      isIncoming: false,
      amount: 2.00,
      merchant: 'Amani Mo',
      card: '3474'
    }
  },
  {
    id: 3,
    bank: 'SAIB',
    sms: 'شراء انترنت\nبSAR 95.00\nلدىKuduKSAR \nمدى ابل X3474 \nمن8001 \nب09-23 19:16',
    expected: {
      category: 'طعام',
      type: 'شراء',
      isIncoming: false,
      amount: 95.00,
      merchant: 'Kudu'
    }
  },
  {
    id: 4,
    bank: 'SAIB',
    sms: 'حوالة واردة: محلية (مقبوله)\nمن: XXXX4903 \nمؤسسة شقق زوايا الماسية \nعبر: البنك الأهلي السعودي \nمبلغ: SAR 15,000.00\nالى: XXXX8001 \nفي: 09-27 11:15',
    expected: {
      category: 'حوالات واردة',
      type: 'حوالة',
      isIncoming: true,
      amount: 15000.00,
      account: '8001'
    }
  },
  {
    id: 5,
    bank: 'SAIB',
    sms: 'حوالة صادرة: محلية\nمن: XXX8001 \nالى: shafi Jahz T Almutiry XXX9767 \nمبلغ: SAR 21,609.91\nرسوم: SAR 5.75\nفي: 09-27 18:07',
    expected: {
      category: 'حوالات صادرة',
      type: 'حوالة',
      isIncoming: false,
      amount: 21609.91,
      account: '8001'
    }
  },
  {
    id: 6,
    bank: 'SAIB',
    sms: 'سحب صراف\nفي (ADENAH )\nبطاقةمدى XXX3474 \nمبلغ:SAR 50.00 \nفي:11-10 07:19',
    expected: {
      category: 'سحب نقدي',
      type: 'سحب',
      isIncoming: false,
      amount: 50.00,
      card: '3474'
    }
  },
  {
    id: 7,
    bank: 'SAIB',
    sms: 'شراء انترنت\nبSAR 2,500.00\nلدىTiqmoSAR \nمدى ابل X3474 \nمن8001 \nب11-10 11:42',
    expected: {
      category: 'محافظ',
      type: 'شحن',
      isIncoming: false,
      amount: 2500.00,
      merchant: 'Tiqmo'
    }
  },
  {
    id: 8,
    bank: 'SAIB',
    sms: 'استرداد مبلغ\nمبلغ: SAR 123.93\nفي: PANDA RETAIL CO 9 \nبطاقة: مدى XXX3474 \nالى: XXX8001 \nفي: 12-28 15:12',
    expected: {
      category: 'استرداد',
      type: 'استرداد',
      isIncoming: true,
      amount: 123.93,
      merchant: 'PANDA'
    }
  },
  {
    id: 9,
    bank: 'SAIB',
    sms: 'اشعار: رصيد غير كافي\nالعملية: انترنت \nمبلغ: SAR 1,000.00\nبطاقة: مدى (Apple Pay) ;XXX3474 \nلدى: Tiqmo R \nفي: 01-12 12:38',
    expected: {
      category: 'مرفوضة',
      type: 'رفض',
      isIncoming: false,
      amount: 1000.00,
      status: 'declined'
    }
  },
  {
    id: 10,
    bank: 'SAIB',
    sms: 'شراء انترنت\nبSAR 500.00\nلدىDonation \nمدى ابل X3474 \nمن8001 \nب11-09 18:54',
    expected: {
      category: 'تبرعات',
      type: 'شراء',
      isIncoming: false,
      amount: 500.00,
      merchant: 'Donation'
    }
  },

  // ========== STC BANK ==========
  {
    id: 11,
    bank: 'STC Bank',
    sms: 'إضافة أموال لحسابك\nبـ:500.00 ر.س\nعبر:*XXXX\nفي:11/11/25 08:34',
    expected: {
      category: 'شحن رصيد',
      type: 'إضافة',
      isIncoming: true,
      amount: 500.00
    }
  },
  {
    id: 12,
    bank: 'STC Bank',
    sms: 'شراء Apple Pay\nعبر:*3281\nبـ:60 SAR\nمن:HALAWYAT TAAM WHAQIQI\nفي: 29/11/25 16:38',
    expected: {
      category: 'طعام',
      type: 'مشتريات',
      isIncoming: false,
      amount: 60.00,
      merchant: 'HALAWYAT TAAM WHAQIQI',
      card: '3281'
    }
  },
  {
    id: 13,
    bank: 'STC Bank',
    sms: 'حوالة داخلية صادرة\nبـ: 70.00ر.س\nإلى: هبه المزروع\nحساب:1929*\nفي:26/11/25 00:08',
    expected: {
      category: 'حوالات صادرة',
      type: 'حوالة',
      isIncoming: false,
      amount: 70.00
    }
  },
  {
    id: 14,
    bank: 'STC Bank',
    sms: 'رصيد غير كافي\n171.54 ر.س\nUpwork -869546658REF\n30/11/25 19:33\nرصيدك 21.97',
    expected: {
      category: 'مرفوضة',
      type: 'رفض',
      isIncoming: false,
      amount: 171.54,
      status: 'declined'
    }
  },
  {
    id: 15,
    bank: 'STC Bank',
    sms: 'شراء VISA\nعبر:*4495\nبـ:44.82 USD\nمن:Upwork -869547177REF\nفي: 30/11/25 19:41',
    expected: {
      category: 'دخل',
      type: 'مشتريات',
      isIncoming: false,
      amount: 44.82,
      currency: 'USD',
      merchant: 'Upwork'
    }
  },
  {
    id: 16,
    bank: 'STC Bank',
    sms: 'Declined due to Timeout\nالعملية: شراء عبر الإنترنت\nالبطاقة: ***4495\nالمبلغ: 774.05 SAR\nفي: Panda click\nبتاريخ: 02/12/25 22:55',
    expected: {
      category: 'مرفوضة',
      type: 'رفض',
      isIncoming: false,
      amount: 774.05,
      status: 'declined'
    }
  },
  {
    id: 17,
    bank: 'STC Bank',
    sms: 'شراء Apple Pay\nعبر:*4495\nبـ:41 SAR\nمن:Amazon SA\nفي: 06/12/25 23:20',
    expected: {
      category: 'تسوق',
      type: 'مشتريات',
      isIncoming: false,
      amount: 41.00,
      merchant: 'Amazon'
    }
  },
  {
    id: 18,
    bank: 'STC Bank',
    sms: 'شراء Apple Pay\nعبر:*4495\nبـ:41 SAR\nمن:DUNKIN DONUTS\nفي: 08/12/25 13:16',
    expected: {
      category: 'طعام',
      type: 'مشتريات',
      isIncoming: false,
      amount: 41.00,
      merchant: 'DUNKIN DONUTS'
    }
  },
  {
    id: 19,
    bank: 'STC Bank',
    sms: 'شراء Apple Pay\nعبر:*3281\nبـ:500 SAR\nمن:Tiqmo\nفي: 25/01/26 18:23',
    expected: {
      category: 'محافظ',
      type: 'شحن',
      isIncoming: false,
      amount: 500.00,
      merchant: 'Tiqmo'
    }
  },
  {
    id: 20,
    bank: 'STC Bank',
    sms: 'Notification: استرجاع\nTransaction: Upwork -864635839REF\nCard: ***4495\nAmount: 227.57 USD\nDate: 18/01/26 03:12',
    expected: {
      category: 'استرداد',
      type: 'استرداد',
      isIncoming: true,
      amount: 227.57,
      currency: 'USD'
    }
  },

  // ========== TAMARA (INSTALLMENTS) ==========
  {
    id: 21,
    bank: 'Tamara',
    sms: 'دفعة قادمة لطلبك من فلاي اديل بقيمة 136.03 SAR مستحقة خلال يومين. فضلاً، تأكد من وجود رصيد كافي في بطاقتك. أو ادفع الحين: https://tmra.pe/cQh0KHNrKk',
    expected: {
      category: 'أقساط',
      type: 'تذكير',
      isIncoming: false,
      amount: 136.03,
      merchant: 'فلاي اديل',
      isInstallment: true
    }
  },
  {
    id: 22,
    bank: 'Tamara',
    sms: 'تأكيد دفعة مقسمة إلى 4 \nالمتجر: AliExpress \nالطلب: 123.25 SAR \nالتاريخ: 29/12/2025',
    expected: {
      category: 'أقساط',
      type: 'تأكيد',
      isIncoming: false,
      amount: 123.25,
      merchant: 'AliExpress',
      isInstallment: true
    }
  },
  {
    id: 23,
    bank: 'Tamara',
    sms: 'تأكيد دفعة مقسمة إلى 3 \nالمتجر: Alsaif Gallery \nالطلب: 708.20 SAR \nالتاريخ: 25/02/20',
    expected: {
      category: 'أقساط',
      type: 'تأكيد',
      isIncoming: false,
      amount: 708.20,
      merchant: 'Alsaif Gallery',
      isInstallment: true
    }
  },

  // ========== ALRAJHI BANK ==========
  {
    id: 24,
    bank: 'AlRajhi',
    sms: 'شراء انترنت\nبطاقة:4912;مدى-ابل باي\nمن:9767\nمبلغ:SAR 300 \nلدى:Tiqmo\n؜25-12-24 08:19',
    expected: {
      category: 'محافظ',
      type: 'شحن',
      isIncoming: false,
      amount: 300.00,
      merchant: 'Tiqmo',
      card: '4912',
      account: '9767'
    }
  },
  {
    id: 25,
    bank: 'AlRajhi',
    sms: 'إيداع دعم سكني\nالمبلغ:SAR 260.15\nالى:9765\nفي:25-12-24 09:10\nيمكن استخدامه في نقاط البيع ودفع الفواتير وسحب من مكائن المصرف',
    expected: {
      category: 'دعم حكومي',
      type: 'إيداع',
      isIncoming: true,
      amount: 260.15,
      account: '9765'
    }
  },
  {
    id: 26,
    bank: 'AlRajhi',
    sms: 'حوالة محلية واردة\nعبر:SAUDI ARABIAN MONETARY AUTHORITY\nمبلغ:SAR 16771.70\nالى:9767\nمن:وزارة التعليم\nمن:\nفي:25-12-28 00:35',
    expected: {
      category: 'راتب',
      type: 'حوالة',
      isIncoming: true,
      amount: 16771.70,
      merchant: 'وزارة التعليم',
      account: '9767'
    }
  },
  {
    id: 27,
    bank: 'AlRajhi',
    sms: 'حوالة داخلية صادرة\nمن:1626\nمبلغ:SAR 10458\nالى:مؤسسة الاحلام البرونزية\nالى:3866\nفي:25-12-30 18:20',
    expected: {
      category: 'حوالات صادرة',
      type: 'حوالة',
      isIncoming: false,
      amount: 10458.00,
      account: '1626'
    }
  },
  {
    id: 28,
    bank: 'AlRajhi',
    sms: 'حوالة داخلية واردة\nمبلغ:SAR 100\nالى:9767\nمن:عمر بركه العلوي\nمن:1869\nفي:26-1-1 17:30',
    expected: {
      category: 'حوالات واردة',
      type: 'حوالة',
      isIncoming: true,
      amount: 100.00,
      account: '9767'
    }
  },
  {
    id: 29,
    bank: 'AlRajhi',
    sms: 'شراء\nبطاقة:4912;مدى-ابل باي\nمبلغ:SAR 410\nلدى:HALA\n؜26-1-1 17:42',
    expected: {
      category: 'نقل',
      type: 'مشتريات',
      isIncoming: false,
      amount: 410.00,
      merchant: 'HALA',
      card: '4912'
    }
  },
  {
    id: 30,
    bank: 'AlRajhi',
    sms: 'شراء انترنت\nبطاقة:4912;مدى-ابل باي\nمن:9767\nمبلغ:SAR 700 \nلدى:D360\n؜26-1-1 18:28',
    expected: {
      category: 'محافظ',
      type: 'شحن',
      isIncoming: false,
      amount: 700.00,
      merchant: 'D360',
      card: '4912'
    }
  },
  {
    id: 31,
    bank: 'AlRajhi',
    sms: 'حوالة بين حساباتك\nمبلغ: SAR 21000\nالى: 1626\nفي: 26-1-1 19:47',
    expected: {
      category: 'تحويل داخلي',
      type: 'حوالة داخلية',
      isIncoming: false,
      amount: 21000.00,
      isInternal: true
    }
  },
  {
    id: 32,
    bank: 'AlRajhi',
    sms: 'سحب:صراف آلي\nبطاقة:4912;مدى\nمبلغ:SAR 1500\nمكان السحب:ALNAFEA GAS STATI\n؜26-1-8 09:41',
    expected: {
      category: 'سحب نقدي',
      type: 'سحب',
      isIncoming: false,
      amount: 1500.00,
      card: '4912'
    }
  },
  {
    id: 33,
    bank: 'AlRajhi',
    sms: 'شراء\nبطاقة:4912;مدى-ابل باي\nمبلغ:SAR 925\nلدى:UNITED TI\n؜26-1-7 21:16',
    expected: {
      category: 'سفر',
      type: 'مشتريات',
      isIncoming: false,
      amount: 925.00,
      merchant: 'UNITED TI'
    }
  },
  {
    id: 34,
    bank: 'AlRajhi',
    sms: 'حوالة محلية صادرة\nمصرف:SNB\nمن:9767\nمبلغ:SAR 114\nالى:محمد الحربي\nالى:7000\nالرسوم:SAR 0.58\n26-1-12 20:33',
    expected: {
      category: 'حوالات صادرة',
      type: 'حوالة',
      isIncoming: false,
      amount: 114.00,
      account: '9767'
    }
  },
  {
    id: 35,
    bank: 'AlRajhi',
    sms: 'حوالة محلية واردة\nعبر:INMA\nمبلغ:SAR 2594.42\nالى:9767\nمن:SHAFI JAHZ TH ALMUTIRY\nمن:9000\n26-1-13 14:01',
    expected: {
      category: 'حوالات واردة',
      type: 'حوالة',
      isIncoming: true,
      amount: 2594.42,
      account: '9767'
    }
  },
  {
    id: 36,
    bank: 'AlRajhi',
    sms: 'خصم: قسط تمويل\nالقسط: 1597.17 SAR\nمن: 9767\nالمبلغ المتبقي: SAR 731429.98\nفي:25-12-28 19:02',
    expected: {
      category: 'قسط تمويل',
      type: 'قسط',
      isIncoming: false,
      amount: 1597.17,
      isLoanPayment: true
    }
  },
  {
    id: 37,
    bank: 'AlRajhi',
    sms: 'خصم: قسط تمويل\nالقسط: 5248.24 SAR\nمن: 9767\nالمبلغ المتبقي: SAR 10496.48\nفي:25-12-28 19:02',
    expected: {
      category: 'قسط تمويل',
      type: 'قسط',
      isIncoming: false,
      amount: 5248.24,
      isLoanPayment: true
    }
  },

  // ========== TIQMO ==========
  {
    id: 38,
    bank: 'Tiqmo',
    sms: 'شراء POS\nبـ 20.00 SAR\nمن TAEM ALBARIKAT CO\nعبر MasterCard **0305 Apple Pay\nفي 2026-01-11 15:57:28',
    expected: {
      category: 'طعام',
      type: 'مشتريات',
      isIncoming: false,
      amount: 20.00,
      merchant: 'TAEM ALBARIKAT',
      card: '0305'
    }
  },
  {
    id: 39,
    bank: 'Tiqmo',
    sms: 'شراء POS\nبـ 105.00 SAR\nمن MOVIE CINEMAS145\nعبر MasterCard **0305 Apple Pay\nفي 2026-01-11 18:10:22',
    expected: {
      category: 'ترفيه',
      type: 'مشتريات',
      isIncoming: false,
      amount: 105.00,
      merchant: 'MOVIE CINEMAS'
    }
  },
  {
    id: 40,
    bank: 'Tiqmo',
    sms: 'رصيد غير كافي\nمبلغ 85.0 SAR\nبطاقة 0305\nمن snae alarabya co\nفي 2026-01-12 12:38:11',
    expected: {
      category: 'مرفوضة',
      type: 'رفض',
      isIncoming: false,
      amount: 85.00,
      status: 'declined'
    }
  },
  {
    id: 41,
    bank: 'Tiqmo',
    sms: 'إضافة أموال\nمبلغ 200.00 ريال\nمن آبل باي\nفي 2026-01-12 12:39:02',
    expected: {
      category: 'شحن رصيد',
      type: 'إضافة',
      isIncoming: true,
      amount: 200.00
    }
  },
  {
    id: 42,
    bank: 'Tiqmo',
    sms: 'Online Purchase Amount , Currency : 1.90 SAR\nTotal 1.93 SAR including fee\nWebsite or store : 01.AI PTE. LTD.\nCard Type: MasterCard\nProcessed Through: \nCard No. (last 4 digit): 0305\nAccount No.: **9682\nDate: 2026-01-13\nTime: 13:07:33',
    expected: {
      category: 'اشتراكات',
      type: 'مشتريات',
      isIncoming: false,
      amount: 1.93,
      merchant: '01.AI'
    }
  },
  {
    id: 43,
    bank: 'Tiqmo',
    sms: 'شراء POS\nبـ 128.00 SAR\nمن NAFT\nعبر MasterCard **0305 Apple Pay\nفي 2026-01-14 08:44:34',
    expected: {
      category: 'وقود',
      type: 'مشتريات',
      isIncoming: false,
      amount: 128.00,
      merchant: 'NAFT'
    }
  },
  {
    id: 44,
    bank: 'Tiqmo',
    sms: 'إضافة أموال\nمبلغ 1000.00 ريال\nمن آبل باي\nفي 2026-01-14 19:47:49',
    expected: {
      category: 'شحن رصيد',
      type: 'إضافة',
      isIncoming: true,
      amount: 1000.00
    }
  },
  {
    id: 45,
    bank: 'Tiqmo',
    sms: 'Reverse Transaction\nAmount, Currency : 0.50 USD\nTotal refunded amount: 1.91 SAR\nMerchant Name: Dragonpass\nCountry: GBR\nCard Type: MasterCard\nCard No. (last 4 digit): 0305\nAccount No.: **9682\nDate: 2026-01-14\nTime: 19:51:10',
    expected: {
      category: 'استرداد',
      type: 'استرداد',
      isIncoming: true,
      amount: 1.91
    }
  },
  {
    id: 46,
    bank: 'Tiqmo',
    sms: 'شراء انترنت\nبـ 100.00 SAR\nمن STC Bank\nعبر MasterCard **0305 Apple Pay\nفي 2026-01-14 21:32:02',
    expected: {
      category: 'محافظ',
      type: 'شحن',
      isIncoming: false,
      amount: 100.00,
      merchant: 'STC Bank'
    }
  },
  {
    id: 47,
    bank: 'Tiqmo',
    sms: 'ECOM Purchase Transaction\nFor 144.77 SAR\nAt SAUDI ELECTRICITY COMP\nCard 5246XXXXXXXX0305\nOn 2026-01-16 14:01:22\nCountry SAU\nThis is just a hold on your card and will be released once the final transaction amount incl. any Fee is settled. Thank you.',
    expected: {
      category: 'فواتير',
      type: 'مشتريات',
      isIncoming: false,
      amount: 144.77,
      merchant: 'SAUDI ELECTRICITY'
    }
  },
  {
    id: 48,
    bank: 'Tiqmo',
    sms: 'شراء POS\nبـ 30.00 SAR\nمن HALA\nعبر MasterCard **0305 Apple Pay\nفي 2026-01-16 20:08:06',
    expected: {
      category: 'نقل',
      type: 'مشتريات',
      isIncoming: false,
      amount: 30.00,
      merchant: 'HALA'
    }
  },
  {
    id: 49,
    bank: 'Tiqmo',
    sms: 'شراء POS\nبـ 50.00 SAR\nمن NAFT STN 4018-AlKeram\nعبر MasterCard **0305 Apple Pay\nفي 2026-01-23 17:54:58',
    expected: {
      category: 'وقود',
      type: 'مشتريات',
      isIncoming: false,
      amount: 50.00,
      merchant: 'NAFT'
    }
  },
  {
    id: 50,
    bank: 'Tiqmo',
    sms: 'شراء انترنت\nبـ 236.08 SAR\nمن Tamara\nعبر MasterCard **0305 \nفي 2026-01-25 18:27:37',
    expected: {
      category: 'أقساط',
      type: 'قسط',
      isIncoming: false,
      amount: 236.08,
      merchant: 'Tamara'
    }
  },
  
  // ========== OTP / VERIFICATION CODES (رمز مؤقت) ==========
  {
    id: 51,
    bank: 'الراجحي',
    sms: 'رمز مؤقت:6221\nلـ :تحويل محلي - التطبيق\nالمبلغ:SAR 240.00',
    expected: {
      category: 'تحقق',
      type: 'رمز تحقق',
      isIncoming: false,
      amount: 240.00,
      isOTP: true
    }
  },
  {
    id: 52,
    bank: 'الراجحي',
    sms: 'رمز مؤقت:3724\nلـ :تحويل داخلي - التطبيق\nالمبلغ:SAR 1,500.00',
    expected: {
      category: 'تحقق',
      type: 'رمز تحقق',
      isIncoming: false,
      amount: 1500.00,
      isOTP: true
    }
  },
  {
    id: 53,
    bank: 'الراجحي',
    sms: 'رمز مؤقت:8695\nلـ :تحويل داخلي - التطبيق\nالمبلغ:SAR 238.55',
    expected: {
      category: 'تحقق',
      type: 'رمز تحقق',
      isIncoming: false,
      amount: 238.55,
      isOTP: true
    }
  },
  {
    id: 54,
    bank: 'STC Bank',
    sms: 'رمز التحقق 1072\nلـ: إضافة مستفيد\n*لا تشارك الرمز',
    expected: {
      category: 'تحقق',
      type: 'رمز تحقق',
      isIncoming: false,
      isOTP: true
    }
  },
  {
    id: 55,
    bank: 'STC Bank',
    sms: 'رمز التحقق 4970\nلـ: حوالة داخلية\nبـ: 70.00 ريال\n*لا تشارك الرمز',
    expected: {
      category: 'تحقق',
      type: 'رمز تحقق',
      isIncoming: false,
      amount: 70.00,
      isOTP: true
    }
  },
  {
    id: 56,
    bank: 'Tiqmo',
    sms: 'رمز التحقق (OTP) 886511 لبطاقة tiqmo تنتهي ب 0305 المبلغ SAR 1.90 إلى 01_AI PTE_. رمز التحقق سيكون متاح ل 5 دقائق.',
    expected: {
      category: 'تحقق',
      type: 'رمز تحقق',
      isIncoming: false,
      amount: 1.90,
      isOTP: true,
      merchant: '01.AI'
    }
  },
  
  // ========== ADDITIONAL TRANSFER TYPES ==========
  {
    id: 57,
    bank: 'الراجحي',
    sms: 'حوالة محلية صادرة\nمصرف:ALBI\nمن:9767\nمبلغ:SAR 240\nالى:مؤسسة لبنات الوقفية\nالى:0005\nالرسوم:SAR 0.58\n26/1/17 16:57',
    expected: {
      category: 'حوالات صادرة',
      type: 'حوالة',
      isIncoming: false,
      amount: 240.00,
      account: '9767'
    }
  },
  {
    id: 58,
    bank: 'الراجحي',
    sms: 'حوالة داخلية صادرة\nمن1626\nبـSAR 1500\nلـ5002;جهز ثبات المطيري\n26/1/18 08:55',
    expected: {
      category: 'تحويل داخلي',
      type: 'حوالة',
      isIncoming: false,
      amount: 1500.00,
      account: '1626'
    }
  },
  {
    id: 59,
    bank: 'الراجحي',
    sms: 'حوالة داخلية صادرة\nمن9765\nبـSAR 238.55\nلـ9818;ابتسام المطيري\n26/1/18 12:32',
    expected: {
      category: 'تحويل داخلي',
      type: 'حوالة',
      isIncoming: false,
      amount: 238.55,
      account: '9765'
    }
  },
  {
    id: 60,
    bank: 'الراجحي',
    sms: 'حوالة داخلية واردة\nمبلغ:SAR 21000\nالى:1626\nمن:shafi almutiry\nمن:9767\nفي:26-1-1 19:48',
    expected: {
      category: 'تحويل داخلي',
      type: 'حوالة',
      isIncoming: true,
      amount: 21000.00,
      account: '1626'
    }
  },
  {
    id: 61,
    bank: 'الراجحي',
    sms: 'اضافة باستخدام آبل باى\nمبلغ:SAR 700\nبطاقة:*4912 - mada\nإلى:*7815\nفي:05/02/2026 14:58:48',
    expected: {
      category: 'شحن رصيد',
      type: 'إضافة',
      isIncoming: true,
      amount: 700.00,
      merchant: 'D360',
      card: '4912',
      account: '3449'
    }
  },
  {
    id: 62,
    bank: 'الراجحي',
    sms: 'شراء انترنت\nعبر:4912;مدى-ابل باي\nمن:9767\nبـSAR 700 \nلـD360\n؜5/2/26 14:58',
    expected: {
      category: 'محافظ',
      type: 'شحن رصيد',
      isIncoming: false,
      amount: 700.00,
      merchant: 'D360',
      account: '9767',
      card: '4912'
    }
  }
];

// OTP Categories - should be excluded from spending totals
var OTP_CATEGORIES = ['تحقق', 'رمز تحقق', 'OTP'];

// ============================================
// MERCHANT CATEGORY MAPPING
// ============================================
var MERCHANT_CATEGORIES = {
  // Digital Wallets / محافظ
  'D360': 'محافظ',
  'Tiqmo': 'محافظ',
  'STC Pay': 'محافظ',
  'STC Bank': 'محافظ',
  'stc pay': 'محافظ',
  'urpay': 'محافظ',
  
  // Food / طعام
  'Kudu': 'طعام',
  'KuduKSAR': 'طعام',
  'HALAWYAT': 'طعام',
  'HALAWYAT TAAM': 'طعام',
  'DUNKIN': 'طعام',
  'DUNKIN DONUTS': 'طعام',
  'Daily Food': 'طعام',
  'Daily Fo': 'طعام',
  'tamwenat': 'طعام',
  'tamwinat': 'طعام',
  'TAMWINAT': 'طعام',
  'TAEM ALBARIKAT': 'طعام',
  'PIZZA': 'طعام',
  'COFFEE': 'طعام',
  'BAKERY': 'طعام',
  'Esraa bakery': 'طعام',
  'ALBATIU': 'طعام',
  'MHL AKLA': 'طعام',
  'ustul alfawakeh': 'طعام',
  'TAAM HAQEQI': 'طعام',
  
  // Shopping / تسوق
  'Amazon': 'تسوق',
  'Amazon SA': 'تسوق',
  'PANDA': 'تسوق',
  'PANDA RETAIL': 'تسوق',
  'AliExpress': 'تسوق',
  'Alsaif Gallery': 'تسوق',
  'AMTIAZ': 'تسوق',
  'AMTIAZ ALKHIR': 'تسوق',
  'DUKAN': 'تسوق',
  'Family M': 'تسوق',
  
  // Transport / نقل
  'HALA': 'نقل',
  'Uber': 'نقل',
  'Careem': 'نقل',
  
  // Fuel / وقود
  'NAFT': 'وقود',
  'NAFT STN': 'وقود',
  'ALNAFEA GAS': 'وقود',
  
  // Entertainment / ترفيه
  'MOVIE': 'ترفيه',
  'CINEMA': 'ترفيه',
  'MOVIE CINEMAS': 'ترفيه',
  
  // Travel / سفر
  'UNITED TI': 'سفر',
  'Flyadeal': 'سفر',
  'Flynas': 'سفر',
  'فلاي اديل': 'سفر',
  'فلاي ناس': 'سفر',
  'Nusuk': 'سفر',
  
  // Bills / فواتير
  'SAUDI ELECTRICITY': 'فواتير',
  'STC': 'فواتير',
  'Mobily': 'فواتير',
  
  // Donations / تبرعات
  'Donation': 'تبرعات',
  
  // Subscriptions / اشتراكات
  '01.AI': 'اشتراكات',
  'Upwork': 'دخل',
  
  // Installments / أقساط
  'Tamara': 'أقساط',
  
  // Stationery / قرطاسية
  'Maktabat': 'قرطاسية',
  'Al-Qurtas': 'قرطاسية',
  'Al-Saiari Library': 'قرطاسية',
  
  // Grocery / بقالة
  'ZAWYAT': 'بقالة',
  'ZAWAYA': 'بقالة',
  'RAEAH ALGEEM': 'بقالة',
  'Azoom AlShamal': 'بقالة',
  'ALRWABI': 'بقالة',
  'Khadija Grocery': 'بقالة'
};

// ============================================
// TEST FUNCTIONS
// ============================================

/**
 * Run full real SMS test suite
 */
function TEST_REAL_SMS_ACCURACY() {
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║     🧪 REAL BANK SMS CATEGORIZATION TEST                   ║');
  Logger.log('║     60 Real SMS Messages from 5 Banks + OTP                ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');
  
  var passed = 0;
  var failed = 0;
  var failures = [];
  var bankStats = {};
  
  for (var i = 0; i < REAL_SMS_TESTS.length; i++) {
    var tc = REAL_SMS_TESTS[i];
    var result = runRealSMSTest_(tc);
    
    // Track bank stats
    if (!bankStats[tc.bank]) {
      bankStats[tc.bank] = { passed: 0, failed: 0 };
    }
    
    if (result.passed) {
      passed++;
      bankStats[tc.bank].passed++;
      Logger.log('✅ #' + tc.id + ' [' + tc.bank + '] PASSED');
    } else {
      failed++;
      bankStats[tc.bank].failed++;
      failures.push(result);
      Logger.log('❌ #' + tc.id + ' [' + tc.bank + '] FAILED: ' + result.reason);
    }
  }
  
  var accuracy = Math.round((passed / REAL_SMS_TESTS.length) * 100);
  
  Logger.log('\n' + '═'.repeat(60));
  Logger.log('📊 RESULTS BY BANK');
  Logger.log('═'.repeat(60));
  
  for (var bank in bankStats) {
    var stats = bankStats[bank];
    var bankAcc = Math.round((stats.passed / (stats.passed + stats.failed)) * 100);
    Logger.log(bank + ': ' + stats.passed + '/' + (stats.passed + stats.failed) + ' (' + bankAcc + '%)');
  }
  
  Logger.log('\n' + '═'.repeat(60));
  Logger.log('📊 OVERALL RESULTS');
  Logger.log('═'.repeat(60));
  Logger.log('Total Tests: ' + REAL_SMS_TESTS.length);
  Logger.log('Passed: ' + passed + ' ✅');
  Logger.log('Failed: ' + failed + ' ❌');
  Logger.log('Accuracy: ' + accuracy + '%');
  
  if (failures.length > 0 && failures.length <= 10) {
    Logger.log('\n⚠️ FAILURE DETAILS:');
    failures.forEach(function(f) {
      Logger.log('\n❌ Test #' + f.testId + ' [' + f.bank + ']');
      Logger.log('   SMS: ' + f.sms.substring(0, 60).replace(/\n/g, ' ') + '...');
      Logger.log('   Reason: ' + f.reason);
    });
  }
  
  return {
    total: REAL_SMS_TESTS.length,
    passed: passed,
    failed: failed,
    accuracy: accuracy,
    bankStats: bankStats,
    failures: failures
  };
}

/**
 * Run single real SMS test
 */
function runRealSMSTest_(tc) {
  try {
    // Parse SMS with AI
    var ai = callAiHybridV120(tc.sms);
    
    // Apply classifier
    if (typeof applyClassifierMap_ === 'function') {
      ai = applyClassifierMap_(tc.sms, ai);
    }
    
    var reasons = [];
    
    // Check category
    if (tc.expected.category && !categoryMatchesReal_(ai.category, tc.expected.category)) {
      reasons.push('category: expected "' + tc.expected.category + '", got "' + ai.category + '"');
    }
    
    // Check type
    if (tc.expected.type && !typeMatchesReal_(ai.type, tc.expected.type)) {
      reasons.push('type: expected "' + tc.expected.type + '", got "' + ai.type + '"');
    }
    
    // Check isIncoming
    if (tc.expected.isIncoming !== undefined && ai.isIncoming !== tc.expected.isIncoming) {
      reasons.push('isIncoming: expected ' + tc.expected.isIncoming + ', got ' + ai.isIncoming);
    }
    
    // Check amount (with 5% tolerance)
    var aiAmount = Number(ai.amount) || 0;
    var expAmount = tc.expected.amount || 0;
    var tolerance = expAmount * 0.05;
    if (Math.abs(aiAmount - expAmount) > tolerance && tolerance > 0) {
      reasons.push('amount: expected ' + expAmount + ', got ' + aiAmount);
    }
    
    if (reasons.length === 0) {
      return { passed: true, testId: tc.id, bank: tc.bank };
    } else {
      return {
        passed: false,
        testId: tc.id,
        bank: tc.bank,
        sms: tc.sms,
        reason: reasons.join('; '),
        expected: tc.expected,
        actual: ai
      };
    }
    
  } catch (e) {
    return {
      passed: false,
      testId: tc.id,
      bank: tc.bank,
      sms: tc.sms,
      reason: 'Error: ' + e.toString()
    };
  }
}

/**
 * Flexible category matching for real SMS
 */
function categoryMatchesReal_(actual, expected) {
  var a = String(actual || '').toLowerCase();
  var e = String(expected || '').toLowerCase();
  
  if (a === e) return true;
  if (a.indexOf(e) >= 0 || e.indexOf(a) >= 0) return true;
  
  var groups = {
    'محافظ': ['محافظ', 'شحن', 'إضافة', 'topup', 'd360', 'tiqmo', 'stc'],
    'طعام': ['طعام', 'مطاعم', 'food', 'restaurant'],
    'تسوق': ['تسوق', 'مشتريات', 'shopping', 'amazon'],
    'نقل': ['نقل', 'مواصلات', 'hala', 'uber', 'careem'],
    'وقود': ['وقود', 'بنزين', 'naft', 'fuel', 'gas'],
    'حوالات واردة': ['حوالات واردة', 'وارد', 'إيداع', 'incoming'],
    'حوالات صادرة': ['حوالات صادرة', 'صادر', 'outgoing'],
    'سحب نقدي': ['سحب نقدي', 'سحب', 'atm', 'صراف'],
    'راتب': ['راتب', 'salary', 'وزارة'],
    'دعم حكومي': ['دعم', 'سكني', 'حكومي', 'support'],
    'أقساط': ['أقساط', 'قسط', 'تمارا', 'tamara', 'installment'],
    'قسط تمويل': ['قسط تمويل', 'تمويل', 'loan'],
    'مرفوضة': ['مرفوضة', 'رفض', 'declined', 'غير كافي'],
    'استرداد': ['استرداد', 'refund', 'reverse'],
    'فواتير': ['فواتير', 'كهرباء', 'bills', 'electricity'],
    'ترفيه': ['ترفيه', 'سينما', 'movie', 'cinema'],
    'تحويل داخلي': ['تحويل داخلي', 'بين حساباتك', 'internal'],
    'مشتريات عامة': ['مشتريات', 'شراء', 'purchase', 'pos']
  };
  
  var group = groups[expected];
  if (group) {
    for (var i = 0; i < group.length; i++) {
      if (a.indexOf(group[i]) >= 0) return true;
    }
  }
  
  return false;
}

/**
 * Flexible type matching for real SMS
 */
function typeMatchesReal_(actual, expected) {
  var a = String(actual || '').toLowerCase();
  var e = String(expected || '').toLowerCase();
  
  if (a === e) return true;
  if (a.indexOf(e) >= 0 || e.indexOf(a) >= 0) return true;
  
  var groups = {
    'مشتريات': ['مشتريات', 'شراء', 'pos', 'purchase'],
    'حوالة': ['حوالة', 'تحويل', 'transfer'],
    'سحب': ['سحب', 'atm', 'withdrawal'],
    'إضافة': ['إضافة', 'شحن', 'topup', 'add'],
    'استرداد': ['استرداد', 'refund', 'reverse'],
    'رفض': ['رفض', 'declined', 'مرفوض'],
    'قسط': ['قسط', 'installment', 'تمويل'],
    'إيداع': ['إيداع', 'deposit', 'دعم']
  };
  
  var group = groups[expected];
  if (group) {
    for (var i = 0; i < group.length; i++) {
      if (a.indexOf(group[i]) >= 0) return true;
    }
  }
  
  return false;
}

/**
 * Test by bank
 */
function TEST_SAIB_SMS() {
  return runBankTests_('SAIB');
}

function TEST_STC_SMS() {
  return runBankTests_('STC Bank');
}

function TEST_ALRAJHI_SMS() {
  return runBankTests_('AlRajhi');
}

function TEST_TIQMO_SMS() {
  return runBankTests_('Tiqmo');
}

function TEST_TAMARA_SMS() {
  return runBankTests_('Tamara');
}

function runBankTests_(bankName) {
  Logger.log('🏦 Testing ' + bankName + ' SMS messages...\n');
  
  var bankTests = REAL_SMS_TESTS.filter(function(tc) {
    return tc.bank === bankName;
  });
  
  var passed = 0;
  bankTests.forEach(function(tc) {
    var result = runRealSMSTest_(tc);
    if (result.passed) {
      passed++;
      Logger.log('✅ #' + tc.id + ' OK');
    } else {
      Logger.log('❌ #' + tc.id + ' FAIL: ' + result.reason);
    }
  });
  
  var accuracy = Math.round((passed / bankTests.length) * 100);
  Logger.log('\n' + bankName + ' Accuracy: ' + passed + '/' + bankTests.length + ' (' + accuracy + '%)');
  
  return accuracy === 100;
}

/**
 * Get merchant category
 */
function getMerchantCategory_(merchant) {
  var m = String(merchant || '').toUpperCase();
  
  for (var key in MERCHANT_CATEGORIES) {
    if (m.indexOf(key.toUpperCase()) >= 0) {
      return MERCHANT_CATEGORIES[key];
    }
  }
  
  return null;
}

/**
 * List all merchant categories
 */
function LIST_MERCHANT_CATEGORIES() {
  Logger.log('📋 Merchant Category Mapping:\n');
  
  var byCategory = {};
  for (var merchant in MERCHANT_CATEGORIES) {
    var cat = MERCHANT_CATEGORIES[merchant];
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(merchant);
  }
  
  for (var category in byCategory) {
    Logger.log('📂 ' + category + ':');
    byCategory[category].forEach(function(m) {
      Logger.log('   • ' + m);
    });
    Logger.log('');
  }
}
