import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Config, Context } from '@netlify/functions';
import { Resvg } from '@resvg/resvg-js';

import { buildVoteOgImageSvg } from '../../apps/web/src/components/Seo/voteOgImage';

type VoteCardPayload = {
    choices: string[];
    pollName: string;
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

const FONT_FILES = resolveFontFiles();
const DAY_IN_SECONDS = 60 * 60 * 24;
const HOUR_IN_SECONDS = 60 * 60;

const isVoteCardPayload = (value: unknown): value is VoteCardPayload =>
    Boolean(
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof (value as { pollName?: unknown }).pollName === 'string' &&
        Array.isArray((value as { choices?: unknown }).choices) &&
        (value as { choices: unknown[] }).choices.every(
            (choice) => typeof choice === 'string',
        ),
    );

const renderVoteCardPng = (payload: VoteCardPayload): Uint8Array => {
    const svg = buildVoteOgImageSvg({
        choiceNames: payload.choices,
        pollName: payload.pollName,
    });
    const image = new Resvg(svg, {
        fitTo: {
            mode: 'width',
            value: OG_IMAGE_WIDTH,
        },
        font: {
            defaultFontFamily: 'Inter',
            fontFiles: FONT_FILES,
            loadSystemFonts: false,
            sansSerifFamily: 'Inter',
        },
    }).render();

    return image.asPng();
};

const createVoteCardResponse = (
    payload: VoteCardPayload,
    ttl: number,
    swr: number,
): Response => {
    const png = renderVoteCardPng(payload);
    const body =
        png.buffer instanceof ArrayBuffer
            ? Buffer.from(png.buffer, png.byteOffset, png.byteLength)
            : Buffer.from(png);

    return new Response(body, {
        headers: {
            'cache-control': 'public, max-age=0, must-revalidate',
            'cdn-cache-control': `public, max-age=${ttl}, stale-while-revalidate=${swr}`,
            'content-type': 'image/png',
            'netlify-cdn-cache-control': `public, durable, max-age=${ttl}, stale-while-revalidate=${swr}`,
        },
        status: 200,
    });
};

const fetchVoteCardPayload = async (
    request: Request,
    pollRef: string,
): Promise<VoteCardPayload | null> => {
    const pollResponse = await fetch(
        new URL(`/api/polls/${encodeURIComponent(pollRef)}`, request.url),
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

    return isVoteCardPayload(pollPayload) ? pollPayload : null;
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
            HOUR_IN_SECONDS,
            DAY_IN_SECONDS,
        );
    }

    const voteCardPayload = await fetchVoteCardPayload(request, pollRef).catch(
        () => null,
    );

    if (!voteCardPayload) {
        return createVoteCardResponse(
            {
                choices: [
                    'Share the link',
                    'Collect responses',
                    'Reveal results',
                ],
                pollName: 'Vote not found',
            },
            HOUR_IN_SECONDS,
            DAY_IN_SECONDS,
        );
    }

    return createVoteCardResponse(
        voteCardPayload,
        30 * DAY_IN_SECONDS,
        30 * DAY_IN_SECONDS,
    );
};

export const config: Config = {
    path: '/og/vote/:pollRef',
};
