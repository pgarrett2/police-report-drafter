# Police Report Drafter - Code Reference

> **Purpose**: Quick reference for navigating the codebase. Keep this updated when making changes.

---

## Project Structure

```
police-report-drafter/
├── App.tsx              # Main application (3600+ lines)
├── types.ts             # TypeScript type definitions
├── constants.ts         # Initial state, templates, optional sections
├── subtypes.ts          # Call type subtypes mapping
├── cjis_codes.ts        # Offense codes database
├── index.tsx            # React entry point
├── index.css            # Global styles
├── components/
│   ├── PreviewSection.tsx
│   └── OffenseListEditor.tsx
└── .agent/workflows/    # Automation workflows
```

---

## App.tsx Structure

### State Variables (Lines 41-220)

| Variable | Line | Purpose |
|----------|------|---------|
| `settings` | 43 | Persistent settings from localStorage |
| `reportData` | 48 | Main report data state |
| `activeSection` | 108 | Current expanded section |
| `isAdditionalSectionsOpen` | 110 | Additional statements dropdown state |
| `isSettingsOpen` | 111 | Settings modal open state |
| `selectedTemplateId` | 109 | Selected narrative template |
| `offenseSearchPatterns` | ~135 | Offense search states per offense slot |
| `offenseSearchPositions` | ~140 | Dropdown position states |
| `isEditingPublic/Intro/Bwc/etc` | ~150 | Edit mode states for each section |

### Core Functions

#### Section Handlers (Lines 114-130)

| Function | Line | Purpose |
|----------|------|---------|
| `scrollToSection` | 114 | Scroll to and expand a section |
| `handleSectionToggle` | 123 | Toggle section expansion |

#### Offense Management (Lines 262-340)

| Function | Line | Purpose |
|----------|------|---------|
| `handleSaveOffense` | 262 | Save offense override to settings |
| `handleExportJson` | 273 | Export offense overrides JSON |
| `handleCopyJson` | 291 | Copy overrides to clipboard |
| `handleDeleteOverride` | 303 | Delete offense override |

#### Input Handlers (Lines 606-640)

| Function | Line | Purpose |
|----------|------|---------|
| `handleInputChange` | 606 | Generic input change handler |
| `handleTemplateSelect` | 616 | Template dropdown handler |
| `handleNewDraftClick` | 633 | New draft button |
| `confirmNewDraft` | 637 | Confirm and reset draft |

#### Optional Sections (Lines 653-930)

| Function | Line | Purpose |
|----------|------|---------|
| `handleOptionalSectionToggle` | 653 | Toggle optional section checkbox |
| `handleSectionVersionChange` | 688 | Switch between section versions (V1/V2) |
| `getSectionVersion` | 706 | Detect version from text content |
| `handlePlaceholderChange` | 714 | Handle [PLACEHOLDER] input changes |
| `interpolatePlaceholders` | 806 | Replace placeholders in preview |
| `renderTextWithPlaceholders` | 850 | Render section with inline inputs |
| `startEditingSection` | 908 | Enter edit mode for section |
| `saveSection` | 913 | Save section changes |

#### Boilerplate Editors (Lines 928-980)

| Function | Line | Purpose |
|----------|------|---------|
| `startEditingCallnotes` | 928 | Edit CALLNOTES |
| `startEditingArrival` | 939 | Edit ARRIVAL ON SCENE |
| `startEditingStatements` | 949 | Edit STATEMENTS |
| `startEditingProperty` | 959 | Edit PROPERTY |
| `startEditingConclusion` | 969 | Edit CONCLUSION |

#### Custom Paragraphs (Lines 979-1050)

| Function | Line | Purpose |
|----------|------|---------|
| `startAddingCustomParagraph` | 979 | Start adding custom paragraph |
| `saveCustomParagraph` | 985 | Save new custom paragraph |
| `deleteCustomParagraph` | 1033 | Delete custom paragraph |
| `getCustomParagraphsForPosition` | 1043 | Get paragraphs for position |

#### Drag & Drop (Lines 1048-1090)

| Function | Line | Purpose |
|----------|------|---------|
| `moveSection` | 1048 | Move section up/down |
| `handleDragStart` | 1061 | Drag start handler |
| `handleDragOver` | 1062 | Drag over handler |
| `handleDrop` | 1067 | Drop handler |

#### Name Management (Lines 1086-1240)

| Function | Line | Purpose |
|----------|------|---------|
| `handleNameChange` | 1086 | Update name entry field |
| `toggleLinkedOffense` | 1121 | Link/unlink offense from name |
| `updateOffenseDisposition` | 1141 | Set ARREST/CITATION/WARNING |
| `addNameEntry` | 1206 | Add new name entry |
| `removeNameEntry` | 1213 | Remove name entry |

#### Copy & Export (Lines 1318-1370)

| Function | Line | Purpose |
|----------|------|---------|
| `copyToClipboard` | 1318 | Copy text with confirmation |
| `handleCopyFullReport` | 1344 | Copy entire report |

#### Offense Summary (Lines 1376-1390)

| Function | Line | Purpose |
|----------|------|---------|
| `handleOffenseSummaryChange` | 1376 | Update offense summary text |

#### Vehicle Management (Lines 1389-1450)

| Function | Line | Purpose |
|----------|------|---------|
| `addVehicleEntry` | 1389 | Add new vehicle |
| `removeVehicleEntry` | 1410 | Remove vehicle |
| `handleVehicleChange` | 1417 | Update vehicle field |
| `decodeVin` | 1424 | NHTSA VIN decoder API |

