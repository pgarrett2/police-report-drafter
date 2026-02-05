import React, { useState, useEffect } from 'react';
import { PersistentSettings, OptionalSection, StatementConfig, StatementVersion } from '../types';
import { SECTION_BOILERPLATES, DEFAULT_STATEMENT_VERSIONS } from '../constants';

interface AdditionalStatementsEditorProps {
    isOpen: boolean;
    onClose: () => void;
    settings: PersistentSettings;
    onUpdateSettings: (newSettings: PersistentSettings) => void;
    isDarkMode: boolean;
}

const NEW_OPTIONAL_SECTION_LABELS = [
    "ARREST", "No Arrest", "Photos taken", "Citizen Link Sent", "Evidence",
    "Family Violence MANDATORY", "Danger Assessment", "CCH check",
    "Property Continuum form (theft/burgs)", "Missing Juvenile",
    "Written Statements", "County Attorney Packet", "Consensual Search",
    "Probable Cause Search", "K9 Alert", "Fingerprints", "Vehicle Tow",
    "CPS Intake", "APS Intake", "Called CIU (Protective Order)",
    "Called Supervisor", "Called CID", "Called Narcs",
    "PURSUE", "MIRANDA WARNING", "WARRANT CHECK", "PR-BOND", "NCIC/TCIC"
];

const generateId = () => Math.random().toString(36).substring(2, 9);

