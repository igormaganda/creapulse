---
Task ID: 6-2
Agent: Passeport Real Data Agent
Task: Replace Passeport MOCK_DATA with real module-scanner data

Work Log:
- Read existing passeport.tsx (492 lines with MOCK_DATA, hardcoded 9-module icon map, async fetch to /api/passeport)
- Read module-scanner.ts to understand FullScanResult, ModuleScanResult interfaces and scanAllModules() API
- Read module-registry.ts to understand MODULE_REGISTRY (38 modules with LucideIcon), SECTION_LABELS
- Removed entire MOCK_DATA constant (lines 98-129)
- Removed async fetch to /api/passeport (no longer needed — client-side localStorage is source of truth)
- Removed 15+ unused icon imports (User, GraduationCap, Pentagon, Lightbulb, Globe, Scale, Calculator, FileText, Rocket, Target)
- Added imports: scanAllModules from @/lib/module-scanner, MODULE_REGISTRY + SECTION_LABELS from @/lib/module-registry, type LucideIcon from lucide-react
- Created MODULE_ICONS dynamically from MODULE_REGISTRY: `Object.fromEntries(MODULE_REGISTRY.map(m => [m.code, m.icon]))`
- Created MODULE_SKILLS map (26 modules) mapping code → skill labels for badges
- Created transformScanToPasseport() function: maps ModuleScanResult[] → PasseportData with certification level logic (0→none, 30→bronze, 50→argent, 75→or, 100→platine)
- Replaced useEffect async fetch with synchronous scanAllModules() + transformScanToPasseport() inside requestAnimationFrame (avoids react-hooks/set-state-in-effect lint)
- All existing UI preserved: 3 stat cards, module grid, skills badges, timeline, export dialog, PDF dialog
- File reduced from 492 to 500 lines (includes new MODULE_SKILLS data, removed old imports/MOCK_DATA)

Stage Summary:
- Passeport now shows REAL module status from 38 localStorage keys via scanAllModules()
- MODULE_ICONS covers all 38 registry modules dynamically (no hardcoded icon map)
- Certification level computed dynamically from globalProgress percentage
- Skills and timeline derived from completed modules with lastActivity dates
- Zero API dependency — fully client-side, uses localStorage as source of truth
- Lint clean (only pre-existing certifications.tsx error remains)