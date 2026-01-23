# استراتيجية البوت غير المتزامن (Async Telegram Bot)

لتحقيق أداء عالٍ (High Performance) وتجنب أخطاء *Timeout* من تيليجرام، يجب فصل **استقبال الرسالة** عن **معالجتها**.

## المشكلة الحالية
في كود `Ingress.js` الحالي، يحاول النظام معالجة الرسالة فوراً باستخدام `LockService` و `executeUniversalFlow`. هذا جيد كمحاولة أولى، لكن إذا استغرقت المعالجة أكثر من 30 ثانية (وهو زمن انتظار تيليجرام)، سيقوم تيليجرام بإعادة إرسال الرسالة (Retry)، مما يسبب تكراراً ومشاكل.

## الاستراتيجية المقترحة (SaaS Grade)

### 1. استقبال وتخزين سريع (The Dump)
دالة `doPost` يجب أن تكون مجرد ساعي بريد "غبي". تستلم الرسالة، تضعها في صندوق بريد (Queue Sheet)، وتخبر تيليجرام "وصلت" (200 OK) فوراً. لا معالجة، لا تحليل، لا قفل (Lock).

### 2. المعالج الخلفي (The Worker)
مشغل زمني (Time-Based Trigger) يعمل كل دقيقة، يأخذ الرسائل من الـ Queue ويعالجها واحدة تلو الأخرى.

---

## الكود المقترح

### تحديث `Ingress.js` - دالة `doPost`

```javascript
/* Ingress.js UPDATED */
function doPost(e) {
  // 1. استخراج النص الخام فوراً
  var rawBody = (e && e.postData && e.postData.contents) ? String(e.postData.contents) : "";
  
  // 2. إيداع في الطابور فوراً (بدون معالجة)
  // نستخدم دالة خفيفة جداً للإضافة
  try {
     SOV1_fastEnqueue_(rawBody); 
  } catch (err) {
     // حتى لو فشل الإيداع، سجل الخطأ لكن لا توقف الرد
     console.error("Queue Failed", err);
  }

  // 3. الرد الفوري بـ 200 OK
  return ContentService.createTextOutput("OK");
}

/* إضافة في Queue.js */
function SOV1_fastEnqueue_(rawBody) {
  // إضافة سريعة جداً بدون تنسيق معقد
  var sh = SpreadsheetApp.openById(ENV.SPREADSHEET_ID).getSheetByName('Ingress_Queue');
  // نستخدم appendRow لأنه الأسرع والأبسط، لكن يمكن استخدام CacheService للسرعة القصوى
  sh.appendRow([new Date(), 'RAW_DUMP', rawBody, 'NEW']);
}
```

### تحديث `Queue.js` - المعالج (Worker)

```javascript
/* Queue.js Worker */

function processQueueWorker() {
  // 1. قفل لمنع تشغيل دالتين معالجة في نفس الوقت
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return; // إذا كان مشغولاً، اخرج

  try {
    var sh = _sheet('Ingress_Queue');
    var data = sh.getDataRange().getValues();
    
    // تجاوز الرأس
    // نبحث عن الصفوف التي حالتها NEW
    // .... كود المعالجة الموجود حالياً ...
    
    // بعد المعالجة، نحدث الحالة إلى DONE
  } finally {
    lock.releaseLock();
  }
}
```

### كيفية تفعيل الـ Trigger
1. اذهب لصفحة Triggers في محرر Apps Script.
2. أضف Trigger جديد للدالة `processQueueWorker`.
3. اجعل الوقت: **Every 1 Minute**.

---

## التحسين المتقدم: (Hybrid Approach)
إذا كنت تريد الرد الفوري ولكن لا تريد انتظار دقيقة كاملة للمعالجة:

في `doPost`، بعد إضافة الصف، قم بإنشاء Trigger لمرة واحدة:

```javascript
// داخل doPost بعد الحفظ
ScriptApp.newTrigger('processQueueWorker')
   .timeBased()
   .after(100) // بعد 100 ملي ثانية (فوري تقريباً)
   .create();
```
*ملاحظة: هذا قد يستهلك كوتة الـ Triggers بسرعة إذا كان الضغط عالياً جداً.*

---

## مقارنة الطرق

| الطريقة | السرعة | الموثوقية | التعقيد | مناسب لـ |
|---------|--------|-----------|---------|----------|
| **الحالية (Synchronous)** | بطيء (يعتمد على المعالجة) | متوسطة (خطر Timeout) | بسيط | استخدام شخصي خفيف |
| **Queue + Cron (1 min)** | سريع جداً (فوري) | عالية جداً | متوسط | SaaS / استخدام كثيف |
| **Queue + Instant Trigger** | سريع جداً | عالية | مرتفع (إدارة Triggers) | SaaS متطلب للسرعة |

**نصيحتي:** ابدأ بـ **Queue + Cron (1 min)**. التأخير لمدة دقيقة مقبول جداً في الأنظمة المالية مقابل الموثوقية العالية وعدم تكرار العمليات.
