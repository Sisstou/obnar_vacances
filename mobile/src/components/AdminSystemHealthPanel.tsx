import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminServiceHealthStatus = 'operational' | 'degraded' | 'outage' | 'unknown';

export type AdminServiceHealthItem = {
  id: string;
  serviceName: string;
  status: AdminServiceHealthStatus;
  checkedAtLabel?: string;
  description?: string;
  responseTimeLabel?: string;
};

export type AdminSystemIncident = {
  id: string;
  title: string;
  description?: string;
  severityLabel?: string;
  statusLabel?: string;
  occurredAtLabel: string;
  resolvedAtLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  services: AdminServiceHealthItem[];
  incidents: AdminSystemIncident[];
  language: Language;
  trustedAdminSource?: boolean;
  overallStatus?: AdminServiceHealthStatus;
  lastCheckedLabel?: string;
};

const copy = {
  ar: {
    heading: 'صحة النظام والخدمات',
    subtitle: 'مؤشرات الحالة والفحوصات وسجل الأعطال التي يوفرها مصدر إداري موثوق',
    overall: 'الحالة العامة',
    services: 'حالة الخدمات',
    incidents: 'سجل الأعطال والحوادث',
    checked: 'آخر فحص',
    serviceCount: 'الخدمات المعروضة',
    incidentCount: 'الحوادث المسجلة',
    search: 'ابحث باسم الخدمة أو وصف الحادث',
    operational: 'تعمل بشكل طبيعي',
    degraded: 'أداء متراجع',
    outage: 'انقطاع',
    unknown: 'غير محدد',
    trusted: 'المؤشرات معروضة من مصدر إداري موثوق.',
    untrusted: 'مصدر بيانات الحالة غير مؤكد؛ تم إخفاء جميع المؤشرات والتفاصيل.',
    emptyServices: 'لا توجد مؤشرات خدمات للعرض.',
    emptyIncidents: 'لا توجد حوادث مسجلة للعرض.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    response: 'زمن الاستجابة',
    lastCheck: 'وقت آخر فحص',
    occurred: 'وقت التسجيل',
    resolved: 'وقت الحل',
    severity: 'الخطورة',
    status: 'الحالة المسجلة',
    staging: 'تنبيه: بيانات بيئة الاختبار لا تمثل بالضرورة حالة بيئة الإنتاج.',
    privacy: 'لا تمرّر كلمات المرور أو مفاتيح API أو رموز الوصول أو عناوين الخوادم الداخلية أو تفاصيل أمنية حساسة إلى هذه اللوحة.',
    readOnly: 'عرض فقط: لا تنفذ فحوصات مباشرة أو إعادة تشغيل أو إصلاحاً أو تغييراً في إعدادات الخدمات.',
  },
  fr: {
    heading: 'État du système et des services',
    subtitle: 'Indicateurs, contrôles et incidents fournis par une source administrative fiable',
    overall: 'État général',
    services: 'État des services',
    incidents: 'Historique des incidents',
    checked: 'Dernier contrôle',
    serviceCount: 'Services affichés',
    incidentCount: 'Incidents enregistrés',
    search: 'Rechercher un service ou une description d’incident',
    operational: 'Opérationnel',
    degraded: 'Performances dégradées',
    outage: 'Interruption',
    unknown: 'Indéterminé',
    trusted: 'Les indicateurs proviennent d’une source administrative fiable.',
    untrusted: 'La source des états n’est pas confirmée ; tous les indicateurs et détails sont masqués.',
    emptyServices: 'Aucun indicateur de service à afficher.',
    emptyIncidents: 'Aucun incident enregistré à afficher.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    response: 'Temps de réponse',
    lastCheck: 'Dernier contrôle',
    occurred: 'Date de signalement',
    resolved: 'Date de résolution',
    severity: 'Gravité',
    status: 'État enregistré',
    staging: 'Attention : les données de test ne représentent pas nécessairement l’état de production.',
    privacy: 'Ne transmettez pas de mots de passe, clés API, jetons d’accès, adresses de serveurs internes ou détails de sécurité sensibles à ce panneau.',
    readOnly: 'Consultation uniquement : aucun contrôle en direct, redémarrage, correctif ou changement de configuration n’est exécuté.',
  },
};

const statusText = (status: AdminServiceHealthStatus, language: Language) => {
  const labels = {
    ar: { operational: 'تعمل بشكل طبيعي', degraded: 'أداء متراجع', outage: 'انقطاع', unknown: 'غير محدد' },
    fr: { operational: 'Opérationnel', degraded: 'Performances dégradées', outage: 'Interruption', unknown: 'Indéterminé' },
  };
  return labels[language][status];
};

