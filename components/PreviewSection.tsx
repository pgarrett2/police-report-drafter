import React, { useState } from 'react';

interface PreviewSectionProps {
  title: string;
  content: string;
  placeholder?: string;
  heightClass?: string;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  title,
  content,
  placeholder = "Section content will appear here...",
  heightClass = "" // Kept as optional prop but largely ignored now for dynamic growth
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = content || "";

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
      } else {
        // Fallback for non-secure contexts (HTTP) or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopied(true);
        } else {
          throw new Error("Copy command unsuccessful");
        }
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed: ', err);
    }
  };

  return (
    <div className={`p-6 md:p-10 flex flex-col border-b border-slate-100 dark:border-slate-800 relative group transition-colors duration-500 ${heightClass} ${copied ? 'bg-green-50/40 dark:bg-green-900/10' : ''}`}>
      {/* Copy Button Container */}
      <div className="absolute right-4 top-4 md:right-8 md:top-8 z-30">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm transition-all duration-300 ${copied
            ? 'bg-green-600 border-green-600 text-white shadow-green-200 dark:shadow-none scale-105'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary hover:shadow-md'
            }`}
          aria-label={`Copy ${title}`}
          title={copied ? "Copied to clipboard" : `Copy ${title}`}
        >
          <span className="material-symbols-outlined text-lg md:text-xl transition-transform active:scale-90">
            {copied ? 'check_circle' : 'content_copy'}
          </span>
          {copied && (
            <span className="text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-right-1">
              Copied
            </span>
          )}
        </button>
      </div>

      {/* Header Label */}
      <h3 className={`font-serif text-[0.6rem] font-bold uppercase tracking-widest mb-3 transition-colors duration-300 ${copied ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
        {title}
      </h3>

      {/* Narrative Content */}
      <div className={`text-xs md:text-sm whitespace-pre-wrap leading-relaxed transition-colors duration-300 ${content
        ? 'text-slate-800 dark:text-slate-200'
        : 'italic text-slate-300 dark:text-slate-600'
        }`}>
        {content || placeholder}
        {/* Adds roughly one extra empty line of space below the text */}
        <div className="h-6 w-full" aria-hidden="true" />
      </div>
    </div>
  );
};