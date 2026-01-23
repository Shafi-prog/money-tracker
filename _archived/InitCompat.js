
/********** InitCompat.gs — توافق آمن **********/

function V120_runInitial_() {
  if (typeof V120_initialSystemSetupImpl_ === 'function') {
    return V120_initialSystemSetupImpl_();
  }
  if (typeof initialSystemSetup_ === 'function') return initialSystemSetup_();
  if (typeof initialSystemSetupV120 === 'function') return initialSystemSetupV120();
  throw new Error('لم يتم العثور على دالة تهيئة تنفيذية: V120_initialSystemSetupImpl_');
}

function initialsystem() {
  return V120_runInitial_();
}
``
