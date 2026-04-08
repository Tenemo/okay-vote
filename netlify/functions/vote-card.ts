import { cacheHeaders, DAY, HOUR } from '@netlify/cache';
import type { Config, Context } from '@netlify/functions';
import { Resvg } from '@resvg/resvg-js';

import { buildVoteOgImageSvg } from '../../apps/web/src/components/Seo/voteOgImage';

type VoteCardPayload = {
    choices: string[];
    pollName: string;
};

const OG_IMAGE_WIDTH = 1200;

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
            defaultFontFamily: 'Arial',
            loadSystemFonts: true,
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
    const body = new Blob([Uint8Array.from(png)], {
        type: 'image/png',
    });

    return new Response(body, {
        headers: {
            ...cacheHeaders({
                durable: true,
                swr,
                ttl,
            }),
            'content-type': 'image/png',
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
    _request: Request,
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
            HOUR,
            DAY,
        );
    }

    const voteCardPayload = await fetchVoteCardPayload(_request, pollRef).catch(
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
            HOUR,
            DAY,
        );
    }

    return createVoteCardResponse(voteCardPayload, 30 * DAY, 30 * DAY);
};

export const config: Config = {
    path: '/og/vote/:pollRef',
};
