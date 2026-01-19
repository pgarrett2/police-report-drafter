import React from 'react';

interface AccordionItemProps {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  hasDraftModeTag?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  hasDraftModeTag = false
}) => {
  return (
    <div className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-all ${isOpen ? 'ring-2 ring-primary/10 border-primary dark:border-blue-500' : 'hover:border-primary'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`material-symbols-outlined ${isOpen ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>
            {icon}
          </span>
          <span className={`font-semibold ${isOpen ? 'text-primary dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
            {title}
          </span>
          {hasDraftModeTag && (
            <span className="ml-2 text-[10px] uppercase tracking-widest bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold">
              Selected
            </span>
          )}
        </div>
        <span className={`material-symbols-outlined transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'text-slate-400'}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
          <hr className="mb-4 border-slate-100 dark:border-slate-700" />
          {children}
        </div>
      )}
    </div>
  );
};
