import {
    buildPollSeoDescription,
    buildSeoTitle,
    DEFAULT_OG_IMAGE_ALT,
} from '../../apps/web/src/components/Seo/seoMetadata.ts';

type HTMLRewriterElement = {
    setAttribute(name: string, value: string): void;
    setInnerContent(content: string): void;
};

declare class HTMLRewriter {
    on(selector: string, handlers: ElementHandler): HTMLRewriter;
    transform(response: Response): Response;
}

type Context = {
    next: () => Promise<Response>;
};

type PollSeoPayload = {
    endedAt?: string;
    pollName: string;
};

type ElementHandler = {
    element: (element: HTMLRewriterElement) => void;
};

const updateTitle = (pageTitle: string): ElementHandler => ({
    element: (element: HTMLRewriterElement): void => {
        element.setInnerContent(pageTitle);
    },
});

const updateMetaContent = (content: string): ElementHandler => ({
    element: (element: HTMLRewriterElement): void => {
        element.setAttribute('content', content);
    },
});

const updateCanonicalLink = (href: string): ElementHandler => ({
    element: (element: HTMLRewriterElement): void => {
        element.setAttribute('href', href);
    },
});

const isPollSeoPayload = (value: unknown): value is PollSeoPayload =>
    Boolean(
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof (value as { pollName?: unknown }).pollName === 'string',
    );

const fetchPollSeoPayload = async (
    request: Request,
): Promise<PollSeoPayload | null> => {
    const requestUrl = new URL(request.url);
    const pollSlug = requestUrl.pathname
        .replace(/^\/votes\//, '')
        .replace(/\/+$/, '')
        .trim();

    if (!pollSlug) {
        return null;
    }

    const pollResponse = await fetch(
        new URL(`/api/polls/${encodeURIComponent(pollSlug)}`, request.url),
        {
            headers: {
                accept: 'application/json',
            },
        },
    );

    if (!pollResponse.ok) {
        return null;
    }

    const pollPayload: unknown = await pollResponse.json();

    return isPollSeoPayload(pollPayload) ? pollPayload : null;
};

export default async (
    request: Request,
    context: Context,
): Promise<Response> => {
    const [response, pollPayload] = await Promise.all([
        context.next(),
        fetchPollSeoPayload(request).catch(() => null),
    ]);

    if (!pollPayload) {
        return response;
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('text/html')) {
        return response;
    }

    const requestUrl = new URL(request.url);
    const canonicalUrl = requestUrl.toString();
    const pageTitle = buildSeoTitle(pollPayload.pollName);
    const description = buildPollSeoDescription({
        isEnded: Boolean(pollPayload.endedAt),
        pollName: pollPayload.pollName,
    });

    return new HTMLRewriter()
        .on('title', updateTitle(pageTitle))
        .on('meta[name="description"]', updateMetaContent(description))
        .on('meta[property="og:title"]', updateMetaContent(pageTitle))
        .on('meta[property="og:description"]', updateMetaContent(description))
        .on('meta[property="og:url"]', updateMetaContent(canonicalUrl))
        .on(
            'meta[property="og:image:alt"]',
            updateMetaContent(DEFAULT_OG_IMAGE_ALT),
        )
        .on('meta[name="twitter:title"]', updateMetaContent(pageTitle))
        .on('meta[name="twitter:description"]', updateMetaContent(description))
        .on(
            'meta[name="twitter:image:alt"]',
            updateMetaContent(DEFAULT_OG_IMAGE_ALT),
        )
        .on('link[rel="canonical"]', updateCanonicalLink(canonicalUrl))
        .transform(response);
};
