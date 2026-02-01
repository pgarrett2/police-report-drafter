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

export const INTRO_BODY = "I responded in a marked patrol vehicle, wearing my issued police uniform.";

export const BWC_VERSION_1 = "My department-issued body-worn camera was activated prior to arrival and recorded my actions, observations, and statements during this incident in accordance with department policy.";
export const BWC_VERSION_2 = "My body-worn camera (BWC) was activated prior to arrival and remained activated throughout the encounter. All statements referenced in this report were captured on BWC audio and video unless otherwise noted.";
export const BWC_VERSION_3 = "Before I arrived, I activated my body-worn camera, which captured all my interactions with the individuals on this call for service.";
export const BWC_INITIATED_TEXT = "When I activated my emergency lights, my body-worn camera and in-car camera system activated. Both recording systems continued to record throughout the duration of this incident.";

export const BWC_BOILERPLATE = BWC_VERSION_1;
export const BWC2_BOILERPLATE = "All body-worn camera footage related to this incident was preserved in accordance with department policy. A transcription of all conversations captured by my body-worn camera was also automatically created once it was uploaded to Evidence.com.";
export const OFFENSE_SUMMARY_BOILERPLATE = "[OFFENSE] - [STATUTE_NAME] [CITATION] [LEVEL]";

const NEW_OPTIONAL_SECTION_LABELS = [
  "ARREST",
  "No Arrest",
  "Photos taken",
  "Citizen Link Sent",
  "Evidence",
  "Family Violence MANDATORY",
  "Danger Assessment",
  "CCH check",
  "Property Continuum form (theft/burgs)",

  "Missing Juvenile",
  "Written Statements",
  "County Attorney Packet",
  "Consensual Search",
  "Probable Cause Search",
  "K9 Alert",
  "Fingerprints",
  "Vehicle Tow",
  "CPS Intake",
  "APS Intake",
  "Called CIU (Protective Order)",
  "Called Supervisor",
  "Called CID",
  "Called Narcs",
  "PURSUE"
];

// Boilerplate texts for specific sections
export const CPS_INTAKE_VERSION_1 = "I later contacted the Child Protective Services (CPS) Intake hotline and spoke to CPS Intake Specialist [NAME] (Agent #[AGENT NUMBER]). I provided [NAME] with all pertinent information regarding this incident and was provided CPS Report ID #[REPORT ID].";

export const CPS_INTAKE_VERSION_2 = "I also spoke with the following children [CHILDREN] present at the location of this incident. All children on the scene were identified and checked for any signs of injury or abuse. I later contacted the CPS intake number, spoke with [INTAKE PERSON], and received the following [INTAKE NUMBER].";

export const APS_INTAKE_BOILERPLATE = "I later contacted the Adult Protective Services (APS) Intake hotline and spoke to APS Intake Specialist [NAME] (Agent #[AGENT NUMBER]). I provided [NAME] with all pertinent information regarding this incident and was provided APS Report ID #[REPORT ID].";

export const FAMILY_VIOLENCE_BOILERPLATE = "[NAME] was provided with a Family Violence victim resource card and the contact information for the Crisis Intervention Unit.";
export const DANGER_ASSESSMENT_BOILERPLATE = "A danger assessment was completed and attached to this report.";
export const CCH_CHECK_BOILERPLATE = "I conducted a Computerized Criminal History (CCH) check on [SUSPECT] and learned that [he/she] [has / has no] prior [Family Violence / Theft / Felony / DWI ] convictions.";
export const MISSING_JUVENILE_BOILERPLATE_1 = "I had [GUARDIAN] complete a Runaway/Missing Person's Report form. [GUARDIAN] stated [MISSING PERSON] is a [RACE/ETHNICITY] [SEX], date of birth [DATE OF BIRTH], [HEIGHT], [WEIGHT] lbs., [HAIR COLOR] hair, [EYE COLOR] eyes, last seen wearing [LAST SEEN WEARING]. [POSSIBLE WHEREABOUTS]";
export const MISSING_JUVENILE_BOILERPLATE_2 = "I then instructed Dispatch to enter [MISSING PERSON] into NCIC/TCIC as a Missing Person. I contacted the National Center for Missing and Exploited Children (NCMEC), spoke to a NCMEC representative ([REP NAME]), and relayed all pertinent information and received NCMEC Case #[NCMEC CASE #].";
export const MISSING_JUVENILE_BOILERPLATE = MISSING_JUVENILE_BOILERPLATE_1;
export const COUNTY_ATTORNEY_PACKET_BOILERPLATE = "[NAME] was given a County Attorney Packet and informed how to follow through with pursuing charges.";

