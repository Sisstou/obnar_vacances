import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Language = 'ar' | 'fr';

export type NewListingDraft = {
  title: string;
  location: string;
  description: string;
  pricePerNight: number;
  depositAmount: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
};

type Props = {
  language: Language;
  onPreview?: (draft: NewListingDraft) => void;
};

const amenityOptions = [
  { id: 'wifi', ar: 'واي فاي', fr: 'Wi-Fi' },
  { id: 'air_conditioning', ar: 'مكيّف', fr: 'Climatisation' },
  { id: 'parking', ar: 'موقف سيارات', fr: 'Parking' },
  { id: 'kitchen', ar: 'مطبخ', fr: 'Cuisine' },
  { id: 'sea_view', ar: 'إطلالة على البحر', fr: 'Vue sur mer' },
  { id: 'pool', ar: 'مسبح', fr: 'Piscine' },
  { id: 'garden', ar: 'حديقة', fr: 'Jardin' },
  { id: 'tv', ar: 'تلفاز', fr: 'Télévision' },
] as const;

const copy = {
  ar: {
    heading: 'إضافة إقامة',
    subtitle: 'أدخل المعلومات الأساسية لمعاينة بطاقة الإقامة.',
    title: 'اسم الإقامة',
    titlePlaceholder: 'مثال: شقة عائلية قرب البحر',
    location: 'الموقع أو المنطقة',
    locationPlaceholder: 'مثال: أولاد بونار، جيجل',
    description: 'وصف الإقامة',
    descriptionPlaceholder: 'اكتب وصفاً واضحاً للإقامة ومميزاتها...',
    price: 'السعر لكل ليلة (دج)',
    deposit: 'العربون الإضافي (دج)',
    guests: 'أقصى عدد للضيوف',
    bedrooms: 'غرف النوم',
    bathrooms: 'الحمامات',
    amenities: 'المرافق المتوفرة',
    preview: 'معاينة البيانات',
    missing: 'يرجى إدخال اسم الإقامة والموقع ووصفها.',
    invalidNumbers: 'تحقق من الأسعار وأعداد الضيوف والغرف والحمامات.',
    previewTitle: 'معاينة الإقامة',
    noAmenities: 'لم يتم اختيار مرافق.',
    demo: 'هذه معاينة محلية فقط. لا يتم إنشاء إقامة أو حفظ أو إرسال أي بيانات، ولا يعني ذلك قبول الإقامة أو نشرها.',
    currency: 'دج / ليلة',
    depositLabel: 'العربون الإضافي',
    guestsLabel: 'الضيوف',
    bedroomsLabel: 'غرف النوم',
    bathroomsLabel: 'الحمامات',
  },
  fr: {
    heading: 'Ajouter un logement',
    subtitle: 'Saisissez les informations principales pour prévisualiser la fiche.',
    title: 'Nom du logement',
    titlePlaceholder: 'Ex. : Appartement familial près de la mer',
    location: 'Lieu ou quartier',
    locationPlaceholder: 'Ex. : Ouled Bounar, Jijel',
    description: 'Description du logement',
    descriptionPlaceholder: 'Décrivez clairement le logement et ses atouts...',
    price: 'Prix par nuit (DZD)',
    deposit: 'Dépôt supplémentaire (DZD)',
    guests: 'Nombre maximal de voyageurs',
    bedrooms: 'Chambres',
    bathrooms: 'Salles de bain',
    amenities: 'Équipements disponibles',
    preview: 'Prévisualiser les informations',
    missing: 'Veuillez saisir le nom, le lieu et la description.',
    invalidNumbers: 'Vérifiez les prix et le nombre de voyageurs, chambres et salles de bain.',
    previewTitle: 'Aperçu du logement',
    noAmenities: 'Aucun équipement sélectionné.',
    demo: 'Aperçu local uniquement. Aucun logement n’est créé, enregistré ou envoyé ; cela ne signifie ni validation ni publication.',
    currency: 'DZD / nuit',
    depositLabel: 'Dépôt supplémentaire',
    guestsLabel: 'Voyageurs',
    bedroomsLabel: 'Chambres',
    bathroomsLabel: 'Salles de bain',
  },
} as const;

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  rtl,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
  rtl: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlign={rtl ? 'right' : 'left'}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

/**
 * Local-only listing form and preview.
 * No network requests, persistence, uploads, or listing submission.
 */
