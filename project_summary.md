# dental.ai — Complete Project Context & Documentation

> **Purpose of this document:** This file is intended to be read by any human or AI navigating this codebase for the first time. After reading it, you should be able to open the app, click through every screen, and understand exactly what is happening — what data is real, what is mocked, where AI is used, where PubMed is or isn't present, and what still needs to be built.

---

## Table of Contents

1. [What is dental.ai?](#1-what-is-dentalai)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Environment Variables & API Keys](#4-environment-variables--api-keys)
5. [How AI Works in This App (The Gemini Pipeline)](#5-how-ai-works-in-this-app-the-gemini-pipeline)
6. [Feature-by-Feature Breakdown](#6-feature-by-feature-breakdown)
   - [6.1 Clinical Pathway (Dashboard / `/workspace`)](#61-clinical-pathway-dashboard--workspace)
   - [6.2 Patient Cases (`/cases`)](#62-patient-cases-cases)
   - [6.3 Specialty AIs (`/specialty-ais`)](#63-specialty-ais-specialty-ais)
   - [6.4 X-ray Analysis (`/xray`)](#64-x-ray-analysis-xray)
   - [6.5 Drug Reference + Interaction Checker (`/drugs`)](#65-drug-reference--interaction-checker-drugs)
   - [6.6 Discover Dental / Evidence Search (`/discover`)](#66-discover-dental--evidence-search-discover)
   - [6.7 Referral Letter Builder (`/referral`)](#67-referral-letter-builder-referral)
   - [6.8 Treatment Plan Builder (`/treatment-plan`)](#68-treatment-plan-builder-treatment-plan)
   - [6.9 Medico-Legal Audit Trail (`/audit`)](#69-medico-legal-audit-trail-audit)
   - [6.10 Dental TV (`/dental-tv`)](#610-dental-tv-dental-tv)
   - [6.11 Peer Review (`/peer-review`)](#611-peer-review-peer-review)
7. [PubMed: Where It Is Used and Where It Isn't](#7-pubmed-where-it-is-used-and-where-it-isnt)
8. [Supabase: Where It Is Used and Where It Isn't](#8-supabase-where-it-is-used-and-where-it-isnt)
9. [What Data Is Real vs Mocked](#9-what-data-is-real-vs-mocked)
10. [Authentication & User State](#10-authentication--user-state)
11. [Possible Problems & Known Limitations](#11-possible-problems--known-limitations)
12. [Future Roadmap](#12-future-roadmap)

---

## 1. What is dental.ai?

**dental.ai** is a clinical AI platform designed specifically for dentists. It is a **doctor-first** tool — not a patient-facing app.

The core idea: a dentist sits down with a patient, types in the patient's complaint and basic details, and gets an AI-generated clinical pathway (triage → differential diagnoses → investigations → management plan → evidence references) in seconds. This mirrors how an experienced senior clinician thinks, but in a structured, auditable format.

Beyond the core clinical pathway, the platform also offers:
- Specialty-specific AI chatbots (one per dental specialty)
- AI-powered dental X-ray analysis (upload a radiograph, get a structured report)
- Drug reference + AI drug interaction checker
- Research article feed with AI critical appraisal
- Phased treatment plan builder
- Referral letter generator
- Medico-legal audit trail
- Video learning hub (Dental TV)
- Peer review (planned)

**Who uses it?** BDS / MDS dentists in India and globally. The UI is in English. Drug dosages are referenced in Indian brand names (e.g., Mox, Flagyl, Crocin). The referral letter generator outputs text formatted for Indian hospital outpatient departments.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend Framework** | React 19 (Vite) | Component-based SPA |
| **Routing** | React Router DOM v7 | Client-side routing |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **AI / LLM** | Google Gemini 1.5 Flash | via `@google/generative-ai` SDK |
| **Voice Input** | Web Speech API | Browser-native, Chrome only |
| **Image Upload** | `react-dropzone` | Drag-and-drop file handler |
| **Database (planned)** | Supabase (PostgreSQL) | Package installed, not yet wired to UI |
| **File Storage (planned)** | Cloudinary | Package not yet used |
| **Icons** | Lucide React | Consistent icon set |
| **Build Tool** | Vite 8 | Fast HMR dev server |
| **Package Manager** | npm | Standard |

**All costs at demo phase:** Zero. Gemini 1.5 Flash free tier is used. Supabase free tier is available. No backend server is deployed — everything runs in the browser.

---

## 3. Project Structure

```
dental-ai/
├── src/
│   ├── App.jsx                 # Route definitions (all 11 routes)
│   ├── main.jsx                # React root entry
│   ├── index.css               # Global styles + Tailwind tokens
│   ├── App.css                 # App-level CSS
│   ├── components/
│   │   ├── AppLayout.jsx       # Wraps every page: Sidebar + main area
│   │   └── Sidebar.jsx         # Left navigation sidebar
│   ├── lib/
│   │   ├── gemini.js           # ALL Gemini API calls + system prompts
│   │   └── data.js             # Static mock data + audit log helpers
│   └── pages/
│       ├── Dashboard.jsx       # Clinical Pathway (main feature)
│       ├── PatientCases.jsx    # Case list view
│       ├── SpecialtyAIs.jsx    # 8 specialty AI chatbots
│       ├── XrayAnalysis.jsx    # X-ray upload + AI analysis
│       ├── DrugReference.jsx   # Drug lookup + interaction checker
│       ├── DiscoverDental.jsx  # Research article feed + AI review
│       ├── ReferralBuilder.jsx # Referral letter generator
│       ├── TreatmentPlan.jsx   # Phased treatment plan builder
│       ├── AuditTrail.jsx      # Medico-legal log viewer
│       ├── DentalTV.jsx        # Video learning hub
│       └── PeerReview.jsx      # Peer review placeholder
├── .env                        # API keys (not committed to git)
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
└── project_summary.md          # This file
```

---

## 4. Environment Variables & API Keys

All secrets live in the `.env` file at the project root. **This file is gitignored** — it is never pushed to GitHub. Anyone cloning the repo must create their own `.env`:

```env
VITE_GEMINI_API_KEY=your_key_here         # Required for all AI features
VITE_SUPABASE_URL=your_url_here           # Not yet wired — future use
VITE_SUPABASE_ANON_KEY=your_key_here      # Not yet wired — future use
VITE_CLOUDINARY_CLOUD_NAME=your_name      # Not yet used
VITE_CLOUDINARY_UPLOAD_PRESET=...         # Not yet used
VITE_YOUTUBE_API_KEY=your_key_here        # Optional — mock data used if absent
```

### Where to get keys (all free tier):
- **Gemini:** https://aistudio.google.com/ → "Get API key"
- **Supabase:** https://supabase.com/ → Create project → Settings → API
- **Cloudinary:** https://cloudinary.com/ → Dashboard → Cloud name
- **YouTube Data API v3:** https://console.cloud.google.com/ → Enable YouTube Data API v3

### What breaks without the Gemini key?
Every AI feature shows a warning banner and returns an error. The app still navigates and shows static/mock content — it gracefully degrades. Non-AI features (Drug Reference page in reference tab, article list, video list, patient cases list) work without any API key.

---

## 5. How AI Works in This App (The Gemini Pipeline)

All AI logic lives in one file: `src/lib/gemini.js`.

The app uses **Google Gemini 1.5 Flash** — a fast, multimodal, free-tier model. Every API call uses `temperature: 0.1–0.4` (low creativity, high factual accuracy).

### The 4-Agent Clinical Pathway Pipeline

This is the most complex and important feature. When a dentist submits a case, **4 sequential AI agents** run:

```
Patient Input → [Agent 1: Triage] → [Agent 2: Differentials] → [Agent 3: Evidence] → [Agent 4: Pathway Builder] → Structured Output
```

Each agent is a separate Gemini API call with a distinct system prompt:

| Agent | What It Does | Output Format |
|---|---|---|
| **Triage Agent** | Assigns EMERGENCY / URGENT / ROUTINE severity. Checks for red flags like Ludwig's angina, airway compromise, avulsion | JSON: `{ severity, redFlags, triageReason, referralRequired }` |
| **Differential Agent** | Generates 3–6 ranked differential diagnoses with ICD-10 codes and key features | JSON: `{ differentials: [...] }` |
| **Evidence Agent** | Retrieves 2–4 evidence-based references (guidelines, RCTs, Cochrane reviews) relevant to the differentials | JSON: `{ sources: [...] }` |
| **Pathway Builder** | Takes all 3 outputs and assembles the final management protocol (investigations → management phases → referral advice → follow-up) | JSON: `{ investigations, management, referral, followUp, disclaimer }` |

**Emergency bypass:** If the Triage Agent flags EMERGENCY, the pipeline short-circuits. Agents 2, 3, 4 are skipped and the doctor is immediately shown referral instructions. This is intentional — in a real emergency, you don't need differential diagnoses, you need to act.

### Other AI Functions in gemini.js

| Function | Trigger | What It Does |
|---|---|---|
| `specialtyChat()` | Specialty AIs page → select specialty → type message | Multi-turn chat with a specialty-specific system prompt (e.g., Endo.ai is primed on RCT protocols, rotary file systems, irrigant protocols) |
| `followUpChat()` | Clinical Pathway → chat input after pathway is generated | Follow-up Q&A with the clinical pathway as context |
| `analyzeXray()` | X-ray Analysis → upload image → Analyse button | Multimodal call — sends image + text prompt to Gemini Vision. Returns structured findings with confidence scores |
| `checkDrugInteractions()` | Drug Reference → Interaction Checker tab | Takes existing meds + planned dental prescription, returns interaction severity, mechanism, recommendation |
| `generateReferralLetter()` | Referral Builder → Generate Letter button | Generates a formal referral letter in Indian hospital letter format |
| `buildTreatmentPlan()` | Treatment Plan Builder | Generates a phased treatment plan (Emergency → Perio → Restorative → Maintenance) with patient-friendly version |

---

## 6. Feature-by-Feature Breakdown

### 6.1 Clinical Pathway (Dashboard / `/workspace`)

**What it is:** The main clinical decision support tool. The homepage of the app.

**In plain terms:** A dentist types a patient's complaint (e.g., "34-year-old male, severe upper left toothache radiating to ear, started 2 days ago, no relief with painkillers"). They can also add the patient's medical history and any clinical findings they've already noted. They click "Generate Clinical Pathway" and within ~10–15 seconds, the app shows them:

1. **Red Flags Detected** — Are there any emergency warning signs? (e.g., swelling tracking down the neck, fever, airway involvement)
2. **Differential Diagnoses** — Most likely to least likely diagnoses, ranked, with ICD-10 codes and key distinguishing features
3. **Investigations** — Which tests to do (e.g., "IOPA of UL6 — Essential", "Sensibility testing — Recommended")
4. **Management Protocol** — Split into Immediate / Short-term / Long-term phases
5. **Evidence Sources** — Research papers and guidelines that support the recommendations
6. **Referral advice** — Which specialist to refer to if needed, and with what urgency

After the pathway is shown, the dentist can:
- **Accept / Modify / Reject** the pathway (logged to audit trail)
- **Ask follow-up questions** in the chat panel below (voice or text input)

**Right panel** shows: evidence sources, recent cases list, and quick actions (generate referral, add procedure note, flag for peer review).

**AI used:** Yes — all 4 agents. `runClinicalPathway()` in gemini.js.

**PubMed used:** No direct API call to PubMed. The Evidence Agent generates references using Gemini's training data — it outputs journal names, paper titles, years, and evidence levels. These references are plausible and clinically relevant but are **not live-fetched from PubMed**. See Section 7 for how PubMed could be integrated.

**Voice input:** Yes — Web Speech API (Chrome only). Language set to `en-IN` (Indian English). The microphone icon in the follow-up chat bar activates it.

**State persistence:** None. Refreshing the page loses the current case. Cases are not saved to a database in the current build.

---

### 6.2 Patient Cases (`/cases`)

**What it is:** A case list / case management view.

**In plain terms:** Shows a list of all patient cases the doctor has handled, with filters by severity (EMERGENCY / URGENT / ROUTINE) and status (active / completed / review). You can search by patient name or complaint.

**AI used:** No — this page is pure UI. It just displays data.

**Data:** Entirely mocked. The 5 patients shown (Rahul Mehta, Sunita Patel, etc.) are hardcoded in `src/lib/data.js`. In a production build, this would query a Supabase `cases` table.

**"New Case" button:** Present but currently just a placeholder — clicking it doesn't open a form. The actual case creation happens on the Dashboard.

**PubMed used:** No.

---

### 6.3 Specialty AIs (`/specialty-ais`)

**What it is:** Eight named AI specialists you can have a live conversation with.

**In plain terms:** Think of it like having 8 senior consultants on call. Each is an AI "persona" deeply primed on its specialty's protocols, evidence base, and clinical reasoning style. You pick one, type a clinical question (or tap a quick-prompt chip), and get a structured response.

The 8 specialties:

| Specialist | What It Knows |
|---|---|
| **Endo.ai** | Root canal protocols, rotary file systems (WaveOne, ProTaper), irrigant protocols (NaOCl, EDTA), obturation techniques, retreatment, Vertucci canal classification |
| **Perio.ai** | 2017 AAP/EFP staging/grading system, SRP protocols, bone graft materials, GTR membranes, peri-implantitis, surgical periodontics |
| **Implant.ai** | Implant placement, bone augmentation (GBR, block grafting, sinus lift), soft tissue management, loading protocols, implant failure management |
| **OralSurg.ai** | Surgical extractions, Winter's/Pell & Gregory impaction classification, facial space infections, Ludwig's angina, orthognathic surgery principles |
| **OrthoD.ai** | Cephalometric analysis (ANB, Wits, SNA, SNB, IMPA), appliance selection, fixed vs aligner therapy, Class II/III treatment, retention |
| **Pedo.ai** | Behaviour management, pulpotomy/pulpectomy in primary teeth, stainless steel crowns, space maintainers, fluoride dosing, trauma management in children |
| **Prostho.ai** | Crown and bridge, material selection (zirconia vs lithium disilicate vs PFM), RPD design, complete dentures, occlusal concepts, digital workflow |
| **OralMed.ai** | Mucosal lesions, potentially malignant disorders (leukoplakia, OSMF), Sjögren's, oral manifestations of systemic disease, TMJ disorders, orofacial pain |

**Quick-prompt chips:** Each specialty has 5 pre-written clinical questions shown as clickable chips at the top of the chat. These are defined in `src/lib/data.js` under `SPECIALTY_QUICK_PROMPTS`.

**Chat history:** Maintained per specialty during a session. Switching between specialties keeps each conversation separate. History resets on page refresh (not persisted).

**Voice input:** Yes — same Web Speech API as the dashboard.

**AI used:** Yes — `specialtyChat()` in gemini.js. System prompts are stored in `SPECIALTY_PROMPTS` object in gemini.js.

**PubMed used:** No direct integration. The AIs cite evidence from training data.

---

### 6.4 X-ray Analysis (`/xray`)

**What it is:** Upload a dental radiograph, get a structured AI analysis report.

**In plain terms:** A dentist drags and drops (or clicks to select) a dental X-ray image — IOPA (intraoral periapical), OPG (orthopantomogram), or CBCT screenshot. The AI reads the image and produces:
- What type of image it is (IOPA / OPG / CBCT)
- Quality assessment (Diagnostic / Suboptimal / Non-diagnostic)
- A list of **findings** — each with a name, location on the tooth/arch, description, confidence percentage, and severity (high/moderate/low)
- A plain English interpretation paragraph for the dentist
- Recommended next steps
- Urgency level (Immediate / Within 1 week / Routine)

You can click on any individual finding in the list to expand its detailed description.

**Image viewer controls:** Zoom (50%–300%), Brightness slider, Contrast slider — all applied live to the displayed image using CSS filters. This simulates the kind of basic radiology viewing controls dentists are used to from IOPA periapical software.

**AI used:** Yes — `analyzeXray()` in gemini.js. This is a **multimodal** call — the image is sent as base64 inline data alongside the text prompt. Gemini 1.5 Flash supports vision.

**Accepts:** JPEG, PNG (and nominally DICOM but DICOM rendering in browser requires additional parsing libraries not yet included — `.dcm` files likely won't display properly in the `<img>` tag).

**PubMed used:** No.

**Limitation:** Gemini is not a certified medical device. The AI report carries a mandatory disclaimer: "Radiographic interpretation only. Correlate with clinical findings." This is honest — the findings are directionally useful but cannot replace a qualified radiologist's report.

---

### 6.5 Drug Reference + Interaction Checker (`/drugs`)

**What it is:** Two tools in one: a drug lookup encyclopedia and an AI drug interaction checker.

#### Drug Reference Tab
**In plain terms:** A searchable database of common dental drugs with full prescribing information tailored for India. You can search by generic name, brand name, or drug class.

Currently includes 6 drugs:
- Amoxicillin
- Metronidazole
- Ibuprofen
- Paracetamol (Acetaminophen)
- Lignocaine (Lidocaine)
- Dexamethasone

For each drug, you see:
- Mechanism of action
- Common dental use
- Adult dental dose
- Paediatric dose
- Renal dose adjustment
- Hepatic dose adjustment
- Contraindications
- Side effects
- Indian brand names (e.g., Mox, Flagyl, Crocin, Xylocaine, Dexona)

**AI used:** No — this tab is entirely static data from `src/lib/data.js` under `DENTAL_DRUGS`.

**PubMed used:** No.

#### Interaction Checker Tab
**In plain terms:** The dentist types a patient's current medications (e.g., "Warfarin 5mg OD, Metformin 500mg BD") and what they plan to prescribe (e.g., "Ibuprofen 400mg TDS, Amoxicillin 500mg TDS"). The AI checks for interactions and returns:
- Each interaction pair, with severity (Major / Moderate / Minor)
- Mechanism of the interaction
- Clinical effect on the patient
- Recommendation: avoid / monitor / dose-adjust / alternative suggested
- Specific alternative drug if relevant
- An overall "safe to administer" verdict

**AI used:** Yes — `checkDrugInteractions()` in gemini.js.

**PubMed used:** No — interactions are from Gemini's training data (pharmacology knowledge). For a production medical device, this would need to integrate with a validated drug database like Drugs.com API, Micromedex, or BNF.

---

### 6.6 Discover Dental / Evidence Search (`/discover`)

**What it is:** A curated research article feed with AI critical appraisal, trending topics, and upcoming conferences.

**In plain terms:** Imagine a simplified Feedly or PubMed filtered specifically for dentists. The dentist sees a list of recent dental research articles, guidelines, material reviews, technique papers, and case reports. They can filter by type and search by title/tag.

On each article card there is an **"AI Review" button** that triggers a critical appraisal. This pops the article title and DOI into the right-side panel and runs an AI structured review covering:
- Study design and evidence level
- Sample size and population
- Key findings
- Limitations
- Clinical relevance (one or two sentences on how this changes practice)

The right panel also has:
- **Trending topics** (hardcoded mock data — e.g., "AI in dental imaging +34%")
- **Upcoming conferences** (hardcoded mock data — IDA Annual Convention, EAO, AOMSI)

**AI used:** Yes — for the Article Review only. It uses `GoogleGenerativeAI` directly (not through `gemini.js`) — the model is called inline in `DiscoverDental.jsx`.

**Data:** The 6 articles shown are mocked in `src/lib/data.js` under `MOCK_ARTICLES`. Each article has a real-looking DOI that links to `doi.org`. These are plausible real papers with actual DOIs, so the links may or may not resolve.

**PubMed used:** No direct PubMed API integration. See Section 7 for where PubMed could be plugged in.

---

### 6.7 Referral Letter Builder (`/referral`)

**What it is:** An AI-powered referral letter generator in Indian hospital OPD format.

**In plain terms:** A dentist fills in a form with patient details (name, age, sex), which specialist they're referring to (dropdown of 10 specialties), and clinical details (complaint, findings, diagnosis, investigations done, reason for referral, requested management). They click "Generate Letter" and within seconds get a fully formatted formal referral letter — the kind you'd hand to a patient to take to a hospital OPD.

After generation:
- Can **edit** the letter directly in a textarea (Edit mode)
- Can **Print / Save PDF** (opens a print dialog via browser's print API with proper serif font formatting)
- The letter subject line is shown in a highlighted banner

The form pre-fills the referring doctor's name, clinic, qualification, and registration number from the `DUMMY_USER` object in `data.js`.

**AI used:** Yes — `generateReferralLetter()` in gemini.js. The prompt specifies "formal letter suitable for Indian hospital outpatient departments."

**PubMed used:** No.

---

### 6.8 Treatment Plan Builder (`/treatment-plan`)

**What it is:** AI-generated phased treatment plan for complex dental cases.

**In plain terms:** This is for when a patient has multiple dental problems that need to be treated in a specific order. For example, a patient with periodontitis, multiple caries, a missing tooth, and a broken crown — you can't just do everything at once. You need to:
1. First: pain relief / emergencies
2. Second: periodontal treatment (you can't restore a tooth with bad gums)
3. Third: restorative work
4. Fourth: prosthetics / implants
5. Fifth: long-term maintenance

The dentist fills in the patient's complaints, confirmed diagnoses, medical history, and urgency level. The AI generates a phased plan with:
- Phase name and rationale (why this phase comes before the next)
- Number of visits per phase
- Specific procedures within each phase, each tagged as Critical / High / Standard priority
- Total estimated visit count
- Maintenance protocol

There are two views:
- **Clinical View:** The structured phased plan used by the dentist
- **Patient View:** Plain English version — "What we're going to do and why" — designed to be printed and given to the patient or used for patient education

A **Cost Estimate Template** is included — a table where the dentist can type in their fees for each phase. The total is a manually-entered field. This is a UI scaffold, not auto-calculated.

**AI used:** Yes — `buildTreatmentPlan()` in gemini.js.

**PubMed used:** No.

---

### 6.9 Medico-Legal Audit Trail (`/audit`)

**What it is:** A tamper-evident log of every AI interaction and doctor decision.

**In plain terms:** Every time a clinical pathway is generated on the Dashboard, the app automatically creates an audit entry. This records:
- Timestamp (exact date and time)
- Case ID
- Severity level (EMERGENCY / URGENT / ROUTINE)
- Which AI model was used (`gemini-1.5-flash`)
- What the doctor decided to do (accepted / modified / rejected the AI recommendation, or pending)
- Brief summary of the case

When the doctor clicks "Accepted pathway," "Modified," or "Rejected" on the Dashboard, an additional audit entry is created recording that action. This creates a documented trail of: "AI suggested X. Doctor reviewed it. Doctor did Y."

Filters allow viewing by severity, by doctor action, or all entries.

The **Export JSON** button downloads the full log as a JSON file (named with today's date).

**Storage:** Currently uses browser `localStorage`. This means the log **disappears if the user clears browser data or uses a different browser**. In a production system, this would write to a Supabase database with row-level security.

**The "write-once" claim:** The UI shows this as non-editable, but because it's just localStorage, technically anyone with browser dev tools can clear it. True tamper-evidence requires a backend database with append-only policies.

**AI used:** No — this page just reads from localStorage.

**PubMed used:** No.

---

### 6.10 Dental TV (`/dental-tv`)

**What it is:** A curated video library for dental continuing education.

**In plain terms:** A Netflix-style grid of dental education videos from channels like Dentsply Sirona Academy, ITI, PerioMastery, and Dental Explained. The dentist can filter by specialty and search by title or channel. Clicking a video opens a side panel with the video details and a "Watch on YouTube ↗" link.

**The videos don't actually play embedded** — they open on YouTube in a new tab. The thumbnails are colour-coded gradient placeholders (not real YouTube thumbnails) because the YouTube Data API v3 key is optional and likely not set.

**AI used:** No.

**Data:** All 8 videos are mocked in `src/lib/data.js` under `MOCK_VIDEOS`. The `youtubeId` values are placeholder IDs and won't resolve to real dental content. In a production build, YouTube Data API v3 would be queried with dental-specific search terms.

**PubMed used:** No.

---

### 6.11 Peer Review (`/peer-review`)

**What it is:** A planned feature for anonymous case sharing between DCI-verified dentists.

**In plain terms:** This is a placeholder. The page shows a lock icon with a "DCI Verification Required" message and lists the planned features:
- Automated patient de-identification
- Structured second opinion format  
- Specialty-tagged case sharing
- Verified dentist-only access

**Nothing is built yet.** The "Request Access" button does nothing. This page was created as a UI scaffold / wireframe to communicate the vision.

**AI used:** No.

**PubMed used:** No.

---

## 7. PubMed: Where It Is Used and Where It Isn't

### Current Status: PubMed is NOT integrated anywhere in this codebase.

No direct calls are made to the NCBI PubMed API (https://api.ncbi.nlm.nih.gov/lit/ctxp or https://eutils.ncbi.nlm.nih.gov/) anywhere in the codebase.

### Where references seem to come from PubMed:

The Clinical Pathway's **Evidence Agent** (Agent 3 in the pipeline) generates evidence references. The UI labels these as "PubMed & guideline retrieval" in the agent progress panel. However, this label is aspirational — the actual mechanism is Gemini generating plausible-looking citations from its training data. These are NOT fetched from PubMed in real-time.

Similarly, the **Discover Dental** article list shows articles with real-looking DOIs. These are hardcoded mock data, not live PubMed fetches.

### Where PubMed COULD be integrated:

1. **Evidence Agent (Most Impactful):** Replace Agent 3's Gemini call with:
   ```
   Step 1: Ask Gemini "What are the 3 best search terms for PubMed given these differentials?"
   Step 2: Call PubMed NCBI E-utilities API (esearch → efetch) with those terms
   Step 3: Parse abstracts and pass them to Gemini to summarise clinical relevance
   ```
   This would make the evidence citations **verifiable and live**.

2. **Discover Dental Feed:** Replace the 6 hardcoded `MOCK_ARTICLES` with a live PubMed feed filtered to dental specialties. NCBI provides free API access with up to 10 requests/second without a key, or more with an API key.

3. **Specialty AIs:** PubMed could be searched when a Specialty AI is asked an evidence question, to append live abstracts to the context.

### How to add PubMed (concrete example for Evidence Agent):

```javascript
// In gemini.js — replace callGemini(EVIDENCE_PROMPT, ...) with:
async function fetchPubMedEvidence(differentials) {
  const searchTerms = differentials.slice(0, 2).map(d => d.diagnosis).join(' OR ')
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchTerms + ' dentistry')}&retmax=5&retmode=json`
  const searchRes = await fetch(searchUrl)
  const { esearchresult } = await searchRes.json()
  const ids = esearchresult.idlist
  // Then efetch to get abstracts, parse, pass to Gemini for clinical summary
}
```

---

## 8. Supabase: Where It Is Used and Where It Isn't

### Current Status: Supabase is NOT wired to any UI.

The `@supabase/supabase-js` package is installed in `package.json` and the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are defined in `.env`. However, no `createClient()` call exists anywhere in the codebase. Supabase is completely un-implemented.

### Where Supabase SHOULD be connected:

1. **Audit Trail** — Currently uses localStorage. Should write to a Supabase `audit_logs` table.
2. **Patient Cases** — Currently mocked. Should read from a Supabase `cases` table.
3. **User Authentication** — Currently uses a hardcoded `DUMMY_USER` object. Supabase Auth (email/password or magic link) would replace this.
4. **Chat History** — Currently lost on page refresh. Supabase would persist conversation history per doctor.
5. **Saved Pathways** — Currently not saved anywhere. Supabase would allow saving and retrieving past clinical pathways.

---

## 9. What Data Is Real vs Mocked

| Data | Status | File |
|---|---|---|
| Patient names (Rahul Mehta, etc.) | **Mocked — fictitious** | `src/lib/data.js` → `MOCK_CASES` |
| Drug information (Amoxicillin, etc.) | **Real clinical data** — accurate doses/contraindications | `src/lib/data.js` → `DENTAL_DRUGS` |
| Research articles (6 articles) | **Plausible mock** — real-looking titles and DOIs, not live-fetched | `src/lib/data.js` → `MOCK_ARTICLES` |
| Educational videos (8 videos) | **Mocked** — placeholder YouTube IDs, not real dental videos | `src/lib/data.js` → `MOCK_VIDEOS` |
| Trending topics (Discover page) | **Hardcoded mock** — not from any real trending API | `src/pages/DiscoverDental.jsx` |
| Conferences | **Hardcoded mock** — real conference names but dates/locations may be outdated | `src/pages/DiscoverDental.jsx` |
| Logged-in user (Dr. Priya Sharma) | **Dummy user** — hardcoded | `src/lib/data.js` → `DUMMY_USER` |
| AI clinical pathway output | **Real Gemini output** — live when API key is set | Runtime |
| AI evidence references | **Gemini-generated** — plausible but not verified | Runtime |
| Audit trail entries | **Real** — generated from actual UI interactions, stored in localStorage | localStorage |

---

## 10. Authentication & User State

**Currently: No authentication.** The app loads directly to the dashboard. There is no login screen, no session management, no JWT tokens.

The "logged-in user" is `DUMMY_USER` in `src/lib/data.js`:
```javascript
export const DUMMY_USER = {
  id: 'dr-001',
  name: 'Dr. Priya Sharma',
  initials: 'PS',
  specialty: 'Conservative Dentistry & Endodontics',
  qualification: 'BDS, MDS (Conservative Dentistry)',
  registrationNumber: 'MH-DCI-24891',
  clinic: 'Sharma Dental Clinic, Mumbai',
  plan: 'pro',
  casesThisWeek: 23,
  pathwaysGenerated: 147,
}
```

This object is referenced in:
- `Sidebar.jsx` — shows name and initials in the bottom left corner
- `ReferralBuilder.jsx` — pre-fills the "Referring Doctor" fields in the referral letter form

To add authentication: Supabase Auth is already installed. Wrap the router with a session check, redirect unauthenticated users to a `/login` page.

---

## 11. Possible Problems & Known Limitations

### 🔴 Critical

1. **API key exposed to browser** — `VITE_GEMINI_API_KEY` is a Vite env var, which means it is embedded in the compiled JavaScript bundle and visible to anyone who inspects the page source. **In production, the Gemini API should be called from a server-side backend (e.g., a Node.js API route or Supabase Edge Function), not directly from the browser.**

2. **No authentication** — Any person with the URL can access the app. Medical data should be behind login.

3. **Audit trail in localStorage** — Medically/legally, this is not tamper-evident or reliable. Must migrate to Supabase.

4. **Evidence references are AI-hallucinated** — The Evidence Agent generates plausible-sounding citations that may not exist or may have incorrect details. These should **never** be used in a clinical or academic context as-is.

### 🟡 Moderate

5. **DICOM support is incomplete** — The X-ray upload accepts `.dcm` MIME type but cannot actually render DICOM files. A browser DICOM renderer library (e.g., cornerstone.js) would be needed.

6. **Voice input (Web Speech API) is Chrome-only** — Doesn't work in Firefox, Safari, or mobile browsers that don't support the SpeechRecognition API.

7. **No patient data persistence** — Cases, pathways, and chat history are all lost on page refresh. This makes the app a demo, not a clinical tool.

8. **YouTube videos are placeholder** — The `youtubeId` values in mock data are all `dQw4w9WgXcQ` (the Rickroll ID). Clicking "Watch on YouTube" opens the wrong video. Real content would need a curated list of actual dental education YouTube IDs or a YouTube Data API query.

9. **Drug database is very small** — Only 6 drugs are included. A production dental drug reference should include 50+ common drugs including local anaesthetics (articaine, prilocaine), antibiotics (azithromycin, clindamycin), antifungals, antiseptics, haemostatic agents, etc.

10. **No rate limiting or cost controls** — A single user could generate hundreds of Gemini API calls in a short time, exhausting the free tier quota or racking up costs on a paid tier.

### 🟢 Minor / Cosmetic

11. **"New Case" button in Patient Cases** — Present in the UI but non-functional (no navigation to a case creation form).

12. **Peer Review page is a placeholder** — The page exists but nothing is implemented. The "Request Access" button does nothing.

13. **"Evidence Search" and "Protocol Library" in sidebar** — Both point to the same `/discover` route. Protocol Library does not have its own page.

14. **Today's Schedule and Urgent Cases** — Both point to `/cases`. They don't have dedicated filtered views.

15. **PDF export** — The referral letter uses the browser print dialog. A proper PDF export would use a library like jsPDF or Puppeteer on a server.

---

## 12. Future Roadmap

### Phase 2 (Backend & Auth)
- [ ] Add Supabase authentication (email/password or magic link)
- [ ] Migrate audit trail to Supabase `audit_logs` table
- [ ] Persist cases to Supabase `cases` table
- [ ] Move Gemini API calls to Supabase Edge Functions (removes browser-side key exposure)
- [ ] Add user profile page with DCI registration number field

### Phase 3 (Real Data)
- [ ] Integrate PubMed E-utilities API for live evidence retrieval in Clinical Pathway
- [ ] Replace mock articles in Discover Dental with live PubMed feed
- [ ] Add YouTube Data API v3 for real dental education video search
- [ ] Expand drug database to 50+ drugs
- [ ] Add Cloudinary for X-ray image storage (currently images are not saved, only base64 passed to Gemini)

### Phase 4 (Clinical Features)
- [ ] Implement Peer Review feed with patient de-identification
- [ ] Add DICOM rendering support (cornerstone.js)
- [ ] Add shareable case links for referral workflows
- [ ] Add Today's Schedule view integrated with a booking system
- [ ] Add prescription pad / prescription export
- [ ] Add photo documentation (clinical photos, before/after)

### Phase 5 (Compliance)
- [ ] HIPAA / DISHA-compliant data handling
- [ ] Row-level security in Supabase
- [ ] Formal clinical validation of AI outputs
- [ ] MDR (Medical Device Regulation) review if deployed as a standalone diagnostic tool

---

*Last updated: April 2026*
*Maintained by: Ananya VJ (GitHub: @ananyavj)*
*Repository: https://github.com/ananyavj/dental.ai*
