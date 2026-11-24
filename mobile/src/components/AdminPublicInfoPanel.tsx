import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Language = 'ar' | 'fr';

export type AdminPublicContactChannel = {
  id: string;
  label: string;
  value: string;
  description?: string;
};

export type AdminPublicPlatformLink = {
  id: string;
  label: string;
  url: string;
  description?: string;
};

type Props = {
  language: Language;
  trustedAdminSource?: boolean;
  platformName?: string;
  publicDescription?: string;
  serviceArea?: string;
  supportedLanguages?: string[];
  contactChannels?: AdminPublicContactChannel[];
  officialLinks?: AdminPublicPlatformLink[];
  lastUpdatedLabel?: string;
};

const copy = {
  ar: {
    heading: 'معلومات المنصة العامة',
    subtitle: 'مراجعة المعلومات التعريفية ووسائل التواصل والروابط التي يعتمدها مصدر الإدارة',
    brand: 'اسم المنصة',
    description: 'نبذة تعريفية',
    area: 'نطاق الخدمة',
    languages: 'لغات الواجهة',
    contacts: 'قنوات التواصل العامة',
    links: 'الروابط الرسمية',
    updated: 'آخر تحديث',
    trusted: 'المعلومات معروضة من مصدر إداري موثوق.',
    untrusted: 'مصدر المعلومات غير مؤكد؛ تم إخفاء التفاصيل.',
    empty: 'لا توجد معلومات إضافية معتمدة للعرض.',
    noContacts: 'لم تُحدد قنوات تواصل عامة موثقة.',
    noLinks: 'لم تُحدد روابط رسمية موثقة.',
    staging: 'تنبيه: هذه معاينة لبيانات بيئة الاختبار، ولا تعني أن المعلومات منشورة للعموم.',
    privacy: 'اعرض فقط وسائل التواصل المخصصة للنشر العام. لا تضع أرقاماً شخصية أو عناوين خاصة أو بيانات دخول أو أسراراً تقنية.',
    readOnly: 'هذه الشاشة للعرض فقط؛ لا تعدّل بيانات المنصة ولا تحفظها ولا تنشرها.',
  },
  fr: {
    heading: 'Informations publiques de la plateforme',
    subtitle: 'Vérification des informations d’identification, des contacts et des liens fournis par la source administrative',
    brand: 'Nom de la plateforme',
    description: 'Présentation',
    area: 'Zone de service',
    languages: 'Langues de l’interface',
    contacts: 'Canaux de contact publics',
    links: 'Liens officiels',
    updated: 'Dernière mise à jour',
    trusted: 'Les informations proviennent d’une source administrative fiable.',
    untrusted: 'La source des informations n’est pas confirmée ; les détails sont masqués.',
    empty: 'Aucune information supplémentaire approuvée à afficher.',
    noContacts: 'Aucun canal de contact public vérifié n’a été fourni.',
    noLinks: 'Aucun lien officiel vérifié n’a été fourni.',
    staging: 'Attention : ceci est un aperçu des données de test et ne signifie pas que ces informations sont publiées.',
    privacy: 'N’affichez que les moyens de contact destinés au public. N’ajoutez ni numéro personnel, ni adresse privée, ni identifiant ou secret technique.',
    readOnly: 'Cet écran est en lecture seule ; il ne modifie, n’enregistre et ne publie aucune information.',
  },
};

function InfoCard({
  label,
  value,
  rtl,
}: {
  label: string;
  value?: string;
  rtl: boolean;
}) {
  if (!value?.trim()) return null;
  return (
    <View style={styles.infoCard}>
      <Text style={[styles.label, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.value, { textAlign: rtl ? 'right' : 'left' }]}>{value}</Text>
    </View>
  );
}

/**
 * Read-only admin preview of public-facing platform information.
 * Brand name and service scope have documented project values; optional contacts
 * and URLs must be supplied by a trusted parent source and are never invented here.
 * Do not pass private contact details, credentials, tokens, or technical secrets.
 */
