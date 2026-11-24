import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminActivityLogItem = {
  id: string;
  actionLabel: string;
  actorLabel?: string;
  targetLabel?: string;
  categoryLabel?: string;
  occurredAtLabel: string;
  summary?: string;
  resultLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  activities: AdminActivityLogItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
  onOpenActivity?: (activity: AdminActivityLogItem) => void;
};

const copy = {
  ar: {
    heading: 'سجل النشاطات الإدارية',
    subtitle: 'متابعة العمليات الإدارية المسجلة والرجوع إلى تفاصيلها',
    search: 'ابحث في الإجراء أو المسؤول أو العنصر المرتبط',
    total: 'عدد النشاطات',
    period: 'الفترة',
    action: 'الإجراء',
    actor: 'المسؤول',
    target: 'العنصر المرتبط',
    category: 'التصنيف',
    occurredAt: 'تاريخ ووقت النشاط',
    summary: 'التفاصيل',
    result: 'النتيجة المسجلة',
    open: 'عرض التفاصيل',
    emptyTitle: 'لا توجد نشاطات للعرض',
    emptyBody: 'ستظهر هنا السجلات التي يمررها مصدر إداري موثوق.',
    noActor: 'غير محدد',
    noTarget: 'غير محدد',
    noCategory: 'غير مصنف',
    trusted: 'السجلات مقدمة من مصدر إداري موثوق.',
    untrusted: 'مصدر السجلات غير مؤكد؛ تم إخفاء النشاطات.',
    privacy: 'الخصوصية: لا تعرض هذه اللوحة كلمات المرور أو رموز التحقق أو بيانات البطاقات أو مستندات الهوية أو بيانات الاتصال الخاصة. مرّر أقل قدر لازم من البيانات.',
    staging: 'سجلات الاختبار لا تمثل بالضرورة نشاطات إنتاجية حقيقية.',
    readOnly: 'عرض فقط: لا تنشئ سجلات ولا تعدّلها أو تحذفها، ولا تنفذ أي إجراء إداري من هذه الواجهة.',
  },
  fr: {
    heading: 'Journal des activités administratives',
    subtitle: 'Suivi des opérations administratives enregistrées et consultation de leurs détails',
    search: 'Rechercher une action, un administrateur ou un élément associé',
    total: 'Nombre d’activités',
    period: 'Période',
    action: 'Action',
    actor: 'Administrateur',
    target: 'Élément associé',
    category: 'Catégorie',
    occurredAt: 'Date et heure',
    summary: 'Détails',
    result: 'Résultat enregistré',
    open: 'Voir les détails',
    emptyTitle: 'Aucune activité à afficher',
    emptyBody: 'Les journaux fournis par une source administrative fiable apparaîtront ici.',
    noActor: 'Non précisé',
    noTarget: 'Non précisé',
    noCategory: 'Non classé',
    trusted: 'Les journaux proviennent d’une source administrative fiable.',
    untrusted: 'La source des journaux n’est pas confirmée ; les activités sont masquées.',
    privacy: 'Confidentialité : ce panneau n’affiche ni mots de passe, ni codes de vérification, ni données de carte, ni pièces d’identité, ni coordonnées privées. Ne transmettez que les données strictement nécessaires.',
    staging: 'Les journaux de test ne représentent pas nécessairement des activités réelles en production.',
    readOnly: 'Consultation uniquement : aucun journal n’est créé, modifié ou supprimé et aucune opération administrative ne peut être exécutée depuis cette interface.',
  },
};

/**
 * Read-only presentation of administrative activity records.
 * Field names are UI-level props, not assertions about the database schema.
 * No assumed action/status taxonomy, network access, persistence, or mutations.
 */
export default function AdminActivityLogPanel({
  activities,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
  onOpenActivity,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const [search, setSearch] = useState('');

  const visibleActivities = trustedAdminSource ? activities : [];
  const filteredActivities = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleActivities;
    return visibleActivities.filter((activity) =>
      [
        activity.actionLabel,
        activity.actorLabel ?? '',
        activity.targetLabel ?? '',
        activity.categoryLabel ?? '',
        activity.summary ?? '',
        activity.resultLabel ?? '',
      ].some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleActivities]);

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
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{visibleActivities.length}</Text>
            <Text style={styles.summaryLabel}>{t.total}</Text>
          </View>

          {reportingPeriodLabel ? (
            <Text style={[styles.period, { textAlign: rtl ? 'right' : 'left' }]}>
              {t.period}: {reportingPeriodLabel}
            </Text>
          ) : null}

          <TextInput
            accessibilityLabel={t.search}
            value={search}
            onChangeText={setSearch}
            placeholder={t.search}
            placeholderTextColor="#98A2B3"
            style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
            autoCorrect={false}
            returnKeyType="search"
          />

          {filteredActivities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.emptyTitle}
              </Text>
              <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {t.emptyBody}
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {filteredActivities.map((activity) => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.action, { textAlign: rtl ? 'right' : 'left' }]}>
                      {activity.actionLabel}
                    </Text>
                    {activity.categoryLabel ? (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{activity.categoryLabel}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={[styles.timestamp, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.occurredAt}: {activity.occurredAtLabel}
                  </Text>

                  {activity.actorLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.actor}: {activity.actorLabel}
                    </Text>
                  ) : null}

                  {activity.targetLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.target}: {activity.targetLabel}
                    </Text>
                  ) : null}

                  {activity.summary ? (
                    <View style={styles.detailBox}>
                      <Text style={[styles.detailLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                        {t.summary}
                      </Text>
                      <Text style={[styles.bodyText, { textAlign: rtl ? 'right' : 'left' }]}>
                        {activity.summary}
                      </Text>
                    </View>
                  ) : null}

                  {activity.resultLabel ? (
                    <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.result}: {activity.resultLabel}
                    </Text>
                  ) : null}

                  {onOpenActivity ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.open + ': ' + activity.actionLabel}
                      onPress={() => onOpenActivity(activity)}
                      style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.openButtonText}>{t.open}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {t.untrusted}
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
  summaryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 13,
    borderWidth: 1,
    gap: 5,
    padding: 13,
  },
  summaryValue: {
    color: '#12345A',
    fontSize: 23,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },
  period: {
    color: '#667085',
    fontSize: 11,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderRadius: 11,
    borderWidth: 1,
    color: '#344054',
    fontSize: 13,
    minHeight: 46,
    paddingHorizontal: 13,
  },
  listContent: {
    gap: 12,
    paddingBottom: 4,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 9,
    padding: 14,
  },
  cardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'space-between',
  },
  action: {
    color: '#12243A',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  categoryBadge: {
    backgroundColor: '#EEF4FA',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  categoryText: {
    color: '#315B7D',
    fontSize: 10,
    fontWeight: '700',
  },
  timestamp: {
    color: '#805B00',
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  detailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    gap: 5,
    padding: 10,
  },
  detailLabel: {
    color: '#475467',
    fontSize: 11,
    fontWeight: '800',
  },
  bodyText: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 19,
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
