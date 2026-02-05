import React, { useState, useEffect, useRef } from 'react';
import { NameEntry, PartyCategory, Vehicle, OptionalSection } from '../types';

interface SlashCommandOverlayProps {
    names: Record<PartyCategory, NameEntry[]>;
    vehicles: Vehicle[];
    optionalSections: OptionalSection[];
}

interface Coordinates {
    top: number;
    left: number;
    height: number;
}

// Logic to mirror input style for coordinate calculation
// Based on textarea-caret
const properties = [
    'direction',
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
];


function getCaretCoordinates(element: HTMLInputElement | HTMLTextAreaElement, position: number): Coordinates {
    const isFirefox = (window as any).mozInnerScreenX != null;
    const div = document.createElement('div');
    div.id = 'input-textarea-caret-position-mirror-div';
    document.body.appendChild(div);

    const style = div.style;
    const computed = window.getComputedStyle(element);

    style.whiteSpace = 'pre-wrap';
    if (element.tagName === 'INPUT') {
        style.whiteSpace = 'nowrap';
    }
    style.wordWrap = 'break-word';
    style.position = 'absolute';
    style.visibility = 'hidden';

    properties.forEach((prop) => {
        style[prop as any] = computed[prop as any];
    });

    if (isFirefox) {
        if (element.scrollHeight > parseInt(computed.height)) {
            style.overflowY = 'scroll';
        }
    } else {
        style.overflow = 'hidden';
    }

    div.textContent = element.value.substring(0, position);
    if (element.tagName === 'INPUT') {
        div.textContent = div.textContent.replace(/\s/g, '\u00a0');
    }

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    const coordinates = {
        top: span.offsetTop + parseInt(computed['borderTopWidth']),
        left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
        height: parseInt(computed['lineHeight'])
    };

    document.body.removeChild(div);
    return coordinates;
}

