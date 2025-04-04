import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
}

const DEFAULT_TITLE = 'Thub Innovation - Education and Learning Platform';
const DEFAULT_DESCRIPTION = 'ThubInnovation offers premier educational programs, certifications, and courses focused on in-demand technical skills and career advancement.';
const DEFAULT_KEYWORDS = 'education, learning, courses, certification, technology, bootcamp, programs';
const DEFAULT_OG_IMAGE = '/thub-innovation-og.jpg';
const DEFAULT_OG_TYPE = 'website';

/**
 * SEO component for dynamically updating metadata on different pages
 * This component helps with SEO optimization across the application
 */
export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = DEFAULT_OG_TYPE,
  canonical
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Update Open Graph meta tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', ogImage);
    updateMetaTag('og:type', ogType);
    
    // Update Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    
    // Update canonical link if provided
    if (canonical) {
      updateCanonicalLink(canonical);
    }

    return () => {
      // Reset to default values when component unmounts
      document.title = DEFAULT_TITLE;
      updateMetaTag('description', DEFAULT_DESCRIPTION);
      updateMetaTag('keywords', DEFAULT_KEYWORDS);
      updateMetaTag('og:title', DEFAULT_TITLE);
      updateMetaTag('og:description', DEFAULT_DESCRIPTION);
      updateMetaTag('og:image', DEFAULT_OG_IMAGE);
      updateMetaTag('og:type', DEFAULT_OG_TYPE);
      updateMetaTag('twitter:title', DEFAULT_TITLE);
      updateMetaTag('twitter:description', DEFAULT_DESCRIPTION);
      updateMetaTag('twitter:image', DEFAULT_OG_IMAGE);
    };
  }, [title, description, keywords, ogImage, ogType, canonical]);

  // No visible UI, just metadata updates
  return null;
}

/**
 * Helper function to update meta tags
 */
function updateMetaTag(name: string, content: string): void {
  // Try to find an existing tag
  let metaTag: HTMLMetaElement | null = null;
  
  if (name.startsWith('og:')) {
    metaTag = document.querySelector(`meta[property="${name}"]`);
  } else {
    metaTag = document.querySelector(`meta[name="${name}"]`);
  }
  
  if (metaTag) {
    // Update existing tag
    metaTag.content = content;
  } else {
    // Create a new tag
    metaTag = document.createElement('meta');
    
    if (name.startsWith('og:')) {
      metaTag.setAttribute('property', name);
    } else {
      metaTag.setAttribute('name', name);
    }
    
    metaTag.content = content;
    document.head.appendChild(metaTag);
  }
}

/**
 * Helper function to update canonical link
 */
function updateCanonicalLink(href: string): void {
  // Try to find an existing canonical link
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  
  if (canonicalLink) {
    // Update existing link
    canonicalLink.setAttribute('href', href);
  } else {
    // Create a new link
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', href);
    document.head.appendChild(canonicalLink);
  }
}