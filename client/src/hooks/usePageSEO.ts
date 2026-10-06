import { useEffect } from 'react';

export interface PageSEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: string;
  ogType?: string;
  ogImage?: string;
}

/**
 * Hook to dynamically synchronize page title, meta description,
 * canonical link, OpenGraph tags, and robots directives for SPA routes.
 */
export function usePageSEO({
  title,
  description,
  canonicalPath = '',
  robots = 'index, follow',
  ogType = 'website',
  ogImage = '/og-image.png',
}: PageSEOProps) {
  useEffect(() => {
    // 1. Update Document Title
    const originalTitle = document.title;
    document.title = title;

    // Helper to safely set or create meta elements
    const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Search Meta
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', robots);

    // 3. OpenGraph Social Meta
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);

    const fullUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${canonicalPath || window.location.pathname}`
      : canonicalPath;
    setMetaTag('property', 'og:url', fullUrl);

    const absoluteOgImage = ogImage.startsWith('http')
      ? ogImage
      : typeof window !== 'undefined'
      ? `${window.location.origin}${ogImage}`
      : ogImage;
    setMetaTag('property', 'og:image', absoluteOgImage);

    // 4. Twitter Meta
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', absoluteOgImage);

    // 5. Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullUrl);

    return () => {
      // Revert title if needed
      document.title = originalTitle;
    };
  }, [title, description, canonicalPath, robots, ogType, ogImage]);
}
