import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminLocalDirectoryItem = {
  id: string;
  name: string;
  categoryLabel?: string;
  providerDisplayName?: string;
  publicArea?: string;
  descriptionPreview?: string;
  statusLabel?: string;
  createdAtLabel?: string;
  updatedAtLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  items: AdminLocalDirectoryItem[];
  language: Language;
  trustedAdminSource?: boolean;
  reportingPeriodLabel?: string;
  onOpenItem?: (item: AdminLocalDirectoryItem) => void;
};

const copy = {
  ar: {
    heading: 'إدارة دليل الأنشطة والخدمات المحلية',
    subtitle: 'متابعة المحلات والحرفيين ومقدمي الخدمات المدرجين في الدليل المحلي',
    total: 'إجمالي الإدراجات',
    period: 'الفترة',
    search: 'ابحث باسم النشاط أو مقدم الخدمة أو المنطقة أو التصنيف',
    list: 'قائمة الأنشطة والخدمات',
    category: 'التصنيف',
    provider: 'مقدم الخدمة',
    area: 'المنطقة العامة',
    description: 'نبذة',
    status: 'الحالة',
    created: 'تاريخ الإرسال',
    updated: 'آخر تحديث',
    open: 'عرض التفاصيل',
    noCategory: 'غير مصنف',
    noProvider: 'غير محدد',
    noArea: 'غير محددة',
    noDescription: 'لا توجد نبذة.',
    noDate: 'غير متوفر',
    empty: 'لا توجد إدراجات مطابقة.',
    emptyAll: 'لا توجد أنشطة أو خدمات لعرضها.',
    trusted: 'البيانات مقدمة من مصدر إداري موثوق.',
    untrusted: 'مصدر البيانات غير مؤكد؛ تم إخفاء تفاصيل الدليل.',
    staging: 'بيانات الاختبار لا تمثل بالضرورة إدراجات منشورة أو خدمات متاحة فعلياً للمستخدمين.',
    privacy: 'تعرض اللوحة المعلومات العامة فقط. لا تعرض أرقام الهواتف أو البريد أو العناوين الخاصة أو وثائق مقدمي الخدمات.',
    readOnly: 'عرض فقط: لا تنشر الإدراجات ولا تقبلها أو ترفضها أو تعدّلها أو تحذفها. لا ترسل إشعارات ولا تحفظ تغييرات.',
  },
  fr: {
    heading: 'Gestion de l’annuaire des activités et services locaux',
    subtitle: 'Suivi des commerces, artisans et prestataires inscrits dans l’annuaire local',
    total: 'Total des fiches',
    period: 'Période',
    search: 'Rechercher par activité, prestataire, zone ou catégorie',
    list: 'Liste des activités et services',
    category: 'Catégorie',
    provider: 'Prestataire',
    area: 'Zone générale',
    description: 'Présentation',
    status: 'Statut',
    created: 'Date de soumission',
    updated: 'Dernière mise à jour',
    open: 'Voir les détails',
    noCategory: 'Non classé',
    noProvider: 'Non précisé',
    noArea: 'Non précisée',
    noDescription: 'Aucune présentation.',
    noDate: 'Non disponible',
    empty: 'Aucune fiche correspondante.',
    emptyAll: 'Aucune activité ou service à afficher.',
    trusted: 'Les données proviennent d’une source administrative fiable.',
    untrusted: 'La source des données n’est pas confirmée ; les détails de l’annuaire sont masqués.',
    staging: 'Les données de test ne représentent pas nécessairement des fiches publiées ou des services réellement disponibles.',
    privacy: 'Seules les informations publiques sont affichées. Aucun téléphone, e-mail, adresse privée ou document de prestataire.',
    readOnly: 'Consultation uniquement : aucune publication, approbation, refus, modification ou suppression. Aucune notification ni sauvegarde.',
  },
} as const;

/**
 * Read-only admin view for the local commerce, artisan and service directory.
 * Category and status labels are supplied by a trusted parent source rather
 * than imposing an undocumented taxonomy or moderation workflow.
 */
