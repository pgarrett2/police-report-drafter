import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TEMPLATES, INITIAL_STATE, CALL_TYPES, INITIATED_CALL_TYPES, REASON_FOR_STOP_TYPES, CONSENSUAL_STOP_TYPES, INTRO_BODY, INITIAL_SETTINGS, BWC_BOILERPLATE, OFFENSE_SUMMARY_BOILERPLATE, getFreshInitialState, US_STATES, CPS_INTAKE_VERSION_1, CPS_INTAKE_VERSION_2, APS_INTAKE_BOILERPLATE, SECTION_BOILERPLATES, ARREST_VERSION_1, ARREST_VERSION_2, PHOTOS_TAKEN_BOILERPLATE, CITIZEN_LINK_SENT_VERSION_1, CITIZEN_LINK_SENT_VERSION_2, BWC_VERSION_1, BWC_VERSION_2, BWC_VERSION_3, BWC_INITIATED_TEXT, BWC2_BOILERPLATE } from './constants';
import { CJIS_CODES } from './cjis_codes';
import { ReportState, Template, PartyCategory, OptionalSection, PersistentSettings, Offense, NameEntry, Vehicle, Conviction } from './types';
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

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
          if ((parsed.incidentDetails as any).offense) {
            const oldOffense = (parsed.incidentDetails as any).offense;
            parsed.incidentDetails.offenses.push({ ...oldOffense, id: oldOffense.id || generateId() });
          }
        }
        // Ensure all existing offenses have IDs
        parsed.incidentDetails.offenses = parsed.incidentDetails.offenses.map((o: any) => ({
          ...o,
          id: o.id || generateId()
        }));
        // Data Migration: Merge optional sections - keep existing enabled states and add any new sections
        const mergedOptionalSections = initial.narratives.optionalSections.map(initialSection => {
          const existingSection = parsed.narratives?.optionalSections?.find(
            (s: OptionalSection) => s.id === initialSection.id
          );
          if (existingSection) {
            // Keep existing section's state (enabled, text, isEdited)
            return existingSection;
          }
          // New section - use initial defaults
          return initialSection;
        });

        return {
          ...initial,
          ...parsed,
          incidentDetails: { ...initial.incidentDetails, ...(parsed.incidentDetails || {}) },
          narratives: {
            ...initial.narratives,
            ...(parsed.narratives || {}),
            optionalSections: mergedOptionalSections
          },
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
  const [isAdditionalSectionsOpen, setIsAdditionalSectionsOpen] = useState(false);

  // Refs for auto-scrolling
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollToSection = (sectionId: string) => {
    setTimeout(() => {
      const element = sectionRefs.current[sectionId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100); // Small delay to allow accordion animation to start
  };

  const handleSectionToggle = (section: string) => {
    const isActive = activeSection === section;
    const newSection = isActive ? '' : section;
    setActiveSection(newSection);
    if (!isActive) {
      scrollToSection(section);
    }
  };

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
  const [linkingOffenseRef, setLinkingOffenseRef] = useState<{ category: PartyCategory, index: number } | null>(null);
  const [tempLinkedOffenses, setTempLinkedOffenses] = useState<string[]>([]);

  // UI Edit States
  const [isEditingPublic, setIsEditingPublic] = useState(false);
  const [tempPublic, setTempPublic] = useState('');
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [tempIntro, setTempIntro] = useState('');
  const [isEditingBwc, setIsEditingBwc] = useState(false);
  const [tempBwc, setTempBwc] = useState('');
  const [isEditingBwc2, setIsEditingBwc2] = useState(false);
  const [tempBwc2, setTempBwc2] = useState('');
  const [isEditingOffenseSummary, setIsEditingOffenseSummary] = useState(false);
  const [tempOffenseSummary, setTempOffenseSummary] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [tempSectionText, setTempSectionText] = useState('');

  // Effect to update offenses in current report when custom definitions change
  useEffect(() => {
    if (!settings.customOffenses) return;

    setReportData(prev => {
      let hasChanges = false;
      const newOffenses = prev.incidentDetails.offenses.map(offense => {
        const customDef = settings.customOffenses?.[offense.literal];
        if (customDef) {
          // Check if any fields differ
          if (
            offense.citation !== customDef.citation ||
            offense.statute !== customDef.statute ||
            offense.level !== customDef.level ||
            offense.elements !== customDef.elements ||
            offense.statuteText !== customDef.statuteText
          ) {
            hasChanges = true;
            return {
              ...offense,
              citation: customDef.citation,
              statute: customDef.statute,
              level: customDef.level,
              elements: customDef.elements,
              statuteText: customDef.statuteText
            };
          }
        }
        return offense;
      });

      if (!hasChanges) return prev;

      return {
        ...prev,
        incidentDetails: {
          ...prev.incidentDetails,
          offenses: newOffenses
        }
      };
    });
  }, [settings.customOffenses]);

  // Offense Editor State
  const [showOffenseEditor, setShowOffenseEditor] = useState(false);
  const [offenseSearchTerm, setOffenseSearchTerm] = useState('');
  const [editingOffense, setEditingOffense] = useState<Offense | null>(null);
  const [showOverridesList, setShowOverridesList] = useState(false);

  // Merge static codes with custom overrides
  const mergedCjisCodes = React.useMemo(() => {
    if (!settings.customOffenses) return CJIS_CODES;
    return CJIS_CODES.map(code => settings.customOffenses![code.literal] || code);
  }, [settings.customOffenses]);

  const editorFilteredOffenses = React.useMemo(() => {
    if (!offenseSearchTerm) return [];
    const search = offenseSearchTerm.trim().toLowerCase();

    const matches = mergedCjisCodes.filter(offense =>
      offense.literal.toLowerCase().includes(search) ||
      offense.citation.toLowerCase().includes(search)
    );

    // Sort: exact matches or prefix matches first (same as main app)
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
  }, [offenseSearchTerm, mergedCjisCodes]);

  const handleSaveOffense = (updatedOffense: Offense) => {
    setSettings(prev => ({
      ...prev,
      customOffenses: {
        ...(prev.customOffenses || {}),
        [updatedOffense.literal]: updatedOffense
      }
    }));
    setEditingOffense(null);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(mergedCjisCodes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "cjis_codes.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteOverride = (literal: string) => {
    if (!settings.customOffenses || !settings.customOffenses[literal]) return;

    const newCustom = { ...settings.customOffenses };
    delete newCustom[literal];

    setSettings(prev => ({
      ...prev,
      customOffenses: newCustom
    }));

    // Reset the editing view to show the original default
    const original = CJIS_CODES.find(c => c.literal === literal);
    if (original) {
      setEditingOffense(original);
    }
  };



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

    const matches = mergedCjisCodes.filter(offense =>
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
  }, [offenseSearch, mergedCjisCodes]);

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

  // Reactively update Missing Juvenile GUARDIAN and MISSING PERSON when Names change
  useEffect(() => {
    const missingJuvenileSection = reportData.narratives.optionalSections.find(s => s.id === 'missingjuvenile');
    if (missingJuvenileSection?.enabled) {
      const guardianVal = reportData.names['Complainant']?.[0]?.name || '';
      const missingPersonVal = reportData.names['Victim']?.[0]?.name || '';
      const currentGuardian = missingJuvenileSection.values?.['GUARDIAN'] || '';
      const currentMissing = missingJuvenileSection.values?.['MISSING PERSON'] || '';

      // Only update if the values are different to avoid infinite loop
      if (guardianVal !== currentGuardian || missingPersonVal !== currentMissing) {
        setReportData(prev => ({
          ...prev,
          narratives: {
            ...prev.narratives,
            optionalSections: prev.narratives.optionalSections.map(s => {
              if (s.id === 'missingjuvenile') {
                return {
                  ...s,
                  values: {
                    ...s.values,
                    'GUARDIAN': guardianVal,
                    'MISSING PERSON': missingPersonVal
                  }
                };
              }
              return s;
            })
          }
        }));
      }
    }
  }, [reportData.names['Complainant'], reportData.names['Victim']]);

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
        let line = offense.literal;

        // Settings-based display (default is false for all, so users must opt-in)
        // If nothing is checked, only Literal is shown (checked above).

        if (settings.offenseSummaryStatute) {
          const fullStatuteTitle = STATUTE_TITLES[offense.statute.toUpperCase()] || offense.statute;
          line += ` - ${fullStatuteTitle}`;
        }

        if (settings.offenseSummaryCitation) {
          line += ` ${offense.citation}`;
        }

        if (settings.offenseSummaryLevel) {
          line += ` [${offense.level}]`;
        }

        lines.push(line);

        if (settings.offenseSummaryElements && offense.elements) {
          lines.push(`\n${offense.elements}\n`);
        }
      });
      dynamicOffenseSummary = lines.join('\n');
    }

    setReportData(prev => {
      const narratives = { ...prev.narratives };
      if (!prev.narratives.isPublicEdited) narratives.public = publicNarrative;
      if (!prev.narratives.isIntroEdited) narratives.introduction = `${introFirstSentence} ${INTRO_BODY}`;
      if (!prev.narratives.isOffenseSummaryEdited) narratives.offenseSummaryStatement = dynamicOffenseSummary;

      // Auto-populate Body-Cam text for Initiated calls
      if (howReceived === 'initiated' && !prev.narratives.isBwcEdited) {
        narratives.bwcStatement = BWC_INITIATED_TEXT;
      } else if (howReceived !== 'initiated' && narratives.bwcStatement === BWC_INITIATED_TEXT && !prev.narratives.isBwcEdited) {
        // Revert to default if switching away from Initiated and user hasn't edited manually
        narratives.bwcStatement = BWC_VERSION_1;
      }

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
    reportData.narratives.isIntroEdited,
    reportData.narratives.isOffenseSummaryEdited,
    settings
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
    setReportData(prev => {
      let newOptionalSections = prev.narratives.optionalSections.map(s =>
        s.id === id ? { ...s, enabled } : s
      );

      // Auto-fill logic for Missing Juvenile
      if (id === 'missingjuvenile' && enabled) {
        newOptionalSections = newOptionalSections.map(s => {
          if (s.id === 'missingjuvenile') {
            const guardianVal = prev.names['Complainant']?.[0]?.name || '';
            const missingPersonVal = prev.names['Victim']?.[0]?.name || '';
            return {
              ...s,
              values: {
                ...s.values,
                'GUARDIAN': guardianVal,
                'MISSING PERSON': missingPersonVal
              }
            };
          }
          return s;
        });
      }

      return {
        ...prev,
        narratives: {
          ...prev.narratives,
          optionalSections: newOptionalSections
        }
      };
    });
  };

  // Handle section version switching
  const handleSectionVersionChange = (sectionId: string, version: 1 | 2) => {
    let newText = '';
    if (sectionId === 'cpsintake') newText = version === 1 ? CPS_INTAKE_VERSION_1 : CPS_INTAKE_VERSION_2;
    if (sectionId === 'arrest') newText = version === 1 ? ARREST_VERSION_1 : ARREST_VERSION_2;
    if (sectionId === 'citizenlinksent') newText = version === 1 ? CITIZEN_LINK_SENT_VERSION_1 : CITIZEN_LINK_SENT_VERSION_2;

    setReportData(prev => ({
      ...prev,
      narratives: {
        ...prev.narratives,
        optionalSections: prev.narratives.optionalSections.map(s =>
          s.id === sectionId ? { ...s, text: newText, isEdited: false } : s
        )
      }
    }));
  };

  // Get current version based on text content
  const getSectionVersion = (sectionId: string, text: string): 1 | 2 => {
    if (sectionId === 'cpsintake') return text.includes('spoke with the following children') ? 2 : 1;
    if (sectionId === 'arrest') return text.includes('placed under arrest for') ? 2 : 1;
    if (sectionId === 'citizenlinksent') return text.includes("I sent [NAME] an Axon's Citizen Link") ? 2 : 1;
    return 1;
  };

  // Handle placeholder input changes within section state
  const handlePlaceholderChange = (sectionId: string, placeholder: string, value: string) => {
    setReportData(prev => ({
      ...prev,
      narratives: {
        ...prev.narratives,
        optionalSections: prev.narratives.optionalSections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            values: {
              ...(s.values || {}),
              [placeholder]: value
            }
          };
        })
      }
    }));
  };

  const handleConvictionAdd = (sectionId: string) => {
    const newConviction: Conviction = {
      id: generateId(),
      court: '',
      offense: '',
      causeNumber: '',
      date: ''
    };

    setReportData(prev => ({
      ...prev,
      narratives: {
        ...prev.narratives,
        optionalSections: prev.narratives.optionalSections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            convictions: [...(s.convictions || []), newConviction],
            convictionListFormat: s.convictionListFormat || 'bullet'
          };
        })
      }
    }));
  };

  const handleConvictionChange = (sectionId: string, convictionId: string, field: keyof Conviction, value: string) => {
    setReportData(prev => ({
      ...prev,
      narratives: {
        ...prev.narratives,
        optionalSections: prev.narratives.optionalSections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            convictions: (s.convictions || []).map(c =>
              c.id === convictionId ? { ...c, [field]: value } : c
            )
          };
        })
      }
    }));
  };

  const handleConvictionDelete = (sectionId: string, convictionId: string) => {
    setReportData(prev => ({
      ...prev,
      narratives: {
        ...prev.narratives,
        optionalSections: prev.narratives.optionalSections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            convictions: (s.convictions || []).filter(c => c.id !== convictionId)
          };
        })
      }
    }));
  };

  const handleConvictionFormatChange = (sectionId: string, format: 'bullet' | 'dash' | 'number') => {
    setReportData(prev => ({
      ...prev,
      narratives: {
        ...prev.narratives,
        optionalSections: prev.narratives.optionalSections.map(s => {
          if (s.id !== sectionId) return s;
          return { ...s, convictionListFormat: format };
        })
      }
    }));
  };

  // Interpolate placeholders for the preview output
  const interpolatePlaceholders = (section: OptionalSection) => {
    let result = section.text;
    if (section.values) {
      Object.entries(section.values).forEach(([key, value]) => {
        if (value && value.trim()) {
          const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const placeholderRegex = new RegExp(`\\[${escapedKey}\\]`, 'g');
          result = result.replace(placeholderRegex, value);
        }
      });
    }

    // Append text2 for sections that have it (e.g., Missing Juvenile)
    if (section.text2) {
      let text2Result = section.text2;
      if (section.values) {
        Object.entries(section.values).forEach(([key, value]) => {
          if (value && value.trim()) {
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const placeholderRegex = new RegExp(`\\[${escapedKey}\\]`, 'g');
            text2Result = text2Result.replace(placeholderRegex, value);
          }
        });
      }
      result += '\n\n' + text2Result;
    }

    // Handle dynamic convictions list for CCH check
    if (section.id === 'cchcheck' && section.convictions && section.convictions.length > 0) {
      const convictionsText = section.convictions
        .map((c, i) => {
          const line = `Court: ${c.court}, Offense: ${c.offense}, Cause Number: ${c.causeNumber}, Conviction Date: ${c.date}`;
          if (section.convictionListFormat === 'number') return `${i + 1}. ${line}`;
          if (section.convictionListFormat === 'dash') return `- ${line}`;
          return `• ${line}`;
        })
        .join('\n');
      result += `\n${convictionsText}`;
    }

    return result;
  };

  // Render text with inline input fields for placeholders
  const renderTextWithPlaceholders = (section: OptionalSection, textKey: 'text' | 'text2' = 'text') => {
    const text = textKey === 'text2' ? (section.text2 || '') : section.text;
    // Match placeholders like [NAME], [NUMBER], [CHILDREN], [Example: ...], etc.
    const placeholderRegex = /\[([A-Z0-9\s#\:\.,a-z/]+)\]/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    const values = section.values || {};

    while ((match = placeholderRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const placeholder = match[1];
      const currentValue = values[placeholder] || '';

      parts.push(
        <textarea
          key={`${section.id}-${textKey}-${match.index}`}
          placeholder={placeholder}
          value={currentValue}
          rows={1}
          onChange={(e) => {
            handlePlaceholderChange(section.id, placeholder, e.target.value);
            // Auto-resize
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onFocus={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="inline-block align-bottom mx-1 px-2 py-0.5 border-b-2 border-primary/30 bg-primary/5 dark:bg-blue-900/10 rounded-t text-primary dark:text-blue-400 font-bold text-sm focus:border-primary focus:bg-primary/10 outline-none transition-all placeholder:text-primary/40 resize-none overflow-hidden"
          style={{ minWidth: '80px', maxWidth: '100%', width: Math.max(80, (currentValue.length || placeholder.length) * 8 + 20) + 'px' }}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Check if a section has placeholders that should be rendered as inputs
  const sectionHasPlaceholders = (sectionId: string) => {
    return sectionId === 'cpsintake' ||
      sectionId === 'apsintake' ||
      sectionId === 'cchcheck' ||
      sectionId === 'missingjuvenile';
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
      const categoryNames = [...prev.names[category]];
      categoryNames[index] = { ...categoryNames[index], [field]: value };
      const newNames = { ...prev.names, [category]: categoryNames };

      let nextOptionalSections = [...prev.narratives.optionalSections];

      // Special logic for suspects arrest status
      if (category === 'Suspect' && field === 'isArrested') {
        const anyArrested = categoryNames.some(n => n.isArrested);
        nextOptionalSections = nextOptionalSections.map(s =>
          s.id === 'arrest' ? { ...s, enabled: anyArrested } : s
        );
      }

      // Special logic for victims pursue status
      if (category === 'Victim' && field === 'isPursuing') {
        const anyPursuing = categoryNames.some(n => n.isPursuing);
        nextOptionalSections = nextOptionalSections.map(s =>
          s.id === 'pursue' ? { ...s, enabled: anyPursuing } : s
        );
      }

      return {
        ...prev,
        names: newNames,
        narratives: {
          ...prev.narratives,
          optionalSections: nextOptionalSections
        }
      };
    });
  };

  const toggleLinkedOffense = (category: PartyCategory, index: number, offenseId: string) => {
    setReportData(prev => {
      const names = { ...prev.names };
      const currentEntry = { ...names[category][index] };
      const linked = currentEntry.linkedOffenses || [];

      if (linked.includes(offenseId)) {
        currentEntry.linkedOffenses = linked.filter(o => o !== offenseId);
        const disps = { ...(currentEntry.offenseDispositions || {}) };
        delete disps[offenseId];
        currentEntry.offenseDispositions = disps;
      } else {
        currentEntry.linkedOffenses = [...linked, offenseId];
      }

      names[category][index] = currentEntry;
      return { ...prev, names };
    });
  };

  const updateOffenseDisposition = (category: PartyCategory, index: number, offenseId: string, disposition: 'ARREST' | 'CITATION' | 'WARNING' | '') => {
    setReportData(prev => {
      const names = { ...prev.names };
      const currentEntry = { ...names[category][index] };
      currentEntry.offenseDispositions = {
        ...(currentEntry.offenseDispositions || {}),
        [offenseId]: disposition
      };

      names[category][index] = currentEntry;
      return { ...prev, names };
    });
  };

  const startLinking = (category: PartyCategory, index: number, current: string[]) => {
    setLinkingOffenseRef({ category, index });
    setTempLinkedOffenses([...current]);
  };

  const commitLinks = () => {
    if (!linkingOffenseRef) return;
    const { category, index } = linkingOffenseRef;
    setReportData(prev => {
      const names = { ...prev.names };
      const entry = { ...names[category][index] };
      entry.linkedOffenses = tempLinkedOffenses;
      const nextDisps = { ...(entry.offenseDispositions || {}) };
      Object.keys(nextDisps).forEach(k => {
        if (!tempLinkedOffenses.includes(k)) delete nextDisps[k];
      });
      entry.offenseDispositions = nextDisps;
      names[category][index] = entry;
      return { ...prev, names };
    });
    setLinkingOffenseRef(null);
  };

  const removeOffenseFromIncident = (offenseId: string) => {
    setReportData(prev => {
      // 1. Remove from incidentDetails.offenses
      const newOffenses = (prev.incidentDetails.offenses || []).filter(o => o.id !== offenseId);

      // 2. Cleanup all links in names
      const nextNames = { ...prev.names };
      Object.keys(nextNames).forEach(cat => {
        const category = cat as PartyCategory;
        nextNames[category] = nextNames[category].map(entry => {
          if (!entry.linkedOffenses?.includes(offenseId)) return entry;

          const linked = (entry.linkedOffenses || []).filter(id => id !== offenseId);
          const disps = { ...(entry.offenseDispositions || {}) };
          delete disps[offenseId];

          return { ...entry, linkedOffenses: linked, offenseDispositions: disps };
        });
      });

      return {
        ...prev,
        incidentDetails: { ...prev.incidentDetails, offenses: newOffenses },
        names: nextNames
      };
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

    const victims = reportData.names.Victim.filter(n => n.name.trim() !== '');
    const firstVictim = victims[0]?.name || 'N/A';

    const suspects = reportData.names.Suspect.filter(n => n.name.trim() !== '');
    const firstSuspect = suspects[0]?.name || 'N/A';

    const witnesses = reportData.names.Witness.filter(n => n.name.trim() !== '');
    const firstWitness = witnesses[0]?.name || 'N/A';

    const complainants = reportData.names.Complainant;
    let firstComplainant = 'N/A';
    if (complainants.length > 0) {
      const c = complainants[0];
      firstComplainant = c.isVictimSame ? 'Same as Victim' : (c.name || 'N/A');
    }

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
      '\\[COMPLAINANT\\]': firstComplainant,
      '\\[WITNESS\\]': firstWitness,
      '\\[ADDRESS\\]': reportData.incidentDetails.address || '[ADDRESS]',
      '\\[BLOCK\\]': block,
      '\\[STREET\\]': street,
      '\\[LOCATION\\]': isIntersection ? displayTitle : (reportData.incidentDetails.address || '[ADDRESS]'),
      '\\[CALLTYPE\\]': (reportData.incidentDetails.callType || '[CALL TYPE]').toLowerCase(),
      '\\[CallType\\]': (reportData.incidentDetails.callType || '[CALL TYPE]').toLowerCase(),
      '\\[OFFENSES\\]': reportData.incidentDetails.offenses?.map(o => o.literal).join(', ') || 'N/A',
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
      if (section.enabled) combinedInvestigative += `\n\n${processText(interpolatePlaceholders(section))}`;
    });
    if (reportData.narratives.isBwcEnabled) combinedInvestigative += `\n\n${processText(reportData.narratives.bwcStatement)}`;
    if (reportData.narratives.isBwc2Enabled) combinedInvestigative += `\n\n${processText(reportData.narratives.bwc2Statement)}`;
    const fullText = `PUBLIC NARRATIVE:\n${reportData.narratives.public}\n\nINVESTIGATIVE NARRATIVE:\n${combinedInvestigative}\n\nPROBABLE CAUSE:\n${processText(reportData.narratives.probableCause)}`;
    copyToClipboard(fullText);
  };

  const startEditingPublic = () => { setTempPublic(reportData.narratives.public); setIsEditingPublic(true); };
  const savePublic = () => { setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, public: tempPublic, isPublicEdited: true } })); setIsEditingPublic(false); };
  const startEditingIntro = () => { setTempIntro(reportData.narratives.introduction); setIsEditingIntro(true); };
  const saveIntro = () => { setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, introduction: tempIntro, isIntroEdited: true } })); setIsEditingIntro(false); };
  const startEditingBwc = () => { setTempBwc(reportData.narratives.bwcStatement); setIsEditingBwc(true); };
  const saveBwc = () => { setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, bwcStatement: tempBwc, isBwcEdited: true } })); setIsEditingBwc(false); };
  const startEditingBwc2 = () => { setTempBwc2(reportData.narratives.bwc2Statement); setIsEditingBwc2(true); };
  const saveBwc2 = () => { setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, bwc2Statement: tempBwc2, isBwc2Edited: true } })); setIsEditingBwc2(false); };
  const startEditingOffenseSummary = () => { setTempOffenseSummary(reportData.narratives.offenseSummaryStatement); setIsEditingOffenseSummary(true); };
  const saveOffenseSummary = () => { setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, offenseSummaryStatement: tempOffenseSummary, isOffenseSummaryEdited: true } })); setIsEditingOffenseSummary(false); };

  const addVehicleEntry = () => {
    setReportData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, {
        id: generateId(),
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
    const offensesInIncident = reportData.incidentDetails.offenses || [];
    const hasClassC = offensesInIncident.some(o => o.level.includes('MC') || o.level.includes('CLASS C'));

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

        <div className="mt-2 space-y-4">
          {names.map((entry, index) => {
            const isLinking = linkingOffenseRef?.category === category && linkingOffenseRef?.index === index;
            const linkedOffenses = entry.linkedOffenses || [];

            return (
              <div key={`${category}-${index}`} className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      title={`Name of ${category}`}
                      placeholder={entry.isVictimSame ? "Same as Victim" : `Name of ${category}...`}
                      value={entry.isVictimSame ? "Same as Victim" : entry.name}
                      readOnly={entry.isVictimSame}
                      onChange={(e) => handleNameChange(category, index, 'name', e.target.value)}
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-base md:text-sm focus:ring-primary focus:border-primary dark:text-white appearance-none ${entry.isVictimSame ? 'opacity-50 cursor-not-allowed italic font-medium' : ''}`}
                    />
                  </div>

                  {/* Complainant "VICTIM" button */}
                  {category === 'Complainant' && (
                    <button
                      onClick={() => handleNameChange(category, index, 'isVictimSame', !entry.isVictimSame)}
                      className={`px-2 py-1.5 rounded-md text-[10px] font-black transition-all border ${entry.isVictimSame
                        ? 'bg-blue-500/10 border-blue-500 text-blue-600 opacity-100'
                        : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-70'
                        }`}
                    >
                      VICTIM
                    </button>
                  )}

                  {/* Victim "PURSUE" button */}
                  {category === 'Victim' && (
                    <button
                      onClick={() => handleNameChange(category, index, 'isPursuing', !entry.isPursuing)}
                      className={`px-2 py-1.5 rounded-md text-[10px] font-black transition-all border ${entry.isPursuing
                        ? 'bg-green-500/10 border-green-500 text-green-600 opacity-100'
                        : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-70'
                        }`}
                    >
                      PURSUE
                    </button>
                  )}

                  {/* Sex Toggle */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
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

                  {/* ARREST/CITATION buttons for Suspects */}
                  {category === 'Suspect' && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleNameChange(category, index, 'isArrested', !entry.isArrested)}
                        className={`px-2 py-1.5 rounded-md text-[10px] font-black transition-all border ${entry.isArrested
                          ? 'bg-red-500/10 border-red-500 text-red-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-70'
                          }`}
                      >
                        ARREST
                      </button>
                      {hasClassC && (
                        <button
                          onClick={() => {
                            const next = ((entry.citationStatus || 0) + 1) % 4; // 0, 1, 2, 3 (3 is reset)
                            handleNameChange(category, index, 'citationStatus', next === 3 ? 0 : next);
                          }}
                          className={`px-2 py-1.5 rounded-md text-[10px] font-black transition-all border ${entry.citationStatus === 1
                            ? 'bg-orange-500/10 border-orange-500 text-orange-600'
                            : entry.citationStatus === 2
                              ? 'bg-yellow-500/10 border-yellow-500 text-yellow-600'
                              : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-70'
                            }`}
                        >
                          {entry.citationStatus === 2 ? 'WARNING' : 'CITATION'}
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => removeNameEntry(category, index)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* Linked Offenses List */}
                {(category === 'Suspect' || category === 'Victim') && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {linkedOffenses.map(offId => {
                        const offense = offensesInIncident.find(o => o.id === offId);
                        if (!offense) return null;

                        return (
                          <div key={offId} className="flex flex-col gap-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-w-[150px]">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[120px]">{offense.literal}</span>
                              <button onClick={() => toggleLinkedOffense(category, index, offId)} className="text-slate-300 hover:text-red-500"><span className="material-symbols-outlined text-xs">close</span></button>
                            </div>
                            {category === 'Suspect' && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => updateOffenseDisposition(category, index, offId, entry.offenseDispositions?.[offId] === 'ARREST' ? '' : 'ARREST')}
                                  className={`flex-1 py-1 rounded text-[8px] font-bold border transition-all ${entry.offenseDispositions?.[offId] === 'ARREST' ? 'bg-red-500 text-white border-red-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                                >
                                  ARREST
                                </button>
                                <button
                                  onClick={() => updateOffenseDisposition(category, index, offId, entry.offenseDispositions?.[offId] === 'CITATION' ? '' : 'CITATION')}
                                  className={`flex-1 py-1 rounded text-[8px] font-bold border transition-all ${entry.offenseDispositions?.[offId] === 'CITATION' ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                                >
                                  CITE
                                </button>
                                <button
                                  onClick={() => updateOffenseDisposition(category, index, offId, entry.offenseDispositions?.[offId] === 'WARNING' ? '' : 'WARNING')}
                                  className={`flex-1 py-1 rounded text-[8px] font-bold border transition-all ${entry.offenseDispositions?.[offId] === 'WARNING' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                                >
                                  WARN
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button
                        onClick={() => isLinking ? setLinkingOffenseRef(null) : startLinking(category, index, linkedOffenses)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-dashed text-[10px] font-bold transition-all ${isLinking ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'}`}
                      >
                        <span className="material-symbols-outlined text-sm">{isLinking ? 'close' : 'link'}</span>
                        {isLinking ? 'CANCEL LINK' : 'LINK OFFENSE'}
                      </button>
                    </div>

                    {/* Linking Dropdown */}
                    {isLinking && (
                      <div className="bg-white dark:bg-slate-900 border border-primary/30 rounded-xl p-3 space-y-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Select Offenses to Link</div>
                        {offensesInIncident.length === 0 ? (
                          <div className="text-xs text-slate-500 italic py-2">No offenses added in Incident Details yet.</div>
                        ) : (
                          <div className="space-y-1">
                            {offensesInIncident.map((off, i) => {
                              const isLinked = tempLinkedOffenses.includes(off.id);
                              return (
                                <div
                                  key={off.id}
                                  onClick={() => {
                                    if (isLinked) setTempLinkedOffenses(tempLinkedOffenses.filter(id => id !== off.id));
                                    else setTempLinkedOffenses([...tempLinkedOffenses, off.id]);
                                  }}
                                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${isLinked ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                                >
                                  <span className="text-xs font-bold uppercase truncate pr-4">{off.literal}</span>
                                  <span className="material-symbols-outlined text-sm">{isLinked ? 'check_circle' : 'add_circle'}</span>
                                </div>
                              );
                            })}
                            <div className="pt-2 flex justify-end gap-2">
                              <button onClick={() => setLinkingOffenseRef(null)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all">
                                <span className="material-symbols-outlined text-sm">close</span> CANCEL
                              </button>
                              <button onClick={commitLinks} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold shadow-lg shadow-primary/20 transition-all">
                                <span className="material-symbols-outlined text-sm">check</span> ASSIGN
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const generateSapdNamesTemplate = (names: Record<PartyCategory, NameEntry[]>) => {
    const victims = names.Victim.filter(n => n.name.trim() !== '');
    const firstVictim = victims[0]?.name || 'N/A';

    const formatCategory = (category: PartyCategory, header: string, separator: string) => {
      let list = '';
      if (category === 'Complainant') {
        list = names.Complainant
          .map(n => n.isVictimSame ? 'Same as Victim' : n.name)
          .filter(name => name && name.trim() !== '')
          .join('\n');
      } else {
        list = names[category]
          .map(n => n.name)
          .filter(n => n.trim() !== '')
          .join('\n');
      }
      return `${header}:\n${separator}\n${list || 'N/A'}`;
    }

    return `-------------------** OFFICER NARRATIVE **-----------------
${formatCategory('Complainant', 'COMPLAINANT', '************')}

${formatCategory('Victim', 'VICTIM', '*******')}

${formatCategory('Suspect', 'SUSPECT', '********')}

${formatCategory('Witness', 'WITNESS', '********')}

${formatCategory('Other', 'OTHER', '******')}

SUPPORT PERSONNEL / AGENCIES:
****************************
N/A
`;
  };

  const investigativeNarrativeContent = `${reportData.narratives.isSapdNamesTemplateEnabled ? generateSapdNamesTemplate(reportData.names) + '\n\n' : ''}NARRATIVE:\n**********\n${processText(reportData.narratives.introduction)}${reportData.narratives.investigative ? `\n\n${processText(reportData.narratives.investigative)}` : ''}${reportData.narratives.optionalSections.filter(s => s.enabled).map(s => `\n\n${processText(interpolatePlaceholders(s))}`).join('')}${reportData.narratives.isBwcEnabled ? `\n\n${processText(reportData.narratives.bwcStatement)}` : ''}${reportData.narratives.isBwc2Enabled ? `\n\n${processText(reportData.narratives.bwc2Statement)}` : ''}${reportData.narratives.isOffenseSummaryEnabled ? `\n\n${processText(reportData.narratives.offenseSummaryStatement)}` : ''}`;

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

              <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    const el = document.getElementById('offense-summary-settings');
                    if (el) el.classList.toggle('hidden');
                    const icon = document.getElementById('offense-summary-chevron');
                    if (icon) icon.textContent = icon.textContent === 'expand_more' ? 'expand_less' : 'expand_more';
                  }}
                  className="flex items-center justify-between w-full text-left font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors mb-2"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">list_alt</span>
                    Offense Summary
                  </span>
                  <span id="offense-summary-chevron" className="material-symbols-outlined text-slate-400">expand_more</span>
                </button>

                <div id="offense-summary-settings" className="hidden pl-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-xs text-slate-500 mb-2">Select fields to include in the Offense Summary header:</p>

                  {[
                    { key: 'offenseSummaryCitation', label: 'Citation' },
                    { key: 'offenseSummaryStatute', label: 'Statute' },
                    { key: 'offenseSummaryLevel', label: 'Level' },
                    { key: 'offenseSummaryElements', label: 'Elements Text' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={!!settings[key as keyof PersistentSettings]}
                        onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  onClick={() => setShowOffenseEditor(true)}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">data_object</span>
                  OFFENSE LIST JSON
                </button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setShowSettings(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}

      {showOffenseEditor && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowOffenseEditor(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  Offense List Editor
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Search and modify offense codes. Changes are saved locally.</p>
              </div>
              <button onClick={() => setShowOffenseEditor(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar List */}
              <div className="w-1/3 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/30 dark:bg-slate-900/50">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                    <input
                      type="text"
                      placeholder="Search offense literal..."
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary dark:text-white transition-all"
                      value={offenseSearchTerm}
                      onChange={(e) => setOffenseSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {showOverridesList ? (
                    // Show list of all overrides with delete buttons
                    Object.keys(settings.customOffenses || {}).length > 0 ? (
                      Object.entries(settings.customOffenses || {}).map(([literal, offense]) => (
                        <div
                          key={literal}
                          className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50"
                        >
                          <button
                            onClick={() => {
                              setEditingOffense({ ...(offense as Offense) });
                              setShowOverridesList(false);
                            }}
                            className="flex-1 text-left"
                          >
                            <div className="font-bold truncate text-amber-800 dark:text-amber-200">{literal}</div>
                            <div className="text-xs mt-1 truncate text-amber-600 dark:text-amber-400">
                              {(offense as Offense).citation} • {(offense as Offense).level}
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteOverride(literal)}
                            className="p-1.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            title="Remove override"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle</span>
                        <p className="text-sm">No overrides active</p>
                      </div>
                    )
                  ) : offenseSearchTerm ? (
                    editorFilteredOffenses.map((offense) => (
                      <button
                        key={offense.literal}
                        onClick={() => setEditingOffense({ ...offense })}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${editingOffense?.literal === offense.literal
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        <div className="font-bold truncate">{offense.literal}</div>
                        <div className={`text-xs mt-1 truncate ${editingOffense?.literal === offense.literal ? 'text-blue-100' : 'text-slate-400'}`}>
                          {offense.citation} • {offense.level}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search</span>
                      <p className="text-sm">Type to search offenses</p>
                    </div>
                  )}
                  {!showOverridesList && offenseSearchTerm && editorFilteredOffenses.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">No matches found</div>
                  )}
                </div>
              </div>

              {/* Editor Panel */}
              <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                {editingOffense ? (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                        Editing: <span className="text-primary">{editingOffense.literal}</span>
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Citation</label>
                          <input
                            type="text"
                            title="Citation code"
                            className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-primary focus:border-primary dark:text-white"
                            value={editingOffense.citation}
                            onChange={(e) => setEditingOffense({ ...editingOffense, citation: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Level</label>
                          <input
                            type="text"
                            title="Offense level"
                            className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-primary focus:border-primary dark:text-white"
                            value={editingOffense.level}
                            onChange={(e) => setEditingOffense({ ...editingOffense, level: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Statute</label>
                        <input
                          type="text"
                          title="Statute"
                          className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-primary focus:border-primary dark:text-white"
                          value={editingOffense.statute}
                          onChange={(e) => setEditingOffense({ ...editingOffense, statute: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Elements</label>
                        <textarea
                          title="Offense elements"
                          className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-primary focus:border-primary dark:text-white min-h-[100px] leading-relaxed"
                          value={editingOffense.elements || ''}
                          onChange={(e) => setEditingOffense({ ...editingOffense, elements: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Statute Text (Full)</label>
                        <textarea
                          title="Full statute text"
                          className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-primary focus:border-primary dark:text-white min-h-[150px] font-mono text-xs leading-relaxed"
                          value={editingOffense.statuteText || ''}
                          onChange={(e) => setEditingOffense({ ...editingOffense, statuteText: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-3">
                      {editingOffense && settings.customOffenses?.[editingOffense.literal] && (
                        <button
                          onClick={() => handleDeleteOverride(editingOffense.literal)}
                          className="mr-auto px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">undo</span>
                          Revert to Default
                        </button>
                      )}
                      <button
                        onClick={() => setEditingOffense(null)}
                        className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => editingOffense && handleSaveOffense(editingOffense)}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl opacity-50">edit_note</span>
                    </div>
                    <p>Select an offense from the list to edit its details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowOverridesList(!showOverridesList);
                  setOffenseSearchTerm('');
                }}
                className={`text-xs flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${showOverridesList
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">{showOverridesList ? 'list' : 'edit_note'}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{Object.keys(settings.customOffenses || {}).length}</span>
                {showOverridesList ? 'viewing overrides' : 'local overrides active'}
              </button>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-base">download</span>
                Export Full JSON
              </button>
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
              <div ref={el => sectionRefs.current['incident'] = el}>
                <AccordionItem title="Incident Details" icon="info" isOpen={activeSection === 'incident'} onToggle={() => handleSectionToggle('incident')}>
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
                                    const newOffense = { ...offense, id: generateId() };
                                    handleInputChange('incidentDetails', 'offenses', [...(reportData.incidentDetails.offenses || []), newOffense]);
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
                                  const custom: Offense = { id: generateId(), literal: offenseSearch.toUpperCase(), citation: 'N/A', statute: 'CUSTOM', level: 'N/A' };
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
                                  const custom: Offense = { id: generateId(), literal: offenseSearch.toUpperCase(), citation: 'N/A', statute: 'CUSTOM', level: 'N/A' };
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
                              <div key={offense.id} className={`p-2 border rounded-md animate-in slide-in-from-top-1 duration-200 ${isCustom ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`}>
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
                                      onClick={() => removeOffenseFromIncident(offense.id)}
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
              </div>
              <div ref={el => sectionRefs.current['names'] = el}>
                <AccordionItem title="Names" icon="person" isOpen={activeSection === 'names'} onToggle={() => handleSectionToggle('names')}>
                  <div className="space-y-2">
                    {renderNameInputs('Complainant')}{renderNameInputs('Victim')}{renderNameInputs('Suspect')}{renderNameInputs('Witness')}{renderNameInputs('Other')}
                  </div>
                </AccordionItem>
              </div>
              <div ref={el => sectionRefs.current['vehicles'] = el}>
                <AccordionItem title="Vehicles" icon="directions_car" isOpen={activeSection === 'vehicles'} onToggle={() => handleSectionToggle('vehicles')}>
                  <div className="space-y-4">
                    {renderVehicleInputs()}
                  </div>
                </AccordionItem>
              </div>
              <div ref={el => sectionRefs.current['public'] = el}>
                <AccordionItem title="Public Narrative" icon="edit_note" isOpen={activeSection === 'public'} onToggle={() => handleSectionToggle('public')}>
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
              </div>
              <div ref={el => sectionRefs.current['investigative'] = el}>
                <AccordionItem title="Investigative Narrative" icon="description" isOpen={activeSection === 'investigative'} onToggle={() => handleSectionToggle('investigative')}>
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
                          {reportData.incidentDetails.howReceived !== 'initiated' && (
                            <div className="mb-3 flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500">Version:</span>
                              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                <button
                                  onClick={() => setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, bwcStatement: BWC_VERSION_1, isBwcEdited: false } }))}
                                  className={`px-3 py-1 text-xs font-bold rounded transition-all ${reportData.narratives.bwcStatement === BWC_VERSION_1 ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                  Version 1
                                </button>
                                <button
                                  onClick={() => setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, bwcStatement: BWC_VERSION_2, isBwcEdited: false } }))}
                                  className={`px-3 py-1 text-xs font-bold rounded transition-all ${reportData.narratives.bwcStatement === BWC_VERSION_2 ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                  Version 2
                                </button>
                                <button
                                  onClick={() => setReportData(prev => ({ ...prev, narratives: { ...prev.narratives, bwcStatement: BWC_VERSION_3, isBwcEdited: false } }))}
                                  className={`px-3 py-1 text-xs font-bold rounded transition-all ${reportData.narratives.bwcStatement === BWC_VERSION_3 ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                  Version 3
                                </button>
                              </div>
                            </div>
                          )}

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
                    <div>
                      <label htmlFor="findings-area" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Findings</label>
                      <textarea id="findings-area" title="Investigative Findings" className="w-full h-64 min-h-[256px] p-3 text-base md:text-sm border-2 border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed appearance-none ring-offset-0 outline-none" placeholder="Enter detailed investigative findings here..." value={reportData.narratives.investigative} onChange={(e) => handleInputChange('narratives', 'investigative', e.target.value)} />
                    </div>
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => setIsAdditionalSectionsOpen(!isAdditionalSectionsOpen)}
                        className="w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                      >
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group-hover:text-primary transition-colors">Additional Sections</label>
                        <span className={`material-symbols-outlined text-slate-400 group-hover:text-primary transition-transform duration-200 ${isAdditionalSectionsOpen ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>

                      {isAdditionalSectionsOpen && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
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

                                {/* Version Selector for multi-version sections */}
                                {['cpsintake', 'arrest', 'citizenlinksent'].includes(section.id) && (
                                  <div className="mb-3 flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-500">Version:</span>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                      <button
                                        onClick={() => handleSectionVersionChange(section.id, 1)}
                                        className={`px-3 py-1 text-xs font-bold rounded transition-all ${getSectionVersion(section.id, section.text) === 1 ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                      >
                                        Version 1
                                      </button>
                                      <button
                                        onClick={() => handleSectionVersionChange(section.id, 2)}
                                        className={`px-3 py-1 text-xs font-bold rounded transition-all ${getSectionVersion(section.id, section.text) === 2 ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                      >
                                        Version 2
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {editingSectionId === section.id ? (
                                  <div className="space-y-2">
                                    <label htmlFor={`edit-section-${section.id}`} className="sr-only">Edit {section.label}</label>
                                    <textarea id={`edit-section-${section.id}`} title={`Edit ${section.label}`} className="w-full h-32 min-h-[128px] p-3 text-base md:text-sm border-2 border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none appearance-none ring-offset-0 outline-none" value={tempSectionText} onChange={(e) => setTempSectionText(e.target.value)} />
                                    <div className="flex justify-end gap-2"><button onClick={cancelSectionEdit} className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600">Cancel</button><button onClick={() => saveSection(section.id)} className="text-xs font-semibold px-3 py-1.5 rounded bg-primary text-white">Save</button></div>
                                  </div>
                                ) : sectionHasPlaceholders(section.id) ? (
                                  <div className="space-y-4">
                                    {/* First text box (Report Form for Missing Juvenile, or main text for others) */}
                                    <div className="relative bg-slate-50 dark:bg-slate-800/50 border border-slate-200 rounded p-4 text-sm leading-loose text-slate-700 dark:text-slate-300">
                                      {section.id === 'missingjuvenile' && (
                                        <span className="absolute -top-2 left-3 bg-slate-50 dark:bg-slate-800 px-2 text-[9px] font-bold text-primary uppercase tracking-wider">Report Form</span>
                                      )}
                                      <button onClick={() => startEditingSection(section)} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm opacity-100 md:opacity-0 md:group-hover/opt:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary"><span className="material-symbols-outlined text-sm">edit</span>EDIT</button>
                                      {renderTextWithPlaceholders(section, 'text')}
                                    </div>

                                    {/* Second text box for Missing Juvenile (NCIC/NCMEC Entry) */}
                                    {section.id === 'missingjuvenile' && section.text2 && (
                                      <div className="relative bg-slate-50 dark:bg-slate-800/50 border border-slate-200 rounded p-4 text-sm leading-loose text-slate-700 dark:text-slate-300">
                                        <span className="absolute -top-2 left-3 bg-slate-50 dark:bg-slate-800 px-2 text-[9px] font-bold text-primary uppercase tracking-wider">NCIC / NCMEC Entry</span>
                                        {renderTextWithPlaceholders(section, 'text2')}
                                      </div>
                                    )}

                                    {/* Convictions dynamic list for CCH check */}
                                    {section.id === 'cchcheck' && (
                                      <div className="mt-4 pl-4 border-l-2 border-primary/20 space-y-4">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recorded Convictions</span>
                                          <div className="flex items-center gap-2">
                                            <select
                                              value={section.convictionListFormat || 'bullet'}
                                              title="List Format"
                                              onChange={(e) => handleConvictionFormatChange(section.id, e.target.value as any)}
                                              className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500"
                                            >
                                              <option value="bullet">Bullets</option>
                                              <option value="dash">Dashes</option>
                                              <option value="number">Numbered</option>
                                            </select>
                                            <button
                                              onClick={() => handleConvictionAdd(section.id)}
                                              className="flex items-center gap-1 text-[10px] font-black text-primary hover:text-blue-700 transition-colors"
                                            >
                                              <span className="material-symbols-outlined text-sm">add_circle</span>
                                              ADD CONVICTION
                                            </button>
                                          </div>
                                        </div>

                                        <div className="space-y-3">
                                          {(section.convictions || []).map((conv) => (
                                            <div key={conv.id} className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-left-2 duration-200">
                                              <div className="flex-1 min-w-[120px]">
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-0.5">Court</label>
                                                <input
                                                  type="text"
                                                  placeholder="Court"
                                                  value={conv.court}
                                                  onChange={(e) => handleConvictionChange(section.id, conv.id, 'court', e.target.value)}
                                                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                                                />
                                              </div>
                                              <div className="flex-[2] min-w-[180px]">
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-0.5">Offense</label>
                                                <input
                                                  type="text"
                                                  placeholder="Offense"
                                                  value={conv.offense}
                                                  onChange={(e) => handleConvictionChange(section.id, conv.id, 'offense', e.target.value)}
                                                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                                                />
                                              </div>
                                              <div className="flex-1 min-w-[100px]">
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-0.5">Cause #</label>
                                                <input
                                                  type="text"
                                                  placeholder="Cause #"
                                                  value={conv.causeNumber}
                                                  onChange={(e) => handleConvictionChange(section.id, conv.id, 'causeNumber', e.target.value)}
                                                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                                                />
                                              </div>
                                              <div className="flex-1 min-w-[100px]">
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-0.5">Date</label>
                                                <input
                                                  type="text"
                                                  placeholder="MM/DD/YYYY"
                                                  value={conv.date}
                                                  onChange={(e) => handleConvictionChange(section.id, conv.id, 'date', e.target.value)}
                                                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                                                />
                                              </div>
                                              <button
                                                onClick={() => handleConvictionDelete(section.id, conv.id)}
                                                className="self-end mb-1 p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                title="Remove Conviction"
                                              >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                              </button>
                                            </div>
                                          ))}

                                          {(!section.convictions || section.convictions.length === 0) && (
                                            <div className="text-center py-4 border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-lg">
                                              <span className="text-[10px] font-medium text-slate-400 italic">No convictions added to the list.</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
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
                      )}

                      {/* BWC #2 Section */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                          <input
                            type="checkbox"
                            id="bwc2-checkbox"
                            checked={reportData.narratives.isBwc2Enabled}
                            onChange={(e) => handleInputChange('narratives', 'isBwc2Enabled', e.target.checked)}
                            className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="bwc2-checkbox" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            Body-worn camera statement #2
                          </label>
                        </div>

                        {reportData.narratives.isBwc2Enabled && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            {isEditingBwc2 ? (
                              <div className="space-y-2">
                                <label htmlFor="bwc2-edit-area" className="sr-only">Edit BWC #2 Statement</label>
                                <textarea
                                  id="bwc2-edit-area"
                                  title="Edit BWC #2 Statement"
                                  className="w-full h-32 min-h-[128px] p-3 text-base md:text-sm border-2 border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed appearance-none ring-offset-0 outline-none"
                                  value={tempBwc2}
                                  onChange={(e) => setTempBwc2(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setIsEditingBwc2(false)} className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Cancel</button>
                                  <button onClick={saveBwc2} className="text-xs font-semibold px-3 py-1.5 rounded bg-primary text-white">Save</button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative group/bwc2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                <button onClick={startEditingBwc2} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm opacity-100 md:opacity-0 md:group-hover/bwc2:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary">
                                  <span className="material-symbols-outlined text-sm">edit</span>EDIT
                                </button>
                                {processText(reportData.narratives.bwc2Statement)}
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
                  </div>
                </AccordionItem>
              </div>
              <div ref={el => sectionRefs.current['pc'] = el}>
                <AccordionItem title="Booking Probable Cause" icon="gavel" isOpen={activeSection === 'pc'} onToggle={() => handleSectionToggle('pc')}>
                  <div className="space-y-2">
                    <label htmlFor="pc-area" className="sr-only">Booking Probable Cause</label>
                    <textarea id="pc-area" title="Booking Probable Cause" className="w-full h-40 min-h-[160px] p-3 text-base md:text-sm border-2 border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none leading-relaxed appearance-none ring-offset-0 outline-none" placeholder="Legal justification for arrest..." value={reportData.narratives.probableCause} onChange={(e) => handleInputChange('narratives', 'probableCause', e.target.value)} />
                  </div>
                </AccordionItem>
              </div>
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