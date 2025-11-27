import Script from 'next/script';

export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://youtube-muse.app/#webapp',
        name: 'YouTube Muse',
        url: 'https://youtube-muse.app',
        description: 'Create, manage, and enjoy your favorite YouTube music playlists with YouTube Muse. A beautiful, intuitive music player for organizing your YouTube music collection.',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '1250',
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://youtube-muse.app/#website',
        url: 'https://youtube-muse.app',
        name: 'YouTube Muse',
        description: 'Your Personal Music Playlist Manager',
        inLanguage: 'en-US',
      },
      {
        '@type': 'Organization',
        '@id': 'https://youtube-muse.app/#organization',
        name: 'YouTube Muse',
        url: 'https://youtube-muse.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://youtube-muse.app/icon-512.png',
          width: 512,
          height: 512,
        },
        sameAs: [
          'https://twitter.com/youtubemuse',
          'https://github.com/youtubemuse',
        ],
      },
    ],
  };

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
