const MAX_TITLE_LINE_LENGTH = 20;
const MAX_TITLE_LINES = 3;
const MAX_VISIBLE_CHOICES = 4;
const MAX_CHOICE_LINE_LENGTH = 22;

type VoteOgImagePayload = {
    choiceNames: string[];
    pollName: string;
};

const escapeXml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');

const truncateLine = (value: string, maxLength: number): string =>
    value.length <= maxLength
        ? value
        : `${value.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}...`;

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
            break;
        }
    }

    if (lines.length < maxLines && currentLine) {
        lines.push(currentLine);
    }

    if (lines.length > maxLines) {
        lines.length = maxLines;
    }

    if (
        lines.length === maxLines &&
        words.join(' ').length > lines.join(' ').length
    ) {
        lines[maxLines - 1] = truncateLine(lines[maxLines - 1], maxLineLength);
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

export const buildVoteOgImageSvg = ({
    choiceNames,
    pollName,
}: VoteOgImagePayload): string => {
    const titleLines = wrapText(
        pollName,
        MAX_TITLE_LINE_LENGTH,
        MAX_TITLE_LINES,
    );
    const choiceLines = buildChoiceLines(choiceNames);
    const titleMarkup = titleLines
        .map(
            (line, index) =>
                `<text x="80" y="${246 + index * 86}" fill="#f5f5f5" font-family="Inter, Arial, sans-serif" font-size="74" font-weight="700">${escapeXml(line)}</text>`,
        )
        .join('');
    const choicesMarkup = choiceLines
        .map(
            (line, index) =>
                `<g transform="translate(780 ${190 + index * 62})"><circle cx="12" cy="12" fill="#8f8f8f" r="6" /><text x="34" y="22" fill="#f5f5f5" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="400">${escapeXml(line)}</text></g>`,
        )
        .join('');
    const choiceCountLabel =
        choiceNames.length === 1 ? '1 choice' : `${choiceNames.length} choices`;

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
    <text x="80" y="118" fill="#d4d4d4" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="600">okay.vote</text>
    <text x="80" y="168" fill="#9f9f9f" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="400">1-10 score vote</text>
    <rect x="740" y="70" width="380" height="490" rx="28" fill="#1a1a1a" stroke="#2e2e2e" />
    ${titleMarkup}
    <text x="780" y="130" fill="#f5f5f5" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700">Choices</text>
    <text x="780" y="164" fill="#a3a3a3" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="400">${escapeXml(choiceCountLabel)}</text>
    ${choicesMarkup}
</svg>`;
};

export default buildVoteOgImageSvg;
