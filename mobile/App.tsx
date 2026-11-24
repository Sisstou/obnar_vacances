import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './src/lib/supabase';

const AUTH_REDIRECT_URL = 'dz.obnarvacances.app://auth/callback';

async function completeAuthFromUrl(url: string) {
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const hash = url.includes('#') ? url.split('#').slice(1).join('#') : '';
  const params = new URLSearchParams([query, hash].filter(Boolean).join('&'));
  const errorDescription = params.get('error_description');
  if (errorDescription) throw new Error(errorDescription);

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (error) throw error;
    return;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
  }
}

type Language = 'ar' | 'fr';
type Tab = 'discover' | 'bookings' | 'account';

const copy = {
  ar: {
    tagline: 'عطلتك تبدأ من هنا',
    intro: 'اكتشف إقامات العطلات في أولاد بونار وجيجل.',
    search: 'ابحث عن إقامة أو منطقة',
    searchPending: 'البحث المباشر غير متاح بعد. لن نعرض بيانات الإقامات التجريبية على أنها عروض حقيقية.',
    previewDetails: 'معاينة تصميم صفحة الإقامة',
    back: 'العودة إلى الإقامات',
    demoLabel: 'مثال توضيحي فقط — ليس عرضاً حقيقياً',
    detailName: 'اسم الإقامة يظهر هنا',
    detailLocation: 'المنطقة وموقع الإقامة',
    detailDescription: 'سيعرض هذا القسم وصف الإقامة، الصور، المرافق، والشروط بعد إدخال بيانات حقيقية والتحقق منها.',
    bookingPanel: 'تفاصيل طلب الحجز',
    checkIn: 'تاريخ الوصول',
    checkOut: 'تاريخ المغادرة',
    guests: 'عدد الضيوف',
    ownerPrice: 'السعر يحدده صاحب الإقامة',
    bookingDisabled: 'الحجز غير متاح في هذه المعاينة',
    bookingNotice: 'هذه شاشة تصميم فقط. لم يتم إنشاء حجز أو إرسال أي بيانات.',

    categories: 'اكتشف الإقامات',
    emptyTitle: 'لا توجد إقامات منشورة حالياً',
    emptyBody: 'الإقامات الموجودة في بيئة الاختبار تجريبية، لذلك نخفيها عن الزوار. ستظهر هنا الإقامات الحقيقية بعد اعتماد مصدر الإنتاج والتحقق منه.',
    discover: 'اكتشف',
    bookings: 'حجوزاتي',
    account: 'حسابي',
    accountTitle: 'حسابك في OBNAR VACANCES',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    signOut: 'تسجيل الخروج',
    signedIn: 'تم تسجيل الدخول',
    signedOut: 'أنت تتصفح كضيف. يمكنك استكشاف الإقامات دون إنشاء حساب.',
    noBookings: 'ستظهر حجوزاتك هنا بعد ربط خدمة متابعة الحجوزات.',
    bookingsTitle: 'متابعة الحجوزات',
    configMissing: 'يلزم إعداد متغيرات Supabase في ملف .env قبل تفعيل الحسابات والبيانات.',
    authError: 'تعذر إتمام العملية. تحقق من البيانات والاتصال ثم حاول مجدداً.',
    required: 'أدخل البريد الإلكتروني وكلمة المرور.',
    loading: 'يرجى الانتظار...',
    language: 'Français',
    stay: 'إقامات معتمدة',
    activities: 'أنشطة محلية قريباً',
    secure: 'تصفح آمن وبسيط',
    trackingIntro: 'أدخل بيانات الوصول الخاصة بحجزك لمتابعة حالته.',
    bookingReference: 'الرقم المرجعي للحجز',
    privateSecret: 'رمز الوصول الخاص',
    referencePlaceholder: 'يظهر هنا الرقم المرجعي',
    secretPlaceholder: 'يُدخل هنا الرمز الخاص',
    trackingButton: 'متابعة الحجز',
    trackingDisabled: 'المتابعة غير مفعّلة في هذه النسخة التجريبية',
    trackingSecurity: 'الرقم المرجعي وحده لا يكشف تفاصيل الحجز ولا يسمح بتعديله. يلزم معه رمز الوصول الخاص.',
    secretSafety: 'لا تشارك رمز الوصول مع أي شخص، ولا ترسله في رابط أو رسالة عامة.',
    trackingNoBackend: 'هذه واجهة تصميم فقط؛ لا يتم التحقق من أي حجز أو إرسال بيانات.',
    ownerPortal: 'واجهة صاحب الإقامة', ownerPreviewTitle: 'مساحة صاحب الإقامة', ownerPreviewIntro: 'معاينة أولية لإدارة الإقامات وطلبات الحجز. ستظهر البيانات الحقيقية بعد ربط الخدمات والتحقق من صلاحيات الحساب.', ownerProperties: 'إقاماتي', ownerPropertiesEmpty: 'ستظهر إقاماتك هنا بعد اعتماد حساب المالك وربط بيانات الإنتاج.', ownerRequests: 'طلبات الحجز', ownerRequestsEmpty: 'ستظهر طلبات الحجز الواردة هنا بعد ربط خدمة الحجوزات.', ownerVerification: 'اعتماد حساب المالك', ownerVerificationInfo: 'يلزم اعتماد حساب المالك قبل نشر أي إقامة.', ownerPreviewOnly: 'معاينة فقط — لا يمكن إضافة أو تعديل أو نشر الإقامات، ولا قبول أو رفض الحجوزات.', ownerBack: 'العودة إلى الحساب', ownerFormPreview: 'معاينة إضافة إقامة', ownerEditPreview: 'معاينة نموذج بيانات الإقامة', ownerName: 'اسم الإقامة', ownerArea: 'المنطقة والعنوان', ownerDescription: 'وصف الإقامة', ownerPhotos: 'صور الإقامة', ownerPhotoSlots: 'أماكن مخصصة للصور — رفع الصور غير متاح', ownerAmenities: 'المرافق والتجهيزات', ownerAmenityList: 'واي فاي · موقف سيارات · مطبخ · تكييف · شرفة', ownerCapacity: 'عدد الأشخاص والغرف', ownerPriceLabel: 'السعر لكل ليلة (دج)', ownerDeposit: 'العربون: ليلة واحدة بالضبط، يضاف إلى سعر الإقامة', ownerSaveDisabled: 'حفظ ونشر الإقامة غير متاحين', ownerEditorNotice: 'الحقول التالية توضيحية فقط. لا تُحفظ أي معلومات ولا تُرسل إلى الخادم.',

  },
  fr: {
    tagline: 'Vos vacances commencent ici',
    intro: 'Découvrez les séjours à Ouled Bounar et dans la wilaya de Jijel.',
    search: 'Rechercher un logement ou une zone',
    searchPending: 'La recherche en direct n’est pas encore disponible. Les données de test ne seront pas présentées comme de vraies offres.',
    previewDetails: 'Aperçu de la fiche logement',
    back: 'Retour aux logements',
    demoLabel: 'Exemple visuel uniquement — offre fictive',
    detailName: 'Le nom du logement apparaîtra ici',
    detailLocation: 'Quartier et emplacement du logement',
    detailDescription: 'Cette section présentera la description, les photos, les équipements et les conditions après validation de vraies données.',
    bookingPanel: 'Détails de la demande',
    checkIn: 'Date d’arrivée',
    checkOut: 'Date de départ',
    guests: 'Nombre de voyageurs',
    ownerPrice: 'Le propriétaire fixe le prix',
    bookingDisabled: 'Réservation indisponible dans cet aperçu',
    bookingNotice: 'Ceci est un écran de conception. Aucune réservation ni donnée n’a été envoyée.',

    categories: 'Découvrir les séjours',
    emptyTitle: 'Aucun logement publié pour le moment',
    emptyBody: 'Les logements présents dans l’environnement de test sont fictifs et restent masqués aux visiteurs. Les véritables offres apparaîtront ici après validation d’une source de production.',
    discover: 'Découvrir',
    bookings: 'Mes réservations',
    account: 'Mon compte',
    accountTitle: 'Votre compte OBNAR VACANCES',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    signIn: 'Se connecter',
    signUp: 'Créer un compte',
    signOut: 'Se déconnecter',
    signedIn: 'Session ouverte',
    signedOut: 'Vous naviguez en tant qu’invité. La création d’un compte n’est pas nécessaire pour découvrir les séjours.',
    noBookings: 'Vos réservations apparaîtront ici après la connexion du suivi des réservations.',
    bookingsTitle: 'Suivi des réservations',
    configMissing: 'Configurez les variables Supabase dans le fichier .env pour activer les comptes et les données.',
    authError: 'Opération impossible. Vérifiez les informations et la connexion, puis réessayez.',
    required: 'Saisissez votre adresse e-mail et votre mot de passe.',
    loading: 'Veuillez patienter...',
    language: 'العربية',
    stay: 'Logements approuvés',
    activities: 'Activités locales bientôt',
    secure: 'Simple et sécurisé',
    trackingIntro: 'Saisissez les éléments d’accès privés de votre réservation pour suivre son état.',
    bookingReference: 'Référence de réservation',
    privateSecret: 'Code d’accès privé',
    referencePlaceholder: 'La référence apparaîtra ici',
    secretPlaceholder: 'Saisir le code privé',
    trackingButton: 'Suivre la réservation',
    trackingDisabled: 'Le suivi n’est pas activé dans cette version de démonstration',
    trackingSecurity: 'La référence seule ne révèle pas les détails et ne permet aucune modification. Le code privé est également nécessaire.',
    secretSafety: 'Ne partagez pas votre code privé et ne l’ajoutez jamais à un lien ou à un message public.',
    trackingNoBackend: 'Écran de conception uniquement : aucune réservation n’est vérifiée et aucune donnée n’est envoyée.',
    ownerPortal: 'Espace propriétaire', ownerPreviewTitle: 'Espace du propriétaire', ownerPreviewIntro: 'Aperçu initial de la gestion des logements et des demandes. Les données réelles seront affichées après connexion des services et vérification des autorisations du compte.', ownerProperties: 'Mes logements', ownerPropertiesEmpty: 'Vos logements apparaîtront ici après validation du compte propriétaire et connexion aux données de production.', ownerRequests: 'Demandes de réservation', ownerRequestsEmpty: 'Les demandes reçues apparaîtront ici après connexion du service de réservation.', ownerVerification: 'Validation du compte propriétaire', ownerVerificationInfo: 'Le compte propriétaire doit être validé avant toute publication de logement.', ownerPreviewOnly: 'Aperçu uniquement — ajout, modification, publication, acceptation et refus des réservations sont désactivés.', ownerBack: 'Retour au compte', ownerFormPreview: 'Aperçu du formulaire logement', ownerEditPreview: 'Aperçu des informations du logement', ownerName: 'Nom du logement', ownerArea: 'Zone et adresse', ownerDescription: 'Description du logement', ownerPhotos: 'Photos du logement', ownerPhotoSlots: 'Emplacements photo — téléversement désactivé', ownerAmenities: 'Équipements et services', ownerAmenityList: 'Wi-Fi · Parking · Cuisine · Climatisation · Balcon', ownerCapacity: 'Capacité et chambres', ownerPriceLabel: 'Prix par nuit (DZD)', ownerDeposit: 'Acompte : exactement une nuit, ajouté au prix du séjour', ownerSaveDisabled: 'Enregistrement et publication indisponibles', ownerEditorNotice: 'Les champs suivants sont illustratifs. Aucune information ne sera enregistrée ni envoyée au serveur.',

  },
} as const;

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [tab, setTab] = useState<Tab>('discover');
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [showDetailPreview, setShowDetailPreview] = useState(false);
  const [showOwnerPreview, setShowOwnerPreview] = useState(false);
  const [showOwnerEditor, setShowOwnerEditor] = useState(false);
  const t = copy[language];
  const rtl = language === 'ar';

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!error) setSession(data.session);
      })
      .catch(() => {
        // Keep guest browsing available if session restoration temporarily fails.
      });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    const deepLinkSubscription = Linking.addEventListener('url', ({ url }) => {
      completeAuthFromUrl(url).catch(() => {
        Alert.alert('OBNAR VACANCES', 'تعذر تأكيد البريد الإلكتروني. أعد فتح رابط التأكيد أو حاول تسجيل الدخول.');
      });
    });
    Linking.getInitialURL().then((url) => {
      if (url) {
        completeAuthFromUrl(url).catch(() => {
          Alert.alert('OBNAR VACANCES', 'تعذر تأكيد البريد الإلكتروني. أعد فتح رابط التأكيد أو حاول تسجيل الدخول.');
        });
      }
    });
    return () => {
      data.subscription.unsubscribe();
      deepLinkSubscription.remove();
    };
  }, []);

  async function authenticate(mode: 'signIn' | 'signUp') {
    if (!email.trim() || !password) {
      Alert.alert(t.accountTitle, t.required);
      return;
    }
    if (!supabaseConfigured) {
      Alert.alert('OBNAR VACANCES', t.configMissing);
      return;
    }
    setBusy(true);
    try {
      const result = mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: AUTH_REDIRECT_URL },
          });
      if (result.error) throw result.error;
      if (mode === 'signUp' && !result.data.session) {
        Alert.alert('OBNAR VACANCES', language === 'ar'
          ? 'تحقق من بريدك الإلكتروني لإكمال إنشاء الحساب.'
          : 'Consultez votre e-mail pour confirmer la création du compte.');
      }
    } catch {
      Alert.alert('OBNAR VACANCES', t.authError);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabaseConfigured) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch {
      Alert.alert('OBNAR VACANCES', t.authError);
    } finally {
      setBusy(false);
    }
  }

  function navigateTo(nextTab: Tab) {
    setTab(nextTab);
    if (nextTab !== 'discover') setShowDetailPreview(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={[styles.header, rtl && styles.rtl]}>
        <View>
          <Text style={styles.brand}>OBNAR VACANCES</Text>
          <Text style={styles.headerSubtitle}>{t.tagline}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.language}
          onPress={() => setLanguage(rtl ? 'fr' : 'ar')}
          style={styles.languageButton}
        >
          <Text style={styles.languageText}>{t.language}</Text>
        </Pressable>
      </View>

      {tab === 'discover' && !showDetailPreview && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={[styles.heroTitle, rtl && styles.textRight]}>{t.intro}</Text>
            <TextInput
              accessibilityLabel={t.search}
              placeholder={t.search}
              placeholderTextColor={COLORS.muted}
              value={search}
              onChangeText={setSearch}
              style={[styles.search, rtl && styles.textRight]}
              textAlign={rtl ? 'right' : 'left'}
              returnKeyType="search"
            />
            {!!search.trim() && (
              <Text style={[styles.searchNote, rtl && styles.textRight]}>{t.searchPending}</Text>
            )}
          </View>
          <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{t.categories}</Text>
          <View style={styles.featureRow}>
            <Feature title={t.stay} symbol="⌂" rtl={rtl} />
            <Feature title={t.activities} symbol="✦" rtl={rtl} />
          </View>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⌂</Text>
            <Text style={[styles.emptyTitle, rtl && styles.textRight]}>{t.emptyTitle}</Text>
            <Text style={[styles.emptyBody, rtl && styles.textRight]}>{t.emptyBody}</Text>
            <Pressable accessibilityRole="button" onPress={() => setShowDetailPreview(true)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{t.previewDetails}</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {tab === 'discover' && showDetailPreview && (
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable accessibilityRole="button" onPress={() => setShowDetailPreview(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹  {t.back}</Text>
          </Pressable>
          <View style={styles.detailHero}>
            <Text style={styles.detailPlaceholderIcon}>⌂</Text>
            <Text style={styles.demoLabel}>{t.demoLabel}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={[styles.detailTitle, rtl && styles.textRight]}>{t.detailName}</Text>
            <Text style={[styles.detailLocation, rtl && styles.textRight]}>⌖  {t.detailLocation}</Text>
            <Text style={[styles.detailDescription, rtl && styles.textRight]}>{t.detailDescription}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{t.bookingPanel}</Text>
            <View style={styles.previewField}>
              <Text style={[styles.label, rtl && styles.textRight]}>{t.checkIn}</Text>
              <View style={styles.readOnlyField}><Text style={styles.readOnlyText}>— / — / — — — —</Text></View>
            </View>
            <View style={styles.previewField}>
              <Text style={[styles.label, rtl && styles.textRight]}>{t.checkOut}</Text>
              <View style={styles.readOnlyField}><Text style={styles.readOnlyText}>— / — / — — — —</Text></View>
            </View>
            <View style={styles.previewField}>
              <Text style={[styles.label, rtl && styles.textRight]}>{t.guests}</Text>
              <View style={styles.readOnlyField}><Text style={styles.readOnlyText}>—</Text></View>
            </View>
            <Text style={[styles.ownerPrice, rtl && styles.textRight]}>{t.ownerPrice}</Text>
            <View style={styles.disabledBooking}><Text style={styles.disabledBookingText}>{t.bookingDisabled}</Text></View>
            <Text style={[styles.bookingNotice, rtl && styles.textRight]}>{t.bookingNotice}</Text>
          </View>
        </ScrollView>
      )}

      {tab === 'bookings' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{t.bookingsTitle}</Text>
          <View style={styles.trackingCard}>
            <Text style={[styles.trackingIntro, rtl && styles.textRight]}>{t.trackingIntro}</Text>
            <View style={styles.previewField}>
              <Text style={[styles.label, rtl && styles.textRight]}>{t.bookingReference}</Text>
              <View style={styles.readOnlyField}>
                <Text style={[styles.readOnlyText, rtl && styles.textRight]}>{t.referencePlaceholder}</Text>
              </View>
            </View>
            <View style={styles.previewField}>
              <Text style={[styles.label, rtl && styles.textRight]}>{t.privateSecret}</Text>
              <View style={styles.readOnlyField}>
                <Text style={[styles.readOnlyText, rtl && styles.textRight]}>••••••••••••••••</Text>
              </View>
            </View>
            <View style={styles.disabledBooking}>
              <Text style={styles.disabledBookingText}>{t.trackingDisabled}</Text>
            </View>
            <Text style={[styles.securityText, rtl && styles.textRight]}>{t.trackingSecurity}</Text>
            <Text style={[styles.securityText, rtl && styles.textRight]}>{t.secretSafety}</Text>
            <Text style={[styles.bookingNotice, rtl && styles.textRight]}>{t.trackingNoBackend}</Text>
          </View>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>▤</Text>
            <Text style={[styles.emptyBody, rtl && styles.textRight]}>{t.noBookings}</Text>
          </View>
        </ScrollView>
      )}

      {tab === 'account' && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.accountCard}>
              <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{t.accountTitle}</Text>
              {session ? (
                <>
                  <Text style={[styles.signedIn, rtl && styles.textRight]}>{t.signedIn}</Text>
                  <Text style={[styles.emailValue, rtl && styles.textRight]}>{session.user.email}</Text>
                  <ActionButton title={t.signOut} onPress={signOut} disabled={busy} />
                </>
              ) : (
                <>
                  <Text style={[styles.helper, rtl && styles.textRight]}>{t.signedOut}</Text>
                  <Field label={t.email} value={email} onChangeText={setEmail} keyboardType="email-address" rtl={rtl} />
                  <Field label={t.password} value={password} onChangeText={setPassword} secureTextEntry rtl={rtl} />
                  <ActionButton title={busy ? t.loading : t.signIn} onPress={() => authenticate('signIn')} disabled={busy} />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => authenticate('signUp')}
                    disabled={busy}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>{t.signUp}</Text>
                  </Pressable>
                  {!supabaseConfigured && <Text style={[styles.configNote, rtl && styles.textRight]}>{t.configMissing}</Text>}
                </>
              )}
            </View>
            {!showOwnerPreview ? (
              <Pressable accessibilityRole="button" onPress={() => setShowOwnerPreview(true)} style={styles.ownerEntryButton}>
                <Text style={styles.ownerEntryText}>{t.ownerPortal}  ›</Text>
              </Pressable>
            ) : (
              <View style={styles.ownerPanel}>
                <Pressable accessibilityRole="button" onPress={() => setShowOwnerPreview(false)} style={styles.backButton}>
                  <Text style={styles.backButtonText}>‹  {t.ownerBack}</Text>
                </Pressable>
                <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{t.ownerPreviewTitle}</Text>
                <Text style={[styles.ownerIntro, rtl && styles.textRight]}>{t.ownerPreviewIntro}</Text>
                <Pressable accessibilityRole="button" onPress={() => setShowOwnerEditor(!showOwnerEditor)} style={styles.ownerEntryButton}>
                  <Text style={styles.ownerEntryText}>{t.ownerFormPreview}  ›</Text>
                </Pressable>
                {showOwnerEditor ? (
                  <View style={styles.ownerEditor}>
                    <Text style={[styles.ownerSectionTitle, rtl && styles.textRight]}>{t.ownerEditPreview}</Text>
                    <Text style={[styles.ownerIntro, rtl && styles.textRight]}>{t.ownerEditorNotice}</Text>
                    <View style={styles.ownerSection}><Text style={[styles.label, rtl && styles.textRight]}>{t.ownerName}</Text><View style={styles.readOnlyField}><Text style={styles.readOnlyText}>—</Text></View></View>
                    <View style={styles.ownerSection}><Text style={[styles.label, rtl && styles.textRight]}>{t.ownerArea}</Text><View style={styles.readOnlyField}><Text style={styles.readOnlyText}>—</Text></View></View>
                    <View style={styles.ownerSection}><Text style={[styles.label, rtl && styles.textRight]}>{t.ownerDescription}</Text><View style={[styles.readOnlyField, styles.ownerMultiline]}><Text style={styles.readOnlyText}>—</Text></View></View>
                    <View style={styles.ownerSection}><Text style={[styles.ownerSectionTitle, rtl && styles.textRight]}>{t.ownerPhotos}</Text><View style={styles.ownerPhotoRow}><View style={styles.ownerPhotoSlot}><Text style={styles.ownerPhotoText}>＋</Text></View><View style={styles.ownerPhotoSlot}><Text style={styles.ownerPhotoText}>＋</Text></View><View style={styles.ownerPhotoSlot}><Text style={styles.ownerPhotoText}>＋</Text></View></View><Text style={[styles.ownerIntro, rtl && styles.textRight]}>{t.ownerPhotoSlots}</Text></View>
                    <View style={styles.ownerSection}><Text style={[styles.ownerSectionTitle, rtl && styles.textRight]}>{t.ownerAmenities}</Text><Text style={[styles.ownerIntro, rtl && styles.textRight]}>{t.ownerAmenityList}</Text></View>
                    <View style={styles.ownerSection}><Text style={[styles.label, rtl && styles.textRight]}>{t.ownerCapacity}</Text><View style={styles.readOnlyField}><Text style={styles.readOnlyText}>—</Text></View></View>
                    <View style={styles.ownerSection}><Text style={[styles.label, rtl && styles.textRight]}>{t.ownerPriceLabel}</Text><View style={styles.readOnlyField}><Text style={styles.readOnlyText}>— DZD</Text></View><Text style={[styles.ownerIntro, rtl && styles.textRight]}>{t.ownerDeposit}</Text></View>
                    <View style={styles.disabledBooking}><Text style={styles.disabledBookingText}>{t.ownerSaveDisabled}</Text></View>
                  </View>
                ) : (
                  <>
                    <View style={styles.ownerSection}><Text style={[styles.ownerSectionTitle, rtl && styles.textRight]}>{t.ownerProperties}</Text><Text style={[styles.emptyBody, rtl && styles.textRight]}>{t.ownerPropertiesEmpty}</Text></View>
                    <View style={styles.ownerSection}><Text style={[styles.ownerSectionTitle, rtl && styles.textRight]}>{t.ownerRequests}</Text><Text style={[styles.emptyBody, rtl && styles.textRight]}>{t.ownerRequestsEmpty}</Text></View>
                    <View style={styles.ownerVerification}><Text style={[styles.ownerSectionTitle, rtl && styles.textRight]}>{t.ownerVerification}</Text><Text style={[styles.ownerIntro, rtl && styles.textRight]}>{t.ownerVerificationInfo}</Text></View>
                  </>
                )}
                <Text style={[styles.ownerDisabledNote, rtl && styles.textRight]}>{t.ownerPreviewOnly}</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <View style={styles.tabBar}>
        <TabButton title={t.discover} symbol="⌂" active={tab === 'discover'} onPress={() => navigateTo('discover')} />
        <TabButton title={t.bookings} symbol="▤" active={tab === 'bookings'} onPress={() => navigateTo('bookings')} />
        <TabButton title={t.account} symbol="○" active={tab === 'account'} onPress={() => navigateTo('account')} />
      </View>
    </SafeAreaView>
  );
}

const COLORS = {
  navy: '#102D46',
  blue: '#174B68',
  gold: '#C9A45C',
  background: '#F8F7F3',
  white: '#FFFFFF',
  ink: '#20384A',
  muted: '#71818B',
  line: '#E9E1D2',
};

function Feature({ title, symbol, rtl }: { title: string; symbol: string; rtl: boolean }) {
  return (
    <View style={[styles.feature, rtl && styles.rtl]}>
      <Text style={styles.featureSymbol}>{symbol}</Text>
      <Text style={[styles.featureText, rtl && styles.textRight]}>{title}</Text>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  rtl: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, props.rtl && styles.textRight]}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize={props.keyboardType === 'email-address' ? 'none' : 'sentences'}
        style={[styles.input, props.rtl && styles.textRight]}
        textAlign={props.rtl ? 'right' : 'left'}
      />
    </View>
  );
}

function ActionButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={[styles.actionButton, disabled && styles.disabled]}>
      <Text style={styles.actionButtonText}>{title}</Text>
    </Pressable>
  );
}

