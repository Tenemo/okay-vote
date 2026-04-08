const MAX_TITLE_LINE_LENGTH = 16;
const MAX_TITLE_LINES = 3;
const MAX_VISIBLE_CHOICES = 4;
const MAX_VISIBLE_RESULTS = 4;
const MAX_CHOICE_LINE_LENGTH = 19;
const MAX_RESULT_LINE_LENGTH = 18;

type VoteOgImagePayload = {
    choiceNames: string[];
    isEnded?: boolean;
    pollName: string;
    results?: Record<string, number>;
};

type VoteResultEntry = {
    choiceName: string;
};

const escapeXml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');

const ELLIPSIS = '...';

const fitLineWithEllipsis = (value: string, maxLength: number): string => {
    if (maxLength <= ELLIPSIS.length) {
        return ELLIPSIS.slice(0, Math.max(maxLength, 0));
    }

    return `${value.slice(0, maxLength - ELLIPSIS.length).trimEnd()}${ELLIPSIS}`;
};

const truncateLine = (value: string, maxLength: number): string =>
    value.length <= maxLength ? value : fitLineWithEllipsis(value, maxLength);

const ellipsizeLine = (value: string, maxLength: number): string => {
    if (value.length + ELLIPSIS.length <= maxLength) {
        return `${value}${ELLIPSIS}`;
    }

    return fitLineWithEllipsis(value, maxLength);
};

const wrapText = (
    value: string,
    maxLineLength: number,
    maxLines: number,
): string[] => {
    const words = value.trim().split(/\s+/).filter(Boolean);

    if (!words.length) {
        return ['Untitled vote'];
    }

    const lines: string[] = [];
    let currentLine = '';
    let didTruncate = false;

    for (const word of words) {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;

        if (nextLine.length <= maxLineLength) {
            currentLine = nextLine;
            continue;
        }

        if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            lines.push(truncateLine(word, maxLineLength));
            currentLine = '';
        }

        if (lines.length === maxLines) {
            didTruncate = true;
            break;
        }
    }

    if (lines.length < maxLines && currentLine) {
        lines.push(currentLine);
    }

    if (lines.length > maxLines) {
        lines.length = maxLines;
    }

    if (lines.length === maxLines && (didTruncate || Boolean(currentLine))) {
        lines[maxLines - 1] = ellipsizeLine(lines[maxLines - 1], maxLineLength);
    }

    return lines;
};

const buildChoiceLines = (choiceNames: string[]): string[] => {
    const visibleChoices = choiceNames
        .slice(0, MAX_VISIBLE_CHOICES)
        .map((choiceName) => truncateLine(choiceName, MAX_CHOICE_LINE_LENGTH));

    if (choiceNames.length > MAX_VISIBLE_CHOICES) {
        visibleChoices.push(
            `+${choiceNames.length - MAX_VISIBLE_CHOICES} more`,
        );
    }

    return visibleChoices.length ? visibleChoices : ['No choices yet'];
};

const buildResultEntries = (
    results: Record<string, number> | undefined,
): VoteResultEntry[] =>
    Object.entries(results ?? {})
        .sort(([leftChoiceName, leftScore], [rightChoiceName, rightScore]) => {
            if (rightScore !== leftScore) {
                return rightScore - leftScore;
            }

            return leftChoiceName.localeCompare(rightChoiceName);
        })
        .slice(0, MAX_VISIBLE_RESULTS)
        .map(([choiceName]) => ({
            choiceName: truncateLine(choiceName, MAX_RESULT_LINE_LENGTH),
        }));

const buildOpenVoteMarkup = (choiceNames: string[]): string => {
    const choiceLines = buildChoiceLines(choiceNames);
    const choiceCountLabel =
        choiceNames.length === 1 ? '1 choice' : `${choiceNames.length} choices`;
    const choicesMarkup = choiceLines
        .map(
            (line, index) =>
                `<g transform="translate(780 ${190 + index * 62})"><circle cx="12" cy="12" fill="#8f8f8f" r="6" /><text x="34" y="22" fill="#f5f5f5" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="400">${escapeXml(line)}</text></g>`,
        )
        .join('');

    return `<text x="780" y="130" fill="#f5f5f5" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700">Choices</text>
    <text x="780" y="164" fill="#a3a3a3" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="400">${escapeXml(choiceCountLabel)}</text>
    ${choicesMarkup}`;
};

