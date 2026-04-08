type HTMLRewriterElement = {
    setAttribute(name: string, value: string): void;
    setInnerContent(content: string): void;
};

declare class HTMLRewriter {
    on(
        selector: string,
        handlers: {
            element?: (element: HTMLRewriterElement) => void;
        },
    ): HTMLRewriter;

    transform(response: Response): Response;
}
