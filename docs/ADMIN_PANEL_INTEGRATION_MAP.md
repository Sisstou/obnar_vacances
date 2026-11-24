# خريطة ربط لوحات الإدارة — OBNAR VACANCES

- الفرع المستهدف: `mobile-app`
- مرجع المراجعة: `97e8d89daf96ae8b83f6ca32fbd081f59ccbb661`
- النطاق: توثيق ربط واجهات الإدارة فقط؛ لا ينفّذ هذا الملف أي ربط أو صلاحيات أو عمليات خلفية.
- اللغة: واجهات اللوحات تدعم `ar` و`fr`.

## 1. قواعد الربط العامة

1. يجب على المكوّن الأب التحقق من جلسة المدير وصلاحيته على الخادم قبل جلب أي بيانات إدارية أو عرض أي لوحة. إظهار عنصر في القائمة أو إخفاؤه ليس آلية صلاحيات.
2. الخاصية `trustedAdminSource` هي إشارة عرض تتحكم في إظهار البيانات داخل الواجهة؛ ليست إثبات هوية أو صلاحية، ولا يجوز تعيينها إلى `true` لمجرد أن البيانات جاءت من التطبيق أو من Supabase. لا تُمرّر `true` إلا بعد تحقق الخادم من مصدر البيانات ونطاق الصلاحية.
3. كل بيانات اللوحات يجب أن تكون من مصدر إداري إنتاجي مصرح به، مع أقل قدر لازم من البيانات، وتنقية الحقول الحساسة قبل تمريرها إلى React Native.
4. بيانات staging والبيانات التجريبية لا تمثل مستخدمين أو إقامات أو حجوزات أو معاملات حقيقية. لا تُعرض للزوار، ولا تُستخدم لإنتاج مؤشرات تشغيلية أو مالية على أنها حقيقية.
5. هذه اللوحات مصممة للعرض والبحث والتنقل إلى التفاصيل. وجود callback مثل `onOpen...` لا يعني أن المكوّن ينفّذ إجراءً إدارياً؛ هو فقط يطلب من الأب فتح شاشة التفاصيل.
6. لا يُسمح بتمرير كلمات المرور، رموز الوصول أو التحقق، مفاتيح API، أسرار التكامل، روابط التخزين الخاصة، وثائق الهوية، بيانات البطاقات، عناوين IP، الموقع الدقيق أو رموز الجلسات إلى لوحات العرض.
7. عند غياب مصدر موثوق، أبقِ `trustedAdminSource` على `false`، ومرّر مجموعات فارغة عند الحاجة إلى props المطلوبة. لا تملأها ببيانات وهمية.
8. لا تُستنتج حالات الطلبات أو تصنيفاتها أو التواريخ أو المبالغ داخل الواجهة. تمرّر القيم والتسميات الموثقة من المصدر المعتمد.

## 2. قائمة الربط حسب panelId

