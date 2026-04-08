import { type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Copy, Share2 } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ShareLinkFeedbackTone = 'default' | 'destructive' | 'success';

export type ShareLinkFeedback = {
    text: string;
    tone: ShareLinkFeedbackTone;
};

type SharePollLinkProps = {
    feedback: ShareLinkFeedback;
    onCopy: () => void;
    onShare: () => void;
    pollUrl: string;
};

export const SharePollLink = ({
    feedback,
    onCopy,
    onShare,
    pollUrl,
}: SharePollLinkProps): ReactElement => {
    return (
        <div className="grid gap-2">
            <Label htmlFor="pollUrl">Share vote link</Label>
            <div className="relative">
                <Input
                    aria-describedby="copy-page-link-helper-text"
                    className="pr-24"
                    id="pollUrl"
                    readOnly
                    value={pollUrl}
                    variant="filled"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
                    <Button
                        aria-label="Share vote link"
                        onClick={onShare}
                        size="icon"
                        title="Share link"
                        type="button"
                        variant="ghost"
                    >
                        <Share2 className="size-4" />
                    </Button>
                    <Button
                        aria-label="Copy vote link"
                        onClick={onCopy}
                        size="icon"
                        title="Copy to clipboard"
                        type="button"
                        variant="ghost"
                    >
                        <Copy className="size-4" />
                    </Button>
                </div>
            </div>
            <p
                aria-live="polite"
                className={`field-note ${
                    feedback.tone === 'destructive'
                        ? 'text-destructive'
                        : feedback.tone === 'success'
                          ? 'text-emerald-400'
                          : ''
                }`}
                id="copy-page-link-helper-text"
            >
                {feedback.text}
            </p>
        </div>
    );
};

export default SharePollLink;
