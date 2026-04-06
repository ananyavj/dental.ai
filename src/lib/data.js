// Dummy user for Phase 1 (no auth)
export const DUMMY_USER = {
  id: 'dr-001',
  name: 'Dr. Priya Sharma',
  initials: 'PS',
  specialty: 'Conservative Dentistry & Endodontics',
  qualification: 'BDS, MDS (Conservative Dentistry)',
  registrationNumber: 'MH-DCI-24891',
  clinic: 'Sharma Dental Clinic, Mumbai',
  plan: 'pro', // 'free' | 'pro'
  casesThisWeek: 23,
  pathwaysGenerated: 147,
}

// Mock patient cases
export const MOCK_CASES = [
  {
    id: 'case-001',
    patientName: 'Rahul Mehta',
    age: 34,
    sex: 'Male',
    chiefComplaint: 'Severe toothache upper left, pain radiating to ear',
    severity: 'URGENT',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'active'
  },
  {
    id: 'case-002',
    patientName: 'Sunita Patel',
    age: 52,
    sex: 'Female',
    chiefComplaint: 'Loose teeth, bleeding gums, halitosis',
    severity: 'ROUTINE',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'completed'
  },
  {
    id: 'case-003',
    patientName: 'Arjun Nair',
    age: 19,
    sex: 'Male',
    chiefComplaint: 'Swelling lower jaw, difficulty opening mouth, fever',
    severity: 'URGENT',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: 'active'
  },
  {
    id: 'case-004',
    patientName: 'Meera Joshi',
    age: 45,
    sex: 'Female',
    chiefComplaint: 'White patch on inner cheek, persistent for 3 months',
    severity: 'URGENT',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'review'
  },
  {
    id: 'case-005',
    patientName: 'Vikram Singh',
    age: 28,
    sex: 'Male',
    chiefComplaint: 'Sensitivity to cold, broken tooth',
    severity: 'ROUTINE',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'completed'
  },
]