| panelId | ملف المكوّن | Props المطلوبة / الاختيارية كما في المصدر | طبيعة الواجهة |
|---|---|---|---|
| `users` | `AdminUsersPanel.tsx` | `users: AdminUserAccount[]`, `language`, `trustedAdminSource?`, `onOpenUser?` | عرض حسابات وتنقل إلى تفاصيل الحساب؛ لا تغيير للأدوار أو تعطيل الحساب |
| `owner-verification` | `AdminOwnerVerificationPanel.tsx` | `requests: AdminOwnerVerificationRequest[]`, `language`, `trustedAdminSource?`, `onOpenVerification?` | عرض بيانات وصفية فقط؛ فتح التفاصيل عبر الأب. مراجعة الوثائق أو اعتماد الهوية يتطلب مساراً منفصلاً وآمناً |
| `listing-review` | `AdminListingReviewPanel.tsx` | `requests: AdminListingReviewItem[]`, `language`, `reportingPeriodLabel?`, `trustedAdminSource?`, `onOpenRequest?` | عرض طلبات الإقامات والتنقل للتفاصيل فقط؛ القبول والرفض وطلب التعديلات غير منفذة هنا |
| `locations` | `AdminLocationsPanel.tsx` | `locations: AdminLocationItem[]`, `language`, `trustedAdminSource?`, `onOpenLocation?` | عرض مواقع ومناطق عامة؛ لا إضافة أو تعديل أو حذف |
| `local-directory` | `AdminLocalDirectoryPanel.tsx` | `items: AdminLocalDirectoryItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?`, `onOpenItem?` | عرض إدراجات الدليل العام والتنقل للتفاصيل؛ لا نشر أو تعديل |
| `local-directory-requests` | `AdminLocalDirectoryRequestsPanel.tsx` | `requests: AdminLocalDirectoryRequest[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?`, `onOpenRequest?` | عرض الطلبات والتنقل للتفاصيل فقط؛ لا قبول أو رفض أو طلب تعديل |
| `bookings` | لا يوجد حالياً | لا توجد Props أو لوحة مرتبطة؛ عنصر القائمة يحمل `componentFile: ''` | **Placeholder فقط**. لا تُنشأ بيانات أو لوحة افتراضية. ربط الحجوزات يتطلب تصميم شاشة ومصدر إنتاجي وصلاحيات ومسار أعمال مستقل |
| `complaints` | `AdminComplaintsPanel.tsx` | `complaints: AdminComplaintItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?`, `onOpenComplaint?` | عرض الشكاوى والتنقل للتفاصيل فقط؛ لا تغيير حالة أو رد أو إشعار أو حذف |
| `reviews` | `AdminReviewsPanel.tsx` | `reviews: AdminReviewItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?`, `onOpenReview?` | عرض التقييمات والتنقل للتفاصيل فقط؛ لا إخفاء أو حذف أو رد أو تعديل |
| `notifications` | `AdminNotificationsPanel.tsx` | `notifications: AdminNotificationItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?`, `onOpenNotification?` | عرض الإشعارات والتنقل للتفاصيل؛ لا إرسال أو إعادة إرسال أو حذف أو تغيير حالة |
| `financial-overview` | `AdminFinancialOverviewPanel.tsx` | `owners: AdminOwnerFinancialSummary[]`, `language`, `reportingPeriodLabel: string`, `trustedAdminSource?` | عرض مؤشرات مالية مجمعة؛ لا تحصيل أو دفع أو تسوية أو تعديل معاملات |
| `activity-log` | `AdminActivityLogPanel.tsx` | `activities: AdminActivityLogItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?`, `onOpenActivity?` | سجل إداري للقراءة والتنقل فقط؛ لا تعديل للسجل |
| `user-activity-log` | `AdminUserActivityLogPanel.tsx` | `activities: AdminUserActivityItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?` | سجل نشاط المستخدمين للقراءة فقط؛ لا إجراءات على الحسابات |
| `backup-history` | `AdminBackupHistoryPanel.tsx` | `backups: AdminBackupRecord[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?`, `lastUpdatedLabel?` | عرض سجل النسخ فقط؛ لا إنشاء أو تنزيل أو حذف أو استعادة |
| `release-history` | `AdminReleaseHistoryPanel.tsx` | `language`, `currentVersion?`, `currentVersionStatusLabel?`, `releases: AdminReleaseEntry[]`, `trustedAdminSource?`, `lastUpdatedLabel?` | عرض سجل الإصدارات فقط؛ لا رفع ملفات أو نشر أو تثبيت تحديث |
| `data-requests` | `AdminDataRequestsPanel.tsx` | `requests: AdminDataRequestItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?` | عرض طلبات البيانات فقط؛ لا تصدير أو حذف أو تنفيذ طلب |
| `privacy-requests` | `AdminPrivacyRequestsPanel.tsx` | `requests: AdminPrivacyRequestItem[]`, `language`, `trustedAdminSource?`, `lastUpdatedLabel?` | عرض طلبات الخصوصية فقط؛ لا حذف بيانات أو تغيير احتفاظ أو اتخاذ قرار |
| `privacy-retention` | `AdminPrivacyRetentionPanel.tsx` | `policies: AdminPrivacyPolicyItem[]`, `retentionRules: AdminRetentionRuleItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?` | عرض السياسات والقواعد الموثقة فقط؛ لا تطبيق أو تعديل سياسة |
| `consent-history` | `AdminConsentHistoryPanel.tsx` | `records: AdminConsentRecord[]`, `documentVersions: AdminLegalDocumentVersion[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?` | عرض أدلة الموافقة وإصدارات الوثائق فقط؛ لا إنشاء موافقة |
| `legal-changes` | `AdminLegalChangesPanel.tsx` | `changes: AdminLegalChangeItem[]`, `language`, `trustedAdminSource?`, `lastUpdatedLabel?` | عرض سجل تغييرات الوثائق؛ لا تحديد صلاحية قانونية أو احتساب فروق قانونية |
| `public-info` | `AdminPublicInfoPanel.tsx` | `language`, `trustedAdminSource?`, `platformName?`, `publicDescription?`, `serviceArea?`, `supportedLanguages?`, `contactChannels?`, `officialLinks?`, `lastUpdatedLabel?` | معاينة معلومات عامة معتمدة فقط؛ لا تعديل أو نشر |
| `platform-settings` | `AdminPlatformSettingsPanel.tsx` | `settings: AdminPlatformSetting[]`, `language`, `trustedAdminSource?`, `lastUpdatedLabel?` | عرض قيم منقحة فقط؛ يمنع تمرير الأسرار، ولا تعديل أو تفعيل |
| `security-overview` | `AdminSecurityOverviewPanel.tsx` | `controls: AdminSecurityControlItem[]`, `verifications: AdminAccountVerificationItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?` | ملخص أمني للقراءة فقط؛ لا يغيّر إعدادات المصادقة أو التحقق |
| `system-health` | `AdminSystemHealthPanel.tsx` | `services: AdminServiceHealthItem[]`, `incidents: AdminSystemIncident[]`, `language`, `trustedAdminSource?`, `overallStatus?`, `lastCheckedLabel?` | عرض مؤشرات وحوادث موثقة؛ لا فحص مباشر أو إعادة تشغيل أو إصلاح |
| `error-log` | `AdminErrorLogPanel.tsx` | `errors: AdminTechnicalErrorItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?` | عرض أخطاء منقحة فقط؛ لا Stack Traces حساسة أو إصلاح أو إعادة محاولة |
| `user-sessions` | `AdminUserSessionsPanel.tsx` | `sessions: AdminUserSessionItem[]`, `language`, `trustedAdminSource?`, `reportingPeriodLabel?` | عرض جلسات منقحة فقط؛ لا رموز جلسات أو إنهاء جلسات أو إدارة مصادقة |

