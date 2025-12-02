/**
 * Structured Data (Schema.org) utilities for better SEO
 * Helps search engines understand website content better
 */

export const addStructuredData = (schema: Record<string, unknown>) => {
  let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;

  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(schema);
};

// Organization Schema
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Prodegi',
  description: 'Free gym tracking app with progressive overload, routines, and social features',
  url: 'https://prodegi.vercel.app',
  applicationCategory: 'HealthApplication',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '100',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/OnlineOnly',
  },
  image: 'https://prodegi.vercel.app/prodegilogo.png',
  author: {
    '@type': 'Organization',
    name: 'Prodegi',
  },
  inLanguage: 'en',
  operatingSystem: 'Web',
};

// Breadcrumb Navigation Schema
export const getBreadcrumbSchema = (path: string) => {
  const segments = path.split('/').filter(Boolean);
  const baseUrl = 'https://prodegi.vercel.app';

  const itemListElement = segments.map((segment, index) => ({
    '@type': 'ListItem',
    position: index + 2,
    name: segment.charAt(0).toUpperCase() + segment.slice(1),
    item: `${baseUrl}/${segments.slice(0, index + 1).join('/')}`,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      ...itemListElement,
    ],
  };
};

// FAQ Schema - useful for common questions
export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Prodegi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Prodegi is a free gym tracking app designed to help you track your workouts and achieve progressive overload. It allows you to manage routines, track personal records, and share your fitness journey with friends.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Prodegi free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Prodegi is completely free to use. There are no hidden fees or premium subscriptions required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I track multiple exercises?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Prodegi allows you to track unlimited exercises with sets, reps, and weights. You can organize them into custom routines for different days.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I share my workouts with friends?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Prodegi has social features that allow you to find friends, share your routines, personal records, and workout statistics based on your privacy settings.',
      },
    },
  ],
};