#### Render Functions (Lines 1446-1930)

| Function | Line | Purpose |
|----------|------|---------|
| `renderVehicleInputs` | 1446 | Render vehicle section UI |
| `renderNameInputs` | 1654 | Render names section UI |
| `generateSapdNamesTemplate` | 1866 | Generate SAPD names template |
| `getCustomParagraphsText` | 1903 | Get custom paragraphs text |
| `getOffenseSummaryTitle` | 1911 | Build offense title with metadata |

---

## UI Sections (JSX Starting ~Line 1933)

### Header (Lines 1935-1970)

- Dark mode toggle
- New Draft button
- Settings button

### Settings Modal (Lines 1979-2115)

- Default Officer setting
- Offense Summary options (Citation, Statute, Level, Elements)
- Offense List Editor trigger
- Dark Mode toggle

### Main Layout (Lines 2120+)

- Split view: Editor (left) | Preview (right)

### Editor Sections

| Section | Approximate Lines | Description |
|---------|-------------------|-------------|
| Incident Details | 2200-2700 | Call type, address, offenses, date/time |
| Names | 2700-2900 | Suspect/Victim/Witness/etc entries |
| Vehicles | 2900-3020 | Vehicle entries with VIN decoder |
| Public Narrative | 3020-3100 | Public-facing narrative |
| Investigative Narrative | 3100-3600 | Full narrative with all sections |

### Investigative Narrative Sub-sections

| Sub-section | Key Lines | Description |
|-------------|-----------|-------------|
| Introduction | ~3120 | Opening paragraph |
| BWC Statement #1 | ~3140 | Body-worn camera statement |
| CALLNOTES | ~3160 | Call notes section |
| ARRIVAL ON SCENE | ~3180 | Arrival description |
| Custom Paragraphs (after-arrival) | ~3200 | User-added paragraphs |
| STATEMENTS | ~3210 | Statements section |
| Custom Paragraphs (after-statements) | ~3220 | User-added paragraphs |
| PROPERTY | ~3230 | Property section |
| Custom Paragraphs (after-property) | ~3240 | User-added paragraphs |
| CONCLUSION | ~3250-3290 | Conclusion section |
| ADDITIONAL STATEMENTS | ~3290-3465 | Collapsible additional sections |
| BWC Statement #2 | ~3466-3510 | Second BWC statement |
| OFFENSE SUMMARY | ~3510-3580 | Per-offense summaries |

---

## Types (types.ts)

| Type | Description |
|------|-------------|
| `ReportState` | Main report data structure |
| `IncidentDetails` | Call type, address, offenses, date/time |
| `Offense` | Offense data (literal, citation, statute, level, elements) |
| `NameEntry` | Name with sex, linked offenses, disposition |
| `PartyCategory` | 'SUSPECT' | 'VICTIM' | 'WITNESS' | etc |
| `VehicleEntry` | Vehicle data with linked names |
| `OptionalSection` | Additional statement with placeholders |
| `CustomParagraph` | User-added paragraph with position |
| `PersistentSettings` | Saved settings (officer, offense options) |
| `Conviction` | Prior conviction entry |

---

## Constants (constants.ts)

| Export | Description |
|--------|-------------|
| `INITIAL_SETTINGS` | Default settings values |
| `getFreshInitialState()` | Create new blank report |
| `TEMPLATES` | Narrative templates |
| `OPTIONAL_SECTIONS` | Additional statement definitions |
| `CALL_TYPES` | Available call types |
| `PARTY_CATEGORIES` | Name categories |

---

## Key Line Ranges Summary

| Feature | Line Range |
|---------|------------|
| Imports & Constants | 1-40 |
| State Initialization | 41-220 |
| Offense Summary Auto-generation | 545-570 |
| Handler Functions | 262-1450 |
| Render Helper Functions | 1446-1930 |
| JSX Return Statement | 1933-3626 |
| Header | 1935-1970 |
| Settings Modal | 1979-2115 |
| Incident Details Section | 2200-2700 |
| Names Section | 2700-2900 |
| Vehicles Section | 2900-3020 |
| Public Narrative | 3020-3100 |
| Investigative Narrative | 3100-3600 |
| CONCLUSION | 3250-3290 |
| ADDITIONAL STATEMENTS | 3290-3465 |
| BWC Statement #2 | 3466-3510 |
| OFFENSE SUMMARY | 3510-3580 |

---

## Recent Changes Log

| Date | Change | Lines Affected |
|------|--------|----------------|
| 2026-01-30 | Offense summary title with metadata | 1911-1925, 3532-3544 |
| 2026-01-30 | Mobile textarea cursor fix | 3551-3570 |
| 2026-01-30 | ADDITIONAL STATEMENTS rename | 3290-3297 |
| 2026-01-30 | Auto-expanding textareas | 3551-3570 |
| 2026-01-30 | Suspect: ARREST/CITATION → INFO button, linked offense buttons transparent | 1733-1742, 1765-1785 |
| 2026-01-30 | ARREST auto-enables ARREST section (V2) + copies to Booking Probable Cause | 1141-1167 |

---

## Tips for Navigation

1. **Find a UI element**: Search for the visible text (e.g., "ADDITIONAL STATEMENTS")
2. **Find a handler**: Search for `handle` + action name
3. **Find state variable**: Check lines 41-220
4. **Find a section**: Use line ranges above
5. **Find types**: Check `types.ts`
6. **Find templates/options**: Check `constants.ts`
