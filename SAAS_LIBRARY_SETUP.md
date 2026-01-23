# دليل إنشاء Google Apps Script Library (التفاصيل التقنية لحماية الكود)

لتحويل السكربت إلى منتج SaaS محمي، اتبع الخطوات التالية بدقة:

## 1. إعداد الـ Core (الكود المحمي)
1. افتح مشروعك الحالي (الذي يحتوي على كل الكود).
2. تأكد أن الدوال التي سيستخدمها العميل (مثل `doPost`, `onOpen`, `setup`) مكتوبة بشكل يسمح بالوصول إليها (ليست global variables خاصة جداً تعتمد على سياق الملف).
3. اضغط على أيقونة الترس (Project Settings) > انسخ **Script ID**.
4. اضغط على زر **Deploy** > **New deployment** > النوع **Library**.
   - الوصف: `v1 Initial Release`
   - الصلاحيات (Who has access): هذا هو الأهم.
     - إذا اخترت **Anyone**، فالكل يمكنه استخدامها (مفتوح).
     - إذا اخترت **Only myself**، لن يعمل عند العملاء.
     - الحل: اختر **Anyone** أو **Anyone with Google Account**، *لكن* أضف منطق تحقق (Auth Logic) داخل الكود.

## 2. إضافة طبقة التحقق (License Check)
داخل السكربت الأساسي (Core)، أضف دالة في بداية كل عملية رئيسية:

```javascript
// في مشروع Core الموزع كـ مكتبة
var LICENSES_DB_ID = "معرف_شيت_يحتوي_على_المشتركين";

function checkLicense() {
  var userEmail = Session.getEffectiveUser().getEmail();
  var sheet = SpreadsheetApp.openById(LICENSES_DB_ID).getSheetByName("Users");
  // بحث بسيط عن الإيميل
  var userRow = findRow_(sheet, userEmail); 
  
  if (!userRow || userRow.status !== 'ACTIVE') {
    throw new Error("عذراً، اشتراكك غير مفعل. الرجاء الاتصال بالدعم.");
  }
}

function publicDoPost(e) {
  checkLicense(); // تحقق قبل المعالجة
  // ... بقية الكود ...
}
```

## 3. إعداد نسخة العميل (Client Distributor)
1. أنشئ Google Sheet جديدة فارغة (التي سينسخها العميل).
2. افتح المحرر (Extensions > Apps Script).
3. أضف المكتبة (Libraries +):
   - الصق **Script ID** الخاص بمشروعك (Core).
   - اختر آخر نسخة (Version).
   - سمّها `MoneyTrackerApp`.
4. اكتب الكود التالي فقط في ملف `Code.gs`:

```javascript
/**
 * Money Tracker Pro
 * جميع الحقوق محفوظة
 */

function onOpen() {
  MoneyTrackerApp.onOpen();
}

function doPost(e) {
  return MoneyTrackerApp.doPost(e);
}

function setup() {
  MoneyTrackerApp.setupSystem();
}
```
5. الآن، العميل يرى فقط هذه الأسطر القليلة. الكود الحقيقي مخفي في `MoneyTrackerApp` ولا يمكنه تعديله.

## 4. تحديث النظام عند العملاء
عندما تريد إضافة ميزة جديدة:
1. عدّل الكود في مشروع `Core`.
2. انشر Deployment جديد للمكتبة (New Version).
3. *تلقائياً*، إذا كان العميل مضبوطاً على استخدام "Head" (للتطوير) سيتحدث، لكن للإنتاج، يجب عليك إخبار العملاء بتحديث النسخة، أو يمكنك توجيههم لنسخ Sheet جديدة إذا كانت التغييرات جذرية.
4. *نصيحة:* في مرحلة التوزيع، اضبط المكتبة في ملف العميل لتستخدم "Version 1" (رقم ثابت) وليس "HEAD"، لكي لا تكسر كودهم إذا عدلت شيئاً وتأكدت منه.
