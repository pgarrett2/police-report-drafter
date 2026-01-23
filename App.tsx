import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TEMPLATES, INITIAL_STATE, CALL_TYPES, INITIATED_CALL_TYPES, REASON_FOR_STOP_TYPES, CONSENSUAL_STOP_TYPES, INTRO_BODY, INITIAL_SETTINGS, BWC_BOILERPLATE, OFFENSE_SUMMARY_BOILERPLATE, getFreshInitialState, US_STATES } from './constants';
import { CJIS_CODES } from './cjis_codes';
import { ReportState, Template, PartyCategory, OptionalSection, PersistentSettings, Offense, NameEntry } from './types';
import { AccordionItem } from './components/AccordionItem';
import { PreviewSection } from './components/PreviewSection';

const STORAGE_KEY_REPORT = 'report_drafter_current_report';
const STORAGE_KEY_SETTINGS = 'report_drafter_persistent_settings';
const STORAGE_KEY_THEME = 'report_drafter_theme';

const STATUTE_TITLES: Record<string, string> = {
  'PC': 'Penal Code',
  'TRC': 'Transportation Code',
  'TC': 'Transportation Code',
  'HSC': 'Health and Safety Code',
  'ABC': 'Alcoholic Beverage Code',
  'EC': 'Election Code',
  'EDC': 'Education Code',
  'ED': 'Education Code',
  'LGC': 'Local Government Code',
  'AGC': 'Agriculture Code',
  'BCC': 'Business and Commerce Code',
  'FNC': 'Finance Code',
  'IC': 'Insurance Code',
  'LC': 'Labor Code',
  'OC': 'Occupations Code',
  'PWC': 'Parks and Wildlife Code',
  'HRC': 'Human Resources Code',
  'CO': 'City Ordinance'
};

