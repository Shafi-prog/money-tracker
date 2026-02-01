# SMS Samples for Grok / Gemini training 📚

This file contains real SMS examples grouped by source/bank and labelled for training Grok/Gemini extraction models. Use these messages to teach the model how to:
- extract account/card last-4, bank name, currency and amount
- identify message types: purchase (POS/Online), incoming/top-up, refund/reverse, declined, OTP/temporary code, transfer, salary, installment/commitment
- normalize bank names and aliases for `bank` field

---

## Expected output schema (suggested)
The extractor should produce JSON with these fields:
```
{
  "merchant": "string",
  "amount": number,
  "currency": "SAR|USD|...",
  "type": "purchase|topup|refund|decline|otp|transfer|salary|installment|hold|other",
  "isIncoming": boolean,
  "cardNum": "0305",
  "accNum": "****9682",
  "bank": "AlrajhiBank|STC|Tiqmo|Tamara|SAIB|...",
  "date": "YYYY-MM-DD",
  "time": "HH:MM:SS",
  "notes": "free-text",
  "labels": ["otp","decline"]
}
```

---

## Bank: Tiqmo (example cluster)
```
tiqmo=

شراء POS
بـ 20.00 SAR
من TAEM ALBARIKAT CO
عبر MasterCard **0305 Apple Pay
في 2026-01-11 15:57:28

شراء POS
بـ 105.00 SAR
من MOVIE CINEMAS145
عبر MasterCard **0305 Apple Pay
في 2026-01-11 18:10:22

... (truncated)

رمز التحقق (OTP) 886511 لبطاقة tiqmo تنتهي ب 0305 المبلغ SAR 1.90 إلى 01_AI PTE_. رمز التحقق سيكون متاح ل 5 دقائق.

Online Purchase Amount , Currency : 1.90 SAR
Total 1.93 SAR including fee
Website or store : 01.AI PTE. LTD.
Card Type: MasterCard
Card No. (last 4 digit): 0305
Account No.: **9682
Date: 2026-01-13
Time: 13:07:33
```

**Labels:** purchase, otp, card-last4:0305, account-last4:9682, topup, decline

---

## Bank: Tamara (installment & reminders)
```
Tamara=

دفعة قادمة لطلبك من فلاي اديل بقيمة 136.03 SAR مستحقة خلال يومين. فضلاً، تأكد من وجود رصيد كافي في بطاقتك. أو ادفع الحين: https://tmra.pe/...

Payment for your Flyadeal order of 136.03 SAR is due in 2 days & will be autocharged from your card.

تأكيد دفعة مقسمة إلى 4 \nالمتجر: AliExpress \nالطلب: 123.25 SAR \nالتاريخ: 29/12/2025
```

**Labels:** installment, due-reminder, commitment

---

## Bank: STC Bank (topups, OTP, declines)
```
STC Bank=

إضافة أموال لحسابك
بـ:500.00 ر.س
عبر:*XXXX
في:11/11/25 08:34

رمز التحقق 1072 ل: إضافة مستفيد

رصيد غير كافي
العملية: شراء عبر الإنترنت
البطاقة: ***3281
المبلغ: 774.05 SAR
```

**Labels:** topup, otp, decline, card-last4:3281

---

## Bank: SAIB (various transactions & holds)
```
SAIB=

شراء انترنت
بSAR 737.00
لدىD360 
مدى ابل X3474 
من8001 
ب09-13 05:41

ECOM Hold (Card 5246XXXXXXXX0305) ... This is just a hold on your card and will be released once the final transaction amount incl. any Fee is settled.
```

**Labels:** hold, purchase, card-mask, refund

---

## Transfer & Internal transfer examples
```
المبلغ:SAR 30.00
حوالة داخلية صادرة
من9767
بـSAR 30
لـ6180;محمد الحربي
26/1/16 18:52

المبلغ:SAR 240.00
حوالة محلية صادرة
مصرف:ALBI
من:9767
```

**Labels:** transfer, internal, from-account:9767, to-account:6180

---

## Salary / Incoming deposits
```
إيداع دعم سكني
المبلغ:SAR 130.07
الى:9765
25/1/26 09:07

حوالة واردة: محلية (مقبوله)
من: XXXX4903 
مؤسسة شقق زوايا الماسية 
مبلغ: SAR 15,000.00
```

**Labels:** salary, incoming, deposit

---

## Other / Notes
- Include multiple variants of the same message to help the model generalize (Arabic/English mix, different formatting, presence/absence of punctuation).
- Mark OTP codes explicitly as `otp` with a `code` field if present.
- Mark declined transactions and temporary codes so the model learns to ignore OTPs from being treated as payments.

---