// Mock dental drugs database
export const DENTAL_DRUGS = [
  {
    id: 'amoxicillin',
    genericName: 'Amoxicillin',
    brandNames: ['Mox', 'Novamox', 'Amoxil', 'Trimox'],
    class: 'Aminopenicillin antibiotic',
    mechanism: 'Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins',
    dentalDose: '500 mg TDS for 5–7 days',
    paediatricDose: '25–50 mg/kg/day in 3 divided doses',
    renalAdjustment: 'Reduce dose if CrCl < 30 mL/min',
    hepaticAdjustment: 'Use with caution in severe hepatic impairment',
    contraindications: ['Penicillin allergy', 'Infectious mononucleosis'],
    sideEffects: ['Nausea', 'Diarrhoea', 'Skin rash', 'Urticaria', 'Pseudomembranous colitis'],
    commonDentalUse: 'Dental infections, prophylaxis for infective endocarditis',
  },
  {
    id: 'metronidazole',
    genericName: 'Metronidazole',
    brandNames: ['Flagyl', 'Metrogyl', 'Aldezole'],
    class: 'Nitroimidazole antibiotic / antiprotozoal',
    mechanism: 'Disrupts DNA synthesis in anaerobic organisms',
    dentalDose: '400 mg TDS for 5–7 days (often combined with amoxicillin)',
    paediatricDose: '7.5 mg/kg TDS',
    renalAdjustment: 'No dose adjustment for mild–moderate impairment',
    hepaticAdjustment: 'Reduce dose in severe hepatic impairment',
    contraindications: ['First trimester of pregnancy', 'Disulfiram use', 'Alcohol consumption'],
    sideEffects: ['Metallic taste', 'Nausea', 'Peripheral neuropathy (long-term)', 'Disulfiram-like reaction with alcohol'],
    commonDentalUse: 'Anaerobic dental infections, ANUG, periodontal infections',
  },
  {
    id: 'ibuprofen',
    genericName: 'Ibuprofen',
    brandNames: ['Brufen', 'Combiflam', 'Advil', 'Nurofen'],
    class: 'NSAID (non-selective COX inhibitor)',
    mechanism: 'Inhibits COX-1 and COX-2 enzymes, reducing prostaglandin synthesis',
    dentalDose: '400–600 mg TDS with food for 3–5 days',
    paediatricDose: '5–10 mg/kg every 6–8 hours (max 40 mg/kg/day)',
    renalAdjustment: 'Avoid in CrCl < 30 mL/min',
    hepaticAdjustment: 'Avoid in severe hepatic impairment',
    contraindications: ['Active peptic ulcer', 'GI bleeding', 'Severe renal impairment', 'Aspirin-sensitive asthma', 'Last trimester pregnancy'],
    sideEffects: ['GI upset', 'Peptic ulcer', 'Renal impairment', 'Increased bleeding risk', 'Fluid retention'],
    commonDentalUse: 'Post-operative pain and swelling, dental pain',
  },
  {
    id: 'paracetamol',
    genericName: 'Paracetamol (Acetaminophen)',
    brandNames: ['Crocin', 'Dolo', 'Calpol', 'Tylenol'],
    class: 'Analgesic / Antipyretic',
    mechanism: 'Central COX inhibition, serotonergic pathways',
    dentalDose: '500–1000 mg QDS (max 4g/day)',
    paediatricDose: '15 mg/kg every 4–6 hours (max 75 mg/kg/day)',
    renalAdjustment: 'Increase dosing interval in severe renal impairment',
    hepaticAdjustment: 'Max 2g/day in hepatic impairment; avoid in severe disease',
    contraindications: ['Hypersensitivity', 'Severe hepatic impairment'],
    sideEffects: ['Hepatotoxicity in overdose', 'Rarely: rash, blood dyscrasia'],
    commonDentalUse: 'Mild to moderate dental pain, post-operative analgesia',
  },
  {
    id: 'lignocaine',
    genericName: 'Lignocaine (Lidocaine)',
    brandNames: ['Xylocaine', 'Xicaine', 'Lignospan'],
    class: 'Amide-type local anaesthetic',
    mechanism: 'Blocks voltage-gated sodium channels, preventing action potential propagation',
    dentalDose: '2% with 1:80,000 or 1:200,000 adrenaline. Max 4.4 mg/kg (300 mg for 70kg adult)',
    paediatricDose: '4.4 mg/kg (without adrenaline: 2.2 mg/kg)',
    renalAdjustment: 'No significant adjustment required',
    hepaticAdjustment: 'Reduce dose in severe hepatic impairment (reduced metabolism)',
    contraindications: ['Allergy to amide local anaesthetics', 'Severe bradycardia', 'Heart block (for IV use)'],
    sideEffects: ['CNS toxicity in overdose', 'Cardiovascular toxicity', 'Allergy (rare)', 'Methaemoglobinaemia (rare)'],
    commonDentalUse: 'Inferior alveolar nerve block, infiltration, periodontal ligament injection',
  },
  {
    id: 'dexamethasone',
    genericName: 'Dexamethasone',
    brandNames: ['Dexona', 'Decadron', 'Hexadrol'],
    class: 'Corticosteroid (glucocorticoid)',
    mechanism: 'Binds glucocorticoid receptors, inhibits inflammatory mediators',
    dentalDose: '4–8 mg IM/IV pre-operatively; 0.5–1 mg oral for ulcer management',
    paediatricDose: '0.08–0.3 mg/kg per dose',
    renalAdjustment: 'No significant adjustment',
    hepaticAdjustment: 'Use with caution in hepatic impairment',
    contraindications: ['Systemic infections without antibiotic cover', 'Hypersensitivity'],
    sideEffects: ['Hyperglycaemia', 'Immunosuppression', 'Adrenal suppression (prolonged use)', 'GI ulceration', 'Delayed wound healing'],
    commonDentalUse: 'Post-surgical swelling after extractions/implants, oral ulcer management, anaphylaxis',
  },
]