/** Read-only presentation. All monitoring data must be supplied by a trusted parent source. */
export default function AdminSystemHealthPanel({
  services,
  incidents,
  language,
  trustedAdminSource = false,
  overallStatus = 'unknown',
  lastCheckedLabel,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const [search, setSearch] = useState('');
  const visibleServices = trustedAdminSource ? services : [];
  const visibleIncidents = trustedAdminSource ? incidents : [];

  const filteredServices = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleServices;
    return visibleServices.filter((item) =>
      [item.serviceName, item.description ?? '', item.status].some((part) =>
        part.toLocaleLowerCase().includes(term),
      ),
    );
  }, [search, visibleServices]);

  const filteredIncidents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleIncidents;
    return visibleIncidents.filter((item) =>
      [item.title, item.description ?? '', item.severityLabel ?? '', item.statusLabel ?? '']
        .some((part) => part.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleIncidents]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.subtitle}</Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedAdminSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
      </View>

      {trustedAdminSource ? (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t.overall}</Text>
            <Text style={styles.summaryValue}>{statusText(overallStatus, language)}</Text>
            {lastCheckedLabel ? (
              <Text style={styles.meta}>{t.checked}: {lastCheckedLabel}</Text>
            ) : null}
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{visibleServices.length}</Text>
              <Text style={styles.metricLabel}>{t.serviceCount}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{visibleIncidents.length}</Text>
              <Text style={styles.metricLabel}>{t.incidentCount}</Text>
            </View>
          </View>

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

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.services}</Text>
            {filteredServices.length === 0 ? (
              <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {visibleServices.length === 0 ? t.emptyServices : t.noResults}
              </Text>
            ) : filteredServices.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTitle, { textAlign: rtl ? 'right' : 'left', flex: 1 }]}>
                    {item.serviceName}
                  </Text>
                  <Text style={styles.statusPill}>{statusText(item.status, language)}</Text>
                </View>
                {item.description ? (
                  <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>{item.description}</Text>
                ) : null}
                {item.checkedAtLabel ? (
                  <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.lastCheck}: {item.checkedAtLabel}</Text>
                ) : null}
                {item.responseTimeLabel ? (
                  <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.response}: {item.responseTimeLabel}</Text>
                ) : null}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.incidents}</Text>
            {filteredIncidents.length === 0 ? (
              <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>
                {visibleIncidents.length === 0 ? t.emptyIncidents : t.noResults}
              </Text>
            ) : filteredIncidents.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <Text style={[styles.itemTitle, { textAlign: rtl ? 'right' : 'left' }]}>{item.title}</Text>
                {item.description ? (
                  <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>{item.description}</Text>
                ) : null}
                {item.severityLabel ? (
                  <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.severity}: {item.severityLabel}</Text>
                ) : null}
                {item.statusLabel ? (
                  <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.status}: {item.statusLabel}</Text>
                ) : null}
                <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.occurred}: {item.occurredAtLabel}</Text>
                {item.resolvedAtLabel ? (
                  <Text style={[styles.meta, { textAlign: rtl ? 'right' : 'left' }]}>{t.resolved}: {item.resolvedAtLabel}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.untrusted}</Text>
        </View>
      )}

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.privacy}</Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { width: '100%' },
  container: { gap: 14, paddingBottom: 20, width: '100%' },
  header: { gap: 5 },
  heading: { color: '#12243A', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 20 },
  notice: { backgroundColor: '#F2F6FA', borderColor: '#DCE6EF', borderRadius: 12, borderWidth: 1, gap: 6, padding: 12 },
  noticeText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  summaryCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 13, borderWidth: 1, gap: 6, padding: 15 },
  summaryLabel: { color: '#667085', fontSize: 11, fontWeight: '700' },
  summaryValue: { color: '#12345A', fontSize: 19, fontWeight: '800' },
  meta: { color: '#667085', fontSize: 11, lineHeight: 17 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 12, borderWidth: 1, flex: 1, gap: 4, padding: 12 },
  metricValue: { color: '#12345A', fontSize: 20, fontWeight: '800' },
  metricLabel: { color: '#667085', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  searchInput: { backgroundColor: '#FFFFFF', borderColor: '#D0D5DD', borderRadius: 11, borderWidth: 1, color: '#344054', fontSize: 13, minHeight: 46, paddingHorizontal: 13 },
  section: { gap: 10 },
  sectionTitle: { color: '#12345A', fontSize: 16, fontWeight: '800' },
  itemCard: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 13, borderWidth: 1, gap: 7, padding: 13 },
  itemHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  itemTitle: { color: '#12243A', fontSize: 14, fontWeight: '800' },
  statusPill: { backgroundColor: '#F2F6FA', borderRadius: 20, color: '#344054', fontSize: 10, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5 },
  description: { color: '#475467', fontSize: 12, lineHeight: 19 },
  emptyCard: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, padding: 17 },
  emptyText: { color: '#667085', fontSize: 12, lineHeight: 19 },
  privacyNotice: { backgroundColor: '#FFF8E8', borderColor: '#F0DDAE', borderRadius: 12, borderWidth: 1, padding: 12 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
