import { supabase } from '../supabase'

// ── User Management ───────────────────────────────────────────────────────────

export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// ── Peer Cases (Live Feed) ────────────────────────────────────────────────────

export async function fetchCases(specialty = null, sort = 'newest') {
  let query = supabase
    .from('peer_cases')
    .select(`
      *,
      profiles:author_id (name, specialty, is_verified),
      endorsements (count),
      peer_comments (count)
    `)

  if (specialty && specialty !== 'All Specialties') {
    query = query.eq('specialty', specialty)
  }

  if (sort === 'popular') {
    // For popular, we would ideally order by endorsement count, but Supabase count selection 
    // doesn't allow direct ordering in a simple select. 
    // For now, we order by created_at and sort in JS, or use a RPC if needed.
    // For simplicity in this phase, we'll keep it as created_at newest.
    query = query.order('created_at', { ascending: false })
  } else if (sort === 'discussed') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function deleteCase(caseId) {
  const { error } = await supabase
    .from('peer_cases')
    .delete()
    .eq('id', caseId)

  if (error) throw error
}

export async function createCase(caseData) {
  const { data, error } = await supabase
    .from('peer_cases')
    .insert([caseData])
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Endorsements ──────────────────────────────────────────────────────────────

export async function endorseCase(caseId, userId) {
  const { error } = await supabase
    .from('endorsements')
    .insert([{ case_id: caseId, user_id: userId }])
  
  if (error && error.code !== '23505') throw error // Ignore unique constraint errors
}

export async function unendorseCase(caseId, userId) {
  const { error } = await supabase
    .from('endorsements')
    .delete()
    .match({ case_id: caseId, user_id: userId })

  if (error) throw error
}

export async function checkUserEndorsement(caseId, userId) {
  const { data, error } = await supabase
    .from('endorsements')
    .select('*')
    .match({ case_id: caseId, user_id: userId })
    .maybeSingle()

  if (error) throw error
  return !!data
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function fetchComments(caseId) {
  const { data, error } = await supabase
    .from('peer_comments')
    .select(`
      *,
      profiles:author_id (name, specialty, is_verified)
    `)
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function addComment(caseId, authorId, body) {
  const { data, error } = await supabase
    .from('peer_comments')
    .insert([{ case_id: caseId, author_id: authorId, body }])
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Static Reference Data (Preserved) ──────────────────────────────────────────

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
];

export const SPECIALTY_QUICK_PROMPTS = {
  'Endodontics': [
    'What are the irrigant protocol steps for a necrotic tooth?',
    'How do I handle a separated file in the apical third?',
    'When is single-visit RCT contraindicated?',
    'What is the difference between MTA and Biodentine for pulpotomy?',
    'How do I classify and manage a missed canal (Vertucci)?',
  ],
  'Periodontics': [
    'How do I stage and grade a new periodontitis case?',
    'What is the protocol for full-mouth disinfection?',
    'When should I extract vs preserve a tooth with severe periodontitis?',
    'What are the risk factors for peri-implantitis?',
    'How do I manage a patient on bisphosphonates needing extraction?',
  ],
  'Implantology': [
    'What are the contraindications for immediate implant placement?',
    'How do I plan a sinus lift — lateral vs crestal approach?',
    'What causes early implant failure and how do I manage it?',
    'When is immediate loading appropriate vs delayed?',
    'How much bone volume do I need for a standard implant?',
  ],
  'OralSurgery': [
    'What is the classification and surgical approach for a 4D lower third molar?',
    'How do I manage Ludwig\'s angina in the clinic before referral?',
    'What are the steps for a periapical curettage?',
    'How do I differentiate a radicular cyst from a dentigerous cyst?',
    'What are the stages of dry socket and management?',
  ],
  'Orthodontics': [
    'How do I interpret an ANB angle and Wits appraisal?',
    'When do I extract premolars vs expand the arch?',
    'What are the clinical signs of skeletal Class III vs dental Class III?',
    'How do I decide between fixed braces and clear aligners?',
    'What is the retention protocol post-orthodontic treatment?',
  ],
  'Paediatric': [
    'What are the indications for pulpotomy vs pulpectomy in primary molars?',
    'How do I manage a traumatically avulsed permanent incisor in a 9-year-old?',
    'Which space maintainer do I use for a prematurely lost lower first primary molar?',
    'What is the maximum safe fluoride dose for a 5-year-old?',
    'How do I manage a very anxious 4-year-old who won\'t open their mouth?',
  ],
  'Prosthodontics': [
    'How do I choose between zirconia and lithium disilicate for a upper anterior crown?',
    'What are the Kennedy classification and design principles for RPD?',
    'How do I record centric relation for complete dentures?',
    'What preparation depth and margin design for a lithium disilicate crown?',
    'How do I troubleshoot a patient with sore spots in a new complete denture?',
  ],
  'OralMedicine': [
    'How do I differentiate between leukoplakia, oral submucous fibrosis, and lichen planus clinically?',
    'When must I biopsy an oral lesion and what biopsy type?',
    'How do I manage a patient with symptomatic oral lichen planus?',
    'What are the oral manifestations of uncontrolled diabetes?',
    'How do I diagnose and manage TMJ disc displacement without reduction?',
  ],
};

// Medico-legal audit trail (Now persisted to Supabase if wanted, but sticking to prompt's focus for now)
export async function logAuditEntry(entry) {
  // In a real app, this would be a table: audit_logs
  // For now, we'll keep it as a placeholder or use localStorage if explicitly requested
  console.log('Audit log entry created:', entry)
  return entry
}

export function getAuditLogs() {
  return [] // Placeholder
}

// ── Mock Data for Informational Pages ──────────────────────────────────────────

export const MOCK_ARTICLES = [
  {
    id: 'art-1',
    type: 'Research',
    tags: ['Endodontics', 'CBCT'],
    title: 'Effectiveness of CBCT in detecting vertical root fractures: A systematic review',
    journal: 'Journal of Endodontics',
    date: '2023-11',
    summary: 'A comprehensive study comparing CBCT sensitivity with conventional periapical radiography in fracture diagnosis.',
    doi: '10.1016/j.joen.2023.08.012'
  },
  {
    id: 'art-2',
    type: 'Guidelines',
    tags: ['Oral Surgery', 'Antibiotics'],
    title: 'New AOMSI guidelines for prophylactic antibiotic use in third molar surgery',
    journal: 'AOMSI Bulletin',
    date: '2024-02',
    summary: 'Updated recommendations for antibiotic timing and dosage to minimize surgical site infections.',
    doi: '10.1007/s12663-023-01988-x'
  },
  {
    id: 'art-3',
    type: 'Technique Update',
    tags: ['Prosthodontics', 'Digital'],
    title: 'Digital vs Analog impressions: Accuracy and patient satisfaction in crown preparation',
    journal: 'Prosthodontic Review',
    date: '2024-01',
    summary: 'Clinical trial comparing IOS scanner efficiency with PVS impressions for single crown workflows.',
    doi: '10.1111/jopr.13782'
  }
]

export const MOCK_VIDEOS = [
  {
    id: 'vid-1',
    title: 'Rotary Instrumentation: Mastering the MB2 Canal',
    channel: 'Endo Pro Channel',
    views: '12K',
    duration: '14:20',
    specialty: 'Endodontics',
    youtubeId: 'dQw4w9WgXcQ'
  },
  {
    id: 'vid-2',
    title: 'Minimally Invasive Extraction Techniques',
    channel: 'Surgical Skills',
    views: '8.5K',
    duration: '22:15',
    specialty: 'Oral Surgery',
    youtubeId: 'dQw4w9WgXcQ'
  },
  {
    id: 'vid-3',
    title: 'Staging and Grading of Periodontitis (2018 Classification)',
    channel: 'Perio Masterclass',
    views: '45K',
    duration: '10:05',
    specialty: 'Periodontics',
    youtubeId: 'dQw4w9WgXcQ'
  }
]
