import { Template, ReportState, OptionalSection, PersistentSettings } from './types';

export const CALL_TYPES = [
  "Aircraft Crash",
  "Aircraft Emergency",
  "Aircraft Fire",
  "Alarm",
  "Animal Problems",
  "Arson Investigation",
  "Assault",
  "Assist",
  "Assist Motorist",
  "Atl",
  "Attempt To Locate",
  "Back Up",
  "Boating Incident",
  "Broadcast",
  "Building Collapse",
  "Burglary",
  "Check Flood Conditions",
  "Check For Debris On Road",
  "Check Solicitor For Sales Permit",
  "Child Problem",
  "City Ordinance Violation",
  "Civil Distrubance",
  "Civil Disturbance",
  "Clear Lot Of Loiterers",
  "Court Bank Run",
  "Court Forgery",
  "Court Impound",
  "Court Pickup Prisoner",
  "Court Police Activity",
  "Court Summons/Subpoena",
  "Court Test Call",
  "Court Traffic",
  "Court Warrants",
  "Criminal Mischief",
  "Criminal Trespass",
  "Dead Body",
  "Deliver Message",
  "Direct Traffic",
  "Directed Patrol",
  "Directive Patrol",
  "Disorderly Conduct",
  "Domestic Disturbance",
  "Driving While Intoxicated",
  "Drowning",
  "Drugs",
  "Drunk",
  "Enroute To…",
  "Escape/Jail Break - Code 3",
  "Escort",
  "Field Event",
  "Fight",
  "Fireworks",
  "Flagdown",
  "Flagged Down",
  "Follow Up On Previous Call",
  "Following Vehicle",
  "Found",
  "Gas Leak",
  "Go To Station",
  "Grass Fire",
  "Harassment",
  "Hauling Prisoner To Jail",
  "Housewatch",
  "Illegal",
  "Illpers",
  "Indecent Exposure",
  "Intoxilizer Operator",
  "Juvenile",
  "Kidnapping",
  "Loud",
  "Mc - Airport Event",
  "Mc Insurance Order",
  "Meal Break",
  "Meet With",
  "Minor In Possession Alcohol/Tobacco",
  "Missing",
  "Motor Vehicle Accident",
  "Officer Needs Assistance",
  "Open Carry Check",
  "Open Door",
  "Other Type Police Call Not Classified",
  "Out W/subject",
  "Out W/veh",
  "Overdose",
  "Pick Up Prisoner",
  "Property Damage",
  "Prowler",
  "Psychiatric Problems",
  "Public Service Generic Term",
  "Receive Info",
  "Reckless Driver",
  "Req Walk Thru Business",
  "Robbery",
  "Sexual Offender Violation",
  "Shooting",
  "Shots",
  "Smoke Report",
  "Spill",
  "Stabbing",
  "Stalking",
  "Structure Fire",
  "Structure Fire - Code 3",
  "Subject Or Person",
  "Subject Pursuit",
  "Subject Stop",
  "Suicide",
  "Supplement Report",
  "Suspicious",
  "Test",
  "Theft",
  "Threats",
  "Traffic Light Out",
  "Traffic Pursuit",
  "Traffic Stop",
  "Transient",
  "Transport Or Truck Fire",
  "Trash Fire",
  "Unauthorized Use Of Motor Vehicle",
  "Unconcious Person",
  "Unk Type Line Down",
  "Unknown",
  "Unwanted Subject(s)",
  "Vehicle",
  "Vehicle Fire",
  "Wanted Subject",
  "Wanted/Stolen",
  "Water Rescue"
];

export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

export const INITIATED_CALL_TYPES = [
  "Traffic Stop",
  "Subject Stop",
  "Out W/veh",
  "Assist Motorist",
  "Follow Up On Previous Call"
];

export const REASON_FOR_STOP_TYPES = [
  "Traffic Stop",
  "Subject Stop",
  "Out W/veh",
  "Assist Motorist"
];

export const CONSENSUAL_STOP_TYPES = [
  "Subject Stop",
  "Out W/veh"
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
    fromDate: '',
    fromTime: '',
    toDate: '',
    toTime: '',
    address: '',
    isBusiness: false,
    businessName: '',
    reportingOfficer: '',
    incidentType: '',
    callType: '',
    howReceived: 'dispatched',
    reasonForStop: '',
    isConsensual: false,
    offenses: [],
  },
  names: {
    'Complainant': [],
    'Victim': [],
    'Suspect': [],
    'Witness': [],
    'Other': []
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
    isSapdNamesTemplateEnabled: false,
    optionalSections: getInitialOptionalSections()
  },
  vehicles: []
});

export const INITIAL_STATE = getFreshInitialState();