export default function App() {
  // Initialization from Local Storage
  const [settings, setSettings] = useState<PersistentSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [reportData, setReportData] = useState<ReportState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REPORT);
    const initial = getFreshInitialState();

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Data Migration: Ensure offenses array exists
        if (!parsed.incidentDetails.offenses) {
          parsed.incidentDetails.offenses = [];
          // Carry over old single offense if it existed
          if ((parsed.incidentDetails as any).offense) {
            parsed.incidentDetails.offenses.push((parsed.incidentDetails as any).offense);
          }
        }
        return {
          ...initial,
          ...parsed,
          incidentDetails: { ...initial.incidentDetails, ...(parsed.incidentDetails || {}) },
          narratives: { ...initial.narratives, ...(parsed.narratives || {}) },
          names: parsed.names ? Object.keys(parsed.names).reduce((acc, cat) => {
            acc[cat as PartyCategory] = (parsed.names[cat] as any[]).map(val =>
              typeof val === 'string' ? { name: val, sex: '' as const } : val
            );
            return acc;
          }, {} as Record<PartyCategory, NameEntry[]>) : initial.names
        };
      } catch (e) {
        console.error("Failed to parse saved report", e);
      }
    }

    if (settings.defaultOfficer) {
      initial.incidentDetails.reportingOfficer = settings.defaultOfficer;
    }
    return initial;
  });

  const [activeSection, setActiveSection] = useState<string>('incident');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [isDesktop, setIsDesktop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [fullReportCopied, setFullReportCopied] = useState(false);
  const [selectedStatute, setSelectedStatute] = useState<Offense | null>(null);
  const [showStatuteModal, setShowStatuteModal] = useState(false);

  // UI Edit States
  const [isEditingPublic, setIsEditingPublic] = useState(false);
  const [tempPublic, setTempPublic] = useState('');
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [tempIntro, setTempIntro] = useState('');
  const [isEditingBwc, setIsEditingBwc] = useState(false);
  const [tempBwc, setTempBwc] = useState('');
  const [isEditingOffenseSummary, setIsEditingOffenseSummary] = useState(false);
  const [tempOffenseSummary, setTempOffenseSummary] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [tempSectionText, setTempSectionText] = useState('');

  // Drag and Drop State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Offense Search State
  const [offenseSearch, setOffenseSearch] = useState('');
  const [showOffenseDropdown, setShowOffenseDropdown] = useState(false);
  const offenseDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (offenseDropdownRef.current && !offenseDropdownRef.current.contains(event.target as Node)) {
        setShowOffenseDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Offense Search Optimization - using useMemo to avoid re-calculating on every render
  const filteredOffenses = React.useMemo(() => {
    const search = offenseSearch.trim().toLowerCase();
    if (search.length < 2) return [];

    const matches = CJIS_CODES.filter(offense =>
      offense.literal.toLowerCase().includes(search) ||
      offense.citation.toLowerCase().includes(search)
    );

    // Sort: exact matches or prefix matches first
    return matches.sort((a, b) => {
      const aLiteral = a.literal.toLowerCase();
      const bLiteral = b.literal.toLowerCase();
      const aStartsWith = aLiteral.startsWith(search);
      const bStartsWith = bLiteral.startsWith(search);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // If both start with it or both don't, maintain alphabetical order
      return aLiteral.localeCompare(bLiteral);
    }).slice(0, 50);
  }, [offenseSearch]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REPORT, JSON.stringify(reportData));
  }, [reportData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    // Auto-fill reporting officer if field is currently empty and setting is provided
    if (!reportData.incidentDetails.reportingOfficer && settings.defaultOfficer) {
      setReportData(prev => ({
        ...prev,
        incidentDetails: { ...prev.incidentDetails, reportingOfficer: settings.defaultOfficer }
      }));
    }
  }, [settings]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [darkMode]);

  // Safe responsive detection - runs only on client
  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop(); // Initial check
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '[DATE]';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${month}/${day}/${year}`;
  };

  const getBlockAddress = (fullAddress: string) => {
    if (!fullAddress) return { block: '___', street: '[STREET]', isIntersection: false, displayTitle: '[ADDRESS]' };

    if (fullAddress.includes('/')) {
      const parts = fullAddress.split('/').map(s => s.trim());
      const street1 = parts[0] || '[STREET 1]';
      const street2 = parts[1] || '[STREET 2]';
      return {
        block: '',
        street: `${street1} and ${street2}`,
        isIntersection: true,
        displayTitle: `the intersection of ${street1} and ${street2}`
      };
    }

    const match = fullAddress.trim().match(/^(\d+)\s+(.*)$/);
    if (match) {
      const houseNum = parseInt(match[1]);
      const streetName = match[2];
      const block = Math.floor(houseNum / 100) * 100;
      const displayTitle = `the ${block} block of ${streetName}`;
      return { block: block.toString(), street: streetName, isIntersection: false, displayTitle };
    }
    return { block: '___', street: fullAddress, isIntersection: false, displayTitle: fullAddress };
  };

  // Automated Narrative Generation Effect
  useEffect(() => {
    const { date, time, reportingOfficer, address, isBusiness, businessName, callType, howReceived, reasonForStop, isConsensual } = reportData.incidentDetails;
    const formattedDate = formatDate(date);
    const { block, street, displayTitle, isIntersection } = getBlockAddress(address);
    const officerName = reportingOfficer || '[OFFICER]';
    const callText = (callType || '[CALL TYPE]').toLowerCase();
    const reasonText = reasonForStop || '[Reason for Stop]';

    const offenseList = reportData.incidentDetails.offenses || [];
    const offenseNames = offenseList.map(o => o.literal).join(', ');
    const callOrOffenseText = callText;

    const suffix = `, San Angelo, Texas, located in Tom Green County, for a ${callOrOffenseText}. Report was made.`;
    const commonPrefix = `On ${formattedDate}, at approximately ${time || '[TIME]'} hours, I, Officer ${officerName}, `;

    let publicNarrative = '';
    let introFirstSentence = '';

    const businessSuffix = (isBusiness && businessName) ? ` (${businessName})` : '';
    const addressWithBusiness = `${isIntersection ? displayTitle : (address || '[ADDRESS]')}${businessSuffix}`;

    if (howReceived === 'dispatched') {
      publicNarrative = `${commonPrefix}was dispatched to ${displayTitle}${suffix}`;
      introFirstSentence = `On the listed date and time, I, Officer ${officerName}, responded to ${addressWithBusiness} regarding a ${callOrOffenseText}.`;
    }
    else if (howReceived === 'flagged down') {
      publicNarrative = `${commonPrefix}was flagged down in ${displayTitle}, San Angelo, Texas, located in Tom Green County, regarding a ${callOrOffenseText}. Report was made.`;
      introFirstSentence = `On the listed date and time, I, Officer ${officerName}, was flagged down in ${displayTitle} regarding a ${callOrOffenseText}.`;
    }
    else if (howReceived === 'initiated') {
      const isStopType = ["Traffic Stop", "Subject Stop"].includes(callType);
      const isCheckOutType = ["Out W/veh", "Assist Motorist"].includes(callType);

      if (callType === 'Follow Up On Previous Call') {
        publicNarrative = `${commonPrefix}conducted a follow-up in ${displayTitle}${suffix}`;
        introFirstSentence = `On the listed date and time, I, Officer ${officerName}, responded to ${addressWithBusiness} regarding a ${callOrOffenseText}.`;
      }
      else if (isConsensual && callType === 'Subject Stop') {
        publicNarrative = `${commonPrefix}initiated a consensual subject stop in ${displayTitle}, San Angelo, Texas, located in Tom Green County. Report was made.`;
        introFirstSentence = `On the listed date and time, I, Officer ${officerName}, initiated a consensual subject stop in ${addressWithBusiness}.`;
      }
      else if (isConsensual && callType === 'Out W/veh') {
        publicNarrative = `${commonPrefix}checked out with a vehicle in ${displayTitle}, San Angelo, Texas, located in Tom Green County. Report was made.`;
        introFirstSentence = `On the listed date and time, I, Officer ${officerName}, checked out with a vehicle in ${addressWithBusiness}.`;
      }
      else if (isStopType || isCheckOutType) {
        publicNarrative = `${commonPrefix}initiated a ${callType} in ${displayTitle}, San Angelo, Texas, located in Tom Green County, for ${reasonText}. Report was made.`;
        introFirstSentence = `On the listed date and time, I, Officer ${officerName}, initiated a ${callType} in ${addressWithBusiness} for ${reasonText}.`;
      } else {
        publicNarrative = `${commonPrefix}initiated a ${callOrOffenseText} in ${displayTitle}${suffix}`;
        introFirstSentence = `On the listed date and time, I, Officer ${officerName}, initiated a ${callOrOffenseText} in ${addressWithBusiness}.`;
      }
    }

    let dynamicOffenseSummary = OFFENSE_SUMMARY_BOILERPLATE;
    if (offenseList.length > 0) {
      const lines = ["OFFENSE SUMMARY", "***********************"];
      offenseList.forEach(offense => {
        const fullStatuteTitle = STATUTE_TITLES[offense.statute.toUpperCase()] || offense.statute;
        lines.push(`${offense.literal} ${fullStatuteTitle} ${offense.citation} ${offense.level}`);
      });
      dynamicOffenseSummary = lines.join('\n');
    }

    setReportData(prev => {
      const narratives = { ...prev.narratives };
      if (!prev.narratives.isPublicEdited) narratives.public = publicNarrative;
      if (!prev.narratives.isIntroEdited) narratives.introduction = `${introFirstSentence} ${INTRO_BODY}`;
      if (!prev.narratives.isOffenseSummaryEdited) narratives.offenseSummaryStatement = dynamicOffenseSummary;
      return { ...prev, narratives };
    });
  }, [
    reportData.incidentDetails.date,
    reportData.incidentDetails.time,
    reportData.incidentDetails.reportingOfficer,
    reportData.incidentDetails.address,
    reportData.incidentDetails.isBusiness,
    reportData.incidentDetails.businessName,
    reportData.incidentDetails.callType,
    reportData.incidentDetails.howReceived,
    reportData.incidentDetails.reasonForStop,
    reportData.incidentDetails.isConsensual,
    reportData.incidentDetails.offenses,
    reportData.narratives.isPublicEdited,
    reportData.narratives.isIntroEdited,
    reportData.narratives.isOffenseSummaryEdited
  ]);

  const handleInputChange = (section: keyof ReportState, field: string, value: any) => {
    setReportData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setReportData(prev => ({
        ...prev,
        incidentDetails: { ...prev.incidentDetails, incidentType: template.name },
        narratives: {
          ...prev.narratives,
          investigative: template.boilerplate.investigativeNarrative,
          probableCause: template.boilerplate.probableCause
        }
      }));
    }
  };

  const handleNewDraftClick = () => {
    setShowResetModal(true);
  };

  const confirmNewDraft = () => {
    const newState = getFreshInitialState();
    if (settings.defaultOfficer) {
      newState.incidentDetails.reportingOfficer = settings.defaultOfficer;
    }
    setReportData(newState);
    setSelectedTemplateId('');
    setActiveSection('incident');
    // Reset editing states
    setIsEditingPublic(false);
    setIsEditingIntro(false);
    setIsEditingBwc(false);
    setEditingSectionId(null);
    setShowResetModal(false);
  };

  const handleOptionalSectionToggle = (id: string, enabled: boolean) => {
    setReportData(prev => ({
      ...prev,
      narratives: {
        ...prev.narratives,
        optionalSections: prev.narratives.optionalSections.map(s =>
          s.id === id ? { ...s, enabled } : s
        )
      }
    }));
  };

  const startEditingSection = (section: OptionalSection) => {
    setEditingSectionId(section.id);
    setTempSectionText(section.text);
  };

  const saveSection = (id: string) => {
    setReportData(prev => ({
      ...prev,
      narratives: {
        ...prev.narratives,
        optionalSections: prev.narratives.optionalSections.map(s =>
          s.id === id ? { ...s, text: tempSectionText, isEdited: true } : s
        )
      }
    }));
    setEditingSectionId(null);
  };

  const cancelSectionEdit = () => setEditingSectionId(null);

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setReportData(prev => {
      const sections = [...prev.narratives.optionalSections];
      const index = sections.findIndex(s => s.id === id);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sections.length) return prev;
      const [moved] = sections.splice(index, 1);
      sections.splice(newIndex, 0, moved);
      return { ...prev, narratives: { ...prev.narratives, optionalSections: sections } };
    });
  };

  const handleDragStart = (id: string) => setDraggedItemId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedItemId !== id) setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverId(null);
      return;
    }
    setReportData(prev => {
      const sections = [...prev.narratives.optionalSections];
      const dragIndex = sections.findIndex(s => s.id === draggedItemId);
      const dropIndex = sections.findIndex(s => s.id === targetId);
      const [dragged] = sections.splice(dragIndex, 1);
      sections.splice(dropIndex, 0, dragged);
      return { ...prev, narratives: { ...prev.narratives, optionalSections: sections } };
    });
    setDraggedItemId(null);
    setDragOverId(null);
  };

  const handleNameChange = (category: PartyCategory, index: number, field: keyof NameEntry, value: any) => {
    setReportData(prev => {
      const newNames = [...prev.names[category]];
      newNames[index] = { ...newNames[index], [field]: value };

      // Special logic for suspects arrest status
      if (category === 'Suspect' && field === 'isArrested') {
        const anyArrested = newNames.some(n => n.isArrested);
        const arrestSection = prev.narratives.optionalSections.find(s => s.id === 'arrest');
        if (arrestSection && arrestSection.enabled !== anyArrested) {
          return {
            ...prev,
            names: { ...prev.names, [category]: newNames },
            narratives: {
              ...prev.narratives,
              optionalSections: prev.narratives.optionalSections.map(s =>
                s.id === 'arrest' ? { ...s, enabled: anyArrested } : s
              )
            }
          };
        }
      }

      return { ...prev, names: { ...prev.names, [category]: newNames } };
    });
  };

  const addNameEntry = (category: PartyCategory) => {
    setReportData(prev => ({
      ...prev,
      names: { ...prev.names, [category]: [...prev.names[category], { name: '', sex: '' }] }
    }));
  };

  const removeNameEntry = (category: PartyCategory, index: number) => {
    setReportData(prev => {
      const newNames = prev.names[category].filter((_, i) => i !== index);

      // Check if arrest section needs to be updated if a suspect is removed
      if (category === 'Suspect') {
        const anyArrested = newNames.some(n => n.isArrested);
        const arrestSection = prev.narratives.optionalSections.find(s => s.id === 'arrest');
        if (arrestSection && arrestSection.enabled !== anyArrested) {
          return {
            ...prev,
            names: { ...prev.names, [category]: newNames },
            narratives: {
              ...prev.narratives,
              optionalSections: prev.narratives.optionalSections.map(s =>
                s.id === 'arrest' ? { ...s, enabled: anyArrested } : s
              )
            }
          };
        }
      }

      return { ...prev, names: { ...prev.names, [category]: newNames } };
    });
  };

  const processText = useCallback((text: string) => {
    if (!text) return '';
    let processed = text;
    const { block, street, displayTitle, isIntersection } = getBlockAddress(reportData.incidentDetails.address);
    const firstSuspect = reportData.names.Suspect.filter(n => n.name.trim() !== '')[0]?.name || '[SUSPECT]';
    const firstVictim = reportData.names.Victim.filter(n => n.name.trim() !== '')[0]?.name || '[VICTIM]';
    const firstWitness = reportData.names.Witness.filter(n => n.name.trim() !== '')[0]?.name || '[WITNESS]';

    // Handle stacked offenses logic
    if (processed.includes('[OFFENSE]') && reportData.incidentDetails.offenses.length > 0) {
      const lines = processed.split('\n');
      const newLines: string[] = [];

      lines.forEach(line => {
        if (line.includes('[OFFENSE]')) {
          reportData.incidentDetails.offenses.forEach(offense => {
            let offenseLine = line;
            const fullStatuteTitle = STATUTE_TITLES[offense.statute.toUpperCase()] || offense.statute;

            const lineReplacements: Record<string, string> = {
              '\\[OFFENSE\\]': offense.literal,
              '\\[CITATION\\]': offense.citation,
              '\\[STATUTE\\]': offense.statute,
              '\\[LEVEL\\]': offense.level,
              '\\[STATUTE_NAME\\]': fullStatuteTitle,
            };

            Object.entries(lineReplacements).forEach(([k, v]) => {
              offenseLine = offenseLine.replace(new RegExp(k, 'g'), v);
            });
            newLines.push(offenseLine);
          });
        } else {
          newLines.push(line);
        }
      });
      processed = newLines.join('\n');
    }

    const replacements: Record<string, string> = {
      '\\[DATE\\]': formatDate(reportData.incidentDetails.date),
      '\\[TIME\\]': reportData.incidentDetails.time,
      '\\[OFFICER\\]': reportData.incidentDetails.reportingOfficer || '[OFFICER]',
      '\\[SUSPECT\\]': firstSuspect,
      '\\[VICTIM\\]': firstVictim,
      '\\[WITNESS\\]': firstWitness,
      '\\[ADDRESS\\]': reportData.incidentDetails.address || '[ADDRESS]',
      '\\[BLOCK\\]': block,
      '\\[STREET\\]': street,
      '\\[LOCATION\\]': isIntersection ? displayTitle : (reportData.incidentDetails.address || '[ADDRESS]'),
      '\\[CALLTYPE\\]': (reportData.incidentDetails.callType || '[CALL TYPE]').toLowerCase(),
      '\\[CallType\\]': (reportData.incidentDetails.callType || '[CALL TYPE]').toLowerCase(),
      '\\[OFFENSES\\]': reportData.incidentDetails.offenses?.map(o => o.literal).join(', ') || '[OFFENSES]',
      '\\[OFFENSE\\]': reportData.incidentDetails.offenses?.[0]?.literal || '[OFFENSE]',
      '\\[CITATION\\]': reportData.incidentDetails.offenses?.[0]?.citation || '[CITATION]',
      '\\[STATUTE\\]': reportData.incidentDetails.offenses?.[0]?.statute || '[STATUTE]',
      '\\[LEVEL\\]': reportData.incidentDetails.offenses?.[0]?.level || '[LEVEL]',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(key, 'g'), value);
    });
    return processed;
  }, [reportData]);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts or older mobile browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) throw new Error("Copy command unsuccessful");
      }
      setFullReportCopied(true);
      setTimeout(() => setFullReportCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy to clipboard. Please try manually selecting the text.');
    }
  };

  const handleCopyFullReport = () => {
    let combinedInvestigative = '';

    if (reportData.narratives.isSapdNamesTemplateEnabled) {
      combinedInvestigative += generateSapdNamesTemplate(reportData.names) + '\n\n';
    }

    combinedInvestigative += `NARRATIVE:\n**********\n${processText(reportData.narratives.introduction)}`;
    if (reportData.narratives.investigative) combinedInvestigative += `\n\n${processText(reportData.narratives.investigative)}`;
    reportData.narratives.optionalSections.forEach(section => {
      if (section.enabled) combinedInvestigative += `\n\n${processText(section.text)}`;
    });
    if (reportData.narratives.isBwcEnabled) combinedInvestigative += `\n\n${processText(reportData.narratives.bwcStatement)}`;
    const fullText = `PUBLIC NARRATIVE:\n${reportData.narratives.public}\n\nINVESTIGATIVE NARRATIVE:\n${combinedInvestigative}\n\nPROBABLE CAUSE:\n${processText(reportData.narratives.probableCause)}`;
    copyToClipboard(fullText);
  };

  const startEditingPublic = () => { setTempPublic(reportData.narratives.public); setIsEditingPublic(true); };
  const savePublic = () => { setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, public: tempPublic, isPublicEdited: true } })); setIsEditingPublic(false); };
  const startEditingIntro = () => { setTempIntro(reportData.narratives.introduction); setIsEditingIntro(true); };
  const saveIntro = () => { setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, introduction: tempIntro, isIntroEdited: true } })); setIsEditingIntro(false); };
  const startEditingBwc = () => { setTempBwc(reportData.narratives.bwcStatement); setIsEditingBwc(true); };
  const saveBwc = () => { setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, bwcStatement: tempBwc, isBwcEdited: true } })); setIsEditingBwc(false); };
  const startEditingOffenseSummary = () => { setTempOffenseSummary(reportData.narratives.offenseSummaryStatement); setIsEditingOffenseSummary(true); };
  const saveOffenseSummary = () => { setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, offenseSummaryStatement: tempOffenseSummary, isOffenseSummaryEdited: true } })); setIsEditingOffenseSummary(false); };

  const addVehicleEntry = () => {
    setReportData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, {
        id: crypto.randomUUID(),
        vin: '',
        showVin: true,
        color: '',
        year: '',
        make: '',
        model: '',
        licensePlate: '',
        licensePlateState: 'Texas',
        style: '',
        linkedName: '',
        status: '',
        statusDetails: ''
      }]
    }));
  };

  const removeVehicleEntry = (id: string) => {
    setReportData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id)
    }));
  };

  const handleVehicleChange = (id: string, field: string, value: any) => {
    setReportData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
  };

  const decodeVin = async (id: string, vin: string) => {
    if (vin.length < 11) return;
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`);
      const data = await response.json();
      const result = data.Results?.[0];
      if (result) {
        setReportData(prev => ({
          ...prev,
          vehicles: prev.vehicles.map(v => v.id === id ? {
            ...v,
            year: result.ModelYear || v.year,
            make: result.Make || v.make,
            model: result.Model || v.model,
          } : v)
        }));
      }
    } catch (error) {
      console.error("VIN decoding failed:", error);
    }
  };

  const renderVehicleInputs = () => {
    const allNames = [
      ...reportData.names.Complainant,
      ...reportData.names.Victim,
      ...reportData.names.Suspect,
      ...reportData.names.Witness,
      ...reportData.names.Other
    ].map(n => n.name).filter(name => name.trim() !== '');

    return (
      <div className="space-y-4">
        <button
          onClick={addVehicleEntry}
          className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
        >
          <span className="text-xs font-bold text-slate-500 group-hover:text-primary transition-colors uppercase tracking-widest">Vehicles</span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
            <span className="material-symbols-outlined text-sm">add_circle</span> ADD VEHICLE
          </div>
        </button>

        <div className="space-y-4">
          {reportData.vehicles.map((vehicle, index) => (
            <div key={vehicle.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Vehicle #{index + 1}</span>
                <button onClick={() => removeVehicleEntry(vehicle.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">VIN</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        id={`show-vin-${vehicle.id}`}
                        title="Show in Report"
                        checked={vehicle.showVin}
                        onChange={(e) => handleVehicleChange(vehicle.id, 'showVin', e.target.checked)}
                        className="w-3 h-3 rounded"
                      />
                      <label htmlFor={`show-vin-${vehicle.id}`} className="text-[10px] text-slate-500 font-bold uppercase cursor-pointer">Show in Report</label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      title="Vehicle VIN"
                      placeholder="Enter VIN..."
                      value={vehicle.vin}
                      onChange={(e) => handleVehicleChange(vehicle.id, 'vin', e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm uppercase font-mono"
                    />
                    <button
                      onClick={() => decodeVin(vehicle.id, vehicle.vin)}
                      disabled={vehicle.vin.length < 11}
                      className="px-3 py-1.5 bg-primary text-white rounded-md text-[10px] font-bold disabled:opacity-50"
                    >
                      DECODE
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Color</label>
                    <input
                      type="text"
                      title="Vehicle Color"
                      placeholder="Color"
                      value={vehicle.color}
                      onChange={(e) => handleVehicleChange(vehicle.id, 'color', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Year</label>
                    <input
                      type="text"
                      title="Vehicle Year"
                      placeholder="Year"
                      value={vehicle.year}
                      onChange={(e) => handleVehicleChange(vehicle.id, 'year', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Make</label>
                    <input
                      type="text"
                      title="Vehicle Make"
                      placeholder="Make"
                      value={vehicle.make}
                      onChange={(e) => handleVehicleChange(vehicle.id, 'make', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Model</label>
                    <input
                      type="text"
                      title="Vehicle Model"
                      placeholder="Model"
                      value={vehicle.model}
                      onChange={(e) => handleVehicleChange(vehicle.id, 'model', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">License Plate</label>
                    <input
                      type="text"
                      title="License Plate"
                      placeholder="Plate"
                      value={vehicle.licensePlate}
                      onChange={(e) => handleVehicleChange(vehicle.id, 'licensePlate', e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Plate State</label>
                    <select
                      title="Plate State"
                      value={vehicle.licensePlateState}
                      onChange={(e) => handleVehicleChange(vehicle.id, 'licensePlateState', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                    >
                      {US_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Style</label>
                  <input
                    type="text"
                    title="Vehicle Style"
                    placeholder="e.g. 4D, SUV"
                    value={vehicle.style}
                    onChange={(e) => handleVehicleChange(vehicle.id, 'style', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Link to Name</label>
                  <select
                    value={vehicle.linkedName}
                    title="Link to Name"
                    onChange={(e) => handleVehicleChange(vehicle.id, 'linkedName', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                  >
                    <option value="">-- Not Linked --</option>
                    {allNames.map((name, i) => (
                      <option key={`${name}-${i}`} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Vehicle Status</label>
                  <select
                    value={vehicle.status}
                    title="Vehicle Status"
                    onChange={(e) => handleVehicleChange(vehicle.id, 'status', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                  >
                    <option value="">-- Select Status --</option>
                    <option value="Towed">Towed</option>
                    <option value="Released">Released</option>
                    <option value="Left on scene legally parked">Left on scene legally parked</option>
                  </select>
                </div>

                {(vehicle.status === 'Towed' || vehicle.status === 'Released') && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      {vehicle.status === 'Towed' ? 'Towed to/where' : 'Released to who'}
                    </label>
                    <input
                      type="text"
                      title="Status Details"
                      placeholder={vehicle.status === 'Towed' ? 'e.g. Towed to Impound' : 'e.g. Released to Owner'}
                      value={vehicle.statusDetails}
                      onChange={(e) => handleVehicleChange(vehicle.id, 'statusDetails', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNameInputs = (category: PartyCategory) => {
    const names = reportData.names[category];
    return (
      <div className="mb-4 last:mb-2">
        <button
          onClick={() => addNameEntry(category)}
          className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
        >
          <span className="text-xs font-bold text-slate-500 group-hover:text-primary transition-colors uppercase tracking-widest">{category}s</span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
            <span className="material-symbols-outlined text-sm">add_circle</span> ADD
          </div>
        </button>

        <div className="mt-2 space-y-2">
          {names.map((entry, index) => (
            <div key={`${category}-${index}`} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="relative flex-1">
                <input
                  type="text"
                  title={`Name of ${category}`}
                  placeholder={`Name of ${category}...`}
                  value={entry.name}
                  onChange={(e) => handleNameChange(category, index, 'name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                />
              </div>

              {/* Sex Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleNameChange(category, index, 'sex', entry.sex === 'M' ? '' : 'M')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${entry.sex === 'M' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                  M
                </button>
                <button
                  onClick={() => handleNameChange(category, index, 'sex', entry.sex === 'F' ? '' : 'F')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${entry.sex === 'F' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                  F
                </button>
              </div>

              {/* ARREST Button for Suspects */}
              {category === 'Suspect' && (
                <button
                  onClick={() => handleNameChange(category, index, 'isArrested', !entry.isArrested)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black tracking-tighter transition-all border ${entry.isArrested
                    ? 'bg-red-500/10 border-red-500 text-red-600 opacity-100'
                    : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-50'
                    }`}
                >
                  ARREST
                </button>
              )}

              <button
                onClick={() => removeNameEntry(category, index)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-all"
                title="Remove Entry"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const generateSapdNamesTemplate = (names: Record<PartyCategory, NameEntry[]>) => {
    const formatCategory = (category: PartyCategory, header: string, separator: string) => {
      const list = names[category].map(n => n.name).filter(n => n.trim() !== '').join('\n');
      return `${header}:\n${separator}${list ? '\n' + list : ''}`;
    }

    return `-------------------** OFFICER NARRATIVE **-----------------
${formatCategory('Complainant', 'COMPLAINANT', '************')}

${formatCategory('Victim', 'VICTIM', '*******')}

${formatCategory('Suspect', 'SUSPECT', '********')}

${formatCategory('Witness', 'WITNESS', '********')}

${formatCategory('Other', 'OTHER', '******')}

SUPPORT PERSONNEL / AGENCIES:
****************************
`;
  };

  const investigativeNarrativeContent = `${reportData.narratives.isSapdNamesTemplateEnabled ? generateSapdNamesTemplate(reportData.names) + '\n\n' : ''}NARRATIVE:\n**********\n${processText(reportData.narratives.introduction)}${reportData.narratives.investigative ? `\n\n${processText(reportData.narratives.investigative)}` : ''}${reportData.narratives.optionalSections.filter(s => s.enabled).map(s => `\n\n${processText(s.text)}`).join('')}${reportData.narratives.isBwcEnabled ? `\n\n${processText(reportData.narratives.bwcStatement)}` : ''}${reportData.narratives.isOffenseSummaryEnabled ? `\n\n${processText(reportData.narratives.offenseSummaryStatement)}` : ''}`;

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate leading-none">REPORT DRAFT</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="material-symbols-outlined text-xl">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button onClick={handleNewDraftClick} className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium dark:text-slate-200">
            <span className="material-symbols-outlined text-sm">add</span><span className="hidden sm:inline">New Draft</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium dark:text-slate-200">
            <span className="material-symbols-outlined text-sm">settings</span><span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-red-600 dark:text-red-400">warning</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reset Draft?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              This will clear all currently entered information for this report. <span className="font-bold text-red-600 dark:text-red-400">This action cannot be undone.</span>
            </p>
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={confirmNewDraft}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
              >
                Reset Draft
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><span className="material-symbols-outlined">close</span></button>
            <div className="flex flex-col items-center py-6">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4"><span className="material-symbols-outlined text-3xl text-primary dark:text-blue-400">settings</span></div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">General Settings</h2>
              <div className="w-full space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Default Officer</label>
                  {!settings.defaultOfficer ? (
                    <div className="flex gap-2">
                      <input type="text" placeholder="e.g. Doe, J #1234" className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:ring-primary focus:border-primary dark:text-white" onKeyDown={(e) => { if (e.key === 'Enter') setSettings({ ...settings, defaultOfficer: (e.target as HTMLInputElement).value }); }} />
                      <button onClick={(e) => setSettings({ ...settings, defaultOfficer: (e.currentTarget.previousSibling as HTMLInputElement).value })} className="bg-primary text-white px-3 py-2 rounded-md hover:bg-blue-800 transition-colors"><span className="material-symbols-outlined text-sm">add</span></button>
                    </div>
                  ) : (
                    <div className="relative group/officer-tag bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3 flex items-center justify-between animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-400 text-sm">person</span><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{settings.defaultOfficer}</span></div>
                      <button onClick={() => setSettings({ ...settings, defaultOfficer: '' })} className="opacity-0 group-hover/officer-tag:opacity-100 transition-opacity bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40"><span className="material-symbols-outlined text-sm">close</span></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setShowSettings(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}

      {showStatuteModal && selectedStatute && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowStatuteModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{selectedStatute.literal}</h2>
                <div className="text-xs text-primary font-bold mt-1">{selectedStatute.citation} • {selectedStatute.statute}</div>
              </div>
              <button onClick={() => setShowStatuteModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 font-serif text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap italic">
                {selectedStatute.statuteText.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={i} className="text-slate-900 dark:text-white not-italic">{part.slice(2, -2)}</strong>
                    : part
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowStatuteModal(false)}
                className="bg-primary text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden flex-col md:flex-row relative">
        <aside className={`${mobileView === 'editor' ? 'flex' : 'hidden'} md:flex md:w-[40%] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col overflow-y-auto w-full h-full`}>
          <div className="p-4 md:p-8 space-y-6 pb-24 md:pb-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Editor</h3>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">Active Report</span>
            </div>
            <div className="space-y-4">
              <AccordionItem title="Incident Details" icon="info" isOpen={activeSection === 'incident'} onToggle={() => setActiveSection(activeSection === 'incident' ? '' : 'incident')}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="incident-date" className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                      <input
                        id="incident-date"
                        type="date"
                        value={reportData.incidentDetails.date}
                        onChange={(e) => handleInputChange('incidentDetails', 'date', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="incident-time" className="block text-xs font-medium text-slate-500 mb-1">Time (24hr)</label>
                      <input
                        id="incident-time"
                        type="text"
                        placeholder="e.g. 1430"
                        maxLength={4}
                        value={reportData.incidentDetails.time}
                        onChange={(e) => handleInputChange('incidentDetails', 'time', e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400">event_repeat</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Timeframe (Optional)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="from-date" className="block text-[10px] font-medium text-slate-500 mb-1 uppercase tracking-tight">From Date</label>
                        <input
                          id="from-date"
                          type="date"
                          value={reportData.incidentDetails.fromDate}
                          onChange={(e) => handleInputChange('incidentDetails', 'fromDate', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="from-time" className="block text-[10px] font-medium text-slate-500 mb-1 uppercase tracking-tight">From Time</label>
                        <input
                          id="from-time"
                          type="text"
                          placeholder="0000"
                          maxLength={4}
                          value={reportData.incidentDetails.fromTime}
                          onChange={(e) => handleInputChange('incidentDetails', 'fromTime', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="to-date" className="block text-[10px] font-medium text-slate-500 mb-1 uppercase tracking-tight">To Date</label>
                        <input
                          id="to-date"
                          type="date"
                          value={reportData.incidentDetails.toDate}
                          onChange={(e) => handleInputChange('incidentDetails', 'toDate', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="to-time" className="block text-[10px] font-medium text-slate-500 mb-1 uppercase tracking-tight">To Time</label>
                        <input
                          id="to-time"
                          type="text"
                          placeholder="0000"
                          maxLength={4}
                          value={reportData.incidentDetails.toTime}
                          onChange={(e) => handleInputChange('incidentDetails', 'toTime', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="how-received" className="block text-xs font-medium text-slate-500 mb-1">How Received</label>
                    <select id="how-received" aria-label="How Received" title="Select how the incident was received" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none" value={reportData.incidentDetails.howReceived} onChange={(e) => handleInputChange('incidentDetails', 'howReceived', e.target.value as any)}>
                      <option value="dispatched">dispatched</option><option value="initiated">initiated</option><option value="flagged down">flagged down</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label htmlFor="call-type" className="block text-xs font-medium text-slate-500 mb-1">Call Type</label>
                      <select id="call-type" aria-label="Call Type" title="Select the type of call" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none" value={reportData.incidentDetails.callType} onChange={(e) => handleInputChange('incidentDetails', 'callType', e.target.value)}>
                        <option value="">-- Select Call Type --</option>
                        {(reportData.incidentDetails.howReceived === 'initiated' ? INITIATED_CALL_TYPES : CALL_TYPES).map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                  </div>

                  {REASON_FOR_STOP_TYPES.includes(reportData.incidentDetails.callType) && (
                    <div className="flex gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      {CONSENSUAL_STOP_TYPES.includes(reportData.incidentDetails.callType) && (
                        <div className="flex items-center h-full pt-6">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="consensual-check"
                              checked={reportData.incidentDetails.isConsensual}
                              onChange={(e) => handleInputChange('incidentDetails', 'isConsensual', e.target.checked)}
                              className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="consensual-check" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">Consensual Stop</label>
                          </div>
                        </div>
                      )}

                      {(!reportData.incidentDetails.isConsensual || !CONSENSUAL_STOP_TYPES.includes(reportData.incidentDetails.callType)) && (
                        <div className="flex-1">
                          <label htmlFor="reason-for-stop" className="block text-xs font-medium text-slate-500 mb-1">Reason for Stop</label>
                          <input
                            id="reason-for-stop"
                            type="text"
                            title="Reason for Stop"
                            placeholder="e.g. defective tail light"
                            value={reportData.incidentDetails.reasonForStop}
                            onChange={(e) => handleInputChange('incidentDetails', 'reasonForStop', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative" ref={offenseDropdownRef}>
                    <label htmlFor="offense-search" className="block text-xs font-medium text-slate-500 mb-1">Offense (CJIS Code v20 & Municipal Court Offenses)</label>
                    <div className="relative">
                      <input
                        id="offense-search"
                        type="text"
                        title="Search Offenses"
                        placeholder="Search to add offense..."
                        value={offenseSearch}
                        onChange={(e) => {
                          setOffenseSearch(e.target.value);
                          setShowOffenseDropdown(true);
                        }}
                        onFocus={() => setShowOffenseDropdown(true)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white pr-10 appearance-none"
                      />
                      {offenseSearch && (
                        <button
                          onClick={() => setOffenseSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>

                    {showOffenseDropdown && offenseSearch.length > 1 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl max-h-60 overflow-y-auto">
                        {filteredOffenses.length > 0 ? (
                          <>
                            {filteredOffenses.map((offense, idx) => (
                              <div
                                key={`${offense.citation}-${idx}`}
                                onClick={() => {
                                  handleInputChange('incidentDetails', 'offenses', [...(reportData.incidentDetails.offenses || []), offense]);
                                  setOffenseSearch('');
                                  setShowOffenseDropdown(false);
                                }}
                                className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0"
                              >
                                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase">{offense.literal}</div>
                                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                                  <span>Cite: {offense.citation} ({offense.statute})</span>
                                  <span className="font-bold text-primary">{offense.level}</span>
                                </div>
                              </div>
                            ))}
                            <div
                              onClick={() => {
                                const custom: Offense = { literal: offenseSearch.toUpperCase(), citation: 'N/A', statute: 'CUSTOM', level: 'N/A' };
                                handleInputChange('incidentDetails', 'offenses', [...(reportData.incidentDetails.offenses || []), custom]);
                                setOffenseSearch('');
                                setShowOffenseDropdown(false);
                              }}
                              className="px-3 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/10 cursor-pointer text-center group"
                            >
                              <div className="text-xs font-bold text-primary flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                ADD CUSTOM: "{offenseSearch.toUpperCase()}"
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="px-3 py-6 text-center">
                            <div className="text-xs text-slate-500 italic mb-3 text-center">No matching offenses found</div>
                            <button
                              onClick={() => {
                                const custom: Offense = { literal: offenseSearch.toUpperCase(), citation: 'N/A', statute: 'CUSTOM', level: 'N/A' };
                                handleInputChange('incidentDetails', 'offenses', [...(reportData.incidentDetails.offenses || []), custom]);
                                setOffenseSearch('');
                                setShowOffenseDropdown(false);
                              }}
                              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              <span className="material-symbols-outlined text-sm">add_circle</span>
                              CREATE CUSTOM OFFENSE
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {reportData.incidentDetails.offenses?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {reportData.incidentDetails.offenses?.map((offense, idx) => {
                          const isCustom = offense.statute === 'CUSTOM';
                          return (
                            <div key={`${offense.citation}-${idx}`} className={`p-2 border rounded-md animate-in slide-in-from-top-1 duration-200 ${isCustom ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`}>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className={`text-[10px] font-bold uppercase leading-tight ${isCustom ? 'text-amber-700 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>{offense.literal}</div>
                                  <div className={`text-[10px] mt-1 ${isCustom ? 'text-amber-600/70 dark:text-amber-500/70' : 'text-blue-500'}`}>
                                    {isCustom ? 'Custom Entry • No Code' : `${offense.citation} • ${offense.statute} • ${offense.level}`}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`${isCustom ? 'bg-amber-600' : 'bg-blue-600'} text-white text-[9px] px-1.5 py-0.5 rounded font-bold`}>{isCustom ? 'MANUAL' : 'V20'}</span>
                                  {offense.statuteText && (
                                    <button
                                      onClick={() => {
                                        setSelectedStatute(offense);
                                        setShowStatuteModal(true);
                                      }}
                                      className="text-slate-400 hover:text-primary transition-colors"
                                      title="View Statute"
                                    >
                                      <span className="material-symbols-outlined text-lg">
                                        {['TRC', 'TC'].includes(offense.statute) ? 'menu_book' : 'info'}
                                      </span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      const newOffenses = (reportData.incidentDetails.offenses || []).filter((_, i) => i !== idx);
                                      handleInputChange('incidentDetails', 'offenses', newOffenses);
                                    }}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="address-input" className="block text-xs font-medium text-slate-500">Address</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="business-check"
                          checked={reportData.incidentDetails.isBusiness}
                          onChange={(e) => handleInputChange('incidentDetails', 'isBusiness', e.target.checked)}
                          className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        <label htmlFor="business-check" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none">Business</label>
                      </div>
                    </div>
                    <input
                      id="address-input"
                      type="text"
                      title="Incident Address"
                      placeholder="e.g. 123 Main St"
                      value={reportData.incidentDetails.address}
                      onChange={(e) => handleInputChange('incidentDetails', 'address', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none"
                    />

                    {reportData.incidentDetails.isBusiness && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        <label htmlFor="business-name-input" className="block text-[10px] font-medium text-slate-500 mb-1 uppercase tracking-tight">Business Name</label>
                        <input
                          id="business-name-input"
                          type="text"
                          title="Business Name"
                          placeholder="e.g. Walmart, McDonald's"
                          value={reportData.incidentDetails.businessName}
                          onChange={(e) => handleInputChange('incidentDetails', 'businessName', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none font-medium"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="officer-input" className="block text-xs font-medium text-slate-500 mb-1">Reporting Officer</label>
                    <input id="officer-input" type="text" title="Reporting Officer" placeholder="Doe, J #1234" value={reportData.incidentDetails.reportingOfficer} onChange={(e) => handleInputChange('incidentDetails', 'reportingOfficer', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none" />
                  </div>
                  <hr className="border-slate-100 dark:border-slate-800" />
                  <div>
                    <label htmlFor="template-select" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Template Narrative Injection</label>
                    <div className="relative">
                      <select id="template-select" aria-label="Template Narrative Injection" title="Select a narrative template" className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none" value={selectedTemplateId} onChange={handleTemplateSelect}>
                        <option value="">-- No Template Selected --</option>
                        {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-sm">filter_list</span>
                    </div>
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem title="Names" icon="person" isOpen={activeSection === 'names'} onToggle={() => setActiveSection(activeSection === 'names' ? '' : 'names')}>
                <div className="space-y-2">
                  {renderNameInputs('Complainant')}{renderNameInputs('Victim')}{renderNameInputs('Suspect')}{renderNameInputs('Witness')}{renderNameInputs('Other')}
                </div>
              </AccordionItem>
              <AccordionItem title="Vehicles" icon="directions_car" isOpen={activeSection === 'vehicles'} onToggle={() => setActiveSection(activeSection === 'vehicles' ? '' : 'vehicles')}>
                <div className="space-y-4">
                  {renderVehicleInputs()}
                </div>
              </AccordionItem>
              <AccordionItem title="Public Narrative" icon="edit_note" isOpen={activeSection === 'public'} onToggle={() => setActiveSection(activeSection === 'public' ? '' : 'public')}>
                <div className="space-y-4">
                  {isEditingPublic ? (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label htmlFor="public-edit-area" className="sr-only">Edit Public Narrative</label>
                      <textarea id="public-edit-area" title="Edit Public Narrative" className="w-full h-40 min-h-[160px] p-3 text-base md:text-sm border-2 border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed appearance-none ring-offset-0 outline-none" value={tempPublic} onChange={(e) => setTempPublic(e.target.value)} />
                      <div className="flex justify-end gap-2"><button onClick={() => setIsEditingPublic(false)} className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Cancel</button><button onClick={savePublic} className="text-xs font-semibold px-3 py-1.5 rounded bg-primary text-white">Save</button></div>
                    </div>
                  ) : (
                    <div className="relative group/public bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      <button onClick={startEditingPublic} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm opacity-100 md:opacity-0 md:group-hover/public:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary"><span className="material-symbols-outlined text-sm">edit</span>EDIT</button>
                      {reportData.narratives.public}
                    </div>
                  )}
                </div>
              </AccordionItem>
              <AccordionItem title="Investigative Narrative" icon="description" isOpen={activeSection === 'investigative'} onToggle={() => setActiveSection(activeSection === 'investigative' ? '' : 'investigative')}>
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <input
                      type="checkbox"
                      id="sapd-names-template-checkbox"
                      checked={reportData.narratives.isSapdNamesTemplateEnabled}
                      onChange={(e) => handleInputChange('narratives', 'isSapdNamesTemplateEnabled', e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="sapd-names-template-checkbox" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      SAPD Names Template
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Introduction</label>
                    {isEditingIntro ? (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        <label htmlFor="intro-edit-area" className="sr-only">Edit Introduction</label>
                        <textarea id="intro-edit-area" title="Edit Introduction" className="w-full h-48 min-h-[192px] p-3 text-base md:text-sm border-2 border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed appearance-none ring-offset-0 outline-none" value={tempIntro} onChange={(e) => setTempIntro(e.target.value)} />
                        <div className="flex justify-end gap-2"><button onClick={() => setIsEditingIntro(false)} className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Cancel</button><button onClick={saveIntro} className="text-xs font-semibold px-3 py-1.5 rounded bg-primary text-white">Save</button></div>
                      </div>
                    ) : (
                      <div className="relative group/intro bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        <button onClick={startEditingIntro} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm opacity-100 md:opacity-0 md:group-hover/intro:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary"><span className="material-symbols-outlined text-sm">edit</span>EDIT</button>
                        {processText(reportData.narratives.introduction)}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="findings-area" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Findings</label>
                    <textarea id="findings-area" title="Investigative Findings" className="w-full h-64 min-h-[256px] p-3 text-base md:text-sm border-2 border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed appearance-none ring-offset-0 outline-none" placeholder="Enter detailed investigative findings here..." value={reportData.narratives.investigative} onChange={(e) => handleInputChange('narratives', 'investigative', e.target.value)} />
                  </div>
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Additional Sections</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {reportData.narratives.optionalSections.map((section) => (
                        <div key={section.id} className="flex items-center gap-2">
                          <input type="checkbox" id={`check-${section.id}`} checked={section.enabled} onChange={(e) => handleOptionalSectionToggle(section.id, e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                          <label htmlFor={`check-${section.id}`} className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">{section.label}</label>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      {reportData.narratives.optionalSections.filter(s => s.enabled).map((section, idx, arr) => (
                        <div key={`edit-${section.id}`} draggable onDragStart={() => handleDragStart(section.id)} onDragOver={(e) => handleDragOver(e, section.id)} onDrop={(e) => handleDrop(e, section.id)} className={`animate-in fade-in slide-in-from-top-2 duration-300 transition-all border rounded-md p-3 ${draggedItemId === section.id ? 'opacity-30 scale-95' : 'opacity-100'} ${dragOverId === section.id ? 'border-primary border-2 border-dashed bg-primary/5' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-400 cursor-grab active:cursor-grabbing select-none">drag_indicator</span><label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{section.label}</label></div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => moveSection(section.id, 'up')} disabled={idx === 0} className={`p-1 rounded ${idx === 0 ? 'text-slate-200' : 'text-slate-500'}`}><span className="material-symbols-outlined text-lg">arrow_upward</span></button>
                              <button onClick={() => moveSection(section.id, 'down')} disabled={idx === arr.length - 1} className={`p-1 rounded ${idx === arr.length - 1 ? 'text-slate-200' : 'text-slate-500'}`}><span className="material-symbols-outlined text-lg">arrow_downward</span></button>
                            </div>
                          </div>
                          {editingSectionId === section.id ? (
                            <div className="space-y-2">
                              <label htmlFor={`edit-section-${section.id}`} className="sr-only">Edit {section.label}</label>
                              <textarea id={`edit-section-${section.id}`} title={`Edit ${section.label}`} className="w-full h-32 min-h-[128px] p-3 text-base md:text-sm border-2 border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none appearance-none ring-offset-0 outline-none" value={tempSectionText} onChange={(e) => setTempSectionText(e.target.value)} />
                              <div className="flex justify-end gap-2"><button onClick={cancelSectionEdit} className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600">Cancel</button><button onClick={() => saveSection(section.id)} className="text-xs font-semibold px-3 py-1.5 rounded bg-primary text-white">Save</button></div>
                            </div>
                          ) : (
                            <div className="relative group/opt bg-slate-50 dark:bg-slate-800/50 border border-slate-200 rounded p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                              <button onClick={() => startEditingSection(section)} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm opacity-100 md:opacity-0 md:group-hover/opt:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary"><span className="material-symbols-outlined text-sm">edit</span>EDIT</button>
                              {processText(section.text)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BWC Section */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="bwc-checkbox"
                        checked={reportData.narratives.isBwcEnabled}
                        onChange={(e) => handleInputChange('narratives', 'isBwcEnabled', e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="bwc-checkbox" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Body-worn camera statement
                      </label>
                    </div>

                    {reportData.narratives.isBwcEnabled && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        {isEditingBwc ? (
                          <div className="space-y-2">
                            <label htmlFor="bwc-edit-area" className="sr-only">Edit BWC Statement</label>
                            <textarea
                              id="bwc-edit-area"
                              title="Edit BWC Statement"
                              className="w-full h-32 min-h-[128px] p-3 text-base md:text-sm border-2 border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed appearance-none ring-offset-0 outline-none"
                              value={tempBwc}
                              onChange={(e) => setTempBwc(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setIsEditingBwc(false)} className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Cancel</button>
                              <button onClick={saveBwc} className="text-xs font-semibold px-3 py-1.5 rounded bg-primary text-white">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group/bwc bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            <button onClick={startEditingBwc} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm opacity-100 md:opacity-0 md:group-hover/bwc:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary">
                              <span className="material-symbols-outlined text-sm">edit</span>EDIT
                            </button>
                            {processText(reportData.narratives.bwcStatement)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Offense Summary Section */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="offense-summary-checkbox"
                        checked={reportData.narratives.isOffenseSummaryEnabled}
                        onChange={(e) => handleInputChange('narratives', 'isOffenseSummaryEnabled', e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="offense-summary-checkbox" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        OFFENSE SUMMARY
                      </label>
                    </div>

                    {reportData.narratives.isOffenseSummaryEnabled && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        {isEditingOffenseSummary ? (
                          <div className="space-y-2">
                            <label htmlFor="offense-summary-edit-area" className="sr-only">Edit Offense Summary</label>
                            <textarea
                              id="offense-summary-edit-area"
                              title="Edit Offense Summary"
                              className="w-full h-32 min-h-[128px] p-3 text-base md:text-sm border-2 border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed appearance-none ring-offset-0 outline-none"
                              value={tempOffenseSummary}
                              onChange={(e) => setTempOffenseSummary(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setIsEditingOffenseSummary(false)} className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Cancel</button>
                              <button onClick={saveOffenseSummary} className="text-xs font-semibold px-3 py-1.5 rounded bg-primary text-white">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group/offense-summary bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            <button onClick={startEditingOffenseSummary} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm opacity-100 md:opacity-0 md:group-hover/offense-summary:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary">
                              <span className="material-symbols-outlined text-sm">edit</span>EDIT
                            </button>
                            <div className="whitespace-pre-wrap">{processText(reportData.narratives.offenseSummaryStatement)}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem title="Booking Probable Cause" icon="gavel" isOpen={activeSection === 'pc'} onToggle={() => setActiveSection(activeSection === 'pc' ? '' : 'pc')}>
                <div className="space-y-2">
                  <label htmlFor="pc-area" className="sr-only">Booking Probable Cause</label>
                  <textarea id="pc-area" title="Booking Probable Cause" className="w-full h-40 min-h-[160px] p-3 text-base md:text-sm border-2 border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed appearance-none ring-offset-0 outline-none" placeholder="Legal justification for arrest..." value={reportData.narratives.probableCause} onChange={(e) => handleInputChange('narratives', 'probableCause', e.target.value)} />
                </div>
              </AccordionItem>
            </div>
          </div>
        </aside >

        {mobileView === 'editor' && (
          <div className="md:hidden fixed bottom-6 left-6 z-[60]"><button onClick={() => setMobileView('preview')} className="bg-primary text-white font-bold py-3 px-6 rounded-full shadow-2xl flex items-center gap-2 transition-all"><span className="material-symbols-outlined">visibility</span>Draft Preview</button></div>
        )
        }

        <section className={`${mobileView === 'preview' ? 'flex' : 'hidden'} md:flex md:w-[60%] overflow-y-auto p-4 md:p-12 bg-slate-100 dark:bg-slate-950 flex flex-col items-center relative w-full h-full`}>
          <div className="w-full max-w-4xl mb-6 flex items-center justify-between sticky top-0 md:relative z-20 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-sm p-2 rounded-lg">
            <div className="flex items-center gap-4"><button onClick={() => setMobileView('editor')} className="md:hidden flex items-center gap-1 text-primary dark:text-blue-400 font-bold"><span className="material-symbols-outlined">arrow_back</span>Back</button><h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 hidden sm:block">FINAL DRAFT</h2></div>
            <div className="flex items-center gap-2"><div className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-lg p-1 shadow-sm"><button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1.5 hover:bg-slate-100 rounded transition-colors"><span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-400">zoom_out</span></button><span className="text-xs font-bold px-2 text-slate-500 w-12 text-center">{zoomLevel}%</span><button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="p-1.5 hover:bg-slate-100 rounded transition-colors"><span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-400">zoom_in</span></button></div></div>
          </div>
          <div className="w-full max-w-4xl transition-all duration-300 origin-top pb-24" style={{ transform: isDesktop ? `scale(${zoomLevel / 100})` : 'none' }}>
            <div className="document-paper w-full bg-white dark:bg-slate-900 rounded-sm">
              <PreviewSection title="Public Narrative" content={processText(reportData.narratives.public)} />
              <PreviewSection title="Investigative Narrative" content={investigativeNarrativeContent} />
              <PreviewSection title="Probable Cause Statement" content={processText(reportData.narratives.probableCause)} />
            </div>
            <div className="mt-8 text-slate-400 text-center uppercase tracking-widest text-[10px]">Confidential - Law Enforcement Use Only</div>
          </div>
          <div className="fixed right-4 md:right-8 bottom-4 md:bottom-8 z-20 flex flex-col gap-4">
            <button className={`w-12 h-12 md:w-14 md:h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${fullReportCopied ? 'bg-green-500' : 'bg-primary'} text-white`} onClick={handleCopyFullReport}><span className="material-symbols-outlined text-xl md:text-2xl">{fullReportCopied ? 'check' : 'content_copy'}</span></button>
          </div>
        </section>
      </main >
    </>
  );
}