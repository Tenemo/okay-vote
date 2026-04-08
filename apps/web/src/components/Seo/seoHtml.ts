type MetaAttributeName = 'name' | 'property';

type SeoHtmlMetadata = {
    canonicalUrl: string;
    description: string;
    imageAlt: string;
    pageTitle: string;
};

const escapeHtml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

const escapeRegex = (value: string): string =>
    value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

const insertIntoHead = (html: string, tag: string): string =>
    html.replace(/<\/head>/i, `        ${tag}\n    </head>`);

const replaceOrInsertTag = (
    html: string,
    pattern: RegExp,
    tag: string,
): string =>
    pattern.test(html) ? html.replace(pattern, tag) : insertIntoHead(html, tag);

const replaceOrInsertMetaTag = (
    html: string,
    attributeName: MetaAttributeName,
    attributeValue: string,
    content: string,
): string =>
    replaceOrInsertTag(
        html,
        new RegExp(
            `<meta\\s+[^>]*${attributeName}=["']${escapeRegex(attributeValue)}["'][^>]*>`,
            'i',
        ),
        `<meta ${attributeName}="${attributeValue}" content="${escapeHtml(content)}" />`,
    );

export const applySeoHtmlMetadata = (
    html: string,
    { canonicalUrl, description, imageAlt, pageTitle }: SeoHtmlMetadata,
): string => {
    let nextHtml = replaceOrInsertTag(
        html,
        /<title>[\s\S]*?<\/title>/i,
        `<title>${escapeHtml(pageTitle)}</title>`,
    );

    nextHtml = replaceOrInsertTag(
        nextHtml,
        /<link\s+[^>]*rel=["']canonical["'][^>]*>/i,
        `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    );

    for (const [attributeName, attributeValue, content] of [
        ['name', 'description', description],
        ['property', 'og:title', pageTitle],
        ['property', 'og:description', description],
        ['property', 'og:url', canonicalUrl],
        ['property', 'og:image:alt', imageAlt],
        ['name', 'twitter:title', pageTitle],
        ['name', 'twitter:description', description],
        ['name', 'twitter:image:alt', imageAlt],
    ] as const) {
        nextHtml = replaceOrInsertMetaTag(
            nextHtml,
            attributeName,
            attributeValue,
            content,
        );
    }

    return nextHtml;
};

export default applySeoHtmlMetadata;
