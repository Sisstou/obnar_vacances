import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type StayReviewsLocale = 'ar' | 'fr';

export interface StayReviewItem {
  id: string;
  authorLabel: string;
  rating: number;
  comment: string;
  dateLabel?: string;
  /** Set true only when verified by the trusted reviews source. */
  isVerifiedStay?: boolean;
}

export interface StayReviewsCardProps {
  locale?: StayReviewsLocale;
  averageRating?: number;
  reviewCount?: number;
  reviews: StayReviewItem[];
  title?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Presentational-only reviews summary.
 * All values must come from a trusted parent data source.
 * No sample reviews, network requests, moderation, or persistence are provided.
 */
export function StayReviewsCard({
  locale = 'ar',
  averageRating,
  reviewCount,
  reviews,
  title,
  style,
}: StayReviewsCardProps) {
  const isArabic = locale === 'ar';
  const rtl = isArabic;
  const labels = isArabic
    ? {
        title: 'آراء المسافرين',
        rating: 'التقييم العام',
        reviews: 'تقييم',
        verified: 'إقامة مؤكدة',
        empty: 'لا توجد تقييمات منشورة حالياً',
        outOf: 'من 5',
      }
    : {
        title: 'Avis des voyageurs',
        rating: 'Note moyenne',
        reviews: 'avis',
        verified: 'Séjour vérifié',
        empty: 'Aucun avis publié pour le moment',
        outOf: 'sur 5',
      };

  const heading = title ?? labels.title;
  const safeAverage =
    averageRating != null && Number.isFinite(averageRating)
      ? Math.max(0, Math.min(5, averageRating))
      : undefined;

  const renderStars = (value: number) => {
    const rounded = Math.round(Math.max(0, Math.min(5, value)));
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  };

  return (
    <View style={[styles.card, style]}>
      <Text
        accessibilityRole="header"
        style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}
      >
        {heading}
      </Text>

      {safeAverage != null ? (
        <View style={[styles.summary, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <View style={styles.scoreBlock}>
            <Text style={styles.score}>{safeAverage.toFixed(1)}</Text>
            <Text style={styles.scoreOutOf}>{labels.outOf}</Text>
          </View>
          <View style={styles.summaryDetails}>
            <Text style={styles.stars} accessibilityLabel={`${safeAverage} / 5`}>
              {renderStars(safeAverage)}
            </Text>
            {reviewCount != null ? (
              <Text style={[styles.reviewCount, { textAlign: rtl ? 'right' : 'left' }]}>
                {reviewCount} {labels.reviews}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{labels.empty}</Text>
        </View>
      ) : (
        <View style={styles.reviewList}>
          {reviews.map((review) => {
            const rating = Number.isFinite(review.rating)
              ? Math.max(0, Math.min(5, review.rating))
              : 0;

            return (
              <View key={review.id} style={styles.reviewItem}>
                <View style={[styles.reviewHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                  <View style={styles.authorBlock}>
                    <Text style={[styles.author, { textAlign: rtl ? 'right' : 'left' }]}>
                      {review.authorLabel}
                    </Text>
                    {review.dateLabel ? (
                      <Text style={[styles.date, { textAlign: rtl ? 'right' : 'left' }]}>
                        {review.dateLabel}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.reviewStars} accessibilityLabel={`${rating} / 5`}>
                    {renderStars(rating)}
                  </Text>
                </View>

                {review.isVerifiedStay ? (
                  <Text style={[styles.verified, { textAlign: rtl ? 'right' : 'left' }]}>
                    ✓ {labels.verified}
                  </Text>
                ) : null}

                <Text style={[styles.comment, { textAlign: rtl ? 'right' : 'left' }]}>
                  {review.comment}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <Text style={[styles.disclaimer, { textAlign: rtl ? 'right' : 'left' }]}>
        {isArabic
          ? 'تُعرض التقييمات التي يمررها مصدر موثوق فقط. لا تحتوي هذه البطاقة على آراء تجريبية.'
          : 'Seuls les avis fournis par une source fiable sont affichés. Cette carte ne contient aucun avis fictif.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 13,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9DCC4',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  heading: {
    color: '#123B5D',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  summary: {
    alignItems: 'center',
    gap: 14,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#F8F5EF',
  },
  scoreBlock: {
    alignItems: 'center',
    minWidth: 54,
  },
  score: {
    color: '#123B5D',
    fontSize: 27,
    fontWeight: '700',
  },
  scoreOutOf: {
    color: '#667085',
    fontSize: 11,
  },
  summaryDetails: {
    flex: 1,
    gap: 4,
  },
  stars: {
    color: '#B7791F',
    fontSize: 18,
    letterSpacing: 1,
  },
  reviewCount: {
    color: '#52606D',
    fontSize: 12,
  },
  emptyState: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#F8F5EF',
  },
  emptyText: {
    color: '#667085',
    fontSize: 13,
    textAlign: 'center',
  },
  reviewList: {
    gap: 10,
  },
  reviewItem: {
    gap: 7,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E9DCC4',
    borderRadius: 12,
  },
  reviewHeader: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  authorBlock: {
    flex: 1,
    gap: 2,
  },
  author: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    color: '#667085',
    fontSize: 11,
  },
  reviewStars: {
    color: '#B7791F',
    fontSize: 13,
    letterSpacing: 1,
  },
  verified: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '600',
  },
  comment: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 20,
  },
  disclaimer: {
    color: '#667085',
    fontSize: 10,
    lineHeight: 15,
  },
});
