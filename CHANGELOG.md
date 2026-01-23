# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
