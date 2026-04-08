import { useEffect, type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';

import {
    buildSiteUrl,
    buildSeoTitle,
    DEFAULT_OG_IMAGE_ALT,
    DEFAULT_OG_IMAGE_PATH,
    DEFAULT_SEO_DESCRIPTION,
    DEFAULT_THEME_COLOR,
    SITE_NAME,
} from '../../seo/seoMetadata';

const OG_IMAGE_WIDTH = '1200';
const OG_IMAGE_HEIGHT = '630';

type SeoProps = {
    description?: string;
    imageAlt?: string;
    imagePath?: string;
    title?: string;
};

type MetaTagDefinition =
    | {
          content: string;
          name: string;
      }
    | {
          content: string;
          property: string;
      };

const syncMetaTag = (definition: MetaTagDefinition): void => {
    const selector =
        'name' in definition
            ? `meta[name="${definition.name}"]`
            : `meta[property="${definition.property}"]`;
    const [existingTag, ...duplicateTags] = Array.from(
        document.head.querySelectorAll<HTMLMetaElement>(selector),
    );
    const metaTag = existingTag ?? document.createElement('meta');

    if ('name' in definition) {
        metaTag.setAttribute('name', definition.name);
        metaTag.removeAttribute('property');
    } else {
        metaTag.setAttribute('property', definition.property);
        metaTag.removeAttribute('name');
    }

    metaTag.setAttribute('content', definition.content);

    if (!existingTag) {
        document.head.append(metaTag);
    }

    for (const duplicateTag of duplicateTags) {
        duplicateTag.remove();
    }
};

const syncCanonicalLink = (href: string): void => {
    const [existingLink, ...duplicateLinks] = Array.from(
        document.head.querySelectorAll<HTMLLinkElement>(
            'link[rel="canonical"]',
        ),
    );
    const canonicalLink = existingLink ?? document.createElement('link');

    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', href);

    if (!existingLink) {
        document.head.append(canonicalLink);
    }

    for (const duplicateLink of duplicateLinks) {
        duplicateLink.remove();
    }
};

export const Seo = ({
    description = DEFAULT_SEO_DESCRIPTION,
    imageAlt = DEFAULT_OG_IMAGE_ALT,
    imagePath = DEFAULT_OG_IMAGE_PATH,
    title,
}: SeoProps): ReactElement | null => {
    const { pathname, search } = useLocation();
    const canonicalUrl = buildSiteUrl(`${pathname}${search}`);
    const imageUrl = buildSiteUrl(imagePath);
    const pageTitle = buildSeoTitle(title);

    useEffect(() => {
        document.title = pageTitle;
        syncCanonicalLink(canonicalUrl);

        for (const tagDefinition of [
            {
                content: description,
                name: 'description',
            },
            {
                content: 'index,follow,max-image-preview:large',
                name: 'robots',
            },
            {
                content: SITE_NAME,
                name: 'application-name',
            },
            {
                content: SITE_NAME,
                name: 'apple-mobile-web-app-title',
            },
            {
                content: DEFAULT_THEME_COLOR,
                name: 'theme-color',
            },
            {
                content: SITE_NAME,
                property: 'og:site_name',
            },
            {
                content: 'en_US',
                property: 'og:locale',
            },
            {
                content: 'website',
                property: 'og:type',
            },
            {
                content: pageTitle,
                property: 'og:title',
            },
            {
                content: description,
                property: 'og:description',
            },
            {
                content: canonicalUrl,
                property: 'og:url',
            },
            {
                content: imageUrl,
                property: 'og:image',
            },
            {
                content: imageUrl,
                property: 'og:image:secure_url',
            },
            {
                content: 'image/png',
                property: 'og:image:type',
            },
            {
                content: OG_IMAGE_WIDTH,
                property: 'og:image:width',
            },
            {
                content: OG_IMAGE_HEIGHT,
                property: 'og:image:height',
            },
            {
                content: imageAlt,
                property: 'og:image:alt',
            },
            {
                content: 'summary_large_image',
                name: 'twitter:card',
            },
            {
                content: pageTitle,
                name: 'twitter:title',
            },
            {
                content: description,
                name: 'twitter:description',
            },
            {
                content: imageUrl,
                name: 'twitter:image',
            },
            {
                content: imageAlt,
                name: 'twitter:image:alt',
            },
        ] satisfies MetaTagDefinition[]) {
            syncMetaTag(tagDefinition);
        }
    }, [canonicalUrl, description, imageAlt, imageUrl, pageTitle]);

    return null;
};

export default Seo;
