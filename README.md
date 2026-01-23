# Police Report Drafter

> A professional tool for law enforcement officers to draft comprehensive and accurate police reports efficiently.

![License](https://img.shields.io/badge/license-Proprietary-blue.svg)
![Version](https://img.shields.io/badge/version-1.2.0-green.svg)

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
- **🚗 Vehicle Tracking**: VIN decoder integration with NHTSA API for auto-populating vehicle details.
- **📱 Mobile-First Design**: Optimized for use in the field on iPhones or tablets, with full desktop compatibility.
- **📄 Professional Export**: One-click export to formatted Word documents, ready for submission.
- **⚖️ Legal Compliance**: Built-in prompts for Reason for Stop, Consensual Stop, and Body-Worn Camera (BWC) statements.
- **🛡️ Evidence Tracking**: Streamlined input for evidence items and booking probable cause statements.

## 🚀 Getting Started

Choose one of the following installation methods based on your preference.

---

### Option 1: NPM Installation (Recommended for Development)

#### Prerequisites

- [Node.js](https://nodejs.org/) **v18 or higher** (LTS recommended)
- [npm](https://www.npmjs.com/) **v9 or higher** (comes with Node.js)
- [Git](https://git-scm.com/)

#### Step-by-Step Instructions

1. **Verify Node.js and npm are installed:**

   ```bash
   node --version   # Should show v18.x.x or higher
   npm --version    # Should show 9.x.x or higher
   ```

   If not installed, download from [nodejs.org](https://nodejs.org/) and install the LTS version.

2. **Clone the repository:**

   ```bash
   git clone https://github.com/pgarrett2/police-report-drafter.git
   cd police-report-drafter
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

   This will install React, Vite, TypeScript, and all other required packages.

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Access the application:**

   Open your browser and navigate to **[http://localhost:3002](http://localhost:3002)**

6. **Build for production (optional):**

   ```bash
   npm run build
   npm run preview   # Preview the production build
   ```

---

### Option 2: Docker Installation (Recommended for Production/Deployment)

#### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) (Docker Desktop recommended for Windows/Mac)
- [Docker Compose](https://docs.docker.com/compose/) (included with Docker Desktop)

#### Step-by-Step Instructions

1. **Verify Docker is installed and running:**

   ```bash
   docker --version         # Should show Docker version
   docker-compose --version # Should show Docker Compose version
   ```

   If not installed, download [Docker Desktop](https://www.docker.com/products/docker-desktop/) for your OS.

2. **Clone the repository:**

   ```bash
   git clone https://github.com/pgarrett2/police-report-drafter.git
   cd police-report-drafter
   ```

3. **Build and start the container:**

   ```bash
   docker-compose up -d --build
   ```

   This command will:
   - Build the Docker image (first time may take 2-3 minutes)
   - Start the container in detached mode (`-d`)
   - Map port 3002 on your machine to the container

4. **Access the application:**

   Open your browser and navigate to **[http://localhost:3002](http://localhost:3002)**

5. **Useful Docker commands:**

   ```bash
   # View running containers
   docker ps

   # View container logs
   docker-compose logs -f

   # Stop the container
   docker-compose down

   # Rebuild after code changes
   docker-compose up -d --build
   ```

---

### Troubleshooting

| Issue | Solution |
| ----- | -------- |
| `npm install` fails | Try deleting `node_modules` folder and `package-lock.json`, then run `npm install` again |
| Port 3002 already in use | Stop any other service using port 3002, or modify `vite.config.ts` (npm) or `docker-compose.yml` (Docker) to use a different port |
| Docker build fails | Ensure Docker Desktop is running, then try `docker system prune` to clear cache |
| Application not loading | Check browser console (F12) for errors; ensure you're using a modern browser (Chrome, Firefox, Edge, Safari) |

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
