/********** SJA-V1 | BankSMS_Patterns.js – Bank SMS Format Detection & Account Extraction **********/

/**
 * Comprehensive Saudi Bank SMS Pattern Library
 * Add your real SMS messages to SAMPLE_SMS array to auto-detect patterns
 * 
 * USAGE:
 * 1. Add your actual bank SMS messages to SAMPLE_SMS array below
 * 2. Run ANALYZE_BANK_SMS_PATTERNS() to detect patterns
 * 3. Run EXTRACT_ALL_ACCOUNTS() to find all your accounts
 * 4. Run SEED_BANK_TEMPLATES() to add patterns to Sms_Templates sheet
 */

// ============================================
// REAL BANK SMS SAMPLES (from Banks SMS.txt)
// ============================================
var SAMPLE_SMS = [
  // ===== SAIB =====
  'شراء انترنت\nبSAR 737.00\nلدىD360 \nمدى ابل X3474 \nمن8001 \nب09-13 05:41',
  'شراء POS\nبSAR 277.00\nمنFamily M \nمدى ابل X3474 \nب09-27 13:04',
  'حوالة واردة: محلية (مقبوله)\nمن: XXXX4903 \nمؤسسة شقق زوايا الماسية \nعبر: البنك الأهلي السعودي \nمبلغ: SAR 15,000.00\nالى: XXXX8001 \nفي: 09-27 11:15',
  'حوالة صادرة: محلية\nمن: XXX8001 \nالى: shafi Jahz T Almutiry XXX9767 \nمبلغ: SAR 21,609.91\nرسوم: SAR 5.75\nفي: 09-27 18:07',
  'سحب صراف\nفي (ADENAH )\nبطاقةمدى XXX3474 \nمبلغ:SAR 50.00 \nفي:11-10 07:19',
  'استرداد مبلغ\nمبلغ: SAR 123.93\nفي: PANDA RETAIL CO 9 \nبطاقة: مدى XXX3474 \nالى: XXX8001 \nفي: 12-28 15:12',
  'اشعار: رصيد غير كافي\nالعملية: انترنت \nمبلغ: SAR 1,000.00\nبطاقة: مدى (Apple Pay) ;XXX3474 \nلدى: Tiqmo R \nفي: 01-12 12:38',
  
  // ===== STC BANK =====
  'إضافة أموال لحسابك\nبـ:500.00 ر.س\nعبر:*XXXX\nفي:11/11/25 08:34',
  'شراء Apple Pay\nعبر:*3281\nبـ:60 SAR\nمن:HALAWYAT TAAM WHAQIQI\nفي: 29/11/25 16:38',
  'حوالة داخلية صادرة\nبـ: 70.00ر.س\nإلى: هبه المزروع\nحساب:1929*\nفي:26/11/25 00:08',
  'رصيد غير كافي\n171.54 ر.س\nUpwork -869546658REF\n30/11/25 19:33\nرصيدك 21.97',
  'شراء VISA\nعبر:*4495\nبـ:44.82 USD\nمن:Upwork -869547177REF\nفي: 30/11/25 19:41',
  'Declined due to Timeout\nالعملية: شراء عبر الإنترنت\nالبطاقة: ***4495\nالمبلغ: 774.05 SAR\nفي: Panda click\nبتاريخ: 02/12/25 22:55',
  'Notification: استرجاع\nTransaction: Upwork -864635839REF\nCard: ***4495\nAmount: 227.57 USD\nDate: 18/01/26 03:12',
  'رمز التحقق 1072\nلـ: إضافة مستفيد\n*لا تشارك الرمز',
  'رمز التحقق 4970\nلـ: حوالة داخلية\nبـ: 70.00 ريال\n*لا تشارك الرمز',
  
  // ===== ALRAJHI BANK =====
  'شراء انترنت\nبطاقة:4912;مدى-ابل باي\nمن:9767\nمبلغ:SAR 300 \nلدى:Tiqmo\n؜25-12-24 08:19',
  'إيداع دعم سكني\nالمبلغ:SAR 260.15\nالى:9765\nفي:25-12-24 09:10\nيمكن استخدامه في نقاط البيع ودفع الفواتير وسحب من مكائن المصرف',
  'حوالة محلية واردة\nعبر:SAUDI ARABIAN MONETARY AUTHORITY\nمبلغ:SAR 16771.70\nالى:9767\nمن:وزارة التعليم\nمن:\nفي:25-12-28 00:35',
  'حوالة داخلية صادرة\nمن:1626\nمبلغ:SAR 10458\nالى:مؤسسة الاحلام البرونزية\nالى:3866\nفي:25-12-30 18:20',
  'حوالة داخلية واردة\nمبلغ:SAR 100\nالى:9767\nمن:عمر بركه العلوي\nمن:1869\nفي:26-1-1 17:30',
  'شراء\nبطاقة:4912;مدى-ابل باي\nمبلغ:SAR 410\nلدى:HALA\n؜26-1-1 17:42',
  'حوالة بين حساباتك\nمبلغ: SAR 21000\nالى: 1626\nفي: 26-1-1 19:47',
  'سحب:صراف آلي\nبطاقة:4912;مدى\nمبلغ:SAR 1500\nمكان السحب:ALNAFEA GAS STATI\n؜26-1-8 09:41',
  'خصم: قسط تمويل\nالقسط: 1597.17 SAR\nمن: 9767\nالمبلغ المتبقي: SAR 731429.98\nفي:25-12-28 19:02',
  // OTP / Temp Code messages (رمز مؤقت)
  'رمز مؤقت:6221\nلـ :تحويل محلي - التطبيق\nالمبلغ:SAR 240.00',
  'حوالة محلية صادرة\nمصرف:ALBI\nمن:9767\nمبلغ:SAR 240\nالى:مؤسسة لبنات الوقفية\nالى:0005\nالرسوم:SAR 0.58\n26/1/17 16:57',
  'رمز مؤقت:3724\nلـ :تحويل داخلي - التطبيق\nالمبلغ:SAR 1,500.00',
  'حوالة داخلية صادرة\nمن1626\nبـSAR 1500\nلـ5002;جهز ثبات المطيري\n26/1/18 08:55',
  'رمز مؤقت:8695\nلـ :تحويل داخلي - التطبيق\nالمبلغ:SAR 238.55',
  'حوالة داخلية صادرة\nمن9765\nبـSAR 238.55\nلـ9818;ابتسام المطيري\n26/1/18 12:32',
  
  // ===== TIQMO =====
  'شراء POS\nبـ 20.00 SAR\nمن TAEM ALBARIKAT CO\nعبر MasterCard **0305 Apple Pay\nفي 2026-01-11 15:57:28',
  'شراء POS\nبـ 105.00 SAR\nمن MOVIE CINEMAS145\nعبر MasterCard **0305 Apple Pay\nفي 2026-01-11 18:10:22',
  'رصيد غير كافي\nمبلغ 85.0 SAR\nبطاقة 0305\nمن snae alarabya co\nفي 2026-01-12 12:38:11',
  'إضافة أموال\nمبلغ 200.00 ريال\nمن آبل باي\nفي 2026-01-12 12:39:02',
  'Online Purchase Amount , Currency : 1.90 SAR\nTotal 1.93 SAR including fee\nWebsite or store : 01.AI PTE. LTD.\nCard Type: MasterCard\nCard No. (last 4 digit): 0305\nAccount No.: **9682\nDate: 2026-01-13\nTime: 13:07:33',
  'شراء POS\nبـ 128.00 SAR\nمن NAFT\nعبر MasterCard **0305 Apple Pay\nفي 2026-01-14 08:44:34',
  'Reverse Transaction\nAmount, Currency : 0.50 USD\nTotal refunded amount: 1.91 SAR\nMerchant Name: Dragonpass\nCountry: GBR\nCard Type: MasterCard\nCard No. (last 4 digit): 0305\nAccount No.: **9682\nDate: 2026-01-14\nTime: 19:51:10',
  'ECOM Purchase Transaction\nFor 144.77 SAR\nAt SAUDI ELECTRICITY COMP\nCard 5246XXXXXXXX0305\nOn 2026-01-16 14:01:22\nCountry SAU',
  'رمز التحقق (OTP) 886511 لبطاقة tiqmo تنتهي ب 0305 المبلغ SAR 1.90 إلى 01_AI PTE_. رمز التحقق سيكون متاح ل 5 دقائق.',
  
  // ===== TAMARA (Installments) =====
  'دفعة قادمة لطلبك من فلاي اديل بقيمة 136.03 SAR مستحقة خلال يومين. فضلاً، تأكد من وجود رصيد كافي في بطاقتك.',
  'تأكيد دفعة مقسمة إلى 4 \nالمتجر: AliExpress \nالطلب: 123.25 SAR \nالتاريخ: 29/12/2025'
];

