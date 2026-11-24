import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type OwnerHelpTopic = {
  id: string;
  question: string;
  answer: string;
};

export type OwnerSupportChannel = {
  id: string;
  label: string;
  detail?: string;
  availabilityLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  language: Language;
  topics?: OwnerHelpTopic[];
  supportChannels?: OwnerSupportChannel[];
  onOpenSupportChannel?: (channel: OwnerSupportChannel) => void;
};

const defaultTopics: Record<Language, OwnerHelpTopic[]> = {
  ar: [
    {
      id: 'listing-status',
      question: 'كيف أتابع حالة الإقامة التي أضفتها؟',
      answer: 'افتح قسم طلبات الإقامات لمراجعة الحالة وآخر ملاحظات الإدارة. إذا طُلبت تعديلات، راجع الملاحظة قبل تحديث المعلومات.',
    },
    {
      id: 'review',
      question: 'ماذا تعني حالة قيد المراجعة؟',
      answer: 'تعني أن الطلب ينتظر المراجعة. لا تعتبر الإقامة منشورة أو متاحة للحجز حتى تؤكد المنصة نشرها من مصدر موثوق.',
    },
    {
      id: 'changes',
      question: 'ماذا أفعل إذا طُلبت تعديلات؟',
      answer: 'راجع ملاحظات المراجعة، ثم استكمل المعلومات المطلوبة عبر مسار تعديل الطلب عند توفره.',
    },
    {
      id: 'photos',
      question: 'ما الذي يجب الانتباه إليه عند إضافة الصور؟',
      answer: 'استخدم صوراً واضحة وحديثة للإقامة، وتأكد من امتلاكك الحق في استخدامها، وتجنب إظهار وثائق شخصية أو معلومات خاصة.',
    },
    {
      id: 'deposit',
      question: 'كيف يُعرض العربون في سعر الإقامة؟',
      answer: 'العربون مبلغ إضافي فوق سعر الإقامة الذي يحدده المالك. يجب توضيح قيمته للضيف قبل تأكيد أي اتفاق.',
    },
    {
      id: 'booking',
      question: 'هل ظهور الإقامة في حسابي يعني أنها قابلة للحجز؟',
      answer: 'لا. بيانات الاختبار أو المسودات أو الطلبات قيد المراجعة لا تعني أن الإقامة منشورة أو متاحة للحجز.',
    },
  ],
  fr: [
    {
      id: 'listing-status',
      question: 'Comment suivre le statut de mon logement ?',
      answer: 'Ouvrez la section des demandes pour consulter le statut et les dernières remarques. Si des modifications sont demandées, lisez la remarque avant de mettre à jour les informations.',
    },
    {
      id: 'review',
      question: 'Que signifie « en cours de vérification » ?',
      answer: 'La demande est en attente de vérification. Le logement ne doit pas être considéré comme publié ou réservable avant confirmation par une source fiable de la plateforme.',
    },
    {
      id: 'changes',
      question: 'Que faire si des modifications sont demandées ?',
      answer: 'Consultez les remarques, puis complétez les informations demandées via le parcours de modification lorsqu’il sera disponible.',
    },
    {
      id: 'photos',
      question: 'À quoi faire attention lors de l’ajout de photos ?',
      answer: 'Utilisez des photos claires et récentes du logement, assurez-vous d’avoir le droit de les utiliser et évitez les documents personnels ou les informations privées.',
    },
    {
      id: 'deposit',
      question: 'Comment le dépôt est-il présenté dans le prix ?',
      answer: 'Le dépôt est un montant supplémentaire au prix du séjour fixé par le propriétaire. Sa valeur doit être communiquée au voyageur avant tout accord.',
    },
    {
      id: 'booking',
      question: 'Mon logement est-il réservable dès qu’il apparaît dans mon compte ?',
      answer: 'Non. Les données de test, les brouillons et les demandes en cours de vérification ne signifient pas que le logement est publié ou disponible à la réservation.',
    },
  ],
};

const copy = {
  ar: {
    heading: 'مركز المساعدة والدعم',
    subtitle: 'إجابات وإرشادات لمساعدتك في إدارة إقاماتك',
    search: 'ابحث في الأسئلة الشائعة',
    faq: 'الأسئلة الشائعة',
    support: 'التواصل مع الإدارة',
    supportIntro: 'تظهر هنا قنوات التواصل التي توفرها إدارة المنصة.',
    noChannels: 'لم تُضف قنوات تواصل رسمية بعد.',
    noResults: 'لا توجد أسئلة تطابق بحثك.',
    privacy: 'لا ترسل كلمات المرور أو رموز التحقق أو بيانات البطاقات أو وثائق الهوية عبر قنوات غير موثقة.',
    demo: 'مركز إرشادي للعرض فقط؛ لا يرسل رسائل أو طلبات دعم ولا يتصل بخدمة خارجية.',
    open: 'فتح قناة التواصل',
    expand: 'عرض الإجابة',
    collapse: 'إخفاء الإجابة',
  },
  fr: {
    heading: 'Centre d’aide et assistance',
    subtitle: 'Réponses et conseils pour gérer vos logements',
    search: 'Rechercher dans la FAQ',
    faq: 'Questions fréquentes',
    support: 'Contacter l’administration',
    supportIntro: 'Les moyens de contact fournis par l’administration apparaîtront ici.',
    noChannels: 'Aucun canal de contact officiel n’a encore été ajouté.',
    noResults: 'Aucune question ne correspond à votre recherche.',
    privacy: 'Ne partagez jamais vos mots de passe, codes de vérification, données bancaires ou pièces d’identité via des canaux non vérifiés.',
    demo: 'Centre informatif uniquement ; il n’envoie aucun message ni demande d’assistance et ne contacte aucun service externe.',
    open: 'Ouvrir le canal de contact',
    expand: 'Afficher la réponse',
    collapse: 'Masquer la réponse',
  },
} as const;