// Mock Discover Dental articles
export const MOCK_ARTICLES = [
  {
    id: 'art-001',
    type: 'Research',
    title: 'Efficacy of Single-Visit vs Multi-Visit Root Canal Treatment: A Systematic Review and Meta-Analysis',
    journal: 'Journal of Endodontics',
    date: 'March 2024',
    summary: 'Single-visit RCT shows comparable outcomes to multi-visit in vital pulp cases with no pre-operative periapical pathology. Post-operative pain levels are similar.',
    tags: ['Endodontics', 'RCT', 'Evidence-based'],
    aiReview: null,
    doi: '10.1016/j.joen.2024.01.012',
  },
  {
    id: 'art-002',
    type: 'Guidelines',
    title: '2024 AAP/EFP Position Paper on Peri-implant Mucositis and Peri-implantitis',
    journal: 'Journal of Periodontology',
    date: 'February 2024',
    summary: 'Updated consensus on non-surgical management of peri-implant mucositis and step-wise approach to peri-implantitis, including surgical thresholds.',
    tags: ['Periodontics', 'Implantology', 'Guidelines'],
    aiReview: null,
    doi: '10.1002/JPER.23-0750',
  },
  {
    id: 'art-003',
    type: 'Material Review',
    title: 'Monolithic Zirconia vs Lithium Disilicate for Posterior Single Crowns: 5-Year Clinical Outcomes',
    journal: 'The Journal of Prosthetic Dentistry',
    date: 'January 2024',
    summary: 'Monolithic zirconia demonstrates superior fracture resistance; lithium disilicate provides better aesthetics. Material selection should be driven by occlusal load and aesthetic demands.',
    tags: ['Prosthodontics', 'Materials', 'Crowns'],
    aiReview: null,
    doi: '10.1016/j.prosdent.2023.10.019',
  },
  {
    id: 'art-004',
    type: 'Case Report',
    title: 'Successful Management of Oral Submucous Fibrosis with Intralesional Bevacizumab: A Novel Approach',
    journal: 'Oral Surgery, Oral Medicine, Oral Pathology',
    date: 'March 2024',
    summary: 'Case series of 12 patients with moderate OSMF managed with intralesional bevacizumab showing 67% improvement in mouth opening at 6 months.',
    tags: ['Oral Medicine', 'OSMF', 'Case Report'],
    aiReview: null,
    doi: '10.1016/j.oooo.2024.01.005',
  },
  {
    id: 'art-005',
    type: 'Technique Update',
    title: 'Digital Smile Design in Full-Arch Rehabilitation: Clinical Protocol and Patient Communication',
    journal: 'International Journal of Prosthodontics',
    date: 'February 2024',
    summary: 'DSD-guided treatment planning improves patient communication and reduces chair-time through digital mock-ups. Validated 8-step clinical protocol presented.',
    tags: ['Prosthodontics', 'Digital Dentistry', 'Aesthetics'],
    aiReview: null,
    doi: '10.11607/ijp.8291',
  },
  {
    id: 'art-006',
    type: 'Research',
    title: 'AI-Assisted Caries Detection on Bitewing Radiographs: Validation Against Expert Radiologists',
    journal: 'Dentomaxillofacial Radiology',
    date: 'March 2024',
    summary: 'Deep learning model achieves 91.3% sensitivity and 88.7% specificity for proximal caries detection, outperforming general practitioner interpretation.',
    tags: ['AI', 'Radiology', 'Caries'],
    aiReview: null,
    doi: '10.1259/dmfr.20230278',
  },
]

// Mock Dental TV videos
export const MOCK_VIDEOS = [
  {
    id: 'vid-001',
    title: 'Step-by-Step Rotary Endodontics with WaveOne Gold | Full Protocol',
    channel: 'Dentsply Sirona Academy',
    thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
    duration: '24:31',
    views: '128K',
    specialty: 'Endodontics',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 'vid-002',
    title: 'Full Mouth Disinfection Protocol: Evidence-Based SRP Technique',
    channel: 'PerioMastery',
    thumbnail: 'https://picsum.photos/seed/perio/320/180',
    duration: '18:45',
    views: '89K',
    specialty: 'Periodontics',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 'vid-003',
    title: 'Mandibular Third Molar Extraction — Surgical Approach for Deep Impactions',
    channel: 'OralSurgery Pro',
    thumbnail: 'https://picsum.photos/seed/oralsurg/320/180',
    duration: '32:10',
    views: '215K',
    specialty: 'Oral Surgery',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 'vid-004',
    title: 'Dental Implant Placement — Prosthetically Driven Protocol',
    channel: 'ITI International Team for Implantology',
    thumbnail: 'https://picsum.photos/seed/implant/320/180',
    duration: '41:22',
    views: '342K',
    specialty: 'Implantology',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 'vid-005',
    title: 'Cephalometric Analysis Made Easy — ANB, Wits, and Treatment Planning',
    channel: 'Dental Explained',
    thumbnail: 'https://picsum.photos/seed/ortho/320/180',
    duration: '28:17',
    views: '176K',
    specialty: 'Orthodontics',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 'vid-006',
    title: 'Monolithic Zirconia Crowns — From Preparation to Cementation',
    channel: '3M Dental',
    thumbnail: 'https://picsum.photos/seed/prostho/320/180',
    duration: '22:08',
    views: '93K',
    specialty: 'Prosthodontics',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 'vid-007',
    title: 'Behaviour Management in Paediatric Dentistry — Practical Techniques',
    channel: 'Dental Explained',
    thumbnail: 'https://picsum.photos/seed/pedo/320/180',
    duration: '19:55',
    views: '67K',
    specialty: 'Paediatric Dentistry',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 'vid-008',
    title: 'Oral Potentially Malignant Disorders — When and How to Biopsy',
    channel: 'Dental Explained',
    thumbnail: 'https://picsum.photos/seed/oralmed/320/180',
    duration: '26:40',
    views: '54K',
    specialty: 'Oral Medicine',
    youtubeId: 'dQw4w9WgXcQ',
  },
]

