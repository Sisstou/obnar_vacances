import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminLocationItem = {
  id: string;
  name: string;
  parentName?: string;
  typeLabel?: string;
  statusLabel?: string;
  description?: string;
  listingCount?: number;
  updatedAtLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  locations: AdminLocationItem[];
  language: Language;
  trustedAdminSource?: boolean;
  onOpenLocation?: (location: AdminLocationItem) => void;
};

const copy = {
  ar: {
    heading: 'إدارة المواقع والمناطق',
    subtitle: 'استعراض المناطق والمواقع المعتمدة في دليل البحث عن الإقامات',
    total: 'إجمالي المواقع',
    search: 'ابحث باسم الموقع أو المنطقة التابعة',
    list: 'قائمة المواقع',
    parent: 'المنطقة الرئيسية',
    type: 'نوع الموقع',
    status: 'الحالة',
    description: 'الوصف',
    listings: 'الإقامات المرتبطة',
    updated: 'آخر تحديث',
    open: 'عرض التفاصيل',
    noParent: 'غير محدد',
    noType: 'غير محدد',
    noStatus: 'غير محددة',
    noDescription: 'لا يوجد وصف.',
    noCount: 'غير متوفر',
    noDate: 'غير متوفر',
    empty: 'لا توجد مواقع مطابقة.',
    emptyAll: 'لا توجد مواقع لعرضها.',
    untrusted: 'بيانات المواقع مخفية حتى يتم تأكيد مصدر إداري موثوق.',
    trusted: 'بيانات المواقع مقدمة من مصدر إداري موثوق.',
    staging: 'إذا كانت البيانات من بيئة الاختبار، فلا تمثل بالضرورة قائمة المواقع المنشورة للمستخدمين.',
    privacy: 'تعرض هذه اللوحة أسماء المواقع والبيانات العامة فقط، ولا تعرض عناوين المالكين أو مواقعهم الخاصة.',
    readOnly: 'عرض فقط: لا تضيف مواقع ولا تعدّلها أو تحذفها ولا تغيّر حالتها. لا يتم حفظ أي تغيير.',
  },
  fr: {
    heading: 'Gestion des lieux et des zones',
    subtitle: 'Consultation des zones et lieux du catalogue de recherche des hébergements',
    total: 'Nombre total de lieux',
    search: 'Rechercher par nom ou zone parente',
    list: 'Liste des lieux',
    parent: 'Zone parente',
    type: 'Type de lieu',
    status: 'Statut',
    description: 'Description',
    listings: 'Hébergements associés',
    updated: 'Dernière mise à jour',
    open: 'Voir les détails',
    noParent: 'Non précisée',
    noType: 'Non précisé',
    noStatus: 'Non précisé',
    noDescription: 'Aucune description.',
    noCount: 'Non disponible',
    noDate: 'Non disponible',
    empty: 'Aucun lieu correspondant.',
    emptyAll: 'Aucun lieu à afficher.',
    untrusted: 'Les données des lieux sont masquées jusqu’à confirmation d’une source administrative fiable.',
    trusted: 'Les données des lieux proviennent d’une source administrative fiable.',
    staging: 'Si les données proviennent de l’environnement de test, elles ne représentent pas nécessairement le catalogue publié aux utilisateurs.',
    privacy: 'Ce panneau affiche uniquement les noms et informations publiques, jamais les adresses ou emplacements privés des propriétaires.',
    readOnly: 'Consultation uniquement : aucun ajout, modification, suppression ou changement de statut. Aucun changement n’est enregistré.',
  },
} as const;

export default function AdminLocationsPanel({
  locations,
  language,
  trustedAdminSource = false,
  onOpenLocation,
}: Props) {
  const [query, setQuery] = useState('');
  const t = copy[language];
  const rtl = language === 'ar';

  const filteredLocations = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return locations;
    return locations.filter((location) =>
      location.name.toLocaleLowerCase().includes(normalized)
      || (location.parentName || '').toLocaleLowerCase().includes(normalized)
      || (location.typeLabel || '').toLocaleLowerCase().includes(normalized),
    );
  }, [locations, query]);

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
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.trusted}</Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
      </View>

      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{locations.length}</Text>
        <Text style={styles.metricLabel}>{t.total}</Text>
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

      {filteredLocations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{locations.length === 0 ? t.emptyAll : t.empty}</Text>
        </View>
      ) : (
        <View style={styles.cards}>
          {filteredLocations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={[styles.cardHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <View style={styles.titleBlock}>
                  <Text style={[styles.locationName, { textAlign: rtl ? 'right' : 'left' }]}>
                    {location.name}
                  </Text>
                  {location.parentName ? (
                    <Text style={[styles.parentName, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.parent}: {location.parentName}
                    </Text>
                  ) : null}
                </View>
                {location.statusLabel ? (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{location.statusLabel}</Text>
                  </View>
                ) : null}
              </View>

              {location.typeLabel ? <Info label={t.type} value={location.typeLabel} rtl={rtl} /> : null}
              {location.description ? (
                <View style={styles.descriptionBox}>
                  <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>{t.description}</Text>
                  <Text style={[styles.descriptionText, { textAlign: rtl ? 'right' : 'left' }]}>
                    {location.description}
                  </Text>
                </View>
              ) : null}
              {typeof location.listingCount === 'number' ? (
                <Info label={t.listings} value={String(location.listingCount)} rtl={rtl} />
              ) : null}
              {location.updatedAtLabel ? <Info label={t.updated} value={location.updatedAtLabel} rtl={rtl} /> : null}

              {onOpenLocation ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.open + ': ' + location.name}
                  onPress={() => onOpenLocation(location)}
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
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    minHeight: 76,
    padding: 13,
  },
  metricValue: {
    color: '#123B5D',
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#667085',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#123B5D',
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
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
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
  locationName: {
    color: '#123B5D',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
  },
  parentName: {
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
    backgroundColor: '#F8F5EF',
    borderColor: '#E9DCC4',
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
    backgroundColor: '#123B5D',
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
    borderColor: '#E9DCC4',
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
