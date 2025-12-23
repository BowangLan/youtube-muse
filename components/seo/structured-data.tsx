import Script from 'next/script';

import {
  SITE_DESCRIPTION_FULL,
  SITE_DESCRIPTION_SHORT,
  SITE_GITHUB_URL,
  SITE_NAME,
  SITE_TWITTER_URL,
  SITE_URL,
} from '@/lib/site';

export function StructuredData() {
  const webAppId = `${SITE_URL}/#webapp`;
  const websiteId = `${SITE_URL}/#website`;
  const organizationId = `${SITE_URL}/#organization`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': webAppId,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION_FULL,
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
        '@id': websiteId,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION_SHORT,
        inLanguage: 'en-US',
      },
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/icon-512.png`,
          width: 512,
          height: 512,
        },
        sameAs: [SITE_TWITTER_URL, SITE_GITHUB_URL].filter(Boolean) as string[],
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
