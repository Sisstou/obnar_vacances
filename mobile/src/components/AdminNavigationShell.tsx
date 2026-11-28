import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type AdminLanguage = 'ar' | 'fr';

export type AdminPanelId =
  | 'users'
  | 'owner-verification'
  | 'listing-review'
  | 'locations'
  | 'local-directory'
  | 'local-directory-requests'
  | 'bookings'
  | 'complaints'
  | 'reviews'
  | 'notifications'
  | 'financial-overview'
  | 'activity-log'
  | 'user-activity-log'
  | 'backup-history'
  | 'release-history'
  | 'data-requests'
  | 'privacy-requests'
  | 'privacy-retention'
  | 'consent-history'
  | 'legal-changes'
  | 'public-info'
  | 'platform-settings'
  | 'security-overview'
  | 'system-health'
  | 'error-log'
  | 'user-sessions';

type AdminPanelDefinition = {
  id: AdminPanelId;
  componentFile: string;
  title: { ar: string; fr: string };
};

type AdminSectionDefinition = {
  id: string;
  title: { ar: string; fr: string };
  description: { ar: string; fr: string };
  panels: AdminPanelDefinition[];
};

const sections: AdminSectionDefinition[] = [
  {
    id: 'accounts',
    title: { ar: 'المستخدمون والمالكون', fr: 'Utilisateurs et propriétaires' },
    description: {
      ar: 'الحسابات والتحقق من هوية المالكين',
      fr: 'Comptes et vérification des propriétaires',
    },
    panels: [
      { id: 'users', componentFile: 'AdminUsersPanel.tsx', title: { ar: 'إدارة المستخدمين', fr: 'Gestion des utilisateurs' } },
      { id: 'owner-verification', componentFile: 'AdminOwnerVerificationPanel.tsx', title: { ar: 'طلبات تحقق المالكين', fr: 'Vérification des propriétaires' } },
    ],
  },
  {
    id: 'listings',
    title: { ar: 'الإقامات والموافقات', fr: 'Logements et validations' },
    description: {
      ar: 'مراجعة الإقامات والمواقع والدليل المحلي',
      fr: 'Révision des logements, lieux et annuaire local',
    },
    panels: [
      { id: 'listing-review', componentFile: 'AdminListingReviewPanel.tsx', title: { ar: 'مراجعة الإقامات', fr: 'Révision des logements' } },
      { id: 'locations', componentFile: 'AdminLocationsPanel.tsx', title: { ar: 'المواقع', fr: 'Emplacements' } },
      { id: 'local-directory', componentFile: 'AdminLocalDirectoryPanel.tsx', title: { ar: 'الدليل المحلي', fr: 'Annuaire local' } },
      { id: 'local-directory-requests', componentFile: 'AdminLocalDirectoryRequestsPanel.tsx', title: { ar: 'طلبات الدليل المحلي', fr: 'Demandes de l’annuaire local' } },
    ],
  },
  {
    id: 'service',
    title: { ar: 'الحجوزات والشكاوى', fr: 'Réservations et réclamations' },
    description: {
      ar: 'متابعة تجربة الضيف ومحتوى المنصة',
      fr: 'Suivi de l’expérience voyageur et du contenu',
    },
    panels: [
      { id: 'bookings', componentFile: '', title: { ar: 'الحجوزات', fr: 'Réservations' } },
      { id: 'complaints', componentFile: 'AdminComplaintsPanel.tsx', title: { ar: 'الشكاوى والبلاغات', fr: 'Réclamations et signalements' } },
      { id: 'reviews', componentFile: 'AdminReviewsPanel.tsx', title: { ar: 'التقييمات', fr: 'Avis' } },
      { id: 'notifications', componentFile: 'AdminNotificationsPanel.tsx', title: { ar: 'الإشعارات', fr: 'Notifications' } },
    ],
  },
  {
    id: 'finance-reports',
    title: { ar: 'المالية والتقارير', fr: 'Finances et rapports' },
    description: {
      ar: 'المؤشرات والسجلات التشغيلية',
      fr: 'Indicateurs et historiques opérationnels',
    },
    panels: [
      { id: 'financial-overview', componentFile: 'AdminFinancialOverviewPanel.tsx', title: { ar: 'الملخص المالي', fr: 'Aperçu financier' } },
      { id: 'activity-log', componentFile: 'AdminActivityLogPanel.tsx', title: { ar: 'سجل نشاط الإدارة', fr: 'Journal d’activité admin' } },
      { id: 'user-activity-log', componentFile: 'AdminUserActivityLogPanel.tsx', title: { ar: 'نشاط المستخدمين', fr: 'Activité des utilisateurs' } },
      { id: 'backup-history', componentFile: 'AdminBackupHistoryPanel.tsx', title: { ar: 'سجل النسخ الاحتياطي', fr: 'Historique des sauvegardes' } },
      { id: 'release-history', componentFile: 'AdminReleaseHistoryPanel.tsx', title: { ar: 'سجل الإصدارات', fr: 'Historique des versions' } },
    ],
  },
  {
    id: 'privacy-compliance',
    title: { ar: 'الخصوصية والامتثال', fr: 'Confidentialité et conformité' },
    description: {
      ar: 'طلبات البيانات والاحتفاظ والموافقات',
      fr: 'Demandes de données, conservation et consentements',
    },
    panels: [
      { id: 'data-requests', componentFile: 'AdminDataRequestsPanel.tsx', title: { ar: 'طلبات البيانات', fr: 'Demandes de données' } },
      { id: 'privacy-requests', componentFile: 'AdminPrivacyRequestsPanel.tsx', title: { ar: 'طلبات الخصوصية', fr: 'Demandes de confidentialité' } },
      { id: 'privacy-retention', componentFile: 'AdminPrivacyRetentionPanel.tsx', title: { ar: 'سياسة الاحتفاظ بالبيانات', fr: 'Conservation des données' } },
      { id: 'consent-history', componentFile: 'AdminConsentHistoryPanel.tsx', title: { ar: 'سجل الموافقات', fr: 'Historique des consentements' } },
      { id: 'legal-changes', componentFile: 'AdminLegalChangesPanel.tsx', title: { ar: 'التغييرات القانونية', fr: 'Modifications juridiques' } },
      { id: 'public-info', componentFile: 'AdminPublicInfoPanel.tsx', title: { ar: 'المعلومات العامة', fr: 'Informations publiques' } },
    ],
  },
  {
    id: 'security-system',
    title: { ar: 'الأمان وسلامة النظام', fr: 'Sécurité et état du système' },
    description: {
      ar: 'إعدادات المنصة ومراقبة سلامة التشغيل',
      fr: 'Paramètres de la plateforme et surveillance',
    },
    panels: [
      { id: 'platform-settings', componentFile: 'AdminPlatformSettingsPanel.tsx', title: { ar: 'إعدادات المنصة', fr: 'Paramètres de la plateforme' } },
      { id: 'security-overview', componentFile: 'AdminSecurityOverviewPanel.tsx', title: { ar: 'نظرة أمنية عامة', fr: 'Vue générale de la sécurité' } },
      { id: 'system-health', componentFile: 'AdminSystemHealthPanel.tsx', title: { ar: 'سلامة النظام', fr: 'État du système' } },
      { id: 'error-log', componentFile: 'AdminErrorLogPanel.tsx', title: { ar: 'سجل الأخطاء', fr: 'Journal des erreurs' } },
      { id: 'user-sessions', componentFile: 'AdminUserSessionsPanel.tsx', title: { ar: 'جلسات المستخدمين', fr: 'Sessions utilisateurs' } },
    ],
  },
];