## How to use
1. Save this file into the repo and use it as test data for Grok/Gemini prompts.
2. Use the CLI endpoint `BULK_EXTRACT_ACCOUNTS` (if available) to run multiple-lines at once: `?mode=cli&cmd=BULK_EXTRACT_ACCOUNTS&smsText=<url-encoded-lines>`
3. When training, prompt the model to return the exact JSON schema (see "Expected output schema"), and include several labelled examples.

---

## FULL RAW SMS DUMP (user-provided)

The following block contains the full set of raw SMS messages you provided. Each message block is separated by one or more blank lines.

```text
tiqmo=

شراء POS
بـ 20.00 SAR
من TAEM ALBARIKAT CO
عبر MasterCard **0305 Apple Pay
في 2026-01-11 15:57:28
شراء POS
بـ 105.00 SAR
من MOVIE CINEMAS145
عبر MasterCard **0305 Apple Pay
في 2026-01-11 18:10:22
شراء POS
بـ 52.00 SAR
من tamwenat  jadyel
عبر MasterCard **0305 Apple Pay
في 2026-01-12 12:37:38
رصيد غير كافي
مبلغ 85.0 SAR
بطاقة 0305
من snae alarabya co
في 2026-01-12 12:38:11
إضافة أموال
مبلغ 200.00 ريال
من آبل باي
في 2026-01-12 12:39:02
شراء POS
بـ 17.00 SAR
من Dewaniah mazaher
عبر MasterCard **0305 Apple Pay
في 2026-01-12 12:43:16
رمز التحقق (OTP) 886511 لبطاقة tiqmo تنتهي ب 0305 المبلغ SAR 1.90 إلى 01_AI PTE_. رمز التحقق سيكون متاح ل 5 دقائق. في حال لم تقم بهذه العملية الرجاء التواصل مع خدمة العملاء 8001110800
Online Purchase Amount , Currency : 1.90 SAR
Total 1.93 SAR including fee
Website or store : 01.AI PTE. LTD.
Card Type: MasterCard
Processed Through: 
Card No. (last 4 digit): 0305
Account No.: **9682
Date: 2026-01-13
Time: 13:07:33
شراء POS
بـ 128.00 SAR
من NAFT
عبر MasterCard **0305 Apple Pay
في 2026-01-14 08:44:34
إضافة أموال
مبلغ 1000.00 ريال
من آبل باي
في 2026-01-14 19:47:49
Online Purchase Amount , Currency : 0.50 USD
Total 1.91 SAR including fee
Website or store : Dragonpass
Card Type: MasterCard
Processed Through: 
Card No. (last 4 digit): 0305
Account No.: **9682
Date: 2026-01-14
Time: 19:51:05
Reverse Transaction
Amount, Currency : 0.50 USD
Total refunded amount: 1.91 SAR
Merchant Name: Dragonpass
Country: GBR
Card Type: MasterCard
Card No. (last 4 digit): 0305
Account No.: **9682
Date: 2026-01-14
Time: 19:51:10
شراء انترنت
بـ 100.00 SAR
من STC Bank
عبر MasterCard **0305 Apple Pay
في 2026-01-14 21:32:02
شراء POS
بـ 23.00 SAR
من ZAWYAT ALSAER ALADEL
عبر MasterCard **0305 Apple Pay
في 2026-01-15 01:42:44
شراء POS
بـ 5.00 SAR
من RAEAH ALGEEM
عبر MasterCard **0305 Apple Pay
في 2026-01-15 08:37:51
شراء POS
بـ 8.00 SAR
من ZAWYAT ALSAER ALADEL
عبر MasterCard **0305 Apple Pay
في 2026-01-15 17:54:06
ECOM Purchase Transaction
For 144.77 SAR
At SAUDI ELECTRICITY COMP
Card 5246XXXXXXXX0305
On 2026-01-16 14:01:22
Country SAU
This is just a hold on your card and will be released once the final transaction amount incl. any Fee is settled. Thank you.
شراء POS
بـ 30.00 SAR
من HALA
عبر MasterCard **0305 Apple Pay
في 2026-01-16 20:08:06
شراء POS
بـ 30.00 SAR
من PIZZA ALOWSTORA RESAAT
عبر MasterCard **0305 Apple Pay
في 2026-01-17 22:04:08
شراء POS
بـ 7.75 SAR
من Azoom AlShamal Co
عبر MasterCard **0305 Apple Pay
في 2026-01-19 07:26:07
شراء POS
بـ 25.00 SAR
من HALA
عبر MasterCard **0305 Apple Pay
في 2026-01-19 18:28:59
شراء POS
بـ 5.00 SAR
من ZAWYAT ALSAER ALADEL
عبر MasterCard **0305 Apple Pay
في 2026-01-19 22:46:53
شراء POS
بـ 36.00 SAR
من Daily Food Co-274
عبر MasterCard **0305 Apple Pay
في 2026-01-21 22:07:55
شراء POS
بـ 1.00 SAR
من ZAWYAT ALSAER ALADEL
عبر MasterCard **0305 Apple Pay
في 2026-01-21 22:13:48
شراء POS
بـ 115.00 SAR
من MHL AKLA ALTWT
عبر MasterCard **0305 Apple Pay
في 2026-01-22 16:42:25
شراء POS
بـ 45.95 SAR
من AMTIAZ ALKHIR CO
عبر MasterCard **0305 Apple Pay
في 2026-01-23 17:12:51
شراء POS
بـ 15.00 SAR
من ustul alfawakeh Establ
عبر MasterCard **0305 Apple Pay
في 2026-01-23 17:22:01
شراء POS
بـ 50.00 SAR
من NAFT STN 4018-AlKeram
عبر MasterCard **0305 Apple Pay
في 2026-01-23 17:54:58
شراء POS
بـ 25.15 SAR
من DUKAN 4278
عبر MasterCard **0305 Apple Pay
في 2026-01-24 16:05:56
شراء POS
بـ 3.50 SAR
من RAEAH ALGEEM
عبر MasterCard **0305 Apple Pay
في 2026-01-24 16:39:23
شراء POS
بـ 6.00 SAR
من Azoom AlShamal Co
عبر MasterCard **0305 Apple Pay
في 2026-01-25 07:29:50
شراء POS
بـ 15.00 SAR
من TAAM  HAQEQI FOR CANDY
عبر MasterCard **0305 Apple Pay
في 2026-01-25 16:17:19
إضافة أموال
مبلغ 500.00 ريال
من آبل باي
في 2026-01-25 18:23:20
رمز التحقق (OTP) 374192 لبطاقة tiqmo تنتهي ب 0305 المبلغ SAR 236.08 إلى Tamara. رمز التحقق سيكون متاح ل 5 دقائق. في حال لم تقم بهذه العملية الرجاء التواصل مع خدمة العملاء 8001110800
شراء انترنت
بـ 236.08 SAR
من Tamara
عبر MasterCard **0305 
في 2026-01-25 18:27:37
شراء POS
بـ 11.00 SAR
من ALBAIT ALTHAHABI Co
عبر MasterCard **0305 Apple Pay
في 2026-01-25 19:52:50

tiqmo=

شراء POS
بـ 20.00 SAR
من TAEM ALBARIKAT CO
عبر MasterCard **0305 Apple Pay
في 2026-01-11 15:57:28
... (repeated block truncated for brevity) ...

المبلغ:SAR 30.00
حوالة داخلية صادرة
من9767
بـSAR 30
لـ6180;محمد الحربي
26/1/16 18:52
رمز مؤقت:6221
لـ :تحويل محلي - التطبيق
المبلغ:SAR 240.00
حوالة محلية صادرة
مصرف:ALBI
من:9767
مبلغ:SAR 240
الى:مؤسسة لبنات الوقفية
الى:0005
الرسوم:SAR 0.58
26/1/17 16:57
رمز مؤقت:3724
لـ :تحويل داخلي - التطبيق
المبلغ:SAR 1,500.00
حوالة داخلية صادرة
من1626
بـSAR 1500
لـ5002;جهز ثبات المطيري
26/1/18 08:55
رمز مؤقت:8695
لـ :تحويل داخلي - التطبيق
المبلغ:SAR 238.55
حوالة داخلية صادرة
من9765
بـSAR 238.55
لـ9818;ابتسام المطيري
26/1/18 12:32
رمز مؤقت:0485
لـ :تحويل داخلي - التطبيق
المبلغ:SAR 300.00
حوالة داخلية صادرة
من9765
بـSAR 300
لـ3512;محمد المطيري
26/1/19 10:32
رمز مؤقت:5956
لـ :تحويل داخلي - التطبيق
المبلغ:SAR 500.00
حوالة داخلية صادرة
من1626
بـSAR 500
لـ3818;مقرن المطيري
26/1/20 17:16
رمز مؤقت:8235
لـ :تحويل داخلي - التطبيق
المبلغ:SAR 270.00
حوالة داخلية صادرة
من9765
بـSAR 270
لـ1869;عمر بركه العلوي
26/1/23 11:57
رمز مؤقت:3950
لـ :تحويل داخلي - التطبيق
المبلغ:SAR 150.00
حوالة داخلية صادرة
من9765
بـSAR 150
لـ9114;حسام المطيري
26/1/24 18:27
إيداع دعم سكني
المبلغ:SAR 130.07
الى:9765
؜25/1/26 09:07
يمكن استخدامه في نقاط البيع ودفع الفواتير وسحب من مكائن المصرف 
إيداع دعم سكني
المبلغ:SAR 260.15
الى:9765
؜25/1/26 09:07
يمكن استخدامه في نقاط البيع ودفع الفواتير وسحب من مكائن المصرف 
إيداع دعم سكني
المبلغ:SAR 455.25
الى:9765
؜25/1/26 09:13
يمكن استخدامه في نقاط البيع ودفع الفواتير وسحب من مكائن المصرف 
إيداع دعم سكني
المبلغ:SAR 455.45
الى:9765
؜25/1/26 09:15
يمكن استخدامه في نقاط البيع ودفع الفواتير وسحب من مكائن المصرف 
حوالة داخلية واردة
بـSAR 150
لـ9767
من9112;حسام المطيري
26/1/25 09:27
حوالة داخلية واردة
بـSAR 300
لـ9767
من2808;العنود معيض المطيري
26/1/25 18:56

Tamara=

دفعة قادمة لطلبك من فلاي اديل بقيمة 136.03 SAR مستحقة خلال يومين. فضلاً، تأكد من وجود رصيد كافي في بطاقتك. أو ادفع الحين: https://tmra.pe/cQh0KHNrKk
دفعة قادمة لطلبك من مركز براعة للتدريب بقيمة 75.61 SAR مستحقة خلال يومين. فضلاً، تأكد من وجود رصيد كافي في بطاقتك. أو ادفع الحين: https://tmra.pe/zHOnytg1XW
دفعة قادمة لطلبك من فلاي اديل بقيمة 8.22 SAR مستحقة خلال يومين. فضلاً، تأكد من وجود رصيد كافي في بطاقتك. أو ادفع الحين: https://tmra.pe/9KS8H0pbjn
Payment for your Flyadeal order of 136.03 SAR is due in 2 days & will be autocharged from your card. Please ensure your card has balance. Pay now: https://tmra.pe/cQh0KHNrKk
Payment for your store.albaraah.sa/ar order of 75.61 SAR is due in 2 days & will be autocharged from your card. Please ensure your card has balance. Pay now: https://tmra.pe/zHOnytg1XW
Payment for your Flynas order of 95.94 SAR is due in 2 days & will be autocharged from your card. Please ensure your card has balance. Pay now: https://tmra.pe/fgeXPkqVwY
Payment for your Flyadeal order of 8.22 SAR is due in 2 days & will be autocharged from your card. Please ensure your card has balance. Pay now: https://tmra.pe/9KS8H0pbjn
Payment for your Flynas order of 121.79 SAR is due in 2 days & will be autocharged from your card. Please ensure your card has balance. Pay now: https://tmra.pe/sf41hhikIt
Payment for your Flyadeal order of 136.03 SAR is due in 2 days & will be autocharged from your card. Please ensure your card has balance. Pay now: https://tmra.pe/cQh0KHNrKk
دفعتك بقيمة 121.79 SAR لطلبك من فلاي ناس مستحقة اليوم، تجنب التأثير على سجلك الائتماني وادفع الحين https://tmra.pe/sf41hhikIt
تأكيد دفعة مقسمة إلى 4 
المتجر: AliExpress 
الطلب: 123.25 SAR 
التاريخ: 29/12/2025
دفعة قادمة بقيمة 30.81 SAR لطلبك من الي اكسبرس مستحقة خلال يومين. سددها الحين: https://tmra.pe/JXZqQkHfo6
تأكيد دفعة مقسمة إلى 3 
المتجر: Alsaif Gallery 
الطلب: 708.20 SAR 
التاريخ: 25/02/20

These installments should be identified as installments not real  conduct money

Use them to identify money commitments

STC Bank=

إضافة أموال لحسابك
بـ:500.00 ر.س
عبر:*XXXX
في:11/11/25 08:34
شراء Apple Pay
عبر:*3281
بـ:1 SAR
من:Fawzia Mahmoud Al-Shehri
في: 21/11/25 02:43
إضافة أموال لحسابك
بـ:100.00 ر.س
عبر:*XXXX
في:26/11/25 00:02
رمز التحقق 1072
لـ: إضافة مستفيد
رمز التحقق 4970
لـ: حوالة داخلية
بـ: 70.00 ريال
*لا تشارك الرمز
حوالة داخلية صادرة
بـ: 70.00ر.س
إلى: هبه المزروع
حساب:1929*
في:26/11/25 00:08
شراء Apple Pay
عبر:*3281
بـ:60 SAR
من:HALAWYAT TAAM WHAQIQI
في: 29/11/25 16:38
رصيد غير كافي
171.54 ر.س
Upwork -869546658REF
30/11/25 19:33
رصيدك 21.97
إضافة أموال لحسابك
بـ:300.00 ر.س
عبر:*XXXX
في:30/11/25 19:35
购买 Visa ...
```

*Generated and added to repository for Grok/Gemini training — keep augmenting with more real samples.*