function TabButton({ title, symbol, active, onPress }: { title: string; symbol: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={styles.tabButton}>
      <Text style={[styles.tabSymbol, active && styles.activeTabText]}>{symbol}</Text>
      <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: {
    minHeight: 82, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.navy,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  rtl: { flexDirection: 'row-reverse' },
  brand: { color: COLORS.white, fontSize: 18, fontWeight: '800', letterSpacing: 0.6 },
  headerSubtitle: { color: '#E9E1D2', fontSize: 12, marginTop: 4 },
  languageButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFFFFF55' },
  languageText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  content: { padding: 18, paddingBottom: 32, gap: 18 },
  hero: { backgroundColor: '#F1E7D3', borderRadius: 20, padding: 20, gap: 16 },
  heroTitle: { color: COLORS.navy, fontSize: 22, fontWeight: '800', lineHeight: 32 },
  textRight: { textAlign: 'right', writingDirection: 'rtl' },
  search: { minHeight: 50, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 14, color: COLORS.ink, borderWidth: 1, borderColor: COLORS.line },
  searchNote: { color: COLORS.muted, fontSize: 12, lineHeight: 19 },
  sectionTitle: { color: COLORS.navy, fontSize: 19, fontWeight: '800' },
  featureRow: { flexDirection: 'row', gap: 10 },
  feature: { flex: 1, minHeight: 92, padding: 14, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, justifyContent: 'center', gap: 6 },
  featureSymbol: { color: COLORS.gold, fontSize: 23, fontWeight: '800' },
  featureText: { color: COLORS.blue, fontWeight: '700', fontSize: 13 },
  emptyCard: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 22, alignItems: 'center', gap: 10 },
  backButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center', paddingHorizontal: 8 },
  backButtonText: { color: COLORS.blue, fontWeight: '800', fontSize: 14 },
  detailHero: { minHeight: 170, backgroundColor: '#E8E2D6', borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 18 },
  detailPlaceholderIcon: { fontSize: 54, color: COLORS.blue },
  demoLabel: { color: '#7B5A24', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  detailCard: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 18, gap: 13 },
  detailTitle: { color: COLORS.navy, fontSize: 20, fontWeight: '800' },
  detailLocation: { color: COLORS.muted, fontSize: 13 },
  detailDescription: { color: COLORS.ink, fontSize: 13, lineHeight: 23 },
  previewField: { gap: 7 },
  readOnlyField: { minHeight: 46, borderRadius: 11, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.background, justifyContent: 'center', paddingHorizontal: 13 },
  readOnlyText: { color: COLORS.muted, fontSize: 14 },
  ownerPrice: { color: COLORS.blue, fontWeight: '800', fontSize: 14 },
  disabledBooking: { minHeight: 48, borderRadius: 12, backgroundColor: '#E8E8E8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  disabledBookingText: { color: '#6F777B', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  bookingNotice: { color: COLORS.muted, fontSize: 12, lineHeight: 19 },
  emptyIcon: { fontSize: 34, color: COLORS.gold },
  emptyTitle: { color: COLORS.navy, fontWeight: '800', fontSize: 17 },
  emptyBody: { color: COLORS.muted, fontSize: 13, lineHeight: 22, textAlign: 'center' },
  trackingCard: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 18, gap: 14 },
  trackingIntro: { color: COLORS.ink, fontSize: 13, lineHeight: 22 },
  securityText: { color: COLORS.blue, fontSize: 12, lineHeight: 20 },
  accountCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: COLORS.line, gap: 14 },
  ownerEntryButton: { minHeight: 50, borderRadius: 13, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  ownerEntryText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  ownerPanel: { backgroundColor: COLORS.white, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: COLORS.line, gap: 14 },
  ownerIntro: { color: COLORS.muted, fontSize: 13, lineHeight: 22 },
  ownerSection: { backgroundColor: COLORS.background, borderRadius: 13, borderWidth: 1, borderColor: COLORS.line, padding: 15, gap: 9, minHeight: 100, justifyContent: 'center' },
  ownerSectionTitle: { color: COLORS.navy, fontWeight: '800', fontSize: 15 },
  ownerVerification: { backgroundColor: '#F1E7D3', borderRadius: 13, padding: 15, gap: 8 },
  ownerDisabledNote: { color: '#7B5A24', fontSize: 12, lineHeight: 20, fontWeight: '700' },
  ownerEditor: { gap: 12 },
  ownerMultiline: { minHeight: 86 },
  ownerPhotoRow: { flexDirection: 'row', gap: 9 },
  ownerPhotoSlot: { flex: 1, minHeight: 76, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.gold, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  ownerPhotoText: { color: COLORS.gold, fontSize: 26, fontWeight: '700' },
  helper: { color: COLORS.muted, lineHeight: 22, fontSize: 13 },
  field: { gap: 7 },
  label: { color: COLORS.ink, fontWeight: '700', fontSize: 13 },
  input: { minHeight: 48, borderRadius: 11, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 13, color: COLORS.ink, backgroundColor: COLORS.white },
  actionButton: { minHeight: 48, borderRadius: 12, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  actionButtonText: { color: COLORS.navy, fontWeight: '800', fontSize: 14 },
  secondaryButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: COLORS.blue, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: COLORS.blue, fontWeight: '700' },
  configNote: { color: '#8B6428', fontSize: 12, lineHeight: 19 },
  signedIn: { color: '#237B62', fontWeight: '800' },
  emailValue: { color: COLORS.ink, fontSize: 14 },
  disabled: { opacity: 0.55 },
  tabBar: { minHeight: 68, paddingBottom: Platform.OS === 'ios' ? 8 : 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.line, backgroundColor: COLORS.white, flexDirection: 'row', justifyContent: 'space-around' },
  tabButton: { minWidth: 72, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabSymbol: { color: COLORS.muted, fontSize: 19 },
  tabText: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  activeTabText: { color: COLORS.gold, fontWeight: '900' },
});