export default function OwnerListingForm({ language, onPreview }: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('0');
  const [guests, setGuests] = useState('2');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<NewListingDraft | null>(null);

  const selectedAmenities = useMemo(
    () => amenityOptions.filter((item) => amenities.includes(item.id)),
    [amenities],
  );

  const toggleAmenity = (id: string) => {
    setAmenities((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setPreview(null);
  };

  const handlePreview = () => {
    if (!title.trim() || !location.trim() || !description.trim()) {
      setError(t.missing);
      setPreview(null);
      return;
    }

    const numeric = [price, deposit, guests, bedrooms, bathrooms].map(Number);
    const [priceValue, depositValue, guestsValue, bedroomsValue, bathroomsValue] = numeric;
    const valid =
      numeric.every((value) => Number.isFinite(value)) &&
      priceValue > 0 &&
      depositValue >= 0 &&
      Number.isInteger(guestsValue) &&
      guestsValue >= 1 &&
      Number.isInteger(bedroomsValue) &&
      bedroomsValue >= 0 &&
      Number.isInteger(bathroomsValue) &&
      bathroomsValue >= 0;

    if (!valid) {
      setError(t.invalidNumbers);
      setPreview(null);
      return;
    }

    const draft: NewListingDraft = {
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      pricePerNight: priceValue,
      depositAmount: depositValue,
      maxGuests: guestsValue,
      bedrooms: bedroomsValue,
      bathrooms: bathroomsValue,
      amenities: [...amenities],
    };

    setError('');
    setPreview(draft);
    onPreview?.(draft);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingBlock}>
        <Text style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>{t.heading}</Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.subtitle}</Text>
      </View>

      <Field rtl={rtl} label={t.title} value={title} onChangeText={(v) => { setTitle(v); setPreview(null); }} placeholder={t.titlePlaceholder} />
      <Field rtl={rtl} label={t.location} value={location} onChangeText={(v) => { setLocation(v); setPreview(null); }} placeholder={t.locationPlaceholder} />
      <Field rtl={rtl} label={t.description} value={description} onChangeText={(v) => { setDescription(v); setPreview(null); }} placeholder={t.descriptionPlaceholder} multiline />

      <View style={styles.twoColumns}>
        <View style={styles.column}>
          <Field rtl={rtl} label={t.price} value={price} onChangeText={(v) => { setPrice(v); setPreview(null); }} keyboardType="numeric" />
        </View>
        <View style={styles.column}>
          <Field rtl={rtl} label={t.deposit} value={deposit} onChangeText={(v) => { setDeposit(v); setPreview(null); }} keyboardType="numeric" />
        </View>
      </View>

      <View style={styles.twoColumns}>
        <View style={styles.column}>
          <Field rtl={rtl} label={t.guests} value={guests} onChangeText={(v) => { setGuests(v); setPreview(null); }} keyboardType="numeric" />
        </View>
        <View style={styles.column}>
          <Field rtl={rtl} label={t.bedrooms} value={bedrooms} onChangeText={(v) => { setBedrooms(v); setPreview(null); }} keyboardType="numeric" />
        </View>
      </View>
      <Field rtl={rtl} label={t.bathrooms} value={bathrooms} onChangeText={(v) => { setBathrooms(v); setPreview(null); }} keyboardType="numeric" />

      <View style={styles.field}>
        <Text style={[styles.label, { textAlign: rtl ? 'right' : 'left' }]}>{t.amenities}</Text>
        <View style={styles.amenitiesGrid}>
          {amenityOptions.map((item) => {
            const selected = amenities.includes(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                onPress={() => toggleAmenity(item.id)}
                style={[styles.amenityChip, selected && styles.amenityChipSelected]}
              >
                <Text style={[styles.amenityText, selected && styles.amenityTextSelected]}>
                  {selected ? '✓ ' : ''}{item[language]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        onPress={handlePreview}
        style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
      >
        <Text style={styles.previewButtonText}>{t.preview}</Text>
      </Pressable>

      {preview ? (
        <View style={styles.previewCard}>
          <Text style={[styles.previewHeading, { textAlign: rtl ? 'right' : 'left' }]}>{t.previewTitle}</Text>
          <Text style={[styles.previewTitle, { textAlign: rtl ? 'right' : 'left' }]}>{preview.title}</Text>
          <Text style={[styles.previewLocation, { textAlign: rtl ? 'right' : 'left' }]}>{preview.location}</Text>
          <Text style={[styles.previewDescription, { textAlign: rtl ? 'right' : 'left' }]}>{preview.description}</Text>
          <Text style={[styles.previewLine, { textAlign: rtl ? 'right' : 'left' }]}>{preview.pricePerNight.toLocaleString()} {t.currency}</Text>
          <Text style={[styles.previewLine, { textAlign: rtl ? 'right' : 'left' }]}>{t.depositLabel}: {preview.depositAmount.toLocaleString()} DZD</Text>
          <Text style={[styles.previewLine, { textAlign: rtl ? 'right' : 'left' }]}>{t.guestsLabel}: {preview.maxGuests} · {t.bedroomsLabel}: {preview.bedrooms} · {t.bathroomsLabel}: {preview.bathrooms}</Text>
          <Text style={[styles.previewLine, { textAlign: rtl ? 'right' : 'left' }]}>
            {selectedAmenities.length
              ? selectedAmenities.map((item) => item[language]).join(' · ')
              : t.noAmenities}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.disclaimer, { textAlign: rtl ? 'right' : 'left' }]}>{t.demo}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    gap: 16,
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
    fontSize: 14,
    lineHeight: 21,
  },
  field: {
    gap: 7,
    width: '100%',
  },
  label: {
    color: '#26384D',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D9E3',
    borderRadius: 11,
    borderWidth: 1,
    color: '#123B5D',
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 112,
    paddingTop: 12,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D9E3',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 13,
  },
  amenityChipSelected: {
    backgroundColor: '#F3EBDD',
    borderColor: '#123B5D',
  },
  amenityText: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '600',
  },
  amenityTextSelected: {
    color: '#123B5D',
  },
  error: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
  },
  previewButton: {
    alignItems: 'center',
    backgroundColor: '#123B5D',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C8D5E2',
    borderRadius: 16,
    borderWidth: 1,
    gap: 9,
    padding: 16,
  },
  previewHeading: {
    color: '#123B5D',
    fontSize: 15,
    fontWeight: '800',
  },
  previewTitle: {
    color: '#123B5D',
    fontSize: 19,
    fontWeight: '800',
  },
  previewLocation: {
    color: '#667085',
    fontSize: 13,
  },
  previewDescription: {
    color: '#344054',
    fontSize: 14,
    lineHeight: 22,
  },
  previewLine: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 20,
  },
  disclaimer: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.78,
  },
});
