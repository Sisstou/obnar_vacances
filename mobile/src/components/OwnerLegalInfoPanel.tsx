import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Language = 'ar' | 'fr';

type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

type Props = {
  language: Language;
  sections?: LegalSection[];
  lastUpdatedLabel?: string;
};

const defaultSections: Record<Language, LegalSection[]> = {
  ar: [
    {
      id: 'owner',
      title: '1. مسؤوليات صاحب الإقامة',
      paragraphs: [
        'يلتزم صاحب الإقامة بتقديم معلومات صحيحة وواضحة عن العقار وموقعه ومرافقه وسعته وسعره، وبإضافة صور حديثة تعكس حالته الفعلية ويملك حق استخدامها.',
        'على المالك تحديث المعلومات عند حدوث تغيير يؤثر في وصف الإقامة أو سعرها أو إمكانية استقبال الضيوف، والرد بوضوح على الاستفسارات المتعلقة بالطلب.',
        'إرسال طلب إضافة إقامة أو ظهوره في لوحة المالك لا يعني الموافقة عليه أو نشره أو إتاحته للحجز. لا تُعد الإقامة منشورة إلا بعد تأكيد المنصة ذلك.',
      ],
    },
    {
      id: 'price-deposit',
      title: '2. السعر والعربون',
      paragraphs: [
        'يحدد المالك سعر الإقامة لليلة الواحدة. ويُحدد العربون في مسار الحجز بمبلغ يساوي سعر ليلة واحدة بالضبط، ويضاف إلى مبلغ الإقامة ولا يُخصم منه.',
        'يدفع الضيف مبلغ الإقامة والعربون الإضافي إلى صاحب الإقامة. العربون ليس مبلغاً مستحقاً للمنصة.',
        'في حالة عدم حضور الضيف واحتفاظ المالك بالعربون وفق قاعدة عدم الحضور، لا يُرد العربون وفق السياسة المعتمدة. يجب توضيح السعر والعربون وشروط الحجز للضيف قبل إتمام الاتفاق.',
      ],
    },
    {
      id: 'commission',
      title: '3. عمولة المنصة',
      paragraphs: [
        'عمولة المنصة ثابتة: 500 دج عن كل ليلة مدفوعة. يتحمل المالك هذه العمولة، ولا تُضاف إلى السعر المعروض على الضيف، وليست نسبة مئوية من قيمة الحجز.',
        'في الحجز العادي المكتمل، تستحق العمولة عن جميع الليالي المدفوعة بعد دفع الضيف كامل مبلغ الحجز. في المرحلة الحالية، تتم تسوية العمولة يدوياً؛ لا يوجد تحصيل آلي.',
        'مثال: إذا دفع الضيف قيمة خمس ليالٍ كاملة، تكون العمولة 2,500 دج.',
        'استثناء عدم الحضور: إذا لم يصل الضيف واحتفظ المالك بعربون ليلة واحدة، يحوّل المالك يدوياً 500 دج للمنصة عن تلك الليلة التي يغطيها العربون.',
        'إذا غادر الضيف قبل نهاية المدة بعد دفع كامل الحجز، فلا يُرد مبلغ الليالي غير المستخدمة وفق السياسة المعتمدة، وتُحسب العمولة على جميع الليالي المدفوعة، لا الليالي التي أقامها فعلياً فقط.',
      ],
    },
    {
      id: 'cancellations',
      title: '4. إلغاء الحجز',
      paragraphs: [
        'إذا ألغى المالك الحجز، يسترد الضيف كامل المبلغ الذي دفعه، ولا تُفرض على المالك غرامة إلغاء وفق السياسة المعتمدة، ولا تستحق المنصة عمولة عن الحجز أو الليالي الملغاة.',
        'تظل قواعد إلغاء الضيف واسترداد المبالغ المعتمدة حالياً سارية، بما فيها مهلة الخمسة أيام والمراجعة الاستثنائية من الإدارة. لا تعرض هذه الشاشة تفاصيل إضافية أو تغيّر تلك القواعد.',
        'تحتاج حالات الاسترداد الجزئي أو تقصير مدة الحجز باتفاق الطرفين أو النزاع حول ليلة مدفوعة إلى مراجعة وتحديد صريح قبل تطبيقها.',
      ],
    },
    {
      id: 'booking',
      title: '5. الحجز والتواصل والدفع',
      paragraphs: [
        'لا يعني إرسال طلب الحجز وحده أن المبلغ دُفع أو أن عمولة المنصة أصبحت مستحقة. يجب التحقق من حالة الحجز والدفع والنتيجة الفعلية وفق إجراءات المنصة.',
        'لا توفر المرحلة الحالية دفعاً إلكترونياً داخل التطبيق ولا تحويلاً آلياً للعمولة. تتم تسوية العمولة يدوياً وفق السياسة التشغيلية المعتمدة.',
        'على المالك والضيف توضيح تفاصيل الإقامة والسعر والعربون والتواريخ وأي اتفاق قبل إتمام الحجز.',
      ],
    },
    {
      id: 'privacy',
      title: '6. الخصوصية وحماية المعلومات',
      paragraphs: [
        'استخدم معلومات الضيوف التي تصل إليك عبر المنصة بالقدر اللازم لمعالجة طلب الإقامة والتواصل بشأنه وتنفيذ الحجز.',
        'لا تنشر بيانات الضيوف أو تشاركها مع أشخاص غير معنيين، ولا تستخدمها للتسويق أو لأغراض أخرى دون أساس مناسب وموافقة لازمة.',
        'تجنب طلب أو تداول كلمات المرور ورموز التحقق وبيانات البطاقات والوثائق الشخصية عبر قنوات غير موثقة. احمِ أي معلومات تصل إليك ولا تحتفظ بنسخ غير ضرورية.',
      ],
    },
    {
      id: 'acceptance',
      title: '7. الاطلاع على الشروط',
      paragraphs: [
        'هذه الشاشة مخصصة لعرض مسودة تنظيمية لمعلومات المالك. لا تسجل قبولاً إلكترونياً ولا تنشئ موافقة ملزمة.',
        'يجب مراجعة النصوص واعتمادها وتحديد النسخة النهائية وتاريخ سريانها قبل نشرها أو استخدامها كوثيقة تعاقدية.',
      ],
    },
  ],
  fr: [
    {
      id: 'owner',
      title: '1. Responsabilités du propriétaire',
      paragraphs: [
        'Le propriétaire fournit des informations exactes et claires sur le logement, son emplacement, ses équipements, sa capacité et son prix. Les photos doivent être récentes, représentatives et utilisées avec les droits nécessaires.',
        'Le propriétaire met à jour les informations lorsqu’un changement affecte la description, le prix ou la disponibilité du logement, et répond clairement aux demandes concernant la réservation.',
        'L’envoi d’une demande de publication ou son affichage dans le tableau de bord ne signifie ni approbation, ni publication, ni disponibilité à la réservation. La publication doit être confirmée par la plateforme.',
      ],
    },
    {
      id: 'price-deposit',
      title: '2. Prix et dépôt',
      paragraphs: [
        'Le propriétaire fixe le prix du logement par nuit. Le parcours de réservation fixe le dépôt à exactement une nuit au tarif du logement ; ce dépôt s’ajoute au prix du séjour et n’en est pas déduit.',
        'Le voyageur verse le montant du séjour et le dépôt supplémentaire au propriétaire. Le dépôt n’est pas dû à la plateforme.',
        'En cas de non-présentation, si le propriétaire conserve le dépôt conformément à la règle applicable, celui-ci n’est pas remboursé selon la politique approuvée. Le prix, le dépôt et les conditions doivent être clairement communiqués avant l’accord.',
      ],
    },
    {
      id: 'commission',
      title: '3. Commission de la plateforme',
      paragraphs: [
        'La commission est fixe : 500 DZD par nuit payée. Elle est à la charge du propriétaire, n’est pas ajoutée au prix affiché au voyageur et ne constitue pas un pourcentage du montant de la réservation.',
        'Pour une réservation normalement exécutée, la commission est due pour toutes les nuits payées après le paiement intégral par le voyageur. À ce stade, le règlement est manuel ; aucun prélèvement automatique n’est effectué.',
        'Exemple : cinq nuits entièrement payées génèrent une commission de 2 500 DZD.',
        'Exception de non-présentation : si le voyageur ne se présente pas et que le propriétaire conserve le dépôt d’une nuit, le propriétaire verse manuellement 500 DZD à la plateforme pour cette nuit couverte par le dépôt.',
        'Si le voyageur quitte le logement avant la fin après avoir payé la totalité du séjour, les nuits non utilisées ne sont pas remboursées selon la politique approuvée. La commission porte sur toutes les nuits payées, et non uniquement sur les nuits occupées.',
      ],
    },
    {
      id: 'cancellations',
      title: '4. Annulation',
      paragraphs: [
        'Si le propriétaire annule la réservation, le voyageur reçoit le remboursement intégral des sommes versées. Aucune pénalité d’annulation n’est appliquée au propriétaire selon la politique approuvée et aucune commission n’est due pour la réservation ou les nuits annulées.',
        'Les règles actuellement approuvées pour l’annulation par le voyageur et les remboursements restent applicables, y compris le seuil de cinq jours et l’examen exceptionnel par l’administration. Cet écran ne les remplace pas et n’ajoute pas de nouvelles règles.',
        'Les remboursements partiels, la réduction de durée convenue entre les parties et les litiges concernant une nuit payée nécessitent des règles explicites avant leur application.',
      ],
    },
    {
      id: 'booking',
      title: '5. Réservation, communication et paiement',
      paragraphs: [
        'L’envoi d’une demande ne prouve pas à lui seul que le paiement a été effectué ni qu’une commission est due. Le statut de la réservation, le paiement et son issue doivent être vérifiés selon les procédures de la plateforme.',
        'À ce stade, l’application ne propose ni paiement électronique intégré ni transfert automatique de commission. Le règlement de la commission est manuel selon la procédure opérationnelle approuvée.',
        'Le propriétaire et le voyageur doivent clarifier les détails du logement, le prix, le dépôt, les dates et tout accord avant de finaliser la réservation.',
      ],
    },
    {
      id: 'privacy',
      title: '6. Confidentialité et protection des informations',
      paragraphs: [
        'Utilisez les informations du voyageur reçues via la plateforme uniquement dans la mesure nécessaire au traitement de la demande, à la communication et à l’exécution de la réservation.',
        'Ne publiez pas les données du voyageur et ne les partagez pas avec des personnes non concernées. Ne les utilisez pas à des fins de prospection ou à d’autres fins sans fondement approprié et consentement requis.',
        'Évitez de demander ou de transmettre des mots de passe, codes de vérification, données bancaires ou pièces personnelles par des canaux non vérifiés. Protégez les informations reçues et évitez les copies inutiles.',
      ],
    },
    {
      id: 'acceptance',
      title: '7. Consultation des conditions',
      paragraphs: [
        'Cet écran présente un projet informatif destiné aux propriétaires. Il n’enregistre aucune acceptation électronique et ne constitue pas un mécanisme de consentement contractuel.',
        'Les textes doivent être examinés et approuvés, avec une version finale et une date d’entrée en vigueur, avant leur publication ou leur utilisation comme document contractuel.',
      ],
    },
  ],
};

