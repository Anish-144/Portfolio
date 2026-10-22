/**
 * Project showcase + case-study content. One entry drives the card, the
 * case-study dialog, and the skill cross-references. Figures are kept to what
 * each project's implementation supports.
 */

export type ProjectId = 'auditai' | 'cyberguard' | 'cloudguard' | 'safedrive-ai';
export type VisualKind = 'audit' | 'threat' | 'cloud' | 'learning';

export interface Metric {
  value: string;
  label: string;
}

export interface ArchitectureStep {
  label: string;
  detail: string;
}

export interface ProjectLink {
  label: string;
  href: string;
}

export interface CaseStudy {
  problem: string;
  architecture: { summary: string; steps: ArchitectureStep[] };
  features: string[];
  technology: Array<{ name: string; reason: string }>;
  challenges: Array<{ title: string; detail: string }>;
  results: string[];
}

export interface Project {
  id: ProjectId;
  index: string;
  name: string;
  tagline: string;
  category: string;
  summary: string;
  stack: string[];
  visual: VisualKind;
  figure: string;
  metrics: Metric[];
  /** Short qualifier shown with the project, e.g. team build or simulated data. */
  context?: string;
  links: { repository?: ProjectLink; demo?: ProjectLink };
  caseStudy: CaseStudy;
}

