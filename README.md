# Police Report Drafter

> A professional tool for law enforcement officers to draft comprehensive and accurate police reports efficiently.

![License](https://img.shields.io/badge/license-Proprietary-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-green.svg)

## 🚔 Overview

The **Police Report Drafter** is designed to streamline the report-writing process for patrol and investigative officers. By leveraging a robust database of CJIS codes and statutes, the application helps ensure that every report is detailed, legally sound, and formatted according to standard departmental requirements.

### 🌐 Live Prototype

The application is available for testing and proof of concept at:
**[https://police-report-drafter-207300499328.us-central1.run.app](https://police-report-drafter-207300499328.us-central1.run.app)**

### 🛡️ Privacy & CJIS Compliance

This application is designed with a **privacy-first architecture**:

- **No Backend**: There is no server-side database. All report data stay within the user's browser environment.
- **Local Storage**: Data is persisted using the browser's local storage mechanism, ensuring it never leaves the device.
- **CJIS Compliance**: When run locally on a department-approved device or hosted on a secure department server (accessible via port 3002), the application remains CJIS compliant because all data remains within the secure, CJIS-authorized network and never traverses external untrusted servers.

### Key Features

- **📚 Comprehensive Offense Search**: Integrated Texas CJIS codes and Municipal Court offenses with instant statute reference.
- **📱 Mobile-First Design**: Optimized for use in the field on iPhones or tablets, with full desktop compatibility.
- **📄 Professional Export**: One-click export to formatted Word documents, ready for submission.
- **⚖️ Legal Compliance**: Built-in prompts for Reason for Stop, Consensual Stop, and Body-Worn Camera (BWC) statements.
- **🛡️ Evidence Tracking**: Streamlined input for evidence items and booking probable cause statements.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Version 16 or higher)
- [npm](https://www.npmjs.com/) (Version 7 or higher)
- [Docker](https://www.docker.com/) (Optional, for containerized execution)

### Installation (Standard)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/pgarrett2/police-report-drafter.git
   cd police-report-drafter
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3002](http://localhost:3002) in your browser.

### Installation (Docker)

To run the application locally using Docker on port 3002:

```bash
docker-compose up -d
```

The application will be available at [http://localhost:3002](http://localhost:3002).

## 🛠️ Tech Stack

- **Frontend**: React (v19), TypeScript, Vite
- **Styling**: Tailwind CSS
- **Containerization**: Docker, Google Cloud Run
- **Data Processing**: Python-based extraction scripts for CJIS/Statute data

## 📄 Documentation

- [Changelog](./CHANGELOG.md): Track all version updates and features.
- [CJIS Codes Reference](./cjis_codes.ts): Integrated offense and statute mapping.

## 🤝 Contributing

This project is currently for internal law enforcement use. For bug reports or feature requests, please contact the development team.

---

*Developed with ❤️ for Law Enforcement.*
