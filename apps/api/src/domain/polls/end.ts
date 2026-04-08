import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import createError from 'http-errors';
import { ERROR_MESSAGES, MINIMUM_END_POLL_VOTERS } from '@okay-vote/contracts';

export const normalizeOrganizerToken = (organizerToken: string): string =>
    organizerToken.trim();

export const validateOrganizerToken = (organizerToken: string): void => {
    if (!organizerToken) {
        throw createError(400, ERROR_MESSAGES.organizerTokenRequired);
    }
};

export const hashOrganizerToken = (organizerToken: string): string =>
    createHash('sha256').update(organizerToken).digest('hex');

export const createOrganizerToken = (): {
    organizerToken: string;
    organizerTokenHash: string;
} => {
    const organizerToken = randomBytes(32).toString('hex');

    return {
        organizerToken,
        organizerTokenHash: hashOrganizerToken(organizerToken),
    };
};

export const matchesOrganizerToken = ({
    organizerToken,
    organizerTokenHash,
}: {
    organizerToken: string;
    organizerTokenHash: string | null;
}): boolean => {
    if (!organizerTokenHash || organizerTokenHash.length !== 64) {
        return false;
    }

    const expectedHashBuffer = Buffer.from(organizerTokenHash, 'hex');
    const actualHashBuffer = Buffer.from(
        hashOrganizerToken(organizerToken),
        'hex',
    );

    if (actualHashBuffer.length !== expectedHashBuffer.length) {
        return false;
    }

    return timingSafeEqual(actualHashBuffer, expectedHashBuffer);
};

export const hasEnoughVotersToEndPoll = (
    votes: Array<{ voterName: string }>,
): boolean =>
    new Set(votes.map(({ voterName }) => voterName)).size >=
    MINIMUM_END_POLL_VOTERS;
