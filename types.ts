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
  id?: string; // Unique instance ID
  literal: string;
  citation: string;
  statute: string;
  level: string;
  elements?: string;
  statuteText?: string;
}

export interface NameEntry {
  name: string;
  sex: 'M' | 'F' | '';
  isArrested?: boolean;
  linkedOffenses?: string[]; // Array of offense literals
  offenseDispositions?: Record<string, 'ARREST' | 'CITATION' | 'WARNING' | ''>;
  isPursuing?: boolean;
  isVictimSame?: boolean;
  citationStatus?: number; // 0: None, 1: Citation (Orange), 2: Warning (Yellow)
}

export interface Conviction {
  id: string;
  court: string;
  offense: string;
  causeNumber: string;
  date: string;
}

export type PartyCategory = 'Complainant' | 'Victim' | 'Suspect' | 'Witness' | 'Other';

export type VehicleStatus = 'Towed' | 'Released' | 'Left on scene legally parked' | '';

export interface Vehicle {
  id: string;
  vin: string;
  showVin: boolean;
  color: string;
  year: string;
  make: string;
  model: string;
  licensePlate: string;
  licensePlateState: string;
  style: string;
  linkedName: string;
  status: VehicleStatus;
  statusDetails: string;
}

export interface CustomParagraph {
  id: string;
  position: 'after-arrival' | 'after-statements' | 'after-property';
  text: string;
}

export interface OptionalSection {
  id: string;
  label: string;
  enabled: boolean;
  text: string;
  text2?: string; // Second text block for sections with two editing boxes
  isEdited: boolean;
  isEdited2?: boolean; // Whether second text was edited
  values?: Record<string, string>;
  convictions?: Conviction[];
  convictionListFormat?: 'bullet' | 'dash' | 'number';
}

export interface PersistentSettings {
  defaultOfficer: string;
  offenseSummaryCitation?: boolean;
  offenseSummaryStatute?: boolean;
  offenseSummaryLevel?: boolean;
  offenseSummaryElements?: boolean;
  customOffenses?: Record<string, Offense>; // Keyed by literal
}

export interface ReportState {
  incidentDetails: {
    caseNumber: string;
    date: string;
    time: string;
    fromDate: string;
    fromTime: string;
    toDate: string;
    toTime: string;
    address: string;
    isBusiness: boolean;
    businessName: string;
    reportingOfficer: string;
    incidentType: string;
    callType: string;
    subtype: string;
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
    bwc2Statement: string;
    isBwc2Enabled: boolean;
    isBwc2Edited: boolean;
    isOffenseSummaryEnabled: boolean;
    offenseSummaryStatement: string; // DEPRECATED: keeping for migration if needed, but new logic uses offenseSummaries
    offenseSummaries: Record<string, string>; // Map of offense ID to summary text
    isOffenseSummaryEdited: boolean; // DEPRECATED: granular edits are tracked by content difference now
    isSapdNamesTemplateEnabled: boolean;
    // New section flags
    isCallnotesEnabled: boolean;
    callnotesStatement: string;
    isCallnotesEdited: boolean;
    isArrivalEnabled: boolean;
    arrivalStatement: string;
    isArrivalEdited: boolean;
    isStatementsEnabled: boolean;
    statementsStatement: string;
    isStatementsEdited: boolean;
    isPropertyEnabled: boolean;
    propertyStatement: string;
    isPropertyEdited: boolean;
    isConclusionEnabled: boolean;
    conclusionStatement: string;
    isConclusionEdited: boolean;
    // Custom paragraphs inserted between sections
    customParagraphs: CustomParagraph[];
    // New dynamic sections
    optionalSections: OptionalSection[];
  };
  vehicles: Vehicle[];
}
