# Police Report Drafter

> A professional, AI-powered tool for law enforcement officers to draft comprehensive and accurate police reports efficiently.

![License](https://img.shields.io/badge/license-Proprietary-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## 🚔 Overview

The **Police Report Drafter** is designed to streamline the report-writing process for patrol and investigative officers. By leveraging AI and a robust database of CJIS codes and statutes, the application helps ensure that every report is detailed, legally sound, and formatted according to standard departmental requirements.

### Key Features

- **🤖 AI Narrative Engine**: Automatically drafts Public and Investigative narratives based on input facts, improving speed and grammar.
- **📚 Comprehensive Offense Search**: Integrated Texas CJIS codes and Municipal Court offenses with instant statute reference.
- **📱 Mobile-First Design**: Optimized for use in the field on iPhones or tablets, with full desktop compatibility.
- **📄 Professional Export**: One-click export to formatted Word documents, ready for submission.
- **⚖️ Legal Compliance**: Built-in prompts for Reason for Stop, Consensual Stop, and Body-Worn Camera (BWC) statements.
- **🛡️ Evidence Tracking**: Streamlined input for evidence items and booking probable cause statements.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Version 16 or higher)
- [npm](https://www.npmjs.com/) (Version 7 or higher)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/[YOUR_USERNAME]/police-report-drafter.git
   cd police-report-drafter
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env.local` file in the root directory and add your Google Gemini API Key:

   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Run Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3002](http://localhost:3002) in your browser.

## 🛠️ Tech Stack

- **Frontend**: React (v18), TypeScript, Vite
- **AI Integration**: Google Gemini API
- **Styling**: Tailwind CSS
- **Data Processing**: Python-based extraction scripts for CJIS/Statute data

## 📄 Documentation

- [Changelog](./CHANGELOG.md): Track all version updates and features.
- [CJIS Codes Reference](./cjis_codes.ts): Integrated offense and statute mapping.

## 🤝 Contributing

This project is currently for internal law enforcement use. For bug reports or feature requests, please contact the development team.

---

*Developed with ❤️ for Law Enforcement.*
