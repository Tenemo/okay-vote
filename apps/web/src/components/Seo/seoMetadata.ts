export const SITE_NAME = 'okay.vote';
export const SITE_URL = 'https://okay.vote';
export const DEFAULT_SEO_TITLE = `${SITE_NAME} | 1-10 score voting app`;
export const DEFAULT_SEO_DESCRIPTION =
    'Create and share 1-10 score votes, collect responses, and reveal results when you are ready.';
export const DEFAULT_OG_IMAGE_PATH = '/social/okay-vote-og.png';
export const DEFAULT_OG_IMAGE_ALT =
    'Screenshot of the okay.vote app showing a 1-10 score vote ready to share.';
export const DEFAULT_THEME_COLOR = '#121212';

type PollSeoDescriptionOptions = {
    isEnded: boolean;
    pollName: string;
};

type BuildPollOgImagePathOptions = {
    endedAt?: string | null;
};

type BuildPollOgImageAltOptions = {
    isEnded?: boolean;
};

export const buildSeoTitle = (title?: string): string =>
    title ? `${title} | ${SITE_NAME}` : DEFAULT_SEO_TITLE;

export const buildSiteUrl = (pathOrUrl: string): string =>
    new URL(pathOrUrl, SITE_URL).toString();

export const buildPollOgImagePath = (
    pollRef: string,
    options: BuildPollOgImagePathOptions = {},
): string => {
    const imagePath = `/og/vote/${encodeURIComponent(pollRef)}`;
    const endedAt = options.endedAt?.trim();

    if (!endedAt) {
        return imagePath;
    }

    return `${imagePath}?${new URLSearchParams({ v: endedAt }).toString()}`;
};

export const buildPollOgImageAlt = (
    pollName: string,
    options: BuildPollOgImageAltOptions = {},
): string =>
    options.isEnded
        ? `Final results preview for ${pollName} on okay.vote.`
        : `Preview image for ${pollName} on okay.vote.`;

export const buildPollSeoDescription = ({
    isEnded,
    pollName,
}: PollSeoDescriptionOptions): string =>
    isEnded
        ? `Voting results for ${pollName}`
        : `${pollName} - score options from 1 to 10.`;
