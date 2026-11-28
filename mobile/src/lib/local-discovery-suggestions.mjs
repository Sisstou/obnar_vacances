export function getLocalDiscoverySuggestions(locale = 'ar') {
  if (locale === 'fr') {
    return [
      { id: 'coast', symbol: '≈', title: 'Plages et littoral', description: 'Les lieux de détente au bord de la mer.' },
      { id: 'nature', symbol: '✦', title: 'Nature et paysages', description: 'Des idées de sorties en plein air.' },
      { id: 'heritage', symbol: '⌂', title: 'Lieux à découvrir', description: 'Repères et sites à explorer dans la région.' },
      { id: 'activities', symbol: '◇', title: 'Activités locales', description: 'Des expériences et activités de proximité.' },
    ];
  }

  return [
    { id: 'coast', symbol: '≈', title: 'الشواطئ والساحل', description: 'أماكن للاستمتاع بالبحر والأجواء الساحلية.' },
    { id: 'nature', symbol: '✦', title: 'الطبيعة والمناظر', description: 'أفكار للخروج والتنزه في الهواء الطلق.' },
    { id: 'heritage', symbol: '⌂', title: 'أماكن ومعالم', description: 'نقاط ومعالم لاكتشافها في المنطقة.' },
    { id: 'activities', symbol: '◇', title: 'أنشطة محلية', description: 'تجارب وأنشطة قريبة من الزائر.' },
  ];
}