export const ARREST_VERSION_1 = "[NAME] was handcuffed (checked for fit and double locked), searched incident to arrest, and placed in the back of [my / [officer’s]] patrol vehicle [and then transported to Tom Green County Jail and booked in for the listed charges].";
export const ARREST_VERSION_2 = "[The suspect / SUSPECT NAME] was placed under arrest for [OFFENSE], handcuffed, searched incident to arrest, and transported to [Tom Green County Jail / the Juvenile Justice Center] for booking.";

export const NO_ARREST_BOILERPLATE = "No arrest was made at the time of this report. The suspect [was not present on scene / fled prior to arrival / could not be located].";

export const PHOTOS_TAKEN_BOILERPLATE = "I took photographs of the scene and later uploaded them to the Axon Cloud Server, which is accessible on Evidence.com.";

export const CITIZEN_LINK_SENT_VERSION_1 = "An Axon’s Citizen Link was sent to [NAME] to upload digital evidence to the Axon Cloud Server.";
export const CITIZEN_LINK_SENT_VERSION_2 = "I sent [NAME] an Axon’s Citizen Link to upload [photographs / the surveillance footage of the incident / the video footage of the incident / photographs and videos / digital evidence] to the Axon Cloud Server.";

// Map of section labels to their default boilerplate text
export const SECTION_BOILERPLATES: Record<string, string> = {
  "CPS Intake": CPS_INTAKE_VERSION_1,
  "APS Intake": APS_INTAKE_BOILERPLATE,
  "Family Violence MANDATORY": FAMILY_VIOLENCE_BOILERPLATE,
  "Danger Assessment": DANGER_ASSESSMENT_BOILERPLATE,
  "CCH check": CCH_CHECK_BOILERPLATE,
  "Missing Juvenile": MISSING_JUVENILE_BOILERPLATE,
  "County Attorney Packet": COUNTY_ATTORNEY_PACKET_BOILERPLATE,
  "ARREST": ARREST_VERSION_1,
  "No Arrest": NO_ARREST_BOILERPLATE,
  "Photos taken": PHOTOS_TAKEN_BOILERPLATE,
  "Citizen Link Sent": CITIZEN_LINK_SENT_VERSION_1,
};

const getInitialOptionalSections = (): OptionalSection[] =>
  NEW_OPTIONAL_SECTION_LABELS.map(label => ({
    id: label.toLowerCase().replace(/[^a-z]/g, ''),
    label: label,
    enabled: false,
    text: SECTION_BOILERPLATES[label] || "Under development",
    text2: label === 'Missing Juvenile' ? MISSING_JUVENILE_BOILERPLATE_2 : undefined,
    isEdited: false
  }));

export const INITIAL_SETTINGS: PersistentSettings = {
  defaultOfficer: '',
  offenseSummaryCitation: false,
  offenseSummaryStatute: false,
  offenseSummaryLevel: false,
  offenseSummaryElements: false
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
    subtype: '',
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
    bwc2Statement: BWC2_BOILERPLATE,
    isBwc2Enabled: true,
    isBwc2Edited: false,
    offenseSummaryStatement: OFFENSE_SUMMARY_BOILERPLATE,
    offenseSummaries: {},
    isOffenseSummaryEnabled: true,
    isOffenseSummaryEdited: false,
    isSapdNamesTemplateEnabled: false,
    // New section flags
    isCallnotesEnabled: false,
    callnotesStatement: 'Under development',
    isCallnotesEdited: false,
    isArrivalEnabled: false,
    arrivalStatement: 'Under development',
    isArrivalEdited: false,
    isStatementsEnabled: false,
    statementsStatement: 'Under development',
    isStatementsEdited: false,
    isPropertyEnabled: false,
    propertyStatement: 'Under development',
    isPropertyEdited: false,
    isConclusionEnabled: false,
    conclusionStatement: 'Under development',
    isConclusionEdited: false,
    customParagraphs: [],
    optionalSections: getInitialOptionalSections()
  },
  vehicles: []
});

export const INITIAL_STATE = getFreshInitialState();
