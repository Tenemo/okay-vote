import slugify from '@sindresorhus/slugify';

export const POLL_SLUG_SUFFIX_LENGTHS = [8, 12, 16, 20, 24, 32] as const;
export const MAX_POLL_SLUG_TITLE_LENGTH = 32;
export const FALLBACK_POLL_SLUG_TITLE = 'vote';

export const normalizePollSlugTitleSegment = (pollName: string): string => {
    const slugifiedTitle = slugify(pollName, {
        separator: '-',
    });
    const truncatedTitle = slugifiedTitle
        .slice(0, MAX_POLL_SLUG_TITLE_LENGTH)
        .replace(/^-+|-+$/g, '');

    return truncatedTitle || FALLBACK_POLL_SLUG_TITLE;
};

export const buildPollSlug = (
    pollName: string,
    pollId: string,
    suffixLength: (typeof POLL_SLUG_SUFFIX_LENGTHS)[number],
): string => {
    const normalizedPollId = pollId.replaceAll('-', '');
    const titleSegment = normalizePollSlugTitleSegment(pollName);
    const idSuffix = normalizedPollId.slice(-suffixLength);

    return `${titleSegment}--${idSuffix}`;
};

export const getPollSlugCandidates = (
    pollName: string,
    pollId: string,
): string[] =>
    POLL_SLUG_SUFFIX_LENGTHS.map((suffixLength) =>
        buildPollSlug(pollName, pollId, suffixLength),
    );
