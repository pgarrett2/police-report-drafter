# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-02-04

### Added

- **Slash Commands**: Introduced `/as` (Additional Statements) and enhanced `/ve` (Vehicle) slash commands for quicker data entry.
- **Slash Command Overlay**: Visual menu for selecting slash command options.
- **Additional Statements Selector**: New UI component for easier selection of statement types.

### Changed

- **UI Refactor**: Converted Investigative Narrative checkboxes to buttons for better visual hierarchy and UX.
- **Settings Menu**: Streamlined the settings menu by removing the "OFFENSE LIST JSON" button and repositioning the "Offense Summary" button.
- **Accessibility**: Fixed missing labels on form elements in Additional Statements Editor.

### Fixed

- **CSS Issues**: Resolved Tailwind CSS conflicts (text-sm vs text-xs) and redundant class warnings.
- **Lint Warnings**: Fixed various linting issues in `App.tsx` and `types.ts`.

## [1.4.0] - 2026-02-01

### Added

- **Mobile Camera Support**: Enhanced camera access for VIN scanning on mobile devices (iOS Safari).
- **HTTPS Development Support**: Configured development server with HTTPS for secure feature testing.
- **Smart Dropdowns**: Universal bracketed placeholder (`[...]`) dropdown system for all narrative sections.
- **Dynamic Name Dropdowns**: Names from the "Names" section now automatically populate relevant placeholders in narratives.
- **Auto-Expanding Textareas**: Improved UX with automatically resizing input fields.
- **New Narrative Sections**: Added MIRANDA WARNING, WARRANT CHECK, PR-BOND, and NCIC/TCIC to Additional Statements.

### Changed

- **Offense Summary UI**: Enhanced summary titles with metadata (statute, level, elements).
- **Placeholder Detection**: Refactored `sectionHasPlaceholders` to dynamically detect patterns.
- **Mobile UI**: Improved transparency for edit buttons and linked offense buttons on mobile.

### Fixed

- **Arrest Logic**: Improved ARREST disposition synchronization with additional statements.
- **Textarea Cursor**: Fixed mobile cursor issues in long textareas.

## [1.3.0] - 2026-01-27

### Added

- **Narrative Checkboxes**: New additional sections including Consensual Search, Probable Cause Search, K9 Alert, Fingerprints, Vehicle Tow, CPS Intake, APS Intake, Called CIU (Protective Order), Called Supervisor, Called CID, and Called Narcs.
- **CPS Intake Boilerplate**: Two boilerplate template options with editable input placeholders for [NAME], [NUMBER], [CHILDREN], [INTAKE PERSON], and [INTAKE NUMBER].
- **APS Intake Boilerplate**: Boilerplate template with editable input placeholders for [NAME] and [NUMBER].

### Fixed

- **Input/Textarea Errors**: Resolved form validation errors in App.tsx.
- **Missing Juvenile Auto-Population**: Fixed guardian and missing person names only auto-populating after deselecting the "MISSING JUVENILE" selection.
- **Body-Worn Camera Statements**: Fixed "Body-worn camera statement #2" section not appearing in the draft preview when selected.
- **Offense Deletion Protection**: Prevented deletion of offenses that are linked to suspects or victims.

## [1.2.0] - 2026-01-22

### Added

- **Vehicle Section**: New comprehensive vehicle tracking with VIN decoder integration (NHTSA API), color, year, make, model, license plate, and vehicle style fields.
- **License Plate State Dropdown**: Added state selector next to license plate field with Texas as default.
- **Vehicle Status Tracking**: Options for Towed, Released, or Left on Scene with conditional destination/location fields.
- **Vehicle-Name Linking**: Ability to associate vehicles with specific names from the Names section.
- **Date/Time Inputs**: Added date and time input boxes in Incident Details section with timeframe support.
- **Cross Streets Support**: Address input now supports "/" character for cross street notation with automatic narrative reformatting.
- **Enhanced Offense Search**: Improved dropdown search prioritizing exact prefix matches for better usability.
- **Expanded Offense Database**: Added OCR offenses and new offense titles including warrants, mental health, and intake categories.

### Changed

- **Call Types**: Updated to comprehensive Title Case list extracted from department call types document.
- **Names Section Redesign**: Transformed category headers into add buttons with sex toggle and arrest button for suspects.

### Fixed

- **Mobile Improvements**: Removed zoom buttons on mobile (pinch-to-zoom available), improved touch icon support.
- **Offense Search UX**: Better prefix matching ensures more relevant results appear first.

## [1.1.0] - 2026-01-20

### Added

- **Cloud Deployment**: Successfully deployed to Google Cloud Run.
- **Local Docker Support**: Added `docker-compose.yml` for easy local execution on port 3002.
- **CJIS Compliance Section**: New documentation in README regarding local data security.
- **Architecture Note**: Clarified no-backend architecture and local browser storage usage.

### Changed

- **Documentation**: Updated README with public testing link and removed mention of unimplemented AI features.
- **Repository**: Prepared for version synchronization.

## [1.0.0] - 2026-01-19

### Added

- Initial release of the **Police Report Drafter**.
- **AI-Assisted Narratives**: Intelligent drafting of Public and Investigative narratives using Gemini AI.
- **CJIS Code Integration**: Search and select from a comprehensive list of Texas CJIS and Municipal Court codes.
- **Offense Database**: Integrated Penal Code and Transportation Code (TRC) offenses with statutory text tooltips.
- **Dynamic Narrative Logic**: Customizable fields for Reason for Stop, Consensual Stop, and BWC statements.
- **Section Management**: Dedicated modules for Incident Details, Names, Evidence, and Booking PC.
- **Document Export**: Generate professional Microsoft Word reports from drafts.
- **Mobile Optimization**: Fully responsive interface optimized for iOS (Safari) and Android.

### Fixed

- Enhanced visibility and functionality of textareas on mobile viewports.
- Corrected offense formatting to match standard "ASSAULT CAUSES BODILY INJ - Penal Code 22.01(a)(1) MA" layout.
- Resolved styling inconsistencies in the draft preview section.
