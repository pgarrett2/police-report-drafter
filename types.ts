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
    isSapdNamesTemplateEnabled: boolean;
    // New dynamic sections
    optionalSections: OptionalSection[];
  };
  vehicles: Vehicle[];
}
