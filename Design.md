# Project Design Guidelines

This document outlines the design system and patterns used in the Police Report Drafter project to ensure consistency across the application.

## 🎨 Color Palette

The project uses a clean, professional palette with full support for light and dark modes.

| Concept | Light Mode | Dark Mode | Variable |
| :-- | :-- | :-- | :-- |
| **Primary** | #1e3a8a (Navy) | #1d4ed8 (Blue) | `--color-primary` |
| **Background** | #f8fafc (Slate-50) | #020617 (Slate-950) | `bg-slate-50` / `bg-slate-950` |
| **Surface** | #ffffff (White) | #0f172a (Slate-900) | `bg-white` / `bg-slate-900` |
| **Text** | #0f172a (Slate-900) | #f1f5f9 (Slate-100) | `text-slate-900` / `text-slate-100` |
| **Accent/Border** | #e2e8f0 (Slate-200) | #1e293b (Slate-800) | `slate-200` / `slate-800` |

## 🔡 Typography

The typography is chosen for readability and a "professional report" aesthetic.

- **Display Font**: `Inter` - Used for UI elements, labels, and general interface text.
- **Serif Font**: `Libre Baskerville` - Specifically used for the "Paper" effect in the final report draft to mimic official documentation.
- **Iconography**: `Material Symbols Outlined` - Used for action buttons and navigation hints.

## 🏗️ Layout & UI Components

### 1. Document Paper (`.document-paper`)

Used for the report preview to simulate a physical sheet of paper.

- **Style**: Shadow (`shadow-lg`), rounded corners (`rounded-sm`), white/dark-slate background.

### 2. Accordion Structure

Used to organize the long report form into manageable sections (Incident Details, Names, Narrative, etc.).

### 3. Inputs & Placeholders

- **Boilerplate Placeholders**: Format `[PLACEHOLDER]` (e.g., `[SUSPECT]`).
- **Dynamic Inputs**: Inline inputs for placeholders use a bottom border (`border-b-2`) and subtle background to indicate editability within a text block.

## ✨ Patterns & Animations

- **Animations**: Subtle `fadeIn` animation (`0.2s ease-out`) for elements appearing in the UI.
- **Scrollbars**: Custom slim scrollbars (`6px`) with rounded thumbs for a cleaner, modern look.
- **Responsive Design**:
  - Mobile: Full-height layouts with specific Safari fixes.
  - Desktop: Multi-column split view (Form vs. Preview).

## 🛠️ Tech Stack

- **Framework**: React / Vite
- **Styling**: Tailwind CSS v4 (with `@theme` configuration)
- **State**: React Hooks (useState, useEffect, useMemo)
- **Storage**: LocalStorage for persistence of settings and report drafts.