export const SlashCommandOverlay: React.FC<SlashCommandOverlayProps> = ({ names, vehicles, optionalSections }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [targetInput, setTargetInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeList, setActiveList] = useState<NameEntry[] | Vehicle[] | OptionalSection[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [triggerKey, setTriggerKey] = useState<string>('');
    const [itemType, setItemType] = useState<'name' | 'vehicle' | 'section'>('name');

    // Calculate options based on activeList
    const options: { label: string, value: string }[] = [];

    if (itemType === 'name') {
        // Filter out empty names
        const validNames = (activeList as NameEntry[]).filter(s => s.name.trim() !== '');

        validNames.forEach((entry, idx) => {
            if (idx < 5) {
                options.push({
                    label: entry.name,
                    value: entry.name
                });
            }
        });

        // Combinations logic (same as before, but on validNames)
        if (validNames.length > 1) {
            const indices = validNames.map((_, i) => i).filter(i => i < 5);
            const getSubsets = (arr: number[]) => {
                return arr.reduce(
                    (subsets: number[][], value: number) => subsets.concat(
                        subsets.map(set => [value, ...set])
                    ),
                    [[]] as number[][]
                ).filter(s => s.length >= 2);
            };

            const subsets = getSubsets(indices);
            subsets.sort((a, b) => {
                if (a.length !== b.length) return a.length - b.length;
                for (let i = 0; i < a.length; i++) {
                    if (a[i] !== b[i]) return a[i] - b[i];
                }
                return 0;
            });

            subsets.forEach((subsetIndices) => {
                subsetIndices.sort((a, b) => a - b);
                const nameList = subsetIndices.map(i => validNames[i].name);
                let label = "";
                if (nameList.length === 2) {
                    label = `${nameList[0]} and ${nameList[1]}`;
                } else {
                    label = nameList.slice(0, -1).join(', ') + `, and ${nameList[nameList.length - 1]}`;
                }
                options.push({ label, value: label });
            });
        }

        if (validNames.length === 0) {
            options.push({ label: 'No names found', value: '' });
        }
    } else if (itemType === 'vehicle') {
        const validVehicles = (activeList as Vehicle[]).filter(v => v.make || v.model); // Basic validation

        validVehicles.forEach((v, idx) => {
            // Format: "color, year, make, model, (state licence plate #{number}" + VIN if selected
            let parts = [];
            if (v.color) parts.push(v.color);
            if (v.year) parts.push(v.year);
            if (v.make) parts.push(v.make);
            if (v.model) parts.push(v.model);

            let str = parts.join(' ');
            if (v.licensePlate) {
                str += `, (${v.licensePlateState || 'Unknown'} license plate #${v.licensePlate})`;
            }
            if (v.showVin && v.vin) {
                str += ` VIN: ${v.vin}`;
            }

            // Fallback label if empty
            const label = str.trim() || `Vehicle #${idx + 1}`;

            options.push({
                label: label,
                value: label
            });
        });

        // Combinations for vehicles? Probably not needed/requested, user usually references one at a time or "the vehicles".
        // Standard is usually [VEHICLE_ONE], [VEHICLE_TWO]. I won't do combinations unless requested.

        if (validVehicles.length === 0) {
            options.push({ label: 'No vehicles found', value: '' });
        }
    } else if (itemType === 'section') {
        const validSections = (activeList as OptionalSection[]);
        validSections.forEach((section) => {
            options.push({
                label: section.label,
                value: section.text // This inserts the boilerplate
            });
        });

        if (validSections.length === 0) {
            options.push({ label: 'No sections found', value: '' });
        }
    }

    useEffect(() => {
        const handleInput = (e: Event) => {
            const target = e.target as HTMLInputElement | HTMLTextAreaElement;
            if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) return;
            if (target.type === 'password' || target.type === 'email' || target.type === 'number') return;

            const cursor = target.selectionStart;
            if (cursor === null || cursor < 2) {
                setIsOpen(false);
                return;
            }

            const text = target.value;
            let categories: PartyCategory[] = [];
            let isVehicle = false;
            let isSection = false;

            // Check triggers (longest first to avoid partial matches)
            const triggerVe = text.slice(cursor - 3, cursor);
            const triggerAs = text.slice(cursor - 3, cursor);

            if (triggerVe === '/ve') {
                isVehicle = true;
            } else if (triggerAs === '/as') {
                isSection = true;
            } else {
                const trigger = text.slice(cursor - 2, cursor);
                if (trigger === '/s') categories = ['Suspect'];
                else if (trigger === '/v') categories = ['Victim'];
                else if (trigger === '/w') categories = ['Witness'];
                else if (trigger === '/o') categories = ['Other'];
                else if (trigger === '/n') categories = ['Complainant', 'Victim', 'Suspect', 'Witness', 'Other'];
            }

            if (categories.length > 0 || isVehicle || isSection) {
                const rect = target.getBoundingClientRect();
                const coords = getCaretCoordinates(target, cursor);

                // Calculate absolute position
                const top = rect.top + window.scrollY + coords.top + coords.height;
                const left = rect.left + window.scrollX + coords.left;

                if (isVehicle) {
                    setActiveList(vehicles);
                    setItemType('vehicle');
                    setTriggerKey('/ve');
                } else if (isSection) {
                    setActiveList(optionalSections);
                    setItemType('section');
                    setTriggerKey('/as');
                } else {
                    // Aggregate names based on categories
                    const combinedNames: NameEntry[] = [];
                    categories.forEach(cat => {
                        if (names[cat]) {
                            combinedNames.push(...names[cat]);
                        }
                    });
                    setActiveList(combinedNames);
                    setItemType('name');
                    const trigger = text.slice(cursor - 2, cursor); // Re-calculate short trigger
                    setTriggerKey(trigger);
                }

                setPosition({ top, left });
                setTargetInput(target);
                setIsOpen(true);
                setSelectedIndex(0);
            } else {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || !targetInput) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % options.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + options.length) % options.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (options[selectedIndex]?.value) {
                    insertSelection(options[selectedIndex].value);
                }
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        // Explicitly handle click outside
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('input', handleInput);
        document.addEventListener('keydown', handleKeyDown, true); // Capture phase to prevent default
        document.addEventListener('click', handleClick);

        return () => {
            document.removeEventListener('input', handleInput);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('click', handleClick);
        };
    }, [isOpen, targetInput, names, options, selectedIndex]); // Dependencies updated

    const insertSelection = (value: string) => {
        if (!targetInput) return;

        const cursor = targetInput.selectionStart;
        if (cursor === null) return;

        // Replace trigger (/s, /n, /ve, etc) with value
        const text = targetInput.value;
        const triggerLength = triggerKey.length; // /s = 2, /ve = 3
        const before = text.slice(0, cursor - triggerLength);
        const after = text.slice(cursor);
        const newValue = before + value + after;

        // Native value setter hack for React
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value"
        )?.set;

        // Fallback for inputs
        const nativeInputValSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
        )?.set;

        if (targetInput.tagName === 'TEXTAREA' && nativeInputValueSetter) {
            nativeInputValueSetter.call(targetInput, newValue);
        } else if (targetInput.tagName === 'INPUT' && nativeInputValSetter) {
            nativeInputValSetter.call(targetInput, newValue);
        } else {
            targetInput.value = newValue;
        }

        const event = new Event('input', { bubbles: true });
        targetInput.dispatchEvent(event);

        // Move cursor?
        // targetInput.setSelectionRange(before.length + value.length, before.length + value.length);

        setIsOpen(false);
        setTargetInput(null);
    };

    if (!isOpen || options.length === 0) return null;

    return (
        <div
            ref={dropdownRef}
            style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                zIndex: 9999,
                minWidth: '200px'
            }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
            <div className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-3 py-1.5 text-slate-500">
                Select {itemType === 'vehicle' ? 'Vehicle' : itemType === 'section' ? 'Statement' : 'Name'} ({triggerKey})
            </div>
            <div className="max-h-60 overflow-y-auto">
                {options.map((opt, idx) => (
                    <div
                        key={idx}
                        className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${idx === selectedIndex
                            ? 'bg-primary text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        onClick={() => insertSelection(opt.value)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                    >
                        <span className="font-medium">{opt.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
