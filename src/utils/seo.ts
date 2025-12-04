/**
 * SEO utility for dynamically updating meta tags in the SPA
 */

export interface SEOConfig {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string;
  canonicalUrl?: string;
}

const BASE_URL = 'https://prodegi.vercel.app';
const DEFAULT_IMAGE = `${BASE_URL}/prodegilogo.png`;

export const updateSEO = (config: SEOConfig) => {
  const {
    title,
    description,
    ogTitle = title,
    ogDescription = description,
    ogImage = DEFAULT_IMAGE,
    keywords,
    canonicalUrl = BASE_URL,
  } = config;

  // Update document title
  document.title = `${title} | Prodegi`;

  // Update or create meta tags
  updateMetaTag('description', description);
  updateMetaTag('og:title', ogTitle, 'property');
  updateMetaTag('og:description', ogDescription, 'property');
  updateMetaTag('og:image', ogImage, 'property');
  updateMetaTag('og:url', canonicalUrl, 'property');
  updateMetaTag('twitter:title', ogTitle);
  updateMetaTag('twitter:description', ogDescription);
  updateMetaTag('twitter:image', ogImage);

  if (keywords) {
    updateMetaTag('keywords', keywords);
  }

  // Update canonical URL
  updateCanonicalUrl(canonicalUrl);
};

const updateMetaTag = (
  name: string,
  content: string,
  type: 'name' | 'property' = 'name'
) => {
  let element = document.querySelector(
    `meta[${type}="${name}"]`
  ) as HTMLMetaElement;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(type, name);
    document.head.appendChild(element);
  }

  element.content = content;
};

const updateCanonicalUrl = (url: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }

  link.href = url;
};

// Page-specific SEO configurations
export const pageSEOConfig: Record<string, SEOConfig> = {
  home: {
    title: 'Home - Track Your Workouts',
    description: 'Start tracking your workouts and achieve progressive overload with Prodegi gym tracker.',
    keywords: 'workout tracking, gym tracker, fitness',
    canonicalUrl: `${BASE_URL}/home`,
  },
  progress: {
    title: 'Progress - Analyze Your Gains',
    description: 'View detailed charts and analytics of your workout progress, personal records, and fitness achievements.',
    keywords: 'progress tracking, fitness analytics, personal records, strength training',
    canonicalUrl: `${BASE_URL}/progress`,
  },
  friends: {
    title: 'Friends - Connect & Share',
    description: 'Find friends, share your workout routines, personal records, and fitness journey with the Prodegi community.',
    keywords: 'fitness social network, share workouts, find friends, gym community',
    canonicalUrl: `${BASE_URL}/friends`,
  },
  settings: {
    title: 'Settings - Manage Your Profile',
    description: 'Configure your profile, privacy settings, and personal information in Prodegi.',
    keywords: 'account settings, privacy settings, profile management',
    canonicalUrl: `${BASE_URL}/settings`,
  },
  login: {
    title: 'Login - Start Tracking',
    description: 'Sign in to your Prodegi account to start tracking workouts and managing your fitness routine.',
    keywords: 'login, sign in, gym tracker login',
    canonicalUrl: `${BASE_URL}/login`,
  },
  onboarding: {
    title: 'Get Started - Set Up Your Routine',
    description: 'Create your first workout routine and customize Prodegi for your fitness goals.',
    keywords: 'onboarding, setup, create routine',
    canonicalUrl: `${BASE_URL}/onboarding`,
  },
};

export const updateLanguage = (lang: string) => {
  document.documentElement.lang = lang;
};

export const updateBreadcrumbs = (path: string) => {
  // Remove existing breadcrumb script
  const existingScript = document.getElementById('seo-breadcrumbs');
  if (existingScript) {
    existingScript.remove();
  }

  const parts = path.split('/').filter(Boolean);
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': BASE_URL
      },
      ...parts.map((part, index) => ({
        '@type': 'ListItem',
        'position': index + 2,
        'name': part.charAt(0).toUpperCase() + part.slice(1),
        'item': `${BASE_URL}/${parts.slice(0, index + 1).join('/')}`
      }))
    ]
  };

  const script = document.createElement('script');
  script.id = 'seo-breadcrumbs';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(breadcrumbList);
  document.head.appendChild(script);
};
