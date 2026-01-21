export interface Template {
  id: string;
  name: string;
  category: string;
  boilerplate: {
    publicNarrative: string;
    investigativeNarrative: string;
    probableCause: string;
  };
  defaultEvidence?: string[];
}

export interface Offense {
  literal: string;
  citation: string;
  statute: string;
  level: string;
  statuteText?: string;
}

export interface NameEntry {
  name: string;
  sex: 'M' | 'F' | '';
  isArrested?: boolean;
}

export type PartyCategory = 'Complainant' | 'Victim' | 'Suspect' | 'Witness' | 'Other';

export interface OptionalSection {
  id: string;
  label: string;
  enabled: boolean;
  text: string;
  isEdited: boolean;
}

export interface PersistentSettings {
  defaultOfficer: string;
}

export interface ReportState {
  incidentDetails: {
    caseNumber: string;
    date: string;
    time: string;
    address: string;
    reportingOfficer: string;
    incidentType: string;
    callType: string;
    howReceived: 'dispatched' | 'initiated' | 'flagged down';
    reasonForStop: string;
    isConsensual: boolean;
    offenses: Offense[];
  };
  names: Record<PartyCategory, NameEntry[]>;
  narratives: {
    public: string;
    isPublicEdited: boolean;
    introduction: string;
    isIntroEdited: boolean;
    investigative: string;
    probableCause: string;
    bwcStatement: string;
    isBwcEnabled: boolean;
    isBwcEdited: boolean;
    isOffenseSummaryEnabled: boolean;
    offenseSummaryStatement: string;
    isOffenseSummaryEdited: boolean;
    // New dynamic sections
    optionalSections: OptionalSection[];
  };
}