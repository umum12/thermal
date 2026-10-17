Blueprint — TRFBT PWA

1. Project Overview

Build a lightweight, mobile-first Progressive Web App (PWA) as an alternative to TRFBT — Bluetooth Struk Transfer.

Target device: Android
Target printer: Xprinter XP-58IIZ, thermal 58 mm
Hosting: GitHub Pages
Frontend: Vanilla HTML, CSS, and JavaScript
Data storage: IndexedDB on the user's device
Backend: None

The application must be simple, fast, installable, and usable offline after its initial load.

2. Architecture

Use a standalone client-side architecture.

- GitHub Pages hosts the entire application.
- IndexedDB stores transaction history and application settings locally.
- Web APIs handle available browser features.
- Web Bluetooth may be used only if the printer's protocol is compatible.
- OCR runs locally in the browser where technically feasible.
- PWA manifest and service worker provide installation and offline caching.
- Favicon, application icons, stylesheets, scripts, and OCR assets are stored in the GitHub repository.

Do not use:

- Google Apps Script or "Code.gs"
- Google Sheets as a database
- Google Drive for transaction or image storage
- External databases or mandatory backend services
- Cloud synchronization in the initial version

Data remains on the current device. Provide JSON export/import for backup if practical.

3. Core Features

A. Transaction Form

- Input transaction details manually.
- Support configurable service fees and additional notes.
- Validate required fields and monetary values.
- Allow users to correct information before printing.

B. Screenshot OCR

- Import a transaction screenshot from the device.
- Extract readable transaction text locally where possible.
- Map recognized values to the appropriate form fields.
- Let users review and correct every extracted value.
- Never treat OCR results as proof that a transfer succeeded.

OCR must not upload screenshots to a server without explicit user consent.

C. Receipt Preview

- Display a live preview while the form is edited.
- Use a thermal receipt layout optimized for 58 mm paper.
- Support configurable store name, footer, service fee, and transaction details.
- Keep the preview consistent with the intended printed output.

D. Bluetooth Printing

- Target the Xprinter XP-58IIZ.
- Use ESC/POS commands only after verifying the printer's supported command set.
- Provide connection status, a test-print function, and clear error messages.
- Support reconnecting and reprinting when appropriate.
- Never report a successful print before the browser confirms the available operation has completed.

Critical compatibility requirement:

Do not assume the printer is compatible with Web Bluetooth simply because it supports Bluetooth.

First determine whether the printer exposes a usable BLE GATT service and writable characteristic. Chrome on Android does not provide generic access to Bluetooth Classic SPP through the Web Bluetooth API.

If the printer requires Bluetooth Classic SPP, document the limitation and propose a separate Android Print Bridge or another technically viable printing method. Do not silently introduce a backend or claim direct browser printing works without a real-device test.

E. Local History

- Save transactions and relevant settings in IndexedDB.
- Display transaction history with details.
- Allow viewing and reprinting previous receipts.
- Provide deletion and data export/import controls.
- Handle missing, corrupted, or incompatible local data gracefully.

F. PWA and Offline Support

- Installable on supported Android browsers.
- Include "manifest.json", service worker, and application icons.
- Cache the application shell and necessary assets.
- Make local forms, preview, settings, and history available offline after initial loading.
- Show a clear status when a feature requires browser support or an active connection.

Offline support must not be presented as automatic cloud synchronization.

4. Suggested Project Structure

trfbt-pwa/
├── index.html
├── manifest.json
├── sw.js
├── README.md
├── blueprint.md
├── assets/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── favicon.svg
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── receipt.js
│   ├── storage.js
│   ├── ocr.js
│   └── printer.js
└── vendor/
    └── ocr/

Adjust this structure when justified, but avoid unnecessary files, frameworks, and dependencies.

All paths must work correctly under a GitHub Pages repository URL, not just at the domain root.

5. Development Plan

Sprint 1 — Feasibility and Foundation

- Audit the XP-58IIZ Bluetooth protocol and available printing options.
- Build the mobile-first application shell.
- Implement the manual transaction form and live 58 mm receipt preview.
- Implement basic IndexedDB storage.
- Prepare PWA manifest, service worker, favicon, and icons.
- Test deployment using the actual GitHub Pages path.

Gate: Document the printing compatibility findings before committing to a direct Bluetooth implementation.

Sprint 2 — Printing

- Implement the appropriate printer adapter based on verified compatibility.
- Add connection status and test printing.
- Validate receipt width, character encoding, alignment, and paper output on the physical printer.
- If direct printing is impossible, document the Print Bridge alternative and its requirements.

Sprint 3 — OCR

- Add local screenshot OCR.
- Map extracted data into editable fields.
- Handle OCR failures and ambiguous values.
- Test with representative screenshots.

Sprint 4 — PWA and Data Reliability

- Complete offline caching.
- Test IndexedDB persistence, export/import, deletion, and recovery.
- Test application updates and cache invalidation.

Sprint 5 — QA and Deployment

- Test on Android and the actual target printer.
- Test installation, offline use, form validation, history, and printing errors.
- Verify all GitHub Pages paths.
- Update README with deployment instructions, limitations, and test results.

Sprint order may change if the printer feasibility audit reveals a blocker.

6. Engineering Principles

- Prefer simple, maintainable vanilla JavaScript.
- Prioritize speed, reliability, and Android usability.
- Avoid unnecessary dependencies and overengineering.
- Do not create fake buttons, simulated printer success, or unimplemented features presented as complete.
- Do not claim hardware compatibility without physical testing.
- Keep OCR, storage, receipt rendering, and printer integration modular.
- Request approval before changing the architecture or adding external services.
- Report actual test results and clearly distinguish verified behavior from assumptions.

7. Acceptance Criteria

The initial application is ready for release when:

1. It deploys and loads correctly through GitHub Pages.
2. Users can enter transactions manually and preview receipts.
3. Local history persists across page reloads.
4. The application can be installed on a supported Android device.
5. Core local features work offline after initial caching.
6. OCR results, when available, remain editable.
7. The printing path is verified on the target printer or its incompatibility is clearly documented with a realistic alternative.
8. No external backend or cloud database is required for the core application.
9. No feature is described as tested unless it has actually been tested.

8. First Priority

Start by verifying the XP-58IIZ printing compatibility and building the basic application.

Do not spend time completing OCR or advanced features before the printing approach is understood. If direct printing is not supported, stop and report the technical findings and available alternatives before proceeding.

The objective is a practical, lightweight PWA—not a complex platform.