// ============================================
// EXTRACTED ACCOUNTS & CARDS FROM REAL SMS
// ============================================
var KNOWN_ACCOUNTS = {
  // ═══════════════════════════════════════════════════════════
  // حساباتك الشخصية (من Banks SMS.txt)
  // ═══════════════════════════════════════════════════════════
  
  // SAIB - ساب
  '8001': { bank: 'ساب', type: 'حساب', owner: 'shafi', isMine: true },
  
  // الراجحي
  '9767': { bank: 'الراجحي', type: 'حساب', owner: 'shafi', isMine: true },
  
  // ═══════════════════════════════════════════════════════════
  // حسابات الآخرين (للتعرف عليهم في الحوالات)
  // ═══════════════════════════════════════════════════════════
  '9818': { bank: 'الراجحي', type: 'حساب', owner: 'ابتسام المطيري', isMine: false },
  '1869': { bank: 'الراجحي', type: 'حساب', owner: 'عمر بركه العلوي', isMine: false },
  '3512': { bank: 'الراجحي', type: 'حساب', owner: 'محمد المطيري', isMine: false },
  '9114': { bank: 'الراجحي', type: 'حساب', owner: 'حسام المطيري', isMine: false },
  '2808': { bank: 'الراجحي', type: 'حساب', owner: 'العنود معيض المطيري', isMine: false },
  '6180': { bank: 'الراجحي', type: 'حساب', owner: 'محمد الحربي', isMine: false },
  '5002': { bank: 'الراجحي', type: 'حساب', owner: 'جهز ثبات المطيري', isMine: false },
  '8985': { bank: 'الراجحي', type: 'حساب', owner: 'عبدالرحمن المطيري', isMine: false },
  '6625': { bank: 'الراجحي', type: 'حساب', owner: 'عزام سالم', isMine: false },
  '6636': { bank: 'الراجحي', type: 'حساب', owner: 'يحيى العزي', isMine: false },
  '3866': { bank: 'الراجحي', type: 'حساب', owner: 'مؤسسة الاحلام البرونزية', isMine: false },
  '4903': { bank: 'الأهلي', type: 'حساب', owner: 'مؤسسة شقق زوايا الماسية', isMine: false },
};

var KNOWN_CARDS = {
  // بطاقاتك - ساب مدى
  '3474': { bank: 'ساب', type: 'مدى', owner: 'shafi', isMine: true },
  
  // Tiqmo Cards
  '0305': { bank: 'tiqmo', type: 'MasterCard', owner: 'shafi', isMine: true },
  '9682': { bank: 'tiqmo', type: 'حساب', owner: 'shafi', isMine: true }
};

