import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminPlatformSetting = {
  id: string;
  categoryLabel: string;
  label: string;
  value: string;
  description?: string;
  updatedAtLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  settings: AdminPlatformSetting[];
  language: Language;
  trustedAdminSource?: boolean;
  lastUpdatedLabel?: string;
};

const copy = {
  ar: {
    heading: 'إعدادات المنصة',
    subtitle: 'الاطلاع على القيم التشغيلية والمعلومات العامة التي يوفرها مصدر الإدارة',
    search: 'ابحث في اسم الإعداد أو قيمته أو تصنيفه',
    total: 'عدد الإعدادات المعروضة',
    updated: 'آخر تحديث',
    trusted: 'القيم معروضة من مصدر إداري موثوق.',
    untrusted: 'مصدر الإعدادات غير مؤكد؛ تم إخفاء جميع القيم.',
    emptyTitle: 'لا توجد إعدادات للعرض',
    emptyBody: 'ستظهر هنا الإعدادات التي يمررها مصدر إداري موثوق.',
    noResults: 'لا توجد نتائج مطابقة للبحث.',
    staging: 'تنبيه: قيم بيئة الاختبار قد تختلف عن إعدادات بيئة الإنتاج.',
    privacy: 'لا تمرّر كلمات المرور أو مفاتيح API أو رموز الوصول أو أسرار التكامل أو بيانات الاتصال الخاصة إلى هذه اللوحة.',
    readOnly: 'عرض فقط: لا يمكن تعديل الإعدادات أو حفظها أو تفعيلها من هذه الشاشة.',
    category: 'التصنيف',
    value: 'القيمة',
    lastUpdated: 'تاريخ التحديث',
  },
  fr: {
    heading: 'Paramètres de la plateforme',
    subtitle: 'Consultation des valeurs opérationnelles et des informations générales fournies par la source administrative',
    search: 'Rechercher par nom, valeur ou catégorie du paramètre',
    total: 'Nombre de paramètres affichés',
    updated: 'Dernière mise à jour',
    trusted: 'Les valeurs proviennent d’une source administrative fiable.',
    untrusted: 'La source des paramètres n’est pas confirmée ; toutes les valeurs sont masquées.',
    emptyTitle: 'Aucun paramètre à afficher',
    emptyBody: 'Les paramètres fournis par une source administrative fiable apparaîtront ici.',
    noResults: 'Aucun résultat ne correspond à la recherche.',
    staging: 'Attention : les valeurs de test peuvent différer des paramètres de production.',
    privacy: 'Ne transmettez pas de mots de passe, clés API, jetons d’accès, secrets d’intégration ou coordonnées privées à ce panneau.',
    readOnly: 'Consultation uniquement : cet écran ne permet ni de modifier, ni d’enregistrer, ni d’activer des paramètres.',
    category: 'Catégorie',
    value: 'Valeur',
    lastUpdated: 'Date de mise à jour',
  },
};

/**
 * Read-only presentation of platform settings supplied by the parent.
 * This component intentionally does not define defaults or imply that displayed
 * values are editable/runtime-effective configuration.
 * Never pass credentials, API keys, access tokens, or integration secrets.
 */
export default function AdminPlatformSettingsPanel({
  settings,
  language,
  trustedAdminSource = false,
  lastUpdatedLabel,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const [search, setSearch] = useState('');

  const visibleSettings = trustedAdminSource ? settings : [];
  const filteredSettings = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return visibleSettings;
    return visibleSettings.filter((setting) =>
      [
        setting.categoryLabel,
        setting.label,
        setting.value,
        setting.description ?? '',
      ].some((part) => part.toLocaleLowerCase().includes(term)),
    );
  }, [search, visibleSettings]);

  const groupedSettings = useMemo(() => {
    const groups = new Map<string, AdminPlatformSetting[]>();
    filteredSettings.forEach((setting) => {
      const current = groups.get(setting.categoryLabel) ?? [];
      current.push(setting);
      groups.set(setting.categoryLabel, current);
    });
    return Array.from(groups.entries());
  }, [filteredSettings]);

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
            <Text style={styles.summaryValue}>{visibleSettings.length}</Text>
            <Text style={styles.summaryLabel}>{t.total}</Text>
          </View>

          {lastUpdatedLabel ? (
            <Text style={[styles.updated, { textAlign: rtl ? 'right' : 'left' }]}>
              {t.updated}: {lastUpdatedLabel}
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

          {filteredSettings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                {visibleSettings.length === 0 ? t.emptyTitle : t.noResults}
              </Text>
              <Text style={[styles.emptyBody, { textAlign: rtl ? 'right' : 'left' }]}>
                {visibleSettings.length === 0 ? t.emptyBody : t.noResults}
              </Text>
            </View>
          ) : (
            <View style={styles.groups}>
              {groupedSettings.map(([category, items]) => (
                <View key={category} style={styles.groupCard}>
                  <Text style={[styles.groupTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                    {category}
                  </Text>
                  {items.map((setting) => (
                    <View key={setting.id} style={styles.settingItem}>
                      <Text style={[styles.settingLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                        {setting.label}
                      </Text>
                      <Text style={[styles.settingValue, { textAlign: rtl ? 'right' : 'left' }]}>
                        {setting.value}
                      </Text>
                      {setting.description ? (
                        <Text style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}>
                          {setting.description}
                        </Text>
                      ) : null}
                      {setting.updatedAtLabel ? (
                        <Text style={[styles.itemUpdated, { textAlign: rtl ? 'right' : 'left' }]}>
                          {t.lastUpdated}: {setting.updatedAtLabel}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))}
            </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
  },
  container: {
    gap: 14,
    paddingBottom: 20,
    width: '100%',
  },
  header: {
    gap: 5,
  },
  heading: {
    color: '#123B5D',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
  },
  notice: {
    backgroundColor: '#F8F5EF',
    borderColor: '#E9DCC4',
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
    borderColor: '#E9DCC4',
    borderRadius: 13,
    borderWidth: 1,
    gap: 5,
    padding: 13,
  },
  summaryValue: {
    color: '#123B5D',
    fontSize: 23,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },
  updated: {
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
  groups: {
    gap: 11,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 15,
    borderWidth: 1,
    gap: 11,
    padding: 14,
  },
  groupTitle: {
    color: '#123B5D',
    fontSize: 14,
    fontWeight: '800',
  },
  settingItem: {
    borderTopColor: '#EAECF0',
    borderTopWidth: 1,
    gap: 6,
    paddingTop: 11,
  },
  settingLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },
  settingValue: {
    color: '#123B5D',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
  },
  description: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 19,
  },
  itemUpdated: {
    color: '#98A2B3',
    fontSize: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 17,
  },
  emptyTitle: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyBody: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 19,
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
