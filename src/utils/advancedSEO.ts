const LANGUAGES = {
  en: 'English',
  es: 'Español', 
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
  pt: 'Português'
};

const BASE_URL = 'https://prodegi.vercel.app';

/**
 * Update hreflang tags for multilingual SEO
 */
export const updateHreflang = (pathname: string) => {
  // Remove existing hreflang links
  const existingLinks = document.querySelectorAll('link[rel="alternate"]');
  existingLinks.forEach(link => link.remove());

  // Add hreflang for each language
  Object.keys(LANGUAGES).forEach(lang => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = lang;
    link.href = `${BASE_URL}${pathname}?lang=${lang}`;
    document.head.appendChild(link);
  });

  // Add x-default
  const defaultLink = document.createElement('link');
  defaultLink.rel = 'alternate';
  defaultLink.hreflang = 'x-default';
  defaultLink.href = `${BASE_URL}${pathname}`;
  document.head.appendChild(defaultLink);
};

/**
 * Add VideoObject schema for tutorial/demo videos
 */
export const addVideoSchema = (videoData: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  contentUrl: string;
}) => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: videoData.name,
    description: videoData.description,
    thumbnailUrl: videoData.thumbnailUrl,
    uploadDate: videoData.uploadDate,
    duration: videoData.duration,
    contentUrl: videoData.contentUrl
  });
  document.head.appendChild(script);
};

/**
 * Add HowTo schema for guides/tutorials
 */
export const addHowToSchema = (steps: Array<{ name: string; text: string; image?: string }>) => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Use Prodegi Gym Tracker',
    description: 'Step-by-step guide to start tracking your workouts with Prodegi',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image })
    }))
  });
  document.head.appendChild(script);
};