// ============================================
// KNOWN SAUDI BANK SMS PATTERNS (from real SMS)
// ============================================
var BANK_PATTERNS = {
  // SAIB (Saudi Investment Bank) patterns
  'SAIB': {
    senderIds: ['SAIB', 'Saudi Investment', 'البنك السعودي للاستثمار'],
    patterns: [
      {
        name: 'internet_purchase',
        regex: /شراء انترنت\s*\nب\s*SAR\s*([\d,\.]+)\s*\nلدى\s*(.+?)\s*\n.*?X(\d{4})\s*\nمن(\d+)/i,
        map: { amount: 1, merchant: 2, card: 3, account: 4 },
        type: 'شراء',
        isIncoming: false
      },
      {
        name: 'pos_purchase',
        regex: /شراء POS\s*\nب\s*SAR\s*([\d,\.]+)\s*\nمن\s*(.+?)\s*\n.*?X(\d{4})/i,
        map: { amount: 1, merchant: 2, card: 3 },
        type: 'مشتريات',
        isIncoming: false
      },
      {
        name: 'transfer_in_local',
        regex: /حوالة واردة:\s*محلية.*?مبلغ:\s*SAR\s*([\d,\.]+)\s*\nالى:\s*[X\d]*(\d{4})/i,
        map: { amount: 1, account: 2 },
        type: 'حوالة',
        isIncoming: true
      },
      {
        name: 'transfer_out_local',
        regex: /حوالة صادرة:\s*محلية.*?مبلغ:\s*SAR\s*([\d,\.]+)\s*\nرسوم:\s*SAR\s*([\d,\.]+)/i,
        map: { amount: 1, fees: 2 },
        type: 'حوالة',
        isIncoming: false
      },
      {
        name: 'atm_withdrawal',
        regex: /سحب صراف.*?مبلغ:\s*SAR\s*([\d,\.]+)/i,
        map: { amount: 1 },
        type: 'سحب',
        isIncoming: false
      },
      {
        name: 'refund',
        regex: /استرداد مبلغ\s*\nمبلغ:\s*SAR\s*([\d,\.]+)\s*\nفي:\s*(.+?)\s*\n/i,
        map: { amount: 1, merchant: 2 },
        type: 'استرداد',
        isIncoming: true
      },
      {
        name: 'declined',
        regex: /رصيد غير كافي.*?مبلغ:\s*SAR\s*([\d,\.]+)/i,
        map: { amount: 1 },
        type: 'رفض',
        isIncoming: false,
        status: 'declined'
      }
    ]
  },
  
  // STC Bank patterns
  'STC Bank': {
    senderIds: ['STC', 'STCPAY', 'STC Pay', 'stc pay', 'STC Bank'],
    patterns: [
      {
        name: 'add_money',
        regex: /إضافة أموال لحسابك\s*\nبـ:\s*([\d,\.]+)\s*(ر\.س|SAR)/i,
        map: { amount: 1, currency: 2 },
        type: 'إضافة',
        isIncoming: true
      },
      {
        name: 'apple_pay_purchase',
        regex: /شراء Apple Pay\s*\nعبر:\*(\d+)\s*\nبـ:\s*([\d,\.]+)\s*(SAR|ر\.س)\s*\nمن:\s*(.+?)\s*\nفي:/i,
        map: { card: 1, amount: 2, currency: 3, merchant: 4 },
        type: 'مشتريات',
        isIncoming: false
      },
      {
        name: 'visa_purchase',
        regex: /شراء VISA\s*\nعبر:\*(\d+)\s*\nبـ:\s*([\d,\.]+)\s*(USD|SAR|EUR)\s*\nمن:\s*(.+?)\s*\nفي:/i,
        map: { card: 1, amount: 2, currency: 3, merchant: 4 },
        type: 'مشتريات',
        isIncoming: false
      },
      {
        name: 'internal_transfer_out',
        regex: /حوالة داخلية صادرة\s*\nبـ:\s*([\d,\.]+)\s*(ر\.س|SAR)\s*\nإلى:\s*(.+?)\s*\nحساب:/i,
        map: { amount: 1, currency: 2, recipient: 3 },
        type: 'حوالة',
        isIncoming: false
      },
      {
        name: 'declined_simple',
        regex: /رصيد غير كافي\s*\n([\d,\.]+)\s*(ر\.س|SAR)/i,
        map: { amount: 1, currency: 2 },
        type: 'رفض',
        isIncoming: false,
        status: 'declined'
      },
      {
        name: 'declined_timeout',
        regex: /Declined due to Timeout.*?المبلغ:\s*([\d,\.]+)\s*(SAR)/i,
        map: { amount: 1, currency: 2 },
        type: 'رفض',
        isIncoming: false,
        status: 'declined'
      },
      {
        name: 'refund',
        regex: /(?:Notification:\s*استرجاع|استرداد).*?Amount:\s*([\d,\.]+)\s*(USD|SAR)/i,
        map: { amount: 1, currency: 2 },
        type: 'استرداد',
        isIncoming: true
      }
    ]
  },
  
  // AlRajhi Bank patterns
  'الراجحي': {
    senderIds: ['AlRajhi', 'ALRAJHI', 'الراجحي', 'مصرف الراجحي', 'AlRajhiBank'],
    patterns: [
      {
        name: 'internet_purchase',
        regex: /شراء انترنت\s*\nبطاقة:(\d+);.*?\nمن:(\d+)\s*\nمبلغ:\s*SAR\s*([\d,\.]+)\s*\nلدى:\s*(.+)/i,
        map: { card: 1, account: 2, amount: 3, merchant: 4 },
        type: 'شراء',
        isIncoming: false
      },
      {
        name: 'pos_purchase',
        regex: /شراء\s*\nبطاقة:(\d+);.*?\nمبلغ:\s*SAR\s*([\d,\.]+)\s*\nلدى:\s*(.+)/i,
        map: { card: 1, amount: 2, merchant: 3 },
        type: 'مشتريات',
        isIncoming: false
      },
      {
        name: 'housing_support',
        regex: /إيداع دعم سكني\s*\nالمبلغ:\s*SAR\s*([\d,\.]+)\s*\nالى:(\d+)/i,
        map: { amount: 1, account: 2 },
        type: 'إيداع',
        isIncoming: true,
        category: 'دعم حكومي'
      },
      {
        name: 'salary',
        regex: /حوالة محلية واردة\s*\nعبر:.*?SAUDI ARABIAN MONETARY.*?\nمبلغ:\s*SAR\s*([\d,\.]+)\s*\nالى:(\d+)\s*\nمن:(.+)/i,
        map: { amount: 1, account: 2, sender: 3 },
        type: 'حوالة',
        isIncoming: true,
        category: 'راتب'
      },
      {
        name: 'internal_transfer_out',
        regex: /حوالة داخلية صادرة\s*\nمن:(\d+)\s*\nمبلغ:\s*SAR\s*([\d,\.]+)\s*\nالى:(.+?)\s*\nالى:(\d+)/i,
        map: { account: 1, amount: 2, recipient: 3, toAccount: 4 },
        type: 'حوالة',
        isIncoming: false
      },
      {
        name: 'internal_transfer_in',
        regex: /حوالة داخلية واردة\s*\nمبلغ:\s*SAR\s*([\d,\.]+)\s*\nالى:(\d+)\s*\nمن:(.+?)\s*\nمن:(\d+)/i,
        map: { amount: 1, account: 2, sender: 3, fromAccount: 4 },
        type: 'حوالة',
        isIncoming: true
      },
      {
        name: 'local_transfer_out',
        regex: /حوالة محلية صادرة\s*\nمصرف:(.+?)\s*\nمن:(\d+)\s*\nمبلغ:\s*SAR\s*([\d,\.]+)\s*\nالى:(.+?)\s*\nالى:(\d+)\s*\nالرسوم:\s*SAR\s*([\d,\.]+)/i,
        map: { bank: 1, account: 2, amount: 3, recipient: 4, toAccount: 5, fees: 6 },
        type: 'حوالة',
        isIncoming: false
      },
      {
        name: 'local_transfer_in',
        regex: /حوالة محلية واردة\s*\nعبر:(.+?)\s*\nمبلغ:\s*SAR\s*([\d,\.]+)\s*\nالى:(\d+)\s*\nمن:(.+?)\s*\nمن:(\d+)/i,
        map: { bank: 1, amount: 2, account: 3, sender: 4, fromAccount: 5 },
        type: 'حوالة',
        isIncoming: true
      },
      {
        name: 'between_own_accounts',
        regex: /حوالة بين حساباتك\s*\nمبلغ:\s*SAR\s*([\d,\.]+)\s*\nالى:\s*(\d+)/i,
        map: { amount: 1, toAccount: 2 },
        type: 'حوالة داخلية',
        isIncoming: false,
        isInternal: true
      },
      {
        name: 'atm_withdrawal',
        regex: /سحب:\s*صراف آلي\s*\nبطاقة:(\d+);.*?\nمبلغ:\s*SAR\s*([\d,\.]+)\s*\nمكان السحب:\s*(.+)/i,
        map: { card: 1, amount: 2, location: 3 },
        type: 'سحب',
        isIncoming: false
      },
      {
        name: 'loan_payment',
        regex: /خصم:\s*قسط تمويل\s*\nالقسط:\s*([\d,\.]+)\s*SAR\s*\nمن:\s*(\d+)\s*\nالمبلغ المتبقي:\s*SAR\s*([\d,\.]+)/i,
        map: { amount: 1, account: 2, remaining: 3 },
        type: 'قسط',
        isIncoming: false,
        category: 'قسط تمويل'
      }
    ]
  },
  
  // Tiqmo patterns
  'tiqmo': {
    senderIds: ['tiqmo', 'Tiqmo', 'TIQMO'],
    patterns: [
      {
        name: 'pos_purchase',
        regex: /شراء POS\s*\nبـ\s*([\d,\.]+)\s*(SAR)\s*\nمن\s+(.+?)\s*\nعبر\s+MasterCard\s+\*\*(\d+)/i,
        map: { amount: 1, currency: 2, merchant: 3, card: 4 },
        type: 'مشتريات',
        isIncoming: false
      },
      {
        name: 'internet_purchase',
        regex: /شراء انترنت\s*\nبـ\s*([\d,\.]+)\s*(SAR)\s*\nمن\s+(.+?)\s*\nعبر\s+MasterCard\s+\*\*(\d+)/i,
        map: { amount: 1, currency: 2, merchant: 3, card: 4 },
        type: 'شراء',
        isIncoming: false
      },
      {
        name: 'add_money',
        regex: /إضافة أموال\s*\nمبلغ\s+([\d,\.]+)\s+ريال\s*\nمن\s+آبل باي/i,
        map: { amount: 1 },
        type: 'إضافة',
        isIncoming: true
      },
      {
        name: 'declined',
        regex: /رصيد غير كافي\s*\nمبلغ\s+([\d,\.]+)\s+SAR\s*\nبطاقة\s+(\d+)\s*\nمن\s+(.+)/i,
        map: { amount: 1, card: 2, merchant: 3 },
        type: 'رفض',
        isIncoming: false,
        status: 'declined'
      },
      {
        name: 'online_purchase_english',
        regex: /Online Purchase.*?Currency\s*:\s*([\d,\.]+)\s*(SAR|USD).*?Total\s+([\d,\.]+)\s+SAR.*?Website or store\s*:\s*(.+?)\s*\n.*?Card No.*?:\s*(\d+)/is,
        map: { origAmount: 1, origCurrency: 2, amount: 3, merchant: 4, card: 5 },
        type: 'مشتريات',
        isIncoming: false
      },
      {
        name: 'ecom_purchase',
        regex: /ECOM Purchase Transaction\s*\nFor\s+([\d,\.]+)\s+(SAR)\s*\nAt\s+(.+?)\s*\nCard\s+\d+X+(\d+)/i,
        map: { amount: 1, currency: 2, merchant: 3, card: 4 },
        type: 'مشتريات',
        isIncoming: false
      },
      {
        name: 'refund',
        regex: /Reverse Transaction.*?Total refunded amount:\s*([\d,\.]+)\s+SAR\s*\nMerchant Name:\s*(.+)/is,
        map: { amount: 1, merchant: 2 },
        type: 'استرداد',
        isIncoming: true
      }
    ]
  },
  
  // Tamara (Installments) patterns
  'Tamara': {
    senderIds: ['Tamara', 'تمارا', 'tmra.pe'],
    patterns: [
      {
        name: 'payment_reminder_ar',
        regex: /دفعة قادمة لطلبك من\s+(.+?)\s+بقيمة\s+([\d,\.]+)\s+SAR\s+مستحقة/i,
        map: { merchant: 1, amount: 2 },
        type: 'تذكير',
        isIncoming: false,
        category: 'أقساط',
        isInstallment: true
      },
      {
        name: 'payment_reminder_en',
        regex: /Payment for your\s+(.+?)\s+order of\s+([\d,\.]+)\s+SAR\s+is due/i,
        map: { merchant: 1, amount: 2 },
        type: 'تذكير',
        isIncoming: false,
        category: 'أقساط',
        isInstallment: true
      },
      {
        name: 'installment_confirm',
        regex: /تأكيد دفعة مقسمة.*?المتجر:\s*(.+?)\s*\nالطلب:\s*([\d,\.]+)\s+SAR/i,
        map: { merchant: 1, amount: 2 },
        type: 'تأكيد',
        isIncoming: false,
        category: 'أقساط',
        isInstallment: true
      }
    ]
  },
  
  // OTP / Verification Code Patterns (رمز مؤقت / رمز التحقق)
  'OTP': {
    senderIds: ['all'], // OTPs can come from any bank
    patterns: [
      // AlRajhi OTP - Local Transfer
      {
        name: 'alrajhi_otp_local',
        regex: /رمز مؤقت:\s*(\d+)\s*\nلـ\s*:\s*تحويل محلي.*?\nالمبلغ:\s*SAR\s*([\d,\.]+)/i,
        map: { otp: 1, amount: 2 },
        type: 'رمز تحقق',
        isIncoming: false,
        category: 'تحقق',
        isOTP: true,
        transferType: 'محلي'
      },
      // AlRajhi OTP - Internal Transfer
      {
        name: 'alrajhi_otp_internal',
        regex: /رمز مؤقت:\s*(\d+)\s*\nلـ\s*:\s*تحويل داخلي.*?\nالمبلغ:\s*SAR\s*([\d,\.]+)/i,
        map: { otp: 1, amount: 2 },
        type: 'رمز تحقق',
        isIncoming: false,
        category: 'تحقق',
        isOTP: true,
        transferType: 'داخلي'
      },
      // STC Bank OTP - Add Beneficiary
      {
        name: 'stc_otp_beneficiary',
        regex: /رمز التحقق\s+(\d+)\s*\nلـ:\s*إضافة مستفيد/i,
        map: { otp: 1 },
        type: 'رمز تحقق',
        isIncoming: false,
        category: 'تحقق',
        isOTP: true,
        transferType: 'مستفيد'
      },
      // STC Bank OTP - Internal Transfer
      {
        name: 'stc_otp_internal',
        regex: /رمز التحقق\s+(\d+)\s*\nلـ:\s*حوالة داخلية\s*\nبـ:\s*([\d,\.]+)/i,
        map: { otp: 1, amount: 2 },
        type: 'رمز تحقق',
        isIncoming: false,
        category: 'تحقق',
        isOTP: true,
        transferType: 'داخلي'
      },
      // Tiqmo OTP - Online Purchase
      {
        name: 'tiqmo_otp',
        regex: /رمز التحقق\s*\(OTP\)\s*(\d+)\s*لبطاقة\s*tiqmo.*?(\d{4})\s*المبلغ\s*(SAR)\s*([\d,\.]+)\s*إلى\s*(.+?)\./i,
        map: { otp: 1, card: 2, currency: 3, amount: 4, merchant: 5 },
        type: 'رمز تحقق',
        isIncoming: false,
        category: 'تحقق',
        isOTP: true,
        transferType: 'شراء'
      },
      // Generic OTP patterns
      {
        name: 'generic_otp_1',
        regex: /رمز\s*(?:مؤقت|التحقق|OTP)[:\s]+(\d{4,6})/i,
        map: { otp: 1 },
        type: 'رمز تحقق',
        isIncoming: false,
        category: 'تحقق',
        isOTP: true
      },
      {
        name: 'generic_otp_2',
        regex: /OTP[:\s]+(\d{4,6})/i,
        map: { otp: 1 },
        type: 'رمز تحقق',
        isIncoming: false,
        category: 'تحقق',
        isOTP: true
      }
    ]
  }
};

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

