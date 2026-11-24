import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
    categories: 'اكتشف الإقامات',
    emptyTitle: 'الإقامات ستظهر هنا',
    emptyBody: 'سيتم عرض الإقامات المعتمدة والمتاحة بعد ربط التطبيق ببيانات المنصة.',
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
    activities: 'نشاطات محلية',
    secure: 'تصفح آمن وبسيط',
  },
  fr: {
    tagline: 'Vos vacances commencent ici',
    intro: 'Découvrez les séjours à Ouled Bounar et dans la wilaya de Jijel.',
    search: 'Rechercher un logement ou une zone',
    categories: 'Découvrir les séjours',
    emptyTitle: 'Les logements apparaîtront ici',
    emptyBody: 'Les logements approuvés et disponibles seront affichés après la connexion aux données de la plateforme.',
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
    activities: 'Activités locales',
    secure: 'Simple et sécurisé',
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
  const t = copy[language];
  const rtl = language === 'ar';

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
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
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) Alert.alert('OBNAR VACANCES', t.authError);
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

      {tab === 'discover' && (
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
            />
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
          </View>
        </ScrollView>
      )}

      {tab === 'bookings' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{t.bookingsTitle}</Text>
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
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <View style={styles.tabBar}>
        <TabButton title={t.discover} symbol="⌂" active={tab === 'discover'} onPress={() => setTab('discover')} />
        <TabButton title={t.bookings} symbol="▤" active={tab === 'bookings'} onPress={() => setTab('bookings')} />
        <TabButton title={t.account} symbol="○" active={tab === 'account'} onPress={() => setTab('account')} />
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
  sectionTitle: { color: COLORS.navy, fontSize: 19, fontWeight: '800' },
  featureRow: { flexDirection: 'row', gap: 10 },
  feature: { flex: 1, minHeight: 92, padding: 14, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, justifyContent: 'center', gap: 6 },
  featureSymbol: { color: COLORS.gold, fontSize: 23, fontWeight: '800' },
  featureText: { color: COLORS.blue, fontWeight: '700', fontSize: 13 },
  emptyCard: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 22, alignItems: 'center', gap: 10 },
  emptyIcon: { fontSize: 34, color: COLORS.gold },
  emptyTitle: { color: COLORS.navy, fontWeight: '800', fontSize: 17 },
  emptyBody: { color: COLORS.muted, fontSize: 13, lineHeight: 22, textAlign: 'center' },
  accountCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: COLORS.line, gap: 14 },
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