export default function AdminLocalDirectoryPanel({
  items,
  language,
  trustedAdminSource = false,
  reportingPeriodLabel,
  onOpenItem,
}: Props) {
  const [query, setQuery] = useState('');
  const t = copy[language];
  const rtl = language === 'ar';

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      item.name.toLocaleLowerCase().includes(normalized)
      || (item.categoryLabel || '').toLocaleLowerCase().includes(normalized)
      || (item.providerDisplayName || '').toLocaleLowerCase().includes(normalized)
      || (item.publicArea || '').toLocaleLowerCase().includes(normalized),
    );
  }, [items, query]);

  if (!trustedAdminSource) {
    return (
      <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <View style={styles.warningCard}>
          <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.untrusted}</Text>
          <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
        </View>
        <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingBlock}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.subtitle}</Text>
        {reportingPeriodLabel ? (
          <Text style={[styles.period, { textAlign: rtl ? 'right' : 'left' }]}>
            {t.period}: {reportingPeriodLabel}
          </Text>
        ) : null}
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.trusted}</Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{items.length}</Text>
        <Text style={styles.summaryLabel}>{t.total}</Text>
      </View>

      <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.list}</Text>
      <TextInput
        accessibilityLabel={t.search}
        onChangeText={setQuery}
        placeholder={t.search}
        placeholderTextColor="#98A2B3"
        returnKeyType="search"
        style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
        value={query}
      />

      {filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{items.length === 0 ? t.emptyAll : t.empty}</Text>
        </View>
      ) : (
        <View style={styles.cards}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.cardHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <View style={styles.titleBlock}>
                  <Text style={[styles.itemName, { textAlign: rtl ? 'right' : 'left' }]}>{item.name}</Text>
                  {item.categoryLabel ? (
                    <Text style={[styles.category, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.category}: {item.categoryLabel}
                    </Text>
                  ) : null}
                </View>
                {item.statusLabel ? (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.statusLabel}</Text>
                  </View>
                ) : null}
              </View>

              {item.providerDisplayName ? <Info label={t.provider} value={item.providerDisplayName} rtl={rtl} /> : null}
              {item.publicArea ? <Info label={t.area} value={item.publicArea} rtl={rtl} /> : null}
              {item.descriptionPreview ? (
                <View style={styles.descriptionBox}>
                  <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.description}</Text>
                  <Text style={[styles.descriptionText, { textAlign: rtl ? 'right' : 'left' }]}>
                    {item.descriptionPreview}
                  </Text>
                </View>
              ) : null}
              {item.createdAtLabel ? <Info label={t.created} value={item.createdAtLabel} rtl={rtl} /> : null}
              {item.updatedAtLabel ? <Info label={t.updated} value={item.updatedAtLabel} rtl={rtl} /> : null}

              {onOpenItem ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.open + ': ' + item.name}
                  onPress={() => onOpenItem(item)}
                  style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
                >
                  <Text style={styles.openButtonText}>{t.open}</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.privacy}</Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
    </ScrollView>
  );
}

function Info({ label, value, rtl }: { label: string; value: string; rtl: boolean }) {
  return (
    <View style={[styles.infoRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.infoValue, { textAlign: rtl ? 'left' : 'right' }]}>{value}</Text>
    </View>
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
  period: {
    color: '#667085',
    fontSize: 12,
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
  warningCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F1DCA8',
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 13,
  },
  warningText: {
    color: '#77520A',
    fontSize: 13,
    lineHeight: 20,
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
    padding: 15,
  },
  summaryValue: {
    color: '#12345A',
    fontSize: 26,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#12243A',
    fontSize: 17,
    fontWeight: '800',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE3EA',
    borderRadius: 11,
    borderWidth: 1,
    color: '#344054',
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 13,
  },
  cards: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 15,
    borderWidth: 1,
    gap: 11,
    padding: 13,
  },
  cardHeader: {
    alignItems: 'flex-start',
    gap: 9,
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: 5,
  },
  itemName: {
    color: '#12243A',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
  },
  category: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
  },
  statusBadge: {
    backgroundColor: '#EAF0F7',
    borderRadius: 999,
    maxWidth: 150,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statusText: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '700',
  },
  descriptionBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E5EAF0',
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
    padding: 10,
  },
  descriptionText: {
    color: '#344054',
    fontSize: 12,
    lineHeight: 19,
  },
  infoRow: {
    alignItems: 'flex-start',
    gap: 10,
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#667085',
    flex: 1,
    fontSize: 11,
  },
  infoValue: {
    color: '#344054',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  openButton: {
    alignItems: 'center',
    backgroundColor: '#12345A',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  emptyText: {
    color: '#667085',
    fontSize: 13,
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
  pressed: {
    opacity: 0.78,
  },
});
