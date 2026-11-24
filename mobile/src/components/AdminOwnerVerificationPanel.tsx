import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type AdminOwnerVerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'needs_update';

export type AdminOwnerVerificationRequest = {
  id: string;
  ownerDisplayName: string;
  publicArea?: string;
  status: AdminOwnerVerificationStatus;
  submittedAtLabel?: string;
  updatedAtLabel?: string;
  documentTypeLabel?: string;
  documentUploadedAtLabel?: string;
  documentCount?: number;
  reviewNote?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  requests: AdminOwnerVerificationRequest[];
  language: Language;
  trustedAdminSource?: boolean;
  onOpenVerification?: (request: AdminOwnerVerificationRequest) => void;
};

const copy = {
  ar: {
    heading: 'التحقق من هوية المالكين',
    subtitle: 'متابعة طلبات التحقق وحالة المستندات دون عرض الملفات الحساسة',
    total: 'إجمالي الطلبات',
    pending: 'قيد المراجعة',
    verified: 'تم التحقق',
    needs_update: 'يتطلب استكمالاً',
    not_submitted: 'لم يُقدّم',
    submitted: 'تاريخ التقديم',
    updated: 'آخر تحديث',
    area: 'المنطقة العامة',
    document: 'بيانات المستند',
    documentType: 'نوع المستند',
    uploadedAt: 'تاريخ رفع المستند',
    documentCount: 'عدد الملفات',
    reviewNote: 'ملاحظة المراجعة',
    noDocument: 'لا توجد بيانات وصفية للمستند.',
    noNote: 'لا توجد ملاحظة مرفقة.',
    open: 'عرض تفاصيل الطلب',
    emptyTitle: 'لا توجد طلبات تحقق',
    emptyBody: 'ستظهر هنا الطلبات التي يمررها مصدر الإدارة الموثوق.',
    trusted: 'بيانات الطلبات مقدمة من مصدر إدارة موثوق.',
    untrusted: 'المصدر غير موثوق؛ تم إخفاء بيانات الطلبات والإحصائيات.',
    privacy: 'حماية الخصوصية: لا تعرض هذه اللوحة صور الهوية أو روابط الملفات أو مسارات التخزين أو أرقام الوثائق. افتح الملفات فقط عبر مسار مراجعة إداري آمن ومصرّح به.',
    staging: 'بيانات الاختبار لا تمثل طلبات حقيقية ولا تثبت هوية أي مستخدم.',
    readOnly: 'واجهة عرض فقط؛ لا تقبل الطلبات أو ترفضها أو تطلب استكمالاً ولا تغيّر حالة التحقق.',
    hidden: 'البيانات مخفية إلى حين تأكيد مصدر الإدارة.',
  },
  fr: {
    heading: 'Vérification des propriétaires',
    subtitle: 'Suivi des demandes sans afficher les documents sensibles',
    total: 'Total des demandes',
    pending: 'En cours de vérification',
    verified: 'Vérifié',
    needs_update: 'Complément requis',
    not_submitted: 'Non soumis',
    submitted: 'Date de soumission',
    updated: 'Dernière mise à jour',
    area: 'Zone générale',
    document: 'Métadonnées du document',
    documentType: 'Type de document',
    uploadedAt: 'Date de dépôt',
    documentCount: 'Nombre de fichiers',
    reviewNote: 'Remarque de vérification',
    noDocument: 'Aucune métadonnée de document fournie.',
    noNote: 'Aucune remarque fournie.',
    open: 'Voir les détails',
    emptyTitle: 'Aucune demande de vérification',
    emptyBody: 'Les demandes fournies par une source d’administration fiable apparaîtront ici.',
    trusted: 'Les demandes proviennent d’une source d’administration fiable.',
    untrusted: 'La source n’est pas fiable ; les demandes et statistiques sont masquées.',
    privacy: 'Protection de la vie privée : ce panneau n’affiche ni images d’identité, ni liens de fichiers, ni chemins de stockage, ni numéros de documents. Consultez les fichiers uniquement via un parcours administratif sécurisé et autorisé.',
    staging: 'Les données de test ne représentent pas de vraies demandes et ne prouvent l’identité d’aucun utilisateur.',
    readOnly: 'Affichage uniquement ; aucune approbation, aucun refus, aucune demande de complément et aucun changement de statut.',
    hidden: 'Les données sont masquées jusqu’à confirmation de la source administrative.',
  },
} as const;

const statusStyles: Record<
  AdminOwnerVerificationStatus,
  { backgroundColor: string; color: string }