// Quick prompts per specialty
export const SPECIALTY_QUICK_PROMPTS = {
  'Endo.ai': [
    'What are the irrigant protocol steps for a necrotic tooth?',
    'How do I handle a separated file in the apical third?',
    'When is single-visit RCT contraindicated?',
    'What is the difference between MTA and Biodentine for pulpotomy?',
    'How do I classify and manage a missed canal (Vertucci)?',
  ],
  'Perio.ai': [
    'How do I stage and grade a new periodontitis case?',
    'What is the protocol for full-mouth disinfection?',
    'When should I extract vs preserve a tooth with severe periodontitis?',
    'What are the risk factors for peri-implantitis?',
    'How do I manage a patient on bisphosphonates needing extraction?',
  ],
  'Implant.ai': [
    'What are the contraindications for immediate implant placement?',
    'How do I plan a sinus lift — lateral vs crestal approach?',
    'What causes early implant failure and how do I manage it?',
    'When is immediate loading appropriate vs delayed?',
    'How much bone volume do I need for a standard implant?',
  ],
  'OralSurg.ai': [
    'What is the classification and surgical approach for a 4D lower third molar?',
    'How do I manage Ludwig\'s angina in the clinic before referral?',
    'What are the steps for a periapical curettage?',
    'How do I differentiate a radicular cyst from a dentigerous cyst?',
    'What are the stages of dry socket and management?',
  ],
  'OrthoD.ai': [
    'How do I interpret an ANB angle and Wits appraisal?',
    'When do I extract premolars vs expand the arch?',
    'What are the clinical signs of skeletal Class III vs dental Class III?',
    'How do I decide between fixed braces and clear aligners?',
    'What is the retention protocol post-orthodontic treatment?',
  ],
  'Pedo.ai': [
    'What are the indications for pulpotomy vs pulpectomy in primary molars?',
    'How do I manage a traumatically avulsed permanent incisor in a 9-year-old?',
    'Which space maintainer do I use for a prematurely lost lower first primary molar?',
    'What is the maximum safe fluoride dose for a 5-year-old?',
    'How do I manage a very anxious 4-year-old who won\'t open their mouth?',
  ],
  'Prostho.ai': [
    'How do I choose between zirconia and lithium disilicate for a upper anterior crown?',
    'What are the Kennedy classification and design principles for RPD?',
    'How do I record centric relation for complete dentures?',
    'What preparation depth and margin design for a lithium disilicate crown?',
    'How do I troubleshoot a patient with sore spots in a new complete denture?',
  ],
  'OralMed.ai': [
    'How do I differentiate between leukoplakia, oral submucous fibrosis, and lichen planus clinically?',
    'When must I biopsy an oral lesion and what biopsy type?',
    'How do I manage a patient with symptomatic oral lichen planus?',
    'What are the oral manifestations of uncontrolled diabetes?',
    'How do I diagnose and manage TMJ disc displacement without reduction?',
  ],
}

// Audit log storage (localStorage for Phase 1)
export function logAuditEntry(entry) {
  const logs = getAuditLogs()
  const newEntry = {
    ...entry,
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    modelVersion: 'gemini-1.5-flash',
    doctorId: DUMMY_USER.id,
    doctorAction: entry.doctorAction || 'pending',
  }
  logs.unshift(newEntry)
  localStorage.setItem('dental_ai_audit_log', JSON.stringify(logs))
  return newEntry
}

export function getAuditLogs() {
  try {
    return JSON.parse(localStorage.getItem('dental_ai_audit_log') || '[]')
  } catch {
    return []
  }
}