type Props = {
  language: AdminLanguage;
  selectedPanelId: AdminPanelId;
  onSelectPanel: (panelId: AdminPanelId) => void;
  children?: React.ReactNode;
};

/**
 * Presentation-only navigation for the administrative area.
 *
 * This component does not authenticate the user, authorize access, fetch data,
 * persist navigation state, or perform administrative mutations. The parent
 * must enforce authorization using a trusted backend before rendering any
 * administrative content. A visible navigation item is never a permission.
 */
export default function AdminNavigationShell({
  language,
  selectedPanelId,
  onSelectPanel,
  children,
}: Props) {
  const rtl = language === 'ar';
  const labels = language === 'ar'
    ? {
        heading: 'مركز إدارة المنصة',
        subtitle: 'تنقل منظم بين أدوات الإدارة',
        selected: 'القسم المحدد',
        notConnected: 'هذه القائمة تنظّم الوصول إلى اللوحات فقط. يجب ربط كل لوحة بمكوّنها الفعلي من المكوّن الأب.',
        security: 'تنبيه الصلاحيات: هذا الغلاف لا يتحقق من هوية المدير ولا يمنح أي صلاحية. يجب فرض الصلاحيات والتحقق منها في الخادم قبل عرض بيانات الإدارة.',
        noFile: 'واجهة غير مرتبطة بعد',
      }
    : {
        heading: 'Centre d’administration',
        subtitle: 'Navigation structurée entre les outils administratifs',
        selected: 'Section sélectionnée',
        notConnected: 'Cette navigation organise uniquement l’accès aux panneaux. Le composant parent doit relier chaque panneau à son écran réel.',
        security: 'Autorisations : cette interface ne vérifie pas l’identité de l’administrateur et n’accorde aucun droit. Le serveur doit contrôler les autorisations avant toute exposition de données administratives.',
        noFile: 'Écran non relié',
      };

  const selectedPanel = sections
    .flatMap((section) => section.panels)
    .find((panel) => panel.id === selectedPanelId);

  return (
    <View style={[styles.root, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.subtitle}
        </Text>
      </View>

      <View style={styles.securityNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.security}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.navigationContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.id} style={styles.sectionCard}>
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                {section.title[language]}
              </Text>
              <Text style={[styles.sectionDescription, { textAlign: rtl ? 'right' : 'left' }]}>
                {section.description[language]}
              </Text>
            </View>

            <View style={styles.panelList}>
              {section.panels.map((panel) => {
                const active = panel.id === selectedPanelId;
                return (
                  <Pressable
                    key={panel.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => onSelectPanel(panel.id)}
                    style={({ pressed }) => [
                      styles.panelButton,
                      active && styles.panelButtonActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.panelTitle,
                        active && styles.panelTitleActive,
                        { textAlign: rtl ? 'right' : 'left' },
                      ]}
                    >
                      {panel.title[language]}
                    </Text>
                    <Text style={styles.panelHint}>
                      {panel.componentFile || labels.noFile}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.contentArea}>
        <Text style={[styles.contentHeading, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.selected}: {selectedPanel?.title[language] ?? selectedPanelId}
        </Text>
        {children ?? (
          <Text style={[styles.emptyContent, { textAlign: rtl ? 'right' : 'left' }]}>
            {labels.notConnected}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#F8F5EF',
    flex: 1,
    gap: 12,
    width: '100%',
  },
  header: {
    gap: 5,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heading: {
    color: '#123B5D',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
  },
  securityNotice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    padding: 12,
  },
  noticeText: {
    color: '#77520A',
    fontSize: 12,
    lineHeight: 19,
  },
  navigationContent: {
    gap: 11,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  sectionHeading: {
    gap: 4,
  },
  sectionTitle: {
    color: '#123B5D',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionDescription: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  panelList: {
    gap: 7,
  },
  panelButton: {
    backgroundColor: '#F8F5EF',
    borderColor: '#E9DCC4',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  panelButtonActive: {
    backgroundColor: '#F3EBDD',
    borderColor: '#D6C19A',
  },
  panelTitle: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },
  panelTitleActive: {
    color: '#123B5D',
  },
  panelHint: {
    color: '#98A2B3',
    fontSize: 10,
    marginTop: 3,
  },
  pressed: {
    opacity: 0.75,
  },
  contentArea: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderTopWidth: 1,
    gap: 8,
    padding: 16,
  },
  contentHeading: {
    color: '#123B5D',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContent: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 19,
  },
});