## 3. مكوّنات التفاصيل — ليست عناصر تنقل مستقلة

| المكوّن | Props | طريقة الاستخدام |
|---|---|---|
| `AdminLocalDirectoryRequestDetails.tsx` | `request: AdminLocalDirectoryRequestDetail`, `language`, `trustedAdminSource?`, `onBack?` | يفتح من `local-directory-requests` عبر callback في الأب؛ للعرض فقط ولا يغيّر حالة الطلب |
| `AdminNotificationDetails.tsx` | `notification: AdminNotificationDetail`, `language`, `trustedAdminSource?`, `onBack?` | يفتح من `notifications` عبر callback في الأب؛ للعرض فقط ولا يرسل أو يحذف الإشعار |

تفاصيل الشكاوى والمستخدمين والتقييمات وطلبات الإقامات والتحقق من المالكين لها callbacks لفتح التفاصيل، لكن هذه القائمة لا تثبت وجود مكوّن تفاصيل مقابل لكل منها. يجب التحقق من وجود شاشة التفاصيل وواجهتها قبل محاولة الربط؛ لا تفترض أسماء ملفات أو Props.

## 4. تقسيم مصادر البيانات المقترح

هذا تقسيم مسؤوليات على مستوى التطبيق، وليس وصفاً لجداول مؤكدة أو استعلامات جاهزة:

