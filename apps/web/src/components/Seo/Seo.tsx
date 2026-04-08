import { type ReactElement } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export const SITE_NAME = 'okay.vote';
export const SITE_URL = 'https://okay.vote';
export const DEFAULT_SEO_TITLE = `${SITE_NAME} | 1-10 score voting app`;
export const DEFAULT_SEO_DESCRIPTION =
    'Create and share 1-10 score votes, collect responses, and reveal results when you are ready.';
export const DEFAULT_OG_IMAGE_PATH = '/social/okay-vote-og.png';
export const DEFAULT_OG_IMAGE_ALT =
    'Screenshot of the okay.vote app showing a 1-10 score vote ready to share.';
export const DEFAULT_THEME_COLOR = '#121212';
const OG_IMAGE_WIDTH = '1200';
const OG_IMAGE_HEIGHT = '630';

type SeoProps = {
    description?: string;
    imageAlt?: string;
    imagePath?: string;
    title?: string;
    type?: 'website';
};

const toAbsoluteSiteUrl = (pathOrUrl: string): string =>
    new URL(pathOrUrl, SITE_URL).toString();

export const Seo = ({
    description = DEFAULT_SEO_DESCRIPTION,
    imageAlt = DEFAULT_OG_IMAGE_ALT,
    imagePath = DEFAULT_OG_IMAGE_PATH,
    title,
    type = 'website',
}: SeoProps): ReactElement => {
    const { pathname, search } = useLocation();
    const canonicalUrl = toAbsoluteSiteUrl(`${pathname}${search}`);
    const imageUrl = toAbsoluteSiteUrl(imagePath);
    const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_SEO_TITLE;

    return (
        <Helmet>
            <title>{pageTitle}</title>
            <link href={canonicalUrl} rel="canonical" />
            <meta content={description} name="description" />
            <meta
                content="index,follow,max-image-preview:large"
                name="robots"
            />
            <meta content={SITE_NAME} name="application-name" />
            <meta content={SITE_NAME} name="apple-mobile-web-app-title" />
            <meta content={DEFAULT_THEME_COLOR} name="theme-color" />
            <meta content={SITE_NAME} property="og:site_name" />
            <meta content="en_US" property="og:locale" />
            <meta content={type} property="og:type" />
            <meta content={pageTitle} property="og:title" />
            <meta content={description} property="og:description" />
            <meta content={canonicalUrl} property="og:url" />
            <meta content={imageUrl} property="og:image" />
            <meta content={imageUrl} property="og:image:secure_url" />
            <meta content="image/png" property="og:image:type" />
            <meta content={OG_IMAGE_WIDTH} property="og:image:width" />
            <meta content={OG_IMAGE_HEIGHT} property="og:image:height" />
            <meta content={imageAlt} property="og:image:alt" />
            <meta content="summary_large_image" name="twitter:card" />
            <meta content={pageTitle} name="twitter:title" />
            <meta content={description} name="twitter:description" />
            <meta content={imageUrl} name="twitter:image" />
            <meta content={imageAlt} name="twitter:image:alt" />
        </Helmet>
    );
};

export default Seo;