/**
 * Analyze SMS messages and detect bank patterns
 */
function ANALYZE_BANK_SMS_PATTERNS() {
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║     🔍 BANK SMS PATTERN ANALYZER                           ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');
  
  if (SAMPLE_SMS.length === 0) {
    Logger.log('⚠️ No SMS samples provided!');
    Logger.log('📝 Add your real bank SMS messages to the SAMPLE_SMS array');
    Logger.log('   in BankSMS_Patterns.js, then run this function again.\n');
    return { success: false, error: 'No samples' };
  }
  
  var results = [];
  var detectedBanks = {};
  var detectedAccounts = [];
  
  for (var i = 0; i < SAMPLE_SMS.length; i++) {
    var sms = SAMPLE_SMS[i];
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('📱 SMS #' + (i + 1) + ':\n' + sms.substring(0, 80) + '...\n');
    
    var analysis = analyzeSingleSMS_(sms);
    results.push(analysis);
    
    if (analysis.bank) {
      detectedBanks[analysis.bank] = (detectedBanks[analysis.bank] || 0) + 1;
    }
    
    if (analysis.accounts && analysis.accounts.length > 0) {
      analysis.accounts.forEach(function(acc) {
        if (detectedAccounts.indexOf(acc) === -1) {
          detectedAccounts.push(acc);
        }
      });
    }
    
    Logger.log('   🏦 Bank: ' + (analysis.bank || 'Unknown'));
    Logger.log('   💰 Amount: ' + (analysis.amount || 'N/A') + ' ' + (analysis.currency || 'SAR'));
    Logger.log('   🏷️ Type: ' + (analysis.type || 'Unknown'));
    Logger.log('   📂 Category: ' + (analysis.category || 'أخرى'));
    Logger.log('   🔄 Incoming: ' + (analysis.isIncoming ? 'Yes' : 'No'));
    Logger.log('   💳 Accounts: ' + (analysis.accounts ? analysis.accounts.join(', ') : 'None'));
    Logger.log('   🏪 Merchant: ' + (analysis.merchant || 'Unknown'));
  }
  
  Logger.log('\n' + '═'.repeat(60));
  Logger.log('📊 SUMMARY');
  Logger.log('═'.repeat(60));
  Logger.log('Total SMS analyzed: ' + SAMPLE_SMS.length);
  Logger.log('\n🏦 Banks detected:');
  for (var bank in detectedBanks) {
    Logger.log('   • ' + bank + ': ' + detectedBanks[bank] + ' messages');
  }
  Logger.log('\n💳 Accounts found:');
  detectedAccounts.forEach(function(acc) {
    Logger.log('   • ' + acc);
  });
  
  return {
    success: true,
    results: results,
    banks: detectedBanks,
    accounts: detectedAccounts
  };
}