export const AdditionalStatementsEditor: React.FC<AdditionalStatementsEditorProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
    isDarkMode
}) => {
    if (!isOpen) return null;

    const [view, setView] = useState<'list' | 'edit' | 'json'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCustom, setIsCustom] = useState(false);

    // Config state for editing
    const [editConfig, setEditConfig] = useState<StatementConfig | null>(null);
    const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
    const [versionName, setVersionName] = useState('');
    const [versionText, setVersionText] = useState('');

    // Reset view when opening
    useEffect(() => {
        if (isOpen) {
            setView('list');
            setEditingId(null);
            setEditConfig(null);
        }
    }, [isOpen]);

    const getConfig = (id: string, isCustomItem: boolean): StatementConfig => {
        if (isCustomItem) {
            const custom: any = settings.customStatements?.find(s => s.id === id);
            if (!custom) return { label: 'New Statement', versions: [], defaultVersionId: '' };

            // Handle legacy structure
            if (!custom.config) {
                return {
                    label: custom.label || 'Legacy Statement',
                    versions: [{
                        id: 'default',
                        name: 'Default',
                        text: custom.text || ''
                    }],
                    defaultVersionId: 'default'
                };
            }
            return custom.config;
        } else {
            const config = settings.statementConfigs?.[id];
            if (config) return config;

            const defaultLabel = NEW_OPTIONAL_SECTION_LABELS.find(l => l.toLowerCase().replace(/[^a-z]/g, '') === id) || id;

            // Check for pre-defined versions
            const predefinedVersions = DEFAULT_STATEMENT_VERSIONS[defaultLabel];
            if (predefinedVersions && predefinedVersions.length > 0) {
                return {
                    label: defaultLabel,
                    versions: predefinedVersions,
                    defaultVersionId: predefinedVersions[0].id
                };
            }

            const defaultText = SECTION_BOILERPLATES[defaultLabel] || "Under development";
            const defaultVersionId = 'default';

            return {
                label: defaultLabel,
                versions: [{ id: defaultVersionId, name: 'Default', text: defaultText }],
                defaultVersionId: defaultVersionId
            };
        }
    };

    const handleEdit = (id: string, isCustomItem: boolean) => {
        const config = getConfig(id, isCustomItem);
        setEditingId(id);
        setIsCustom(isCustomItem);
        setEditConfig(JSON.parse(JSON.stringify(config))); // Deep copy
        setEditingVersionId(null); // List view first
        setView('edit');
    };

    const handleAddNew = () => {
        const newId = generateId();
        setEditingId(newId);
        setIsCustom(true);
        setEditConfig({
            label: 'New Statement',
            versions: [],
            defaultVersionId: ''
        });
        setEditingVersionId(null);
        setView('edit');
    };

    const handleSaveConfig = () => {
        if (!editingId || !editConfig) return;

        // Ensure at least one version exists/is selected
        if (editConfig.versions.length === 0) {
            alert("You must have at least one version.");
            return;
        }

        if (isCustom) {
            const newCustom = { id: editingId, config: editConfig };
            const currentCustoms = settings.customStatements || [];
            const existingIndex = currentCustoms.findIndex(s => s.id === editingId);

            let updatedCustoms;
            if (existingIndex >= 0) {
                updatedCustoms = [...currentCustoms];
                updatedCustoms[existingIndex] = newCustom;
            } else {
                updatedCustoms = [...currentCustoms, newCustom];
            }

            onUpdateSettings({ ...settings, customStatements: updatedCustoms });
        } else {
            const updatedConfigs = {
                ...(settings.statementConfigs || {}),
                [editingId]: editConfig
            };
            onUpdateSettings({ ...settings, statementConfigs: updatedConfigs });
        }
        setView('list');
    };

    const handleDeleteCustom = (id: string) => {
        if (confirm('Are you sure you want to delete this custom statement?')) {
            const updatedCustoms = (settings.customStatements || []).filter(s => s.id !== id);
            onUpdateSettings({ ...settings, customStatements: updatedCustoms });
        }
    };

    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // ... existing handlers ...

    const handleResetDefaults = () => {
        setShowResetConfirm(true);
    };

    const confirmResetDefaults = () => {
        onUpdateSettings({ ...settings, statementConfigs: {} });
        setShowResetConfirm(false);
    };

    // --- Version Management ---

    const handleAddVersion = () => {
        setEditingVersionId('NEW');
        setVersionName('');
        setVersionText('');
    };

    const handleEditVersion = (v: StatementVersion) => {
        setEditingVersionId(v.id);
        setVersionName(v.name);
        setVersionText(v.text);
    };

    const handleSaveVersion = () => {
        if (!editConfig) return;

        const newVersion: StatementVersion = {
            id: editingVersionId === 'NEW' ? generateId() : editingVersionId!,
            name: versionName || 'Untitled Version',
            text: versionText
        };

        const existingIdx = editConfig.versions.findIndex(v => v.id === newVersion.id);
        const newVersions = [...editConfig.versions];

        if (existingIdx >= 0) {
            newVersions[existingIdx] = newVersion;
        } else {
            newVersions.push(newVersion);
        }

        // Auto-set default if it's the first one
        let newDefaultId = editConfig.defaultVersionId;
        if (newVersions.length === 1) {
            newDefaultId = newVersion.id;
        }

        setEditConfig({
            ...editConfig,
            versions: newVersions,
            defaultVersionId: newDefaultId
        });
        setEditingVersionId(null);
    };

    const handleDeleteVersion = (vid: string) => {
        if (!editConfig) return;
        if (editConfig.versions.length <= 1) {
            alert("You must have at least one version.");
            return;
        }

        const newVersions = editConfig.versions.filter(v => v.id !== vid);

        // If we deleted the default, set new default to first available
        let newDefaultId = editConfig.defaultVersionId;
        if (vid === newDefaultId) {
            newDefaultId = newVersions[0].id;
        }

        setEditConfig({
            ...editConfig,
            versions: newVersions,
            defaultVersionId: newDefaultId
        });
    };

    const generateJson = () => {
        return JSON.stringify({
            configs: settings.statementConfigs || {},
            custom: settings.customStatements || []
        }, null, 2);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 mobile-safe-area">
            <div className={`w-full max-w-2xl h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>

                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-center border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div>
                        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            {view === 'edit' ? (editingVersionId ? 'Edit Version' : `Manage Versions: ${editConfig?.label}`) :
                                view === 'json' ? 'Configuration JSON' : 'Additional Statements'}
                        </h2>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {view === 'list' ? 'Customize boilerplate text and manage multiple versions.' :
                                view === 'edit' && !editingVersionId ? 'Select a version to set as default or edit.' :
                                    view === 'edit' ? 'Modify text for this specific version.' : 'Backup configuration.'}
                        </p>
                    </div>
                    <button aria-label="Close modal" onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {view === 'list' && (
                        <>
                            {/* Custom Statements */}
                            <div className="space-y-3">
                                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Custom Statements</h3>
                                {(settings.customStatements || []).map((custom: any) => {
                                    // Handle legacy data structure safely
                                    const config = custom.config || {
                                        label: custom.label || 'Legacy Statement',
                                        versions: [{
                                            id: 'default',
                                            name: 'Default',
                                            text: custom.text || ''
                                        }],
                                        defaultVersionId: 'default'
                                    };

                                    const activeVersion = config.versions.find((v: any) => v.id === config.defaultVersionId);

                                    return (
                                        <div key={custom.id} className={`p-4 rounded-lg border flex justify-between items-start group ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className={`font-bold text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{config.label}</div>
                                                <div className={`text-xs mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Active: {activeVersion?.name || 'None'}</div>
                                                <div className={`text-xs line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{activeVersion?.text}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button aria-label="Edit statement" onClick={() => handleEdit(custom.id, true)} className={`p-1.5 rounded hover:bg-primary/10 hover:text-primary ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button aria-label="Delete statement" onClick={() => handleDeleteCustom(custom.id)} className="p-1.5 rounded hover:bg-red-500/10 hover:text-red-500 text-slate-400">
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button onClick={handleAddNew} className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-all font-bold text-sm">
                                    <span className="material-symbols-outlined">add_circle</span>
                                    CREATE CUSTOM STATEMENT
                                </button>
                            </div>

                            <hr className={isDarkMode ? 'border-slate-800' : 'border-slate-100'} />

                            {/* Defaults */}
                            <div className="space-y-3">
                                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Default Statements</h3>
                                {NEW_OPTIONAL_SECTION_LABELS.map(label => {
                                    const id = label.toLowerCase().replace(/[^a-z]/g, '');
                                    const config = getConfig(id, false);
                                    const activeVersion = config.versions.find(v => v.id === config.defaultVersionId);
                                    const isModified = !!settings.statementConfigs?.[id];

                                    return (
                                        <div key={id} className={`p-4 rounded-lg border flex justify-between items-start group ${isDarkMode ? 'bg-transparent border-slate-800' : 'bg-white border-slate-200'}`}>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{label}</div>
                                                    {isModified && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase">Modified</span>}
                                                </div>
                                                <div className={`text-xs mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Active: {activeVersion?.name || 'Default'}</div>
                                                <div className={`text-xs line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{activeVersion?.text}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button aria-label="Edit statement" onClick={() => handleEdit(id, false)} className={`p-1.5 rounded hover:bg-primary/10 hover:text-primary ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button onClick={handleResetDefaults} className={`flex-1 py-3 text-sm font-bold rounded-lg border transition-colors ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>RESET DEFAULTS</button>
                                <button onClick={() => setView('json')} className={`flex-1 py-3 text-sm font-bold rounded-lg border transition-colors ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>SHOW JSON</button>
                            </div>
                        </>
                    )}

                    {view === 'edit' && editConfig && !editingVersionId && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="stmt-label-input" className={`block text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Statement Label</label>
                                <input
                                    id="stmt-label-input"
                                    type="text"
                                    value={editConfig.label}
                                    onChange={(e) => setEditConfig({ ...editConfig, label: e.target.value })}
                                    disabled={!isCustom}
                                    className={`w-full px-4 py-3 rounded-lg border text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} ${!isCustom ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className={`text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Versions</h3>
                                    <button onClick={handleAddVersion} className="text-xs font-bold text-primary hover:underline">+ ADD VERSION</button>
                                </div>

                                {editConfig.versions.map(v => (
                                    <div key={v.id} className={`p-4 rounded-lg border flex items-center justify-between ${editConfig.defaultVersionId === v.id ? (isDarkMode ? 'border-blue-500 bg-blue-900/10' : 'border-blue-500 bg-blue-50') : (isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white')}`}>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{v.name}</span>
                                                {editConfig.defaultVersionId === v.id && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">Default</span>}
                                            </div>
                                            <div className={`text-xs line-clamp-1 mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{v.text}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {editConfig.defaultVersionId !== v.id && (
                                                <button onClick={() => setEditConfig({ ...editConfig, defaultVersionId: v.id })} className="text-xs font-bold text-slate-500 hover:text-primary">SET DEFAULT</button>
                                            )}
                                            <button aria-label="Edit version" onClick={() => handleEditVersion(v)} className="p-1.5">
                                                <span className="material-symbols-outlined text-lg opacity-50 hover:opacity-100">edit</span>
                                            </button>
                                            <button aria-label="Delete version" onClick={() => handleDeleteVersion(v.id)} className="p-1.5 text-red-500">
                                                <span className="material-symbols-outlined text-lg opacity-50 hover:opacity-100">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setView('list')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>CANCEL</button>
                                <button onClick={handleSaveConfig} className="flex-1 py-3 rounded-lg font-bold text-sm bg-primary text-white hover:bg-blue-600 transition-colors">SAVE CHANGES</button>
                            </div>
                        </div>
                    )}

                    {view === 'edit' && editingVersionId && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="space-y-2">
                                <label htmlFor="version-name-input" className={`block text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Version Name</label>
                                <input
                                    id="version-name-input"
                                    type="text"
                                    value={versionName}
                                    onChange={(e) => setVersionName(e.target.value)}
                                    placeholder="e.g., Short Form, Spanish, etc."
                                    className={`w-full px-4 py-3 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="version-text-input" className={`block text-xs font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Boilerplate Text</label>
                                <textarea
                                    id="version-text-input"
                                    value={versionText}
                                    onChange={(e) => setVersionText(e.target.value)}
                                    placeholder="Enter text for this version..."
                                    className={`w-full h-48 px-4 py-3 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-y ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setEditingVersionId(null)} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>CANCEL</button>
                                <button onClick={handleSaveVersion} className="flex-1 py-3 rounded-lg font-bold text-sm bg-primary text-white hover:bg-blue-600 transition-colors">SAVE VERSION</button>
                            </div>
                        </div>
                    )}

                    {view === 'json' && (
                        <div className="space-y-4">
                            <textarea
                                readOnly
                                value={generateJson()}
                                title="Configuration JSON"
                                aria-label="Configuration JSON"
                                className={`w-full h-96 p-4 font-mono text-xs rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                            />
                            <button onClick={() => setView('list')} className={`w-full py-3 rounded-lg font-bold text-sm ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>BACK TO LIST</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`w-full max-w-sm p-6 rounded-xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                        <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Confirm Reset</h3>
                        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Are you sure you want to reset all default statements? This will update them to the latest versions. Your Custom Statements will remain.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={confirmResetDefaults}
                                className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                YES, RESET
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
