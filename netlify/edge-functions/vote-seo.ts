import {
    buildPollOgImageAlt,
    buildPollOgImagePath,
    buildPollSeoDescription,
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

const OPEN_POLL_SEO_CACHE_TTL_MS = 5 * 1000;
const ENDED_POLL_SEO_CACHE_TTL_MS = 60 * 1000;
const MAX_POLL_SEO_CACHE_ENTRIES = 128;
const pollSeoPayloadCache = new Map<
    string,
    {
        expiresAt: number;
        payload: PollSeoPayload;
    }
>();

const prunePollSeoPayloadCache = (now: number): void => {
    for (const [pollSlug, cachedPayload] of pollSeoPayloadCache) {
        if (cachedPayload.expiresAt <= now) {
            pollSeoPayloadCache.delete(pollSlug);
        }
    }

    while (pollSeoPayloadCache.size >= MAX_POLL_SEO_CACHE_ENTRIES) {
        const oldestPollSlug = pollSeoPayloadCache.keys().next().value;

        if (!oldestPollSlug) {
            break;
        }

        pollSeoPayloadCache.delete(oldestPollSlug);
    }
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
    const now = Date.now();
    const requestUrl = new URL(request.url);
    const pollSlug = requestUrl.pathname
        .replace(/^\/votes\//, '')
        .replace(/\/+$/, '')
        .trim();

    if (!pollSlug) {
        return null;
    }

    const cachedPayload = pollSeoPayloadCache.get(pollSlug);

    if (cachedPayload && cachedPayload.expiresAt > now) {
        return cachedPayload.payload;
    }

    if (cachedPayload) {
        pollSeoPayloadCache.delete(pollSlug);
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

    if (!isPollSeoPayload(pollPayload)) {
        return null;
    }

    prunePollSeoPayloadCache(now);
    pollSeoPayloadCache.set(pollSlug, {
        expiresAt:
            now +
            (pollPayload.endedAt
                ? ENDED_POLL_SEO_CACHE_TTL_MS
                : OPEN_POLL_SEO_CACHE_TTL_MS),
        payload: pollPayload,
    });

    return pollPayload;
};

export default async (
    request: Request,
    context: Context,
): Promise<Response> => {
    if (request.method !== 'GET') {
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
    const requestOrigin = `${requestUrl.protocol}//${requestUrl.host}`;
    const canonicalUrl = new URL(
        `${requestUrl.pathname}${requestUrl.search}`,
        requestOrigin,
    ).toString();
    const pageTitle = buildSeoTitle(pollPayload.pollName);
    const description = buildPollSeoDescription({
        isEnded: Boolean(pollPayload.endedAt),
        pollName: pollPayload.pollName,
    });
    const imageUrl = new URL(
        buildPollOgImagePath(pollRef, {
            endedAt: pollPayload.endedAt,
        }),
        requestOrigin,
    ).toString();
    const html = applySeoHtmlMetadata(await response.text(), {
        canonicalUrl,
        description,
        imageAlt: buildPollOgImageAlt(pollPayload.pollName, {
            isEnded: Boolean(pollPayload.endedAt),
        }),
        imageUrl,
        pageTitle,
    });
    const headers = new Headers(response.headers);

    headers.set('content-type', 'text/html; charset=utf-8');
    headers.delete('content-encoding');
    headers.delete('content-length');
    headers.delete('etag');

    return new Response(html, {
        headers,
        status: response.status,
        statusText: response.statusText,
    });
};
