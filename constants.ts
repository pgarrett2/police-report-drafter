import { Template, ReportState, OptionalSection, PersistentSettings } from './types';

export const CALL_TYPES = [
  "Theft",
  "Assault",
  "Domestic Disturbance",
  "Traffic Stop",
  "Burglary",
  "Vandalism",
  "Public Intoxication",
  "Narcotics Violation",
  "Criminal Mischief",
  "Harassment",
  "Suspicious Person",
  "Warrant Service"
];

export const INITIATED_CALL_TYPES = [
  "traffic stop",
  "subject stop",
  "bicycle stop",
  "out with vehicle",
  "assist motorist",
  "follow-up"
];

export const REASON_FOR_STOP_TYPES = [
  "traffic stop",
  "subject stop",
  "bicycle stop",
  "out with vehicle",
  "assist motorist"
];

export const CONSENSUAL_STOP_TYPES = [
  "subject stop",
  "out with vehicle"
];

export const INTRO_BODY = "I responded in a marked patrol vehicle, wearing my issued police uniform. My department-issued body-worn camera was activated prior to arrival and recorded my actions, observations, and statements during this incident in accordance with department policy.";

export const BWC_BOILERPLATE = "All body-worn camera footage related to this incident was preserved in accordance with department policy. A transcription of all conversations captured by my body-worn camera was also automatically created once it was uploaded to Evidence.com.";
export const OFFENSE_SUMMARY_BOILERPLATE = "OFFENSE SUMMARY\n***********************\n[OFFENSE] - [STATUTE_NAME] [CITATION] [LEVEL]";

const NEW_OPTIONAL_SECTION_LABELS = [
  "ARREST",
  "Photos taken",
  "Citizen Link Sent",
  "Evidence",
  "Family Violence Paperwork",
  "Danger Assessment",
  "CCH check",
  "Property Continuum form (theft/burgs)",
  "Missing Juvenile",
  "Written Statements",
  "County Attorney Packet"
];

const getInitialOptionalSections = (): OptionalSection[] =>
  NEW_OPTIONAL_SECTION_LABELS.map(label => ({
    id: label.toLowerCase().replace(/[^a-z]/g, ''),
    label: label,
    enabled: false,
    text: "Under development",
    isEdited: false
  }));

export const INITIAL_SETTINGS: PersistentSettings = {
  defaultOfficer: ''
};

export const TEMPLATES: Template[] = [
  {
    id: 'theft-retail',
    name: 'Retail Theft (Shoplifting)',
    category: 'Property Crime',
    boilerplate: {
      publicNarrative: "",
      investigativeNarrative: "Loss prevention observed the suspect, identified as [SUSPECT], select merchandise from the display shelf. The suspect concealed the items in a personal bag and passed all points of sale without attempting to pay. The total value of stolen items was calculated at $___. Surveillance footage was secured.",
      probableCause: "The suspect was observed by a witness concealing items and exiting the store without payment, demonstrating intent to permanently deprive the owner of the property.",
    },
    defaultEvidence: ["Surveillance Video", "Receipt of Stolen Goods", "Written Statement from Loss Prevention"]
  },
  {
    id: 'traffic-dui',
    name: 'DUI / Traffic Stop',
    category: 'Traffic',
    boilerplate: {
      publicNarrative: "",
      investigativeNarrative: "I observed the vehicle swerving across the lane divider. Upon contact with the driver, [SUSPECT], I detected a strong odor of an alcoholic beverage emitting from the vehicle. The driver had bloodshot, watery eyes and slurred speech. Standardized Field Sobriety Tests (SFSTs) were administered.",
      probableCause: "The driver operated a motor vehicle on a public roadway while showing objective signs of impairment, including poor performance on SFSTs and a BAC of ___% provided by breath sample.",
    },
    defaultEvidence: ["Dashcam Footage", "Bodycam Footage", "Breathalyzer Results"]
  },
  {
    id: 'assault-simple',
    name: 'Simple Assault',
    category: 'Person Crime',
    boilerplate: {
      publicNarrative: "",
      investigativeNarrative: "The victim, [VICTIM], stated that the suspect, [SUSPECT], struck them in the face with a closed fist during a verbal argument. I observed redness and swelling on the victim's left cheek consistent with the statement.",
      probableCause: "The suspect intentionally caused physical injury to another person by striking them, which was corroborated by witness statements and visible injuries.",
    },
    defaultEvidence: ["Photos of Injuries", "Witness Statements"]
  },
  {
    id: 'vandalism',
    name: 'Vandalism / Criminal Mischief',
    category: 'Property Crime',
    boilerplate: {
      publicNarrative: "",
      investigativeNarrative: "I observed spray paint graffiti on the north-facing wall of the building. The victim, [VICTIM], estimated the cost of cleanup to be approximately $___. No suspects were located at the scene.",
      probableCause: "Evidence of intentional damage to property of another without consent was observed.",
    },
    defaultEvidence: ["Photos of Damage", "Estimate of Repair Costs"]
  }
];

export const getFreshInitialState = (): ReportState => ({
  incidentDetails: {
    caseNumber: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }).replace(':', ''),
    address: '',
    reportingOfficer: '',
    incidentType: '',
    callType: '',
    howReceived: 'dispatched',
    reasonForStop: '',
    isConsensual: false,
    offenses: [],
  },
  names: {
    'Complainant': [''],
    'Victim': [''],
    'Suspect': [''],
    'Witness': [''],
    'Other': ['']
  },
  narratives: {
    public: '',
    isPublicEdited: false,
    introduction: '',
    isIntroEdited: false,
    investigative: '',
    probableCause: '',
    bwcStatement: BWC_BOILERPLATE,
    isBwcEnabled: true,
    isBwcEdited: false,
    offenseSummaryStatement: OFFENSE_SUMMARY_BOILERPLATE,
    isOffenseSummaryEnabled: true,
    isOffenseSummaryEdited: false,
    optionalSections: getInitialOptionalSections()
  }
});

export const INITIAL_STATE = getFreshInitialState();