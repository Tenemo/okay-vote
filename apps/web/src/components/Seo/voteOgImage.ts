const MAX_TITLE_LINE_LENGTH = 18;
const MAX_TITLE_LINES = 3;
const MAX_VISIBLE_CHOICES = 4;
const MAX_CHOICE_LINE_LENGTH = 24;

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
                `<text x="80" y="${180 + index * 88}" fill="#f7f3ea" font-family="Arial, sans-serif" font-size="72" font-weight="700">${escapeXml(line)}</text>`,
        )
        .join('');
    const choicesMarkup = choiceLines
        .map(
            (line, index) =>
                `<text x="760" y="${238 + index * 48}" fill="#f7f3ea" font-family="Arial, sans-serif" font-size="28" font-weight="500">${escapeXml(line)}</text>`,
        )
        .join('');
    const choiceCountLabel =
        choiceNames.length === 1 ? '1 choice' : `${choiceNames.length} choices`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(pollName)}">
    <defs>
        <linearGradient id="surface" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#101010" />
            <stop offset="100%" stop-color="#181818" />
        </linearGradient>
        <radialGradient id="glow" cx="72%" cy="18%" r="70%">
            <stop offset="0%" stop-color="#f6c982" stop-opacity="0.32" />
            <stop offset="100%" stop-color="#f6c982" stop-opacity="0" />
        </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#surface)" rx="36" />
    <rect width="1200" height="630" fill="url(#glow)" rx="36" />
    <rect x="730" y="92" width="390" height="324" fill="#1c1c1c" opacity="0.96" rx="28" stroke="#303030" />
    <text x="80" y="92" fill="#d0c8b8" font-family="Arial, sans-serif" font-size="24" font-weight="600">okay.vote</text>
    <text x="80" y="128" fill="#8f8779" font-family="Arial, sans-serif" font-size="24" font-weight="500">1-10 score vote</text>
    ${titleMarkup}
    <text x="760" y="146" fill="#d0c8b8" font-family="Arial, sans-serif" font-size="22" font-weight="600">Choices</text>
    <text x="760" y="184" fill="#8f8779" font-family="Arial, sans-serif" font-size="22" font-weight="500">${escapeXml(choiceCountLabel)}</text>
    ${choicesMarkup}
    <text x="80" y="564" fill="#8f8779" font-family="Arial, sans-serif" font-size="28" font-weight="500">Share the vote. Collect scores. Reveal results when you are ready.</text>
    <text x="80" y="600" fill="#f6c982" font-family="Arial, sans-serif" font-size="26" font-weight="600">okay.vote</text>
</svg>`;
};

export default buildVoteOgImageSvg;
