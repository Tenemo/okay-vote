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

export const buildSeoTitle = (title?: string): string =>
    title ? `${title} | ${SITE_NAME}` : DEFAULT_SEO_TITLE;

export const buildPollSeoDescription = ({
    isEnded,
    pollName,
}: PollSeoDescriptionOptions): string =>
    isEnded
        ? `Review the final 1-10 score voting results for ${pollName} in okay.vote.`
        : `Score every option in ${pollName} from 1 to 10 with the okay.vote app.`;