export const PROJECTS: readonly Project[] = [
  {
    id: 'auditai',
    index: 'P/01',
    name: 'AuditAI',
    tagline: 'Autonomous Financial Compliance & Audit Agent',
    category: 'Multi-agent AI · Financial compliance',
    summary:
      'A multi-agent audit platform that ingests financial documents, reconciles GST and TDS data, flags potential fraud, routes critical findings to human review, and generates audit-ready PDF reports.',
    stack: ['Python', 'FastAPI', 'LangGraph', 'LangChain', 'React', 'OCR (Tesseract)', 'ChromaDB', 'LLM APIs'],
    visual: 'audit',
    figure: 'Agent pipeline',
    metrics: [
      { value: '6', label: 'Specialised agents in a LangGraph pipeline' },
      { value: '3-way', label: 'Matching for GST & TDS reconciliation' },
      { value: 'HITL', label: 'Human review before any report ships' },
    ],
    context: 'Team build',
    links: {
      repository: { label: 'Team repository', href: 'https://github.com/TAPAN-2835/audit-ai' },
      demo: { label: 'Live demo', href: 'https://audit-ai-livid.vercel.app' },
    },
    caseStudy: {
      problem:
        'Audit and compliance checks depend on invoices, GST records, bank debits, and purchase orders agreeing with one another. Reconciling them by hand is slow and error-prone, and a general-purpose chatbot cannot produce the structured, reviewable findings an audit relies on.',
      architecture: {
        summary:
          'A React frontend talks to a FastAPI backend that runs a LangGraph pipeline of specialised agents. Uploaded documents are classified and extracted, with OCR for scanned PDFs. Reconciliation and fraud checks then run as parallel branches, findings are aggregated into a risk score, critical items wait for human review, and a reporting agent renders the final PDF.',
        steps: [
          { label: 'Ingest', detail: 'PDF, Excel, CSV and JSON uploads; OCR for scans' },
          { label: 'DocAgent', detail: 'Classify, extract and normalise' },
          { label: 'Reconcile + Fraud', detail: 'GST/TDS matching alongside fraud checks' },
          { label: 'AuditAgent', detail: 'Aggregate findings and compute risk' },
          { label: 'Human review', detail: 'Critical items approved first' },
          { label: 'ReportAgent', detail: 'Audit-ready PDF report' },
        ],
      },
      features: [
        'Document ingestion with automatic classification and transaction extraction',
        'GST and TDS reconciliation: 3-way matching, GSTR-2B mismatch detection, and ITC risk scoring',
        'Fraud detection that combines a rule engine, Benford’s Law analysis, and LLM-based semantic flagging',
        'Risk aggregation with a severity breakdown and a composite risk score',
        'A human-in-the-loop review queue before report generation',
        'Natural-language questions over audit data through a dedicated query agent',
        'Role-based workspaces for administrators, CA-firm clients, auditors, reviewers, and viewers',
      ],
      technology: [
        {
          name: 'LangGraph',
          reason:
            'Expresses the audit as a directed graph of agents, so each stage has one responsibility and an explicit hand-off.',
        },
        { name: 'FastAPI', reason: 'Async Python API that serves the pipeline, with generated OpenAPI documentation.' },
        {
          name: 'Tesseract OCR, PyMuPDF, pdfplumber',
          reason: 'Extract data from both scanned and digital financial documents.',
        },
        { name: 'ChromaDB', reason: 'Vector memory for retrieval over audit context.' },
        { name: 'React', reason: 'Role-based dashboards for reviewing findings and reports.' },
      ],
      challenges: [
        {
          title: 'Specialisation versus coordination',
          detail:
            'Dividing the work between agents keeps each one focused and testable, but every hand-off must be explicit. A directed LangGraph pipeline makes the order visible, including the parallel reconciliation and fraud branches.',
        },
        {
          title: 'Automation with a human gate',
          detail:
            'Audit findings carry consequences, so critical items go to a review queue before the report is generated instead of being published automatically.',
        },
        {
          title: 'Deterministic checks beside LLM judgement',
          detail:
            'Rule-based and statistical checks such as Benford’s Law sit alongside LLM-based flagging, so the model supplements verifiable logic rather than replacing it.',
        },
      ],
      results: [
        'Six specialised agents covering documents, reconciliation, fraud, aggregation, reporting, and natural-language queries',
        'Automated GST and TDS reconciliation with 3-way matching',
        'Audit-ready PDF reports generated from pipeline output, after human review of critical items',
      ],
    },
  },
  {
    id: 'cyberguard',
    index: 'P/02',
    name: 'CyberGuard',
    tagline: 'AI Threat Intelligence & RAG Incident Reasoning',
    category: 'RAG · Security operations',
    summary:
      'An AI-assisted SOC platform that analyses security logs, maps activity to MITRE ATT&CK, scores risk, and explains incidents, showing the retrieved evidence behind each conclusion.',
    stack: ['Python', 'Flask', 'LangChain', 'FAISS', 'BM25', 'LLM APIs', 'scikit-learn', 'MITRE ATT&CK'],
    visual: 'threat',
    figure: 'Incident reasoning',
    metrics: [
      { value: '4+', label: 'AI-assisted SOC workflows' },
      { value: '2', label: 'ML models for risk and anomaly scoring' },
      { value: '1,000', label: 'Synthetic records for model training' },
    ],
    context: 'Simulated data',
    links: {
      repository: { label: 'Repository', href: 'https://github.com/Anish-144/AI-RAG' },
    },
    caseStudy: {
      problem:
        'Analysts triage large volumes of alerts and reconstruct incidents by hand: reading raw logs, correlating timestamps, looking up ATT&CK techniques, and writing the narrative. An ungrounded LLM adds its own risk, a confident explanation with no evidence behind it.',
      architecture: {
        summary:
          'Logs are parsed and scored by two models: a supervised RandomForest for risk and an IsolationForest for anomalies. A hybrid retriever then gathers supporting knowledge, combining FAISS dense search with BM25 keyword search through Reciprocal Rank Fusion and a cross-encoder re-ranker. An LLM (Gemini by default, with a Groq fallback) produces the narrative, the ATT&CK mapping, and defensive actions. Company policies live in a separate, isolated vector store.',
        steps: [
          { label: 'Ingest logs', detail: 'Firewall, web, system and cloud logs' },
          { label: 'ML scoring', detail: 'RandomForest risk · IsolationForest anomaly' },
          { label: 'Hybrid retrieval', detail: 'FAISS + BM25, fused and re-ranked' },
          { label: 'LLM reasoning', detail: 'Narrative and ATT&CK mapping' },
          { label: 'Analyst output', detail: 'Defensive actions, cases, reports' },
        ],
      },
      features: [
        'Log intelligence: AI analysis with KPIs, an attack timeline, and MITRE ATT&CK mapping',
        'Suggested next attacker moves based on the current attack stage',
        'Supervised risk scores (0–100) and unsupervised anomaly scores',
        'IP geolocation and reputation enrichment',
        'Policy Q&A over an isolated vector store, with numbered sources',
        'Case management that records high-risk incidents automatically',
        'Investigation and executive PDF reports',
        'Transparency: the retrieved evidence and retrieval scores are shown with each answer',
      ],
      technology: [
        {
          name: 'FAISS + BM25',
          reason:
            'Dense search captures meaning while keyword search catches exact identifiers such as event IDs. Reciprocal Rank Fusion merges the two result sets.',
        },
        { name: 'Cross-encoder re-ranking', reason: 'Re-orders the fused candidates before they reach the model.' },
        { name: 'scikit-learn', reason: 'RandomForest risk prediction and IsolationForest anomaly detection.' },
        {
          name: 'LLM APIs',
          reason: 'Gemini by default with a Groq fallback, chosen through a provider router.',
        },
        { name: 'MITRE ATT&CK', reason: 'A shared vocabulary for adversary tactics and techniques.' },
      ],
      challenges: [
        {
          title: 'Exact terms versus meaning',
          detail:
            'Security data mixes exact identifiers with open-ended questions. Dense vectors alone miss exact matches, so semantic search is fused with BM25 keyword search.',
        },
        {
          title: 'Grounding over fluency',
          detail:
            'Each conclusion is shown with the evidence and retrieval scores behind it, so an analyst can check the reasoning instead of trusting it.',
        },
        {
          title: 'Keeping contexts apart',
          detail:
            'Policy documents sit in their own vector store, so threat knowledge and policy context never contaminate each other’s retrieval.',
        },
        {
          title: 'Assistance, not autonomy',
          detail:
            'CyberGuard explains, recommends, and records cases. It does not act on production systems. It is built and evaluated on simulated and sample security data.',
        },
      ],
      results: [
        'Four or more AI-assisted SOC workflows, including log intelligence, security and policy chat, case management, and reporting',
        '70+ simulated log events indexed for retrieval',
        'Risk and anomaly models trained on 1,000 synthetic network records',
      ],
    },
  },
  {
    id: 'cloudguard',
    index: 'P/03',
    name: 'CloudGuard',
    tagline: 'Cloud Security Monitoring & IAM Risk Analysis',
    category: 'Cloud security · Governance',
    summary:
      'A microservices platform for AWS security and governance. It scans an account through a read-only role, checks IAM and configuration against compliance rules, flags cost waste, and streams real-time alerts to role-based dashboards.',
    stack: ['Python', 'FastAPI', 'boto3', 'AWS IAM', 'CloudTrail', 'CloudWatch', 'PostgreSQL', 'Redis', 'React', 'Docker'],
    visual: 'cloud',
    figure: 'IAM risk map',
    metrics: [
      { value: '8', label: 'Compliance rules' },
      { value: '8', label: 'Automated check types' },
      { value: '3', label: 'Data modes: simulated, live, hybrid' },
    ],
    context: 'Simulated & live modes',
    links: {
      repository: { label: 'Repository', href: 'https://github.com/Anish-144/CloudProject' },
    },
    caseStudy: {
      problem:
        'Cloud risk often hides in configuration: IAM users without MFA, root-account usage, stale access keys, broad administrator or wildcard policies, public storage, and missing logging. Finding it means checking configuration and activity together, continuously, without handing the auditing tool write access.',
      architecture: {
        summary:
          'A collector polls AWS with boto3 through a read-only IAM role and publishes events to a Redis stream. Compliance and FinOps engines consume that stream independently and send findings to an alert service. A FastAPI gateway relays alerts to a React dashboard over server-sent events, and PostgreSQL stores resources, findings, and alerts. In simulated mode the collector stays idle and the platform runs on manually ingested logs instead of live account data.',
        steps: [
          { label: 'Cloud collector', detail: 'boto3, read-only IAM role' },
          { label: 'Redis stream', detail: 'Decouples collection from analysis' },
          { label: 'Compliance + FinOps', detail: 'Rules, IAM checks, cost waste' },
          { label: 'Alert service', detail: 'Findings to real-time alerts' },
          { label: 'Gateway + dashboards', detail: 'FastAPI, SSE, React' },
        ],
      },
      features: [
        'IAM checks for MFA, root-account usage, access-key rotation older than 90 days, and AdministratorAccess or wildcard and inline policies',
        'Configuration checks for public EC2 IPs and S3 public access, encryption, versioning, and logging',
        'Eight compliance rules, including no public S3, encryption at rest, MFA for IAM, and logging enabled',
        'FinOps detection of idle and over-provisioned resources and cost spikes',
        'Real-time alerts streamed to dashboards over server-sent events',
        'Role-based dashboards for cloud admin, FinOps, compliance, IT admin, and viewer roles',
      ],
      technology: [
        { name: 'boto3 + read-only IAM', reason: 'Inventory and configuration scanning with no write access to the account.' },
        { name: 'Redis Streams', reason: 'Several engines consume the same event stream without depending on each other.' },
        { name: 'FastAPI + SSE', reason: 'A single gateway for the API and live alert delivery to the browser.' },
        { name: 'PostgreSQL', reason: 'Relational storage for resources, rules, findings, and alerts.' },
        { name: 'Docker Compose', reason: 'Runs every microservice together for local development and demos.' },
      ],
      challenges: [
        {
          title: 'Read-only by design',
          detail: 'The collector scans through a read-only IAM role, so the platform never needs write access to the account it audits.',
        },
        {
          title: 'Decoupled analysis',
          detail:
            'A Redis stream separates collection from analysis, so compliance, FinOps, and alerting can evolve and scale independently.',
        },
        {
          title: 'Simulated versus live data',
          detail:
            'Simulated mode exercises the platform on manually ingested logs without live credentials. Results from it describe simulated input, not production telemetry.',
        },
      ],
      results: [
        'Eight compliance rules and eight automated check types across IAM, S3, and EC2',
        'Simulated, live (single AWS account, read-only), and hybrid data modes',
        'A real-time alert pipeline from collector to dashboard',
      ],
    },
  },
  {
    id: 'safedrive-ai',
    index: 'P/04',
    name: 'SafeDrive AI',
    tagline: 'AI-Powered Distracted-Driving Awareness Platform',
    category: 'Full-stack · Voice AI · Learning',
    summary:
      'A learning platform from the Shreya Dixit Foundation that combines an onboarding assessment, AI-generated driving scenarios and lessons, and voice-based tutoring to build awareness of distracted driving.',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'ElevenLabs', 'OpenAI'],
    visual: 'learning',
    figure: 'Voice-guided learning',
    metrics: [
      { value: '6+', label: 'Platform modules contributed to' },
      { value: '10+', label: 'Hosting services evaluated' },
      { value: '40–50%', label: 'Estimated infrastructure cost reduction' },
    ],
    context: 'Shreya Dixit Foundation',
    links: {
      repository: { label: 'Repository', href: 'https://github.com/Anish-144/Distracted_Driving_platform' },
      demo: { label: 'Live platform', href: 'https://safedrive-ai.vercel.app' },
    },
    caseStudy: {
      problem:
        'Distracted-driving awareness material is usually static and the same for everyone. The platform makes it interactive and personal: learners are assessed, given scenarios and lessons that match, and can learn by voice as well as on screen.',
      architecture: {
        summary:
          'A Next.js and TypeScript frontend talks to a FastAPI backend that uses SQLAlchemy models on PostgreSQL. AI services generate scenarios and lessons, and ElevenLabs provides voice narration for the voice tutor. An admin area exposes analytics, users, feedback, and research views.',
        steps: [
          { label: 'Onboarding', detail: 'Assessment questionnaire and calibration' },
          { label: 'Personalisation', detail: 'Assessment results shape the path' },
          { label: 'Scenarios + lessons', detail: 'AI-generated driving simulations' },
          { label: 'Voice tutor', detail: 'ElevenLabs narration and voice input' },
          { label: 'Progress', detail: 'Reports, analytics and research views' },
        ],
      },
      features: [
        'Account registration and login',
        'An onboarding assessment questionnaire with calibration scenarios',
        'AI-generated driving-simulation scenarios and lessons',
        'Voice narration, voice input, and a voice tutor',
        'Progress and report dashboards for learners',
        'Admin analytics, user, feedback, and research dashboards',
      ],
      technology: [
        { name: 'Next.js + TypeScript', reason: 'A typed frontend for the learner and admin experiences.' },
        { name: 'FastAPI + SQLAlchemy', reason: 'An async Python API with explicit data models and migrations.' },
        { name: 'ElevenLabs', reason: 'Natural voice narration for the voice tutor.' },
        { name: 'PostgreSQL', reason: 'Learner, assessment, and progress data.' },
      ],
      challenges: [
        {
          title: 'Personalisation from the learner',
          detail:
            'The learning path is driven by an onboarding assessment and calibration scenarios that learners complete themselves.',
        },
        {
          title: 'Voice as a first-class path',
          detail: 'Voice narration and voice input sit beside the on-screen lessons, so learners can follow either path.',
        },
        {
          title: 'Hosting on a non-profit budget',
          detail:
            'More than ten free-tier hosting services were compared to keep running costs low, with an estimated 40–50% reduction in infrastructure cost.',
        },
      ],
      results: [
        'Contributions to six or more platform modules: authentication, voice assistance, analytics, and personalised learning',
        'ElevenLabs voice automation integrated into the voice tutor',
        'An estimated 40–50% reduction in infrastructure cost from the hosting evaluation',
      ],
    },
  },
];

export const projectById = (id: string): Project | undefined => PROJECTS.find((project) => project.id === id);
