import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type OwnerRequestDetailStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'needs_changes';

export type OwnerRequestHistoryEntry = {
  id: string;
  status: OwnerRequestDetailStatus;
  dateLabel: string;
  note?: string;
};

export type OwnerListingRequestDetail = {
  id: string;
  listingTitle: string;
  location: string;
  status: OwnerRequestDetailStatus;
  submittedAtLabel?: string;
  updatedAtLabel?: string;
  reviewNote?: string;
  history: OwnerRequestHistoryEntry[];
};

type Language = 'ar' | 'fr';

type Props = {
  request: OwnerListingRequestDetail;
  language: Language;
  onBack?: () => void;
  onEdit?: (request: OwnerListingRequestDetail) => void;
  trustedStatusSource?: boolean;
};

const copy = {
  ar: {
    heading: 'تفاصيل طلب الإقامة',
    back: 'العودة إلى الطلبات',
    edit: 'تعديل الطلب',
    status: 'الحالة الحالية',
    location: 'الموقع',
    submitted: 'تاريخ التقديم',
    updated: 'آخر تحديث',
    reviewHeading: 'ملاحظات الإدارة',
    noReview: 'لا توجد ملاحظات مراجعة مرفقة بهذا الطلب.',
    historyHeading: 'سجل متابعة الطلب',
    historyEmpty: 'لا توجد أحداث مسجلة في السجل.',
    draft: 'مسودة',
    under_review: 'قيد المراجعة',
    approved: 'مقبول',
    needs_changes: 'يتطلب تعديلات',
    event: 'تحديث الحالة',
    demo: 'هذه شاشة عرض فقط. لا تغيّر حالة الطلب ولا ترسل تعديلات أو تحفظ بيانات.',
    untrusted: 'الحالة والسجل غير مؤكدين ما لم يأتيا من مصدر موثوق.',
    trusted: 'الحالة والسجل مقدمان من مصدر موثوق.',
    staging: 'بيانات الاختبار ليست طلبات حقيقية ولا تثبت نشر الإقامة أو توفرها للحجز.',
  },
  fr: {
    heading: 'Détails de la demande',
    back: 'Retour aux demandes',
    edit: 'Modifier la demande',
    status: 'Statut actuel',
    location: 'Emplacement',
    submitted: 'Date de soumission',
    updated: 'Dernière mise à jour',
    reviewHeading: 'Remarques de l’administration',
    noReview: 'Aucune remarque de vérification n’est jointe à cette demande.',
    historyHeading: 'Historique de suivi',
    historyEmpty: 'Aucun événement enregistré dans l’historique.',
    draft: 'Brouillon',
    under_review: 'En cours de vérification',
    approved: 'Approuvée',
    needs_changes: 'Modifications requises',
    event: 'Mise à jour du statut',
    demo: 'Écran d’affichage uniquement. Il ne modifie pas le statut, n’envoie aucune modification et n’enregistre aucune donnée.',
    untrusted: 'Le statut et l’historique ne sont pas confirmés sans source fiable.',
    trusted: 'Le statut et l’historique proviennent d’une source fiable.',
    staging: 'Les données de test ne sont pas de vraies demandes et ne prouvent ni publication ni disponibilité à la réservation.',
  },
} as const;

const statusStyles: Record<
  OwnerRequestDetailStatus,
  { backgroundColor: string; color: string }
> = {
  draft: { backgroundColor: '#EEF2F7', color: '#344054' },
  under_review: { backgroundColor: '#FFF4D6', color: '#805B00' },
  approved: { backgroundColor: '#E4F5EC', color: '#176B42' },
  needs_changes: { backgroundColor: '#FDECEC', color: '#A12B2B' },
};

/**
 * Read-only owner request detail screen.
 * The parent supplies the request and history. No backend calls or mutations.
 */
export default function OwnerListingRequestDetails({
  request,
  language,
  onBack,
  onEdit,
  trustedStatusSource = false,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const statusStyle = statusStyles[request.status];
  const canEdit = request.status === 'draft' || request.status === 'needs_changes';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingBlock}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
          {request.listingTitle}
        </Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedStatusSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.status}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor, alignSelf: rtl ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{t[request.status]}</Text>
        </View>
        <InfoRow label={t.location} value={request.location} rtl={rtl} />
        {request.submittedAtLabel ? <InfoRow label={t.submitted} value={request.submittedAtLabel} rtl={rtl} /> : null}
        {request.updatedAtLabel ? <InfoRow label={t.updated} value={request.updatedAtLabel} rtl={rtl} /> : null}
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.reviewHeading}</Text>
        <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
          {request.reviewNote?.trim() || t.noReview}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.historyHeading}</Text>
        {request.history.length === 0 ? (
          <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.historyEmpty}</Text>
        ) : (
          <View style={styles.timeline}>
            {request.history.map((entry, index) => {
              const entryStyle = statusStyles[entry.status];
              const last = index === request.history.length - 1;
              return (
                <View key={entry.id} style={[styles.timelineRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                  <View style={styles.timelineRail}>
                    <View style={[styles.timelineDot, { backgroundColor: entryStyle.color }]} />
                    {!last ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t[entry.status] || t.event}
                    </Text>
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{entry.dateLabel}</Text>
                    {entry.note ? (
                      <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>{entry.note}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={[styles.actions, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        {onBack ? (
          <ActionButton label={t.back} onPress={onBack} secondary />
        ) : null}
        {onEdit && canEdit ? (
          <ActionButton label={t.edit} onPress={() => onEdit(request)} />
        ) : null}
      </View>

      <Text style={[styles.footerNote, { textAlign: rtl ? 'right' : 'left' }]}>{t.demo}</Text>
    </ScrollView>
  );
}

function InfoRow({ label, value, rtl }: { label: string; value: string; rtl: boolean }) {
  return (
    <View style={[styles.infoRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.infoValue, { textAlign: rtl ? 'left' : 'right' }]}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.secondaryButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionText, secondary && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  container: {
    gap: 14,
    padding: 16,
    paddingBottom: 28,
  },
  headingBlock: {
    gap: 6,
  },
  heading: {
    color: '#12243A',
    fontSize: 22,
    fontWeight: '800',
  },
  title: {
    color: '#344054',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
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
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 15,
  },
  sectionTitle: {
    color: '#12243A',
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoRow: {
    alignItems: 'flex-start',
    borderTopColor: '#EEF1F4',
    borderTopWidth: 1,
    gap: 12,
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  infoLabel: {
    color: '#667085',
    flex: 1,
    fontSize: 12,
  },
  infoValue: {
    color: '#344054',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  bodyText: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 21,
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    gap: 12,
    minHeight: 58,
  },
  timelineRail: {
    alignItems: 'center',
    width: 16,
  },
  timelineDot: {
    borderRadius: 6,
    height: 11,
    marginTop: 3,
    width: 11,
  },
  timelineLine: {
    backgroundColor: '#DCE3EA',
    flex: 1,
    marginVertical: 3,
    width: 2,
  },
  timelineContent: {
    flex: 1,
    gap: 4,
    paddingBottom: 16,
  },
  timelineTitle: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    color: '#667085',
    fontSize: 11,
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#12345A',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B8C7D6',
    borderWidth: 1,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryText: {
    color: '#12345A',
  },
  footerNote: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.78,
  },
});