- **الحسابات والتحقق:** مصدر إداري مصرح به يعيد حقول عرض مختصرة ومخفية الهوية عند الحاجة. لا تمرّر مستندات الهوية أو روابطها إلى اللوحات العامة.
- **الإقامات والمواقع والدليل المحلي:** مصدر إنتاجي منشور ومراجع. افصل طلبات الإدراج عن العناصر المنشورة، ولا تخلط بين حالة الطلب وحالة النشر.
- **الشكاوى والتقييمات والإشعارات:** بيانات إنتاجية مع تقليل بيانات صاحب البلاغ/التقييم، مع callbacks تنقل فقط.
- **المالية:** مصدر تجميعي موثوق، مع تحديد الفترة والعملة وتعريفات المؤشرات. لا تعرض الحجوزات التجريبية كحجم أعمال أو دخل فعلي.
- **السجلات والنسخ والإصدارات:** مصدر سجلات موثق ومنقح. لا تكشف البنية الداخلية أو تفاصيل الاستعادة أو أسرار النشر.
- **الخصوصية والامتثال:** مصدر موثق للموافقات والطلبات والسياسات؛ لا تنفّذ عمليات حذف أو تصدير أو تغيير مدد الاحتفاظ من هذه اللوحات.
- **الأمان وصحة النظام:** مؤشرات آمنة للعرض فقط، مع حجب تفاصيل البنية الحساسة وأسرار التشغيل.

## 5. ضوابط مالية وتشغيلية خاصة بالمشروع

- العمولة المعتمدة في منطق العمل: 500 دج لكل ليلة مدفوعة بالكامل.
- في حالة عدم الحضور مع احتفاظ المالك بعربون ليلة واحدة، تكون العمولة المستحقة للمنصة 500 دج، وتتم التسوية يدوياً.
- إذا دفع الضيف كامل مدة الحجز وغادر مبكراً دون استرداد، تُحسب العمولة على كامل الليالي المدفوعة.
- إذا ألغى المالك الحجز واسترد الضيف كامل المبلغ، فلا تُحتسب عمولة على الحجز الملغى.
- لا يوجد تحصيل أو دفع إلكتروني داخل التطبيق في المرحلة الحالية.
- لوحة `financial-overview` للعرض التجميعي فقط، ويجب أن توضّح أن المقبوضات والعمولات ليست أرباحاً صافية ولا كشفاً محاسبياً نهائياً.

## 6. شروط ما قبل ربط أي لوحة

- [ ] تأكيد أن حساب المدير وصلاحيته تم التحقق منهما على الخادم.
- [ ] تحديد مصدر إنتاجي معتمد لكل مجموعة بيانات، مع رفض بيانات staging.
- [ ] كتابة عقد بيانات typed لكل لوحة ومراجعته مقابل أنواع TypeScript الفعلية.
- [ ] تحديد سياسة تقليل البيانات والحقول الحساسة لكل مصدر.
- [ ] تمرير `trustedAdminSource={true}` فقط بعد التحقق الفعلي من المصدر والصلاحية.
- [ ] تعريف سلوك التحميل والخطأ والفراغ دون اختلاق بيانات.
- [ ] توثيق callbacks كتنقل فقط، وفصل أي إجراء إداري حساس في مسار خلفي مستقل مع تدقيق وتأكيد.
- [ ] عدم تعديل `mobile/App.tsx` دون تنسيق صريح مع مسار العمل الآخر.
- [ ] عدم إجراء تغييرات على Supabase أو SQL أو RLS أو Storage أو Edge Functions ضمن مهمة ربط الواجهات هذه.

## 7. حدود هذه الوثيقة

هذه خريطة واجهات مبنية على تعريفات Props الحالية في ملفات المكونات وعلى معرّفات التنقل في `AdminNavigationShell.tsx`. لا تعني أن أي لوحة موصولة فعلياً بمصدر بيانات أو أن عمليات الإدارة تعمل. لا تثبت وجود Backend endpoint أو جدول أو سياسة صلاحيات لكل لوحة. يجب تنفيذ مراجعة منفصلة للمخطط ومصادر البيانات والأمان قبل أي تكامل تشغيلي.