const buildEndedVoteMarkup = (
    choiceNames: string[],
    results: Record<string, number> | undefined,
): string => {
    const resultEntries = buildResultEntries(results);
    const scoredChoiceCount = Object.keys(results ?? {}).length;
    const resultCountLabel =
        scoredChoiceCount === 1
            ? '1 scored choice'
            : `${scoredChoiceCount} scored choices`;

    if (!resultEntries.length) {
        return `<text x="780" y="130" fill="#f5f5f5" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700">Results</text>
    <text x="780" y="164" fill="#a3a3a3" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="400">No scores submitted</text>
    <text x="780" y="248" fill="#f5f5f5" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="600">No submitted scores</text>
    <text x="780" y="292" fill="#9f9f9f" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="400">This vote ended before anyone voted.</text>
    <text x="780" y="352" fill="#9f9f9f" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="400">${escapeXml(
        choiceNames.length === 1
            ? '1 choice was available.'
            : `${choiceNames.length} choices were available.`,
    )}</text>`;
    }

    const rowsMarkup = resultEntries
        .map(
            ({ choiceName }, index) =>
                `<g transform="translate(776 ${178 + index * 84})"><rect width="308" height="64" rx="18" fill="#202020" stroke="#2c2c2c" /><text x="24" y="41" fill="#8f8f8f" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700">${index + 1}</text><text x="64" y="41" fill="#f5f5f5" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="600">${escapeXml(choiceName)}</text></g>`,
        )
        .join('');
    const hiddenChoiceCount = scoredChoiceCount - resultEntries.length;
    const hiddenChoiceMarkup =
        hiddenChoiceCount > 0
            ? `<text x="780" y="534" fill="#9f9f9f" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="400">+${hiddenChoiceCount} more scored choices</text>`
            : '';

    return `<text x="780" y="130" fill="#f5f5f5" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700">Results</text>
    <text x="780" y="164" fill="#a3a3a3" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="400">${escapeXml(resultCountLabel)}</text>
    ${rowsMarkup}
    ${hiddenChoiceMarkup}`;
};

export const buildVoteOgImageSvg = ({
    choiceNames,
    isEnded = false,
    pollName,
    results,
}: VoteOgImagePayload): string => {
    const titleStartY = 246;
    const titleLines = wrapText(
        pollName,
        MAX_TITLE_LINE_LENGTH,
        MAX_TITLE_LINES,
    );
    const titleMarkup = titleLines
        .map(
            (line, index) =>
                `<text x="80" y="${titleStartY + index * 84}" fill="#f5f5f5" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="700">${escapeXml(line)}</text>`,
        )
        .join('');
    const panelMarkup = isEnded
        ? buildEndedVoteMarkup(choiceNames, results)
        : buildOpenVoteMarkup(choiceNames);
    const eyebrowLabel = isEnded ? 'Final results' : '1-10 score vote';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(pollName)}">
    <defs>
        <linearGradient id="background" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#101010" />
            <stop offset="100%" stop-color="#171717" />
        </linearGradient>
        <radialGradient id="accent" cx="78%" cy="12%" r="62%">
            <stop offset="0%" stop-color="#2f2f2f" stop-opacity="0.7" />
            <stop offset="100%" stop-color="#2f2f2f" stop-opacity="0" />
        </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#background)" />
    <rect width="1200" height="630" fill="url(#accent)" />
    <text x="80" y="118" fill="#d4d4d4" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="600">okay.vote</text>
    <text x="80" y="168" fill="#9f9f9f" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="400">${eyebrowLabel}</text>
    <rect x="740" y="70" width="380" height="490" rx="28" fill="#1a1a1a" stroke="#2e2e2e" />
    ${titleMarkup}
    ${panelMarkup}
</svg>`;
};

export default buildVoteOgImageSvg;