/**
 * Read-only help centre.
 * FAQ and support channels can be supplied by the parent.
 * No messaging, external linking, network calls, or persistence is performed.
 */
export default function OwnerHelpCenterPanel({
  language,
  topics,
  supportChannels = [],
  onOpenSupportChannel,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visibleTopics = useMemo(() => {
    const source = topics ?? defaultTopics[language];
    const query = search.trim().toLocaleLowerCase();
    if (!query) return source;
    return source.filter((topic) =>
      (topic.question + ' ' + topic.answer).toLocaleLowerCase().includes(query),
    );
  }, [language, search, topics]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      keyboardShouldPersistTaps="handled"
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

      <TextInput
        accessibilityLabel={t.search}
        value={search}
        onChangeText={setSearch}
        placeholder={t.search}
        placeholderTextColor="#98A2B3"
        returnKeyType="search"
        style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
      />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.faq}
        </Text>
        {visibleTopics.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.noResults}</Text>
          </View>
        ) : (
          <View style={styles.topicList}>
            {visibleTopics.map((topic) => {
              const expanded = expandedId === topic.id;
              return (
                <Pressable
                  key={topic.id}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setExpandedId(expanded ? null : topic.id)}
                  style={({ pressed }) => [styles.topicCard, pressed && styles.pressed]}
                >
                  <View style={[styles.topicHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.question, { textAlign: rtl ? 'right' : 'left' }]}>
                      {topic.question}
                    </Text>
                    <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
                  </View>
                  {expanded ? (
                    <Text style={[styles.answer, { textAlign: rtl ? 'right' : 'left' }]}>
                      {topic.answer}
                    </Text>
                  ) : null}
                  <Text style={[styles.expandLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                    {expanded ? t.collapse : t.expand}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.support}
        </Text>
        <Text style={[styles.supportIntro, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.supportIntro}
        </Text>
        {supportChannels.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.noChannels}</Text>
          </View>
        ) : (
          <View style={styles.channelList}>
            {supportChannels.map((channel) => (
              <Pressable
                key={channel.id}
                accessibilityRole={onOpenSupportChannel ? 'button' : undefined}
                disabled={!onOpenSupportChannel}
                onPress={() => onOpenSupportChannel?.(channel)}
                style={({ pressed }) => [styles.channelCard, pressed && styles.pressed]}
              >
                <Text style={[styles.channelLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                  {channel.label}
                </Text>
                {channel.detail ? (
                  <Text style={[styles.channelDetail, { textAlign: rtl ? 'right' : 'left' }]}>
                    {channel.detail}
                  </Text>
                ) : null}
                {channel.availabilityLabel ? (
                  <Text style={[styles.channelAvailability, { textAlign: rtl ? 'right' : 'left' }]}>
                    {channel.availabilityLabel}
                  </Text>
                ) : null}
                {onOpenSupportChannel ? (
                  <Text style={[styles.openLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.open}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.privacy}
        </Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.demo}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
  },
  container: {
    gap: 16,
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
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E1EA',
    borderRadius: 12,
    borderWidth: 1,
    color: '#344054',
    fontSize: 13,
    minHeight: 46,
    paddingHorizontal: 13,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#12243A',
    fontSize: 16,
    fontWeight: '800',
  },
  topicList: {
    gap: 8,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 13,
    borderWidth: 1,
    gap: 9,
    padding: 13,
  },
  topicHeader: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
  },
  question: {
    color: '#24364B',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  chevron: {
    color: '#12345A',
    fontSize: 21,
    fontWeight: '600',
  },
  answer: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 20,
  },
  expandLabel: {
    color: '#245B91',
    fontSize: 11,
    fontWeight: '700',
  },
  supportIntro: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
  },
  channelList: {
    gap: 8,
  },
  channelCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 13,
    borderWidth: 1,
    gap: 6,
    padding: 13,
  },
  channelLabel: {
    color: '#24364B',
    fontSize: 13,
    fontWeight: '800',
  },
  channelDetail: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 18,
  },
  channelAvailability: {
    color: '#667085',
    fontSize: 11,
  },
  openLabel: {
    color: '#245B91',
    fontSize: 11,
    fontWeight: '800',
    paddingTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
  },
  emptyText: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  privacyNotice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: {
    color: '#72530A',
    fontSize: 11,
    lineHeight: 18,
  },
  footer: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.78,
  },
});
