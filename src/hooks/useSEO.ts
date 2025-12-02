import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updateSEO, pageSEOConfig } from '../utils/seo';
import type { SEOConfig } from '../utils/seo';

/**
 * Hook to automatically update SEO tags based on current route
 */
export const useSEO = (customConfig?: SEOConfig) => {
  const location = useLocation();

  useEffect(() => {
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
  }, [location, customConfig]);
};
