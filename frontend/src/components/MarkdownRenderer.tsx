import { FC, useEffect, useRef, useState, memo, ReactNode, Children, cloneElement, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';

// Initialize mermaid with Neo-Brutalist theme
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        primaryColor: '#FFD700',
        primaryTextColor: '#000000',
        primaryBorderColor: '#000000',
        lineColor: '#000000',
        secondaryColor: '#FFFFFF',
        tertiaryColor: '#F5F5F5',
        fontFamily: 'Space Grotesk, sans-serif',
    },
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
    },
});

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// Mermaid diagram component
const MermaidDiagram: FC<{ chart: string }> = memo(({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const renderDiagram = async () => {
            if (!chart.trim()) return;

            try {
                const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
                setError('');
            } catch (err) {
                console.error('Mermaid rendering error:', err);
                setError('Failed to render diagram');
            }
        };

        renderDiagram();
    }, [chart]);

    if (error) {
        return (
            <div className="border-[3px] border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 p-3 my-3">
                <p className="text-xs font-bold uppercase text-[hsl(var(--destructive))]">DIAGRAM ERROR</p>
                <pre className="text-xs mt-1 text-muted-foreground overflow-x-auto whitespace-pre-wrap">{chart}</pre>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="border-[3px] border-foreground bg-[hsl(var(--muted))] p-4 my-3 animate-pulse">
                <p className="text-xs font-bold uppercase">RENDERING DIAGRAM...</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="my-3 p-4 border-[3px] border-foreground bg-white overflow-x-auto"
            style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
});

MermaidDiagram.displayName = 'MermaidDiagram';

// Code block component with copy button
const CodeBlockWrapper: FC<{ children: ReactNode; language: string; code: string }> = memo(({
    children,
    language,
    code
}) => {
    const [copied, setCopied] = useState(false);

    // Check if it's a mermaid diagram
    if (language === 'mermaid') {
        return <MermaidDiagram chart={code.trim()} />;
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3 border-[3px] border-foreground bg-[#0d1117] overflow-hidden" style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}>
            {/* Header with language and copy button */}
            <div className="flex justify-between items-center px-3 py-1.5 bg-foreground text-background">
                <span className="text-xs font-bold uppercase tracking-wide">
                    {language || 'CODE'}
                </span>
                <button
                    onClick={handleCopy}
                    className="text-xs font-bold uppercase px-2 py-0.5 bg-background text-foreground border-[2px] border-background hover:bg-[hsl(var(--secondary))] hover:text-black hover:border-[hsl(var(--secondary))] transition-colors"
                >
                    {copied ? 'COPIED!' : 'COPY'}
                </button>
            </div>
            {/* Code content */}
            <div className="p-4 overflow-x-auto">
                {children}
            </div>
        </div>
    );
});

CodeBlockWrapper.displayName = 'CodeBlockWrapper';

// InlineCode - High contrast for better visibility
const InlineCode: FC<{ children: ReactNode }> = ({ children }) => (
    <code className="bg-background text-foreground px-1.5 py-0.5 border-[2px] border-foreground text-sm font-mono font-bold mx-1 shadow-[2px_2px_0_hsl(var(--foreground))]">
        {children}
    </code>
);

// Main Markdown Renderer
const MarkdownRenderer: FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    // Check if content looks like plain text (no markdown indicators)
    const isPlainText = !content.includes('#') &&
        !content.includes('```') &&
        !content.includes('**') &&
        !content.includes('`') &&
        !content.includes('- ') &&
        !content.includes('1. ') &&
        !content.includes('[') &&
        !content.includes('|');

    if (isPlainText) {
        return (
            <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${className}`}>
                {content}
            </p>
        );
    }

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                    // Headings
                    h1: ({ children }) => (
                        <h1 className="text-xl font-bold uppercase tracking-tight mt-5 mb-3 border-b-[3px] border-foreground pb-2">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-lg font-bold uppercase tracking-tight mt-4 mb-2">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-base font-bold uppercase tracking-wide mt-3 mb-2">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-sm font-bold uppercase tracking-wide mt-3 mb-1">
                            {children}
                        </h4>
                    ),

                    // Paragraphs - improved spacing
                    p: ({ children }) => (
                        <p className="text-sm font-medium leading-relaxed my-3 text-foreground/90">
                            {children}
                        </p>
                    ),

                    // Strong - emphasized
                    strong: ({ children }) => (
                        <strong className="font-extrabold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic">{children}</em>
                    ),

                    // Lists - increased spacing and hierarchy
                    ul: ({ children }) => (
                        <ul className="my-3 ml-4 space-y-2">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="my-3 ml-4 space-y-2 list-decimal">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-sm font-medium leading-relaxed flex gap-2 pl-1">
                            <span className="text-[hsl(var(--secondary))] font-black select-none mt-1.5 animate-pulse text-[10px]">●</span>
                            <div className="flex-1">{children}</div>
                        </li>
                    ),

                    // Blockquote
                    blockquote: ({ children }) => (
                        <blockquote className="my-3 pl-3 border-l-[4px] border-[hsl(var(--secondary))] bg-[hsl(var(--muted))] py-2 pr-3">
                            {children}
                        </blockquote>
                    ),

                    // Pre - handles code blocks
                    pre: ({ children, node }) => {
                        // Extract the code content and language from the child
                        const codeElement = node?.children[0];
                        let language = '';
                        let codeContent = '';

                        if (codeElement && codeElement.type === 'element' && codeElement.tagName === 'code') {
                            const classNames = codeElement.properties?.className as string[] || [];
                            const langClass = classNames.find((c: string) => c.startsWith('language-'));
                            language = langClass ? langClass.replace('language-', '') : '';

                            // Get the text content
                            const textNode = codeElement.children[0];
                            if (textNode && textNode.type === 'text') {
                                codeContent = textNode.value;
                            }
                        }

                        // Clone children to explicitly pass isBlock prop to the code component
                        const childrenWithProp = Children.map(children, child => {
                            if (isValidElement(child)) {
                                return cloneElement(child as React.ReactElement<any>, { isBlock: true });
                            }
                            return child;
                        });

                        return (
                            <CodeBlockWrapper language={language} code={codeContent}>
                                {childrenWithProp}
                            </CodeBlockWrapper>
                        );
                    },

                    // Code component with explicit block detection
                    code: ({ children, className, inline, isBlock, ...props }: any) => {
                        // If it's passed 'isBlock' from 'pre', it is definitely a code block.
                        if (isBlock) {
                            return (
                                <code
                                    className={`text-sm font-mono text-[#c9d1d9] whitespace-pre block min-w-full ${className || ''}`}
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }

                        // Otherwise, treat as inline code
                        return <InlineCode>{children}</InlineCode>;
                    },

                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[hsl(var(--secondary))] underline font-semibold hover:bg-[hsl(var(--secondary))] hover:text-black px-0.5 transition-colors"
                        >
                            {children}
                        </a>
                    ),

                    // Images
                    img: ({ src, alt }) => (
                        <div className="my-3">
                            <img
                                src={src}
                                alt={alt || 'Image'}
                                className="max-w-full border-[3px] border-foreground"
                                style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
                                loading="lazy"
                            />
                            {alt && (
                                <p className="text-xs font-medium uppercase text-muted-foreground mt-1">
                                    {alt}
                                </p>
                            )}
                        </div>
                    ),

                    // Tables
                    table: ({ children }) => (
                        <div className="my-3 overflow-x-auto border-[3px] border-foreground" style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}>
                            <table className="w-full text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-foreground text-background font-bold uppercase text-xs">
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody className="bg-background">
                            {children}
                        </tbody>
                    ),
                    tr: ({ children }) => (
                        <tr className="border-b-[2px] border-foreground last:border-b-0">
                            {children}
                        </tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-3 py-2 text-left border-r-[2px] border-background last:border-r-0">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-3 py-2 border-r-[2px] border-foreground/20 last:border-r-0">
                            {children}
                        </td>
                    ),

                    // Horizontal rule
                    hr: () => (
                        <hr className="my-4 border-t-[3px] border-foreground" />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default memo(MarkdownRenderer);
