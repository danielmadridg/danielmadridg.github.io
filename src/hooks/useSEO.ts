import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updateSEO, pageSEOConfig, updateLanguage, updateBreadcrumbs } from '../utils/seo';
import type { SEOConfig } from '../utils/seo';
import { useLanguage } from '../context/LanguageContext';
import { updateHreflang } from '../utils/advancedSEO';

/**
 * Hook to automatically update SEO tags based on current route
 */
export const useSEO = (customConfig?: SEOConfig) => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    // Update language attribute
    updateLanguage(language);

    // Update Breadcrumbs
    updateBreadcrumbs(location.pathname);

    // Update hreflang tags for multilingual support
    updateHreflang(location.pathname);

    if (customConfig) {
      updateSEO(customConfig);
    } else {
      // Auto-detect page from pathname
      const pathname = location.pathname.substring(1) || 'home';
      const page = pathname.split('/')[0];

      if (pageSEOConfig[page]) {
        updateSEO(pageSEOConfig[page]);
      }
    }

    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location, customConfig, language]);
};