const labels = {
  ar: {
    heading: 'الشروط وسياسة الخصوصية للمالك',
    subtitle: 'ملخص تنظيمي لمسؤوليات المالك والحجوزات والعمولة وحماية البيانات.',
    draft: 'مسودة للمراجعة والاعتماد قبل النشر',
    updated: 'آخر تحديث',
    footer: 'هذه معلومات إرشادية داخل التطبيق وليست استشارة قانونية أو وثيقة نهائية معتمدة. يلزم فحصها قانونياً قبل النشر.',
    expand: 'عرض التفاصيل',
    collapse: 'إخفاء التفاصيل',
  },
  fr: {
    heading: 'Conditions et confidentialité du propriétaire',
    subtitle: 'Résumé des responsabilités, réservations, commissions et protection des données.',
    draft: 'Projet à examiner et approuver avant publication',
    updated: 'Dernière mise à jour',
    footer: 'Ces informations sont indicatives et ne constituent ni un conseil juridique ni un document final approuvé. Une vérification juridique est nécessaire avant publication.',
    expand: 'Afficher les détails',
    collapse: 'Masquer les détails',
  },
} as const;

/**
 * Read-only owner legal information panel.
 * This is an informational draft only; it does not record acceptance or contact a backend.
 */
export default function OwnerLegalInfoPanel({
  language,
  sections,
  lastUpdatedLabel,
}: Props) {
  const rtl = language === 'ar';
  const t = labels[language];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visibleSections = sections ?? defaultSections[language];

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

      <View style={styles.draftNotice}>
        <Text style={[styles.draftText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.draft}
        </Text>
      </View>

      {lastUpdatedLabel ? (
        <Text style={[styles.updated, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.updated}: {lastUpdatedLabel}
        </Text>
      ) : null}

      <View style={styles.sectionList}>
        {visibleSections.map((section) => {
          const expanded = expandedId === section.id;
          return (
            <View key={section.id} style={styles.sectionCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpandedId(expanded ? null : section.id)}
                style={({ pressed }) => [
                  styles.sectionTrigger,
                  { flexDirection: rtl ? 'row-reverse' : 'row' },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                  {section.title}
                </Text>
                <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
              </Pressable>
              {expanded ? (
                <View style={styles.paragraphs}>
                  {section.paragraphs.map((paragraph, index) => (
                    <Text
                      key={index}
                      style={[styles.paragraph, { textAlign: rtl ? 'right' : 'left' }]}
                    >
                      {paragraph}
                    </Text>
                  ))}
                </View>
              ) : null}
              <Text style={[styles.expandLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                {expanded ? t.collapse : t.expand}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.footer}
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
    paddingBottom: 22,
    width: '100%',
  },
  header: {
    gap: 5,
  },
  heading: {
    color: '#12243A',
    fontSize: 21,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
  },
  draftNotice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  draftText: {
    color: '#72530A',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 19,
  },
  updated: {
    color: '#667085',
    fontSize: 11,
  },
  sectionList: {
    gap: 9,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EAF0',
    borderRadius: 13,
    borderWidth: 1,
    gap: 9,
    padding: 13,
  },
  sectionTrigger: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
    minHeight: 34,
  },
  sectionTitle: {
    color: '#24364B',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 20,
  },
  chevron: {
    color: '#12345A',
    fontSize: 21,
    fontWeight: '600',
  },
  paragraphs: {
    gap: 10,
  },
  paragraph: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 21,
  },
  expandLabel: {
    color: '#245B91',
    fontSize: 11,
    fontWeight: '700',
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
