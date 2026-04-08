import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Config, Context } from '@netlify/functions';
import { Resvg } from '@resvg/resvg-js';

import { buildVoteOgImageSvg } from '../../apps/web/src/components/Seo/voteOgImage';

type VoteCardPayload = {
    choices: string[];
    endedAt?: string;
    pollName: string;
    results?: Record<string, number>;
};

type VoteCardFetchResult =
    | {
          payload: VoteCardPayload;
          status: 'found';
      }
    | {
          status: 'not-found';
      }
    | {
          status: 'unavailable';
      };

type VoteCardCachePolicy = {
    browser: string;
    cdn: string;
    netlifyCdn: string;
};

const OG_IMAGE_WIDTH = 1200;
const FONT_FILE_NAMES = ['Inter-Regular.ttf', 'Inter-Bold.ttf'] as const;

const getFontDirectoryCandidates = (): string[] => {
    const candidates = [
        resolve(process.cwd(), 'netlify/functions/assets/fonts'),
        resolve(process.cwd(), 'assets/fonts'),
    ];

    if (typeof __dirname === 'string') {
        candidates.push(resolve(__dirname, 'assets', 'fonts'));
    }

    return candidates;
};

const resolveFontFiles = (): string[] => {
    for (const directory of getFontDirectoryCandidates()) {
        const fontFiles = FONT_FILE_NAMES.map((fontFileName) =>
            resolve(directory, fontFileName),
        );

        if (fontFiles.every((fontFile) => existsSync(fontFile))) {
            return fontFiles;
        }
    }

    throw new Error('Unable to locate bundled OG image fonts.');
};

const DAY_IN_SECONDS = 60 * 60 * 24;
const HOUR_IN_SECONDS = 60 * 60;
let cachedFontFiles: string[] | null | undefined;

const persistentImageCachePolicy: VoteCardCachePolicy = {
    browser: 'public, max-age=0, must-revalidate',
    cdn: `public, max-age=${30 * DAY_IN_SECONDS}, stale-while-revalidate=${30 * DAY_IN_SECONDS}`,
    netlifyCdn: `public, durable, max-age=${30 * DAY_IN_SECONDS}, stale-while-revalidate=${30 * DAY_IN_SECONDS}`,
};

const notFoundImageCachePolicy: VoteCardCachePolicy = {
    browser: 'public, max-age=0, must-revalidate',
    cdn: `public, max-age=${HOUR_IN_SECONDS}, stale-while-revalidate=${DAY_IN_SECONDS}`,
    netlifyCdn: `public, durable, max-age=${HOUR_IN_SECONDS}, stale-while-revalidate=${DAY_IN_SECONDS}`,
};

const unavailableImageCachePolicy: VoteCardCachePolicy = {
    browser: 'no-store',
    cdn: 'no-store',
    netlifyCdn: 'no-store',
};

const getFontFiles = (): string[] | undefined => {
    if (cachedFontFiles !== undefined) {
        return cachedFontFiles ?? undefined;
    }

    try {
        cachedFontFiles = resolveFontFiles();
    } catch {
        cachedFontFiles = null;
    }

    return cachedFontFiles ?? undefined;
};

const isVoteCardPayload = (value: unknown): value is VoteCardPayload =>
    Boolean(
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof (value as { pollName?: unknown }).pollName === 'string' &&
        Array.isArray((value as { choices?: unknown }).choices) &&
        (value as { choices: unknown[] }).choices.every(
            (choice) => typeof choice === 'string',
        ) &&
        (typeof (value as { endedAt?: unknown }).endedAt === 'undefined' ||
            typeof (value as { endedAt?: unknown }).endedAt === 'string') &&
        (typeof (value as { results?: unknown }).results === 'undefined' ||
            (Boolean((value as { results?: unknown }).results) &&
                typeof (value as { results?: unknown }).results === 'object' &&
                !Array.isArray((value as { results?: unknown }).results) &&
                Object.values(
                    (value as { results: Record<string, unknown> }).results,
                ).every((score) => typeof score === 'number'))),
    );

const renderVoteCardPng = (payload: VoteCardPayload): Uint8Array => {
    const fontFiles = getFontFiles();
    const svg = buildVoteOgImageSvg({
        choiceNames: payload.choices,
        isEnded: Boolean(payload.endedAt),
        pollName: payload.pollName,
        results: payload.results,
    });
    const image = new Resvg(svg, {
        fitTo: {
            mode: 'width',
            value: OG_IMAGE_WIDTH,
        },
        font: {
            defaultFontFamily: fontFiles ? 'Inter' : 'sans-serif',
            ...(fontFiles ? { fontFiles } : {}),
            loadSystemFonts: !fontFiles,
            sansSerifFamily: fontFiles ? 'Inter' : 'sans-serif',
        },
    }).render();

    return image.asPng();
};

const createVoteCardResponse = (
    payload: VoteCardPayload,
    {
        cachePolicy,
        status = 200,
    }: {
        cachePolicy: VoteCardCachePolicy;
        status?: number;
    },
): Response => {
    const png = renderVoteCardPng(payload);
    const body = Buffer.from(
        png.buffer as ArrayBuffer,
        png.byteOffset,
        png.byteLength,
    );

    return new Response(body, {
        headers: {
            'cache-control': cachePolicy.browser,
            'cdn-cache-control': cachePolicy.cdn,
            'content-type': 'image/png',
            'netlify-cdn-cache-control': cachePolicy.netlifyCdn,
        },
        status,
    });
};

const fetchVoteCardPayload = async (
    request: Request,
    pollRef: string,
): Promise<VoteCardFetchResult> => {
    const pollResponse = await fetch(
        new URL(`/api/polls/${encodeURIComponent(pollRef)}`, request.url),
        {
            headers: {
                accept: 'application/json',
            },
        },
    );

    if (pollResponse.status === 404) {
        return {
            status: 'not-found',
        };
    }

    if (!pollResponse.ok) {
        return {
            status: 'unavailable',
        };
    }

    const pollPayload: unknown = await pollResponse.json();

    if (!isVoteCardPayload(pollPayload)) {
        return {
            status: 'unavailable',
        };
    }

    return {
        payload: pollPayload,
        status: 'found',
    };
};

export default async (
    request: Request,
    context: Context,
): Promise<Response> => {
    const pollRef = context.params.pollRef?.trim();

    if (!pollRef) {
        return createVoteCardResponse(
            {
                choices: [
                    'Share the link',
                    'Collect responses',
                    'Reveal results',
                ],
                pollName: 'okay.vote',
            },
            {
                cachePolicy: notFoundImageCachePolicy,
            },
        );
    }

    const voteCardResult = await fetchVoteCardPayload(request, pollRef).catch(
        (): VoteCardFetchResult => ({
            status: 'unavailable',
        }),
    );

    if (voteCardResult.status === 'not-found') {
        return createVoteCardResponse(
            {
                choices: [
                    'Share the link',
                    'Collect responses',
                    'Reveal results',
                ],
                pollName: 'Vote not found',
            },
            {
                cachePolicy: notFoundImageCachePolicy,
            },
        );
    }

    if (voteCardResult.status === 'unavailable') {
        return createVoteCardResponse(
            {
                choices: ['Try again shortly'],
                pollName: 'Vote unavailable',
            },
            {
                cachePolicy: unavailableImageCachePolicy,
                status: 503,
            },
        );
    }

    return createVoteCardResponse(voteCardResult.payload, {
        cachePolicy: persistentImageCachePolicy,
    });
};

export const config: Config = {
    path: '/og/vote/:pollRef',
};