> = {
  not_submitted: { backgroundColor: '#EEF2F7', color: '#344054' },
  pending: { backgroundColor: '#FFF4D6', color: '#805B00' },
  verified: { backgroundColor: '#E4F5EC', color: '#176B42' },
  needs_update: { backgroundColor: '#FDECEC', color: '#A12B2B' },
};

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

/**
 * Read-only administrative owner-verification queue.
 * The parent must map trusted backend records into this presentation model.
 * Document paths, URLs, identity images, and private identifiers are deliberately
 * excluded. No fetching, storage access, approval, rejection, or persistence.
 */
export default function AdminOwnerVerificationPanel({
  requests,
  language,
  trustedAdminSource = false,
  onOpenVerification,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const visibleRequests = trustedAdminSource ? requests : [];
  const count = (status: AdminOwnerVerificationStatus) =>
    visibleRequests.filter((request) => request.status === status).length;

  return (
    <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={styles.headingBlock}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.subtitle}
        </Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedAdminSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      {trustedAdminSource ? (
        <>
          <View style={styles.metricsGrid}>
            <Metric label={t.total} value={visibleRequests.length} />
            <Metric label={t.pending} value={count('pending')} />
            <Metric label={t.verified} value={count('verified')} />
            <Metric label={t.needs_update} value={count('needs_update')} />
          </View>

          {visibleRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.emptyTitle}
              </Text>
              <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.emptyBody}
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {visibleRequests.map((request) => {
                const statusStyle = statusStyles[request.status];
                return (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.cardTop}>
                      <View style={styles.titleBlock}>
                        <Text
                          numberOfLines={2}
                          style={[styles.ownerName, { textAlign: rtl ? 'right' : 'left' }]}
                        >
                          {request.ownerDisplayName}
                        </Text>
                        {request.publicArea ? (
                          <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                            {t.area}: {request.publicArea}
                          </Text>
                        ) : null}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>
                          {t[request.status]}
                        </Text>
                      </View>
                    </View>

                    {request.submittedAtLabel ? (
                      <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.submitted}: {request.submittedAtLabel}
                      </Text>
                    ) : null}
                    {request.updatedAtLabel ? (
                      <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.updated}: {request.updatedAtLabel}
                      </Text>
                    ) : null}

                    <View style={styles.documentBox}>
                      <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.document}
                      </Text>
                      {request.documentTypeLabel ? (
                        <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                          {t.documentType}: {request.documentTypeLabel}
                        </Text>
                      ) : null}
                      {request.documentUploadedAtLabel ? (
                        <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                          {t.uploadedAt}: {request.documentUploadedAtLabel}
                        </Text>
                      ) : null}
                      {typeof request.documentCount === 'number' ? (
                        <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                          {t.documentCount}: {request.documentCount}
                        </Text>
                      ) : null}
                      {!request.documentTypeLabel &&
                      !request.documentUploadedAtLabel &&
                      typeof request.documentCount !== 'number' ? (
                        <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                          {t.noDocument}
                        </Text>
                      ) : null}
                    </View>

                    {request.reviewNote ? (
                      <View style={styles.reviewBox}>
                        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                          {t.reviewNote}
                        </Text>
                        <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                          {request.reviewNote}
                        </Text>
                      </View>
                    ) : null}

                    {onOpenVerification ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t.open + ': ' + request.ownerDisplayName}
                        onPress={() => onOpenVerification(request)}
                        style={({ pressed }) => [
                          styles.openButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.openButtonText}>{t.open}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {t.hidden}
          </Text>
        </View>
      )}

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.privacy}
        </Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.readOnly}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    width: '100%',
  },
  headingBlock: {
    gap: 5,
  },
  heading: {
    color: '#12243A',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
  },
  notice: {
    backgroundColor: '#F2F6FA',
    borderColor: '#DCE6EF',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  noticeText: {
    color: '#475467',
    fontSize: 11,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 13,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 5,
    minWidth: 125,
    padding: 12,
  },
  metricValue: {
    color: '#12345A',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    gap: 12,
    paddingBottom: 4,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 11,
    padding: 14,
  },
  cardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: 5,
  },
  ownerName: {
    color: '#12243A',
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  documentBox: {
    backgroundColor: '#F7F9FC',
    borderRadius: 11,
    gap: 6,
    padding: 11,
  },
  sectionTitle: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '800',
  },
  bodyText: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 19,
  },
  reviewBox: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 11,
    borderWidth: 1,
    gap: 6,
    padding: 11,
  },
  openButton: {
    alignItems: 'center',
    backgroundColor: '#12345A',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 16,
  },
  emptyTitle: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '800',
  },
  privacyNotice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  footer: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 18,
  },
});
