import React, { useState, useRef, useEffect } from 'react';
import { OptionalSection } from '../types';

interface AdditionalStatementsSelectorProps {
    sections: OptionalSection[];
    onToggle: (id: string, enabled: boolean) => void;
}

export const AdditionalStatementsSelector: React.FC<AdditionalStatementsSelectorProps> = ({
    sections,
    onToggle,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    // Filter sections that are NOT enabled and match the search term
    const availableSections = sections.filter(
        (section) =>
            !section.enabled &&
            section.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (id: string) => {
        onToggle(id, true);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="relative mb-4 z-dropdown" ref={wrapperRef}>
            <div
                className="flex items-center gap-2 p-3 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg cursor-text focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all"
                onClick={() => setIsOpen(true)}
            >
                <span className="material-symbols-outlined text-slate-500">search</span>
                <input
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholderable-slate-400"
                    placeholder="Search additional statements..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {/* Toggle chevron */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="text-slate-400 hover:text-primary transition-colors"
                >
                    <span className={`material-symbols-outlined transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
            </div>

            {isOpen && (
                <div
                    className="absolute z-dropdown-menu left-0 right-0 mt-2 max-h-60 overflow-y-auto overscroll-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100"
                    onWheel={(e) => e.stopPropagation()} // Ensure scrolling within dropdown doesn't propagate
                >
                    {availableSections.length > 0 ? (
                        <div className="py-1">
                            {availableSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => handleSelect(section.id)}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-colors flex items-center justify-between group"
                                >
                                    <span className="font-medium">{section.label}</span>
                                    <span className="material-symbols-outlined text-transparent group-hover:text-primary text-lg">add_circle</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-slate-500 text-sm italic">
                            {searchTerm ? 'No matching statements found.' : 'All statements added.'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
