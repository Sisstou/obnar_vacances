import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import OwnerListingForm, { type NewListingDraft } from './OwnerListingForm';
import OwnerListingPhotoPicker, {
  type OwnerListingLocalPhoto,
} from './OwnerListingPhotoPicker';
import OwnerListingReview from './OwnerListingReview';

type Language = 'ar' | 'fr';
type Step = 'details' | 'photos' | 'review' | 'complete';

export type OwnerListingCreationFlowProps = {
  language: Language;
};

/**
 * Local-only owner listing flow.
 * Keeps the details form mounted while moving between steps so draft input
 * is not lost when the owner returns to edit it.
 * No submission, persistence, network request, or photo upload is performed.
 */
export default function OwnerListingCreationFlow({
  language,
}: OwnerListingCreationFlowProps) {
  const [step, setStep] = useState<Step>('details');
  const [draft, setDraft] = useState<NewListingDraft | null>(null);
  const [photos, setPhotos] = useState<OwnerListingLocalPhoto[]>([]);
  const [formKey, setFormKey] = useState(0);
  const isArabic = language === 'ar';
  const rtl = isArabic;

  const t = isArabic
    ? {
        details: 'المعلومات',
        photos: 'الصور',
        review: 'المراجعة',
        back: 'العودة للمعلومات',
        continue: 'متابعة إلى المراجعة',
        editDetails: 'تعديل المعلومات',
        editPhotos: 'تعديل الصور',
        missingDraft: 'أدخل معلومات الإقامة أولاً.',
        finishPreview: 'إنهاء المعاينة',
        successTitle: 'اكتملت المعاينة بنجاح',
        successBody: 'تمت مراجعة معلومات الإقامة والصور في هذه الجلسة فقط. لم يتم تقديم طلب أو نشر الإقامة.',
        returnReview: 'العودة إلى المراجعة',
        newPreview: 'بدء معاينة جديدة',
        localOnly: 'مسار تجريبي محلي: لا يتم إنشاء إقامة أو حفظ بيانات أو إرسال طلب أو رفع صور.',
      }
    : {
        details: 'Informations',
        photos: 'Photos',
        review: 'Vérification',
        back: 'Retour aux informations',
        continue: 'Passer à la vérification',
        editDetails: 'Modifier les informations',
        editPhotos: 'Modifier les photos',
        missingDraft: 'Saisissez d’abord les informations du logement.',
        finishPreview: 'Terminer l’aperçu',
        successTitle: 'Aperçu terminé',
        successBody: 'Les informations et les photos ont été vérifiées dans cette session uniquement. Aucune demande n’a été envoyée et le logement n’a pas été publié.',
        returnReview: 'Revenir à la vérification',
        newPreview: 'Commencer un nouvel aperçu',
        localOnly: 'Parcours de démonstration local : aucun logement n’est créé, aucune donnée n’est enregistrée, aucune demande ni photo n’est envoyée.',
      };

  const steps: { id: Step; label: string }[] = [
    { id: 'details', label: t.details },
    { id: 'photos', label: t.photos },
    { id: 'review', label: t.review },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.stepBar, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        {steps.map((item, index) => {
          const active = item.id === step;
          const complete = steps.findIndex((entry) => entry.id === step) > index;
          return (
            <View key={item.id} style={styles.stepItem}>
              <View style={[styles.stepNumber, (active || complete) && styles.stepNumberActive]}>
                <Text style={[styles.stepNumberText, (active || complete) && styles.stepNumberTextActive]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={step === 'details' ? styles.visibleStep : styles.hiddenStep}>
        <OwnerListingForm
          key={formKey}
          language={language}
          onPreview={(nextDraft) => {
            setDraft(nextDraft);
            setStep('photos');
          }}
        />
      </View>

      {step === 'photos' ? (
        <View style={styles.stepContent}>
          <OwnerListingPhotoPicker
            language={language}
            photos={photos}
            onChange={setPhotos}
            maxPhotos={8}
          />
          <View style={[styles.actions, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <ActionButton label={t.back} onPress={() => setStep('details')} secondary />
            <ActionButton
              label={t.continue}
              onPress={() => {
                if (draft) setStep('review');
              }}
              disabled={!draft}
            />
          </View>
          {!draft ? (
            <Text style={styles.error} accessibilityRole="alert">{t.missingDraft}</Text>
          ) : null}
        </View>
      ) : null}

      {step === 'review' && draft ? (
        <View style={styles.stepContent}>
          <OwnerListingReview
            language={language}
            draft={draft}
            photos={photos}
            onEditDetails={() => setStep('details')}
            onEditPhotos={() => setStep('photos')}
          />
          <View style={[styles.actions, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
            <ActionButton
              label={t.editDetails}
              onPress={() => setStep('details')}
              secondary
            />
            <ActionButton
              label={t.editPhotos}
              onPress={() => setStep('photos')}
              secondary
            />
          </View>
          <ActionButton label={t.finishPreview} onPress={() => setStep('complete')} />
        </View>
      ) : null}

      {step === 'complete' ? (
        <View style={styles.successContent}>
          <View style={styles.successMark}>
            <Text style={styles.successMarkText}>✓</Text>
          </View>
          <Text accessibilityRole="header" style={styles.successTitle}>{t.successTitle}</Text>
          <Text style={[styles.successBody, { textAlign: rtl ? 'right' : 'left' }]}>{t.successBody}</Text>
          <View style={styles.successNotice}>
            <Text style={[styles.successNoticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.localOnly}</Text>
          </View>
          <ActionButton label={t.returnReview} onPress={() => setStep('review')} secondary />
          <ActionButton
            label={t.newPreview}
            onPress={() => {
              setDraft(null);
              setPhotos([]);
              setFormKey((value) => value + 1);
              setStep('details');
            }}
          />
        </View>
      ) : null}

      <Text style={[styles.localNotice, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.localOnly}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionText, secondary && styles.secondaryText, disabled && styles.disabledText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    width: '100%',
  },
  stepBar: {
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
  },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  stepNumberActive: {
    backgroundColor: '#12345A',
  },
  stepNumberText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '800',
  },
  stepNumberTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#12345A',
    fontWeight: '800',
  },
  visibleStep: {
    flex: 1,
  },
  hiddenStep: {
    display: 'none',
  },
  stepContent: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  successContent: {
    alignItems: 'stretch',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  successMark: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#E8F4EC',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  successMarkText: {
    color: '#247A45',
    fontSize: 36,
    fontWeight: '800',
  },
  successTitle: {
    color: '#12345A',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  successBody: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 22,
  },
  successNotice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F2D49B',
    borderRadius: 11,
    borderWidth: 1,
    padding: 12,
  },
  successNoticeText: {
    color: '#694B16',
    fontSize: 12,
    lineHeight: 19,
  },
  actions: {
    alignItems: 'stretch',
    gap: 9,
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#12345A',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 10,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B8C7D6',
    borderWidth: 1,
  },
  disabledButton: {
    backgroundColor: '#E4E7EC',
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
  disabledText: {
    color: '#667085',
  },
  error: {
    color: '#B42318',
    fontSize: 12,
    textAlign: 'center',
  },
  localNotice: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pressed: {
    opacity: 0.78,
  },
});