export default function AdminPublicInfoPanel({
  language,
  trustedAdminSource = false,
  platformName = 'OBNAR VACANCES',
  publicDescription,
  serviceArea = 'Ouled Bounar et la wilaya de Jijel',
  supportedLanguages = ['العربية', 'Français'],
  contactChannels = [],
  officialLinks = [],
  lastUpdatedLabel,
}: Props) {
  const rtl = language === 'ar';
  const t = copy[language];
  const visible = trustedAdminSource;

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
          {visible ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      {visible ? (
        <>
          <View style={styles.brandCard}>
            <Text style={[styles.brandEyebrow, { textAlign: rtl ? 'right' : 'left' }]}>{t.brand}</Text>
            <Text style={[styles.brandName, { textAlign: rtl ? 'right' : 'left' }]}>{platformName}</Text>
          </View>

          <InfoCard label={t.description} value={publicDescription} rtl={rtl} />
          <InfoCard label={t.area} value={serviceArea} rtl={rtl} />
          <InfoCard
            label={t.languages}
            value={supportedLanguages.filter(Boolean).join(rtl ? '، ' : ' · ')}
            rtl={rtl}
          />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.contacts}</Text>
            {contactChannels.length === 0 ? (
              <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.noContacts}</Text>
            ) : (
              contactChannels.map((channel) => (
                <View key={channel.id} style={styles.item}>
                  <Text style={[styles.itemLabel, { textAlign: rtl ? 'right' : 'left' }]}>{channel.label}</Text>
                  <Text style={[styles.itemValue, { textAlign: rtl ? 'right' : 'left' }]}>{channel.value}</Text>
                  {channel.description ? (
                    <Text style={[styles.itemDescription, { textAlign: rtl ? 'right' : 'left' }]}>
                      {channel.description}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.links}</Text>
            {officialLinks.length === 0 ? (
              <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.noLinks}</Text>
            ) : (
              officialLinks.map((link) => (
                <View key={link.id} style={styles.item}>
                  <Text style={[styles.itemLabel, { textAlign: rtl ? 'right' : 'left' }]}>{link.label}</Text>
                  <Text
                    selectable
                    style={[styles.linkValue, { textAlign: rtl ? 'right' : 'left' }]}
                  >
                    {link.url}
                  </Text>
                  {link.description ? (
                    <Text style={[styles.itemDescription, { textAlign: rtl ? 'right' : 'left' }]}>
                      {link.description}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

          {lastUpdatedLabel ? (
            <Text style={[styles.updated, { textAlign: rtl ? 'right' : 'left' }]}>
              {t.updated}: {lastUpdatedLabel}
            </Text>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.empty}</Text>
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
  scroll: {
    width: '100%',
  },
  container: {
    gap: 13,
    paddingBottom: 20,
    width: '100%',
  },
  header: {
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
  brandCard: {
    backgroundColor: '#102D46',
    borderRadius: 15,
    gap: 7,
    padding: 17,
  },
  brandEyebrow: {
    color: '#D5E3EF',
    fontSize: 11,
    fontWeight: '700',
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 13,
    borderWidth: 1,
    gap: 7,
    padding: 13,
  },
  label: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    color: '#12243A',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 11,
    padding: 14,
  },
  sectionTitle: {
    color: '#12345A',
    fontSize: 14,
    fontWeight: '800',
  },
  item: {
    borderTopColor: '#EAECF0',
    borderTopWidth: 1,
    gap: 5,
    paddingTop: 10,
  },
  itemLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },
  itemValue: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  linkValue: {
    color: '#245B91',
    fontSize: 12,
    lineHeight: 19,
    textDecorationLine: 'underline',
  },
  itemDescription: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 18,
  },
  updated: {
    color: '#667085',
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 13,
    borderWidth: 1,
    padding: 15,
  },
  emptyText: {
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
