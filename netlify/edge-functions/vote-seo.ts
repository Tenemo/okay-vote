import {
    buildPollOgImageAlt,
    buildPollOgImagePath,
    buildPollSeoDescription,
    buildSiteUrl,
    buildSeoTitle,
} from '../../apps/web/src/components/Seo/seoMetadata.ts';
import { applySeoHtmlMetadata } from '../../apps/web/src/components/Seo/seoHtml.ts';

type Context = {
    next: () => Promise<Response>;
};

type PollSeoPayload = {
    endedAt?: string;
    pollName: string;
};

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
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return context.next();
    }

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
    const pollRef = requestUrl.pathname
        .replace(/^\/votes\//, '')
        .replace(/\/+$/, '')
        .trim();
    const canonicalUrl = buildSiteUrl(
        `${requestUrl.pathname}${requestUrl.search}`,
    );
    const pageTitle = buildSeoTitle(pollPayload.pollName);
    const description = buildPollSeoDescription({
        isEnded: Boolean(pollPayload.endedAt),
        pollName: pollPayload.pollName,
    });
    const imageUrl = new URL(
        buildPollOgImagePath(pollRef),
        requestUrl,
    ).toString();
    const html = applySeoHtmlMetadata(await response.text(), {
        canonicalUrl,
        description,
        imageAlt: buildPollOgImageAlt(pollPayload.pollName),
        imageUrl,
        pageTitle,
    });
    const headers = new Headers(response.headers);

    headers.set('content-type', 'text/html; charset=utf-8');
    headers.delete('content-encoding');
    headers.delete('content-length');
    headers.delete('etag');

    return new Response(request.method === 'HEAD' ? null : html, {
        headers,
        status: response.status,
        statusText: response.statusText,
    });
};
