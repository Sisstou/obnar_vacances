import React from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { HomeHero } from '../src/components/HomeHero';
import { StayCategoryTiles } from '../src/components/StayCategoryTiles';
import { ExploreLocalArea } from '../src/components/ExploreLocalArea';
import { HomeSectionHeader } from '../src/components/HomeSectionHeader';

export default function App() {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F5EF" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topLine}>
          <Text style={styles.previewTag}>معاينة داخلية — لا توجد بيانات حقيقية</Text>
          <Text style={styles.brand}>OBNAR VACANCES</Text>
        </View>

        <HomeHero
          locale="ar"
          onSearch={() =>
            Alert.alert(
              'معاينة فقط',
              'البحث غير متصل بمصدر بيانات في هذه النسخة التجريبية.',
            )
          }
        />

        <View style={styles.section}>
          <HomeSectionHeader
            title="اختر نوع الإقامة"
            subtitle="عرض تجريبي للتصنيفات دون أعداد أو إعلانات حقيقية."
          />
          <StayCategoryTiles
            locale="ar"
            onSelect={(category) =>
              Alert.alert(
                'تصنيف تجريبي',
                `تم اختيار: ${category}. لا توجد فلترة أو نتائج حقيقية في هذه المعاينة.`,
              )
            }
          />
        </View>

        <View style={styles.section}>
          <HomeSectionHeader
            title="اكتشف أولاد بونار وجيجل"
            subtitle="ستُضاف الأماكن بعد اعتماد بياناتها وصورها."
          />
          <ExploreLocalArea locale="ar" items={[]} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>نسخة معاينة مستقلة</Text>
          <Text style={styles.footerText}>
            هذه الشاشة تختبر شكل المكونات وطريقة عرضها فقط. لا يوجد تسجيل دخول،
            ولا اتصال بـ Supabase، ولا بحث أو حجز أو دفع أو بيانات مستخدمين.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F5EF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 20,
  },
  topLine: {
    gap: 5,
    alignItems: 'flex-end',
  },
  previewTag: {
    color: '#8A5B17',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  brand: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  section: {
    gap: 12,
  },
  footer: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E0D2',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  footerTitle: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  footerText: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
});