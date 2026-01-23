import json

call_types_raw = ["AIRCRAFT CRASH", "AIRCRAFT EMERGENCY", "AIRCRAFT FIRE", "ALARM", "ANIMAL PROBLEMS", "ARSON INVESTIGATION", "ASSAULT", "ASSIST", "ASSIST MOTORIST", "ATL", "ATTEMPT TO LOCATE", "BACK UP", "BOATING INCIDENT", "BROADCAST", "BUILDING COLLAPSE", "BURGLARY", "CHECK FLOOD CONDITIONS", "CHECK FOR DEBRIS ON ROAD", "CHECK SOLICITOR FOR SALES PERMIT", "CHILD PROBLEM", "CITY ORDINANCE VIOLATION", "CIVIL DISTRUBANCE", "CIVIL DISTURBANCE", "CLEAR LOT OF LOITERERS", "COURT BANK RUN", "COURT FORGERY", "COURT IMPOUND", "COURT PICKUP PRISONER", "COURT POLICE ACTIVITY", "COURT SUMMONS/SUBPOENA", "COURT TEST CALL", "COURT TRAFFIC", "COURT WARRANTS", "CRIMINAL MISCHIEF", "CRIMINAL TRESPASS", "DEAD BODY", "DELIVER MESSAGE", "DIRECT TRAFFIC", "DIRECTED PATROL", "DIRECTIVE PATROL", "DISORDERLY CONDUCT", "DOMESTIC DISTURBANCE", "DRIVING WHILE INTOXICATED", "DROWNING", "DRUGS", "DRUNK", "ENROUTE TO\u2026", "ESCAPE/JAIL BREAK - CODE 3", "ESCORT", "FIELD EVENT", "FIGHT", "FIREWORKS", "FLAGDOWN", "FLAGGED DOWN", "FOLLOW UP ON PREVIOUS CALL", "FOLLOWING VEHICLE", "FOUND", "GAS LEAK", "GO TO STATION", "GRASS FIRE", "HARASSMENT", "HAULING PRISONER TO JAIL", "HOUSEWATCH", "ILLEGAL", "ILLPERS", "INDECENT EXPOSURE", "INTOXILIZER OPERATOR", "JUVENILE", "KIDNAPPING", "LOUD", "MC - AIRPORT EVENT", "MC INSURANCE ORDER", "MEAL BREAK", "MEET WITH", "MINOR IN POSSESSION ALCOHOL/TOBACCO", "MISSING", "MOTOR VEHICLE ACCIDENT", "OFFICER NEEDS ASSISTANCE", "OPEN CARRY CHECK", "OPEN DOOR", "OTHER TYPE POLICE CALL NOT CLASSIFIED", "OUT W/SUBJECT", "OUT W/VEH", "OVERDOSE", "PICK UP PRISONER", "PROPERTY DAMAGE", "PROWLER", "PSYCHIATRIC PROBLEMS", "PUBLIC SERVICE GENERIC TERM", "RECEIVE INFO", "RECKLESS DRIVER", "REQ WALK THRU BUSINESS", "ROBBERY", "SEXUAL OFFENDER VIOLATION", "SHOOTING", "SHOTS", "SMOKE REPORT", "SPILL", "STABBING", "STALKING", "STRUCTURE FIRE", "STRUCTURE FIRE - CODE 3", "SUBJECT OR PERSON", "SUBJECT PURSUIT", "SUBJECT STOP", "SUICIDE", "SUPPLEMENT REPORT", "SUSPICIOUS", "TEST", "THEFT", "THREATS", "TRAFFIC LIGHT OUT", "TRAFFIC PURSUIT", "TRAFFIC STOP", "TRANSIENT", "TRANSPORT OR TRUCK FIRE", "TRASH FIRE", "UNAUTHORIZED USE OF MOTOR VEHICLE", "UNCONCIOUS PERSON", "UNK TYPE LINE DOWN", "UNKNOWN", "UNWANTED SUBJECT(S)", "VEHICLE", "VEHICLE FIRE", "WANTED SUBJECT", "WANTED/STOLEN", "WATER RESCUE"]

def to_title_case(s):
    # Specialized handling for acronyms if needed, or just basic title case
    return s.title().replace("'S", "'s")

call_types_formatted = [to_title_case(c) for c in call_types_raw]
call_types_formatted.sort()

formatted_string = "export const CALL_TYPES = [\n  \"" + "\",\n  \"".join(call_types_formatted) + "\"\n];"

# Define mappings for logic constants based on new CALL_TYPES
initiated_matches = ["TRAFFIC STOP", "SUBJECT STOP", "OUT W/VEH", "ASSIST MOTORIST", "FOLLOW UP ON PREVIOUS CALL"]
reason_matches = ["TRAFFIC STOP", "SUBJECT STOP", "OUT W/VEH", "ASSIST MOTORIST"]
consensual_matches = ["SUBJECT STOP", "OUT W/VEH"]

def get_lower_list(matches):
    return "[\n  \"" + "\",\n  \"".join([m.lower() for m in matches]) + "\"\n]"

with open("constants.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace CALL_TYPES
import re
content = re.sub(r"export const CALL_TYPES = \[.*?\];", formatted_string, content, flags=re.DOTALL)

# Replace logic constants to match lower-cased versions of new strings
content = re.sub(r"export const INITIATED_CALL_TYPES = \[.*?\];", f"export const INITIATED_CALL_TYPES = {get_lower_list(initiated_matches)};", content, flags=re.DOTALL)
content = re.sub(r"export const REASON_FOR_STOP_TYPES = \[.*?\];", f"export const REASON_FOR_STOP_TYPES = {get_lower_list(reason_matches)};", content, flags=re.DOTALL)
content = re.sub(r"export const CONSENSUAL_STOP_TYPES = \[.*?\];", f"export const CONSENSUAL_STOP_TYPES = {get_lower_list(consensual_matches)};", content, flags=re.DOTALL)

with open("constants.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated constants.ts")