/**
 * Analyze a single SMS message
 */
function analyzeSingleSMS_(sms) {
  var result = {
    original: sms,
    bank: null,
    amount: null,
    currency: 'SAR',
    type: null,
    category: null,
    isIncoming: null,
    accounts: [],
    cards: [],
    merchant: null,
    matchedPattern: null
  };
  
  // Detect bank
  for (var bankName in BANK_PATTERNS) {
    var bankInfo = BANK_PATTERNS[bankName];
    
    // Check sender IDs
    for (var j = 0; j < bankInfo.senderIds.length; j++) {
      if (sms.toLowerCase().indexOf(bankInfo.senderIds[j].toLowerCase()) >= 0) {
        result.bank = bankName;
        break;
      }
    }
    
    if (result.bank) {
      // Try to match patterns
      for (var k = 0; k < bankInfo.patterns.length; k++) {
        var pattern = bankInfo.patterns[k];
        var match = sms.match(pattern.regex);
        
        if (match) {
          result.matchedPattern = pattern.name;
          result.type = pattern.type;
          result.isIncoming = pattern.isIncoming;
          
          if (pattern.map.amount && match[pattern.map.amount]) {
            result.amount = parseFloat(match[pattern.map.amount].replace(/,/g, ''));
          }
          if (pattern.map.currency && match[pattern.map.currency]) {
            result.currency = match[pattern.map.currency];
          }
          if (pattern.map.merchant && match[pattern.map.merchant]) {
            result.merchant = match[pattern.map.merchant].trim();
          }
          if (pattern.map.card && match[pattern.map.card]) {
            result.cards.push(match[pattern.map.card]);
          }
          if (pattern.map.account && match[pattern.map.account]) {
            result.accounts.push(match[pattern.map.account]);
          }
          
          break;
        }
      }
      break;
    }
  }
  
  // Extract accounts/cards if not found by pattern
  if (result.accounts.length === 0) {
    var accMatches = sms.match(/(?:حساب|account|acc)[\s#:]*(\d{4,})/gi);
    if (accMatches) {
      accMatches.forEach(function(m) {
        var num = m.match(/(\d{4,})/);
        if (num) result.accounts.push(num[1]);
      });
    }
  }
  
  if (result.cards.length === 0) {
    var cardMatches = sms.match(/(?:بطاقة|بطاقه|card|كارت)[\s#:]*\*{0,4}(\d{4})/gi);
    if (cardMatches) {
      cardMatches.forEach(function(m) {
        var num = m.match(/(\d{4})/);
        if (num) result.cards.push(num[1]);
      });
    }
  }
  
  // Fallback amount detection
  if (!result.amount) {
    var amtMatch = sms.match(/([\d,\.]+)\s*(SAR|ريال|ر\.س)/i);
    if (amtMatch) {
      result.amount = parseFloat(amtMatch[1].replace(/,/g, ''));
      result.currency = amtMatch[2];
    }
  }
  
  // Fallback bank detection
  // كشف البنك (حساباتك فقط: ساب، الراجحي، tiqmo، Tamara)
  if (!result.bank) {
    if (/saib|ساب|sabb/i.test(sms)) result.bank = 'ساب';
    else if (/الراجحي|alrajhi/i.test(sms)) result.bank = 'الراجحي';
    else if (/tiqmo/i.test(sms)) result.bank = 'tiqmo';
    else if (/tamara|تمارا/i.test(sms)) result.bank = 'Tamara';
  }
  
  // Detect category
  result.category = detectCategory_(sms, result);
  
  // Fallback type detection
  if (!result.type) {
    if (/شراء|pos|مدى|purchase/i.test(sms)) result.type = 'مشتريات';
    else if (/تحويل|حوالة|transfer/i.test(sms)) result.type = 'حوالة';
    else if (/سحب|atm/i.test(sms)) result.type = 'سحب';
    else if (/سداد|فاتورة|bill/i.test(sms)) result.type = 'سداد';
    else result.type = 'أخرى';
  }
  
  // Fallback isIncoming detection
  if (result.isIncoming === null) {
    if (/وارد|إيداع|استلام|إضافة|راتب|received/i.test(sms)) {
      result.isIncoming = true;
    } else if (/خصم|صادر|شراء|سحب|دفع|debit/i.test(sms)) {
      result.isIncoming = false;
    } else {
      result.isIncoming = false;
    }
  }
  
  return result;
}

/**
 * Detect category from SMS
 */
function detectCategory_(sms, data) {
  var t = sms.toLowerCase();
  
  // Food
  if (/starbucks|mcdonalds|البيك|كنتاكي|hungerstation|مطعم|food|طعام/i.test(t)) return 'طعام';
  
  // Transport
  if (/uber|careem|مواصلات|نقل|transport/i.test(t)) return 'نقل';
  
  // Shopping
  if (/amazon|noon|جرير|extra|تسوق|shopping/i.test(t)) return 'تسوق';
  
  // Bills
  if (/stc|mobily|كهرباء|مياه|فاتورة|سداد|bill/i.test(t)) return 'فواتير';
  
  // Salary
  if (/راتب|salary/i.test(t)) return 'راتب';
  
  // ATM
  if (/atm|صراف|سحب نقدي/i.test(t)) return 'سحب نقدي';
  
  // Transfers
  if (data && data.isIncoming) return 'حوالات واردة';
  if (/تحويل|حوالة/i.test(t)) return 'حوالات صادرة';
  
  // Purchases
  if (/شراء|pos|purchase|مدى/i.test(t)) return 'مشتريات عامة';
  
  return 'أخرى';
}

// ============================================
// ACCOUNT EXTRACTION
// ============================================

/**
 * Extract all unique accounts from SMS samples
 */
function EXTRACT_ALL_ACCOUNTS() {
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║     💳 ACCOUNT EXTRACTOR                                   ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');
  
  var accounts = {};
  
  // From Sheet1 (existing transactions)
  try {
    var s1 = _sheet('Sheet1');
    var lastRow = s1.getLastRow();
    
    if (lastRow > 1) {
      // Get account numbers from column L (accNum) and card from column K (cardNum)
      var accData = s1.getRange(2, 11, lastRow - 1, 2).getValues(); // K:L
      var rawData = s1.getRange(2, 13, lastRow - 1, 1).getValues(); // M (raw SMS)
      
      accData.forEach(function(row, idx) {
        var cardNum = String(row[0] || '').trim();
        var accNum = String(row[1] || '').trim();
        var rawSMS = String(rawData[idx][0] || '');
        
        if (cardNum && cardNum.length >= 4) {
          var key = 'card_' + cardNum.slice(-4);
          if (!accounts[key]) {
            accounts[key] = {
              type: 'بطاقة',
              number: cardNum.slice(-4),
              fullNumber: cardNum,
              bank: detectBankFromSMS_(rawSMS),
              count: 0
            };
          }
          accounts[key].count++;
        }
        
        if (accNum && accNum.length >= 4) {
          var key2 = 'acc_' + accNum.slice(-4);
          if (!accounts[key2]) {
            accounts[key2] = {
              type: 'حساب',
              number: accNum.slice(-4),
              fullNumber: accNum,
              bank: detectBankFromSMS_(rawSMS),
              count: 0
            };
          }
          accounts[key2].count++;
        }
      });
    }
  } catch (e) {
    Logger.log('Could not read Sheet1: ' + e);
  }
  
  // From SAMPLE_SMS
  SAMPLE_SMS.forEach(function(sms) {
    var analysis = analyzeSingleSMS_(sms);
    
    analysis.accounts.forEach(function(acc) {
      var key = 'acc_' + acc.slice(-4);
      if (!accounts[key]) {
        accounts[key] = {
          type: 'حساب',
          number: acc.slice(-4),
          fullNumber: acc,
          bank: analysis.bank,
          count: 0
        };
      }
      accounts[key].count++;
    });
    
    analysis.cards.forEach(function(card) {
      var key = 'card_' + card.slice(-4);
      if (!accounts[key]) {
        accounts[key] = {
          type: 'بطاقة',
          number: card.slice(-4),
          fullNumber: card,
          bank: analysis.bank,
          count: 0
        };
      }
      accounts[key].count++;
    });
  });
  
  // Display results
  var accountList = Object.values(accounts);
  accountList.sort(function(a, b) { return b.count - a.count; });
  
  Logger.log('📊 Found ' + accountList.length + ' unique accounts/cards:\n');
  
  accountList.forEach(function(acc, idx) {
    Logger.log((idx + 1) + '. ' + acc.type + ' ' + acc.number + 
               ' (' + (acc.bank || 'Unknown') + ') - ' + acc.count + ' transactions');
  });
  
  return accountList;
}

/**
 * Detect bank from SMS text
 */
function detectBankFromSMS_(sms) {
  var t = String(sms || '').toLowerCase();
  if (/الراجحي|alrajhi/i.test(t)) return 'الراجحي';
  if (/stc\s*pay|stcpay/i.test(t)) return 'STC Pay';
  if (/tiqmo/i.test(t)) return 'tiqmo';
  if (/d360/i.test(t)) return 'D360';
  if (/الإنماء|alinma/i.test(t)) return 'الإنماء';
  if (/الأهلي|ncb|snb/i.test(t)) return 'الأهلي';
  return null;
}

// ============================================
// SHEET INTEGRATION
// ============================================

/**
 * Add discovered accounts to Accounts sheet
 */
function ADD_DISCOVERED_ACCOUNTS_TO_SHEET() {
  Logger.log('Adding discovered accounts to Accounts sheet...\n');
  
  var accounts = EXTRACT_ALL_ACCOUNTS();
  
  try {
    var sh = _sheet('Accounts');
    var existing = sh.getDataRange().getValues();
    var existingNumbers = existing.map(function(r) { return String(r[2] || ''); });
    
    var added = 0;
    accounts.forEach(function(acc) {
      if (existingNumbers.indexOf(acc.number) === -1 && existingNumbers.indexOf(acc.fullNumber) === -1) {
        var name = (acc.bank || 'Unknown') + ' ' + acc.number;
        sh.appendRow([
          name,           // Name
          acc.type,       // Type
          acc.number,     // Number (last 4)
          acc.bank || '', // Bank
          '',             // Aliases
          true,           // Is Mine
          false           // Is Internal
        ]);
        added++;
        Logger.log('✅ Added: ' + name);
      }
    });
    
    Logger.log('\n📊 Added ' + added + ' new accounts to sheet');
    return { success: true, added: added };
    
  } catch (e) {
    Logger.log('❌ Error: ' + e);
    return { success: false, error: e.toString() };
  }
}

/**
 * Seed SMS templates to Sms_Templates sheet
 */
function SEED_BANK_TEMPLATES() {
  Logger.log('Seeding bank SMS templates...\n');
  
  try {
    var sh = ensureTemplatesSheet_();
    var templates = [];
    
    // Generate templates from BANK_PATTERNS
    for (var bankName in BANK_PATTERNS) {
      var bankInfo = BANK_PATTERNS[bankName];
      
      bankInfo.patterns.forEach(function(pattern) {
        var mapStr = '';
        for (var field in pattern.map) {
          if (mapStr) mapStr += ';';
          mapStr += field + '=' + pattern.map[field];
        }
        
        templates.push([
          true,                           // Enabled
          bankName,                       // Bank/Org
          pattern.regex.source,           // Regex pattern
          mapStr                          // Field mapping
        ]);
      });
    }
    
    // Add to sheet
    if (templates.length > 0) {
      sh.getRange(sh.getLastRow() + 1, 1, templates.length, 4).setValues(templates);
      Logger.log('✅ Added ' + templates.length + ' templates');
    }
    
    // Clear cache
    CacheService.getScriptCache().remove('SMS_TEMPLATES');
    
    return { success: true, count: templates.length };
    
  } catch (e) {
    Logger.log('❌ Error: ' + e);
    return { success: false, error: e.toString() };
  }
}

/**
 * Test parsing with all known patterns
 */
function TEST_SMS_PARSING(smsText) {
  if (!smsText) {
    Logger.log('Usage: TEST_SMS_PARSING("your sms text here")');
    return;
  }
  
  Logger.log('🔍 Testing SMS parsing...\n');
  Logger.log('Input: ' + smsText + '\n');
  
  var result = analyzeSingleSMS_(smsText);
  
  Logger.log('Results:');
  Logger.log('  🏦 Bank: ' + (result.bank || 'Unknown'));
  Logger.log('  💰 Amount: ' + result.amount + ' ' + result.currency);
  Logger.log('  🏷️ Type: ' + result.type);
  Logger.log('  📂 Category: ' + result.category);
  Logger.log('  🔄 Incoming: ' + result.isIncoming);
  Logger.log('  💳 Cards: ' + result.cards.join(', '));
  Logger.log('  🏪 Merchant: ' + result.merchant);
  Logger.log('  📋 Pattern: ' + result.matchedPattern);
  
  return result;
}

/**
 * Quick help
 */
function HELP_BANK_SMS() {
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║     📖 BANK SMS PATTERNS - HELP                            ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');
  
  Logger.log('STEP 1: Add your real bank SMS messages');
  Logger.log('  → Open BankSMS_Patterns.js');
  Logger.log('  → Find SAMPLE_SMS array');
  Logger.log('  → Add your actual SMS messages from banks\n');
  
  Logger.log('STEP 2: Analyze patterns');
  Logger.log('  → Run: ANALYZE_BANK_SMS_PATTERNS()\n');
  
  Logger.log('STEP 3: Extract accounts');
  Logger.log('  → Run: EXTRACT_ALL_ACCOUNTS()\n');
  
  Logger.log('STEP 4: Add to sheets');
  Logger.log('  → Run: ADD_DISCOVERED_ACCOUNTS_TO_SHEET()');
  Logger.log('  → Run: SEED_BANK_TEMPLATES()\n');
  
  Logger.log('TEST: Parse any SMS');
  Logger.log('  → Run: TEST_SMS_PARSING("your sms text")\n');
  
  Logger.log('Supported Banks:');
  for (var bank in BANK_PATTERNS) {
    Logger.log('  ✅ ' + bank);
  }
}
