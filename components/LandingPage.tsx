import React, { useEffect, useState, ReactNode } from 'react';
import {
    SparklesIcon,
    MailIcon,
    PhoneIcon,
    MapPinIcon,
    TwitterIcon,
    LinkedInIcon,
    FacebookIcon,
    LockIcon,
    FileTextIcon,
    CheckCircleIcon,
    CpuIcon,
    BrainCircuitIcon,
    CodeIcon
} from '../constants/icons';
import {
    AdaptiveLessonPlayerMockup,
    SchoolOSDashboardMockup,
    StudentUIMockup,
    TeacherUIMockup,
    SchoolUIMockup,
    ParentUIMockup
} from './ui_mockups';

interface LandingPageProps {
    onLaunch: () => void;
}

type HighlightCard = {
    title: string;
    description: string;
    accent: string;
};

type Metric = {
    value: string;
    label: string;
    sublabel?: string;
};

interface Persona {
    id: 'institutes' | 'schools' | 'corporate';
    label: string;
    summary: string;
    bullets: string[];
    utilities: string[];
    media: ReactNode;
}

interface SolutionStack {
    id: 'course' | 'live' | 'students' | 'communication' | 'certification';
    kicker: string;
    title: string;
    description: string;
    bullets: string[];
    media: ReactNode;
}

const heroStats: Metric[] = [
    { value: '10k+', label: 'Learners onboarded' },
    { value: '120+', label: 'Courses published' },
    { value: '75+', label: 'Institutions live' }
];

const managementHighlights: HighlightCard[] = [
    {
        title: 'Effortless Management',
        description: 'Automate enrollments, organize batches, and keep every cohort in sync without spreadsheets.',
        accent: 'Operations'
    },
    {
        title: 'Custom Learning Paths',
        description: 'Blend PDFs, videos, Jupyter notebooks, Scratch projects, and AI content into one adaptive flow.',
        accent: 'Personalization'
    },
    {
        title: 'Seamless Communication',
        description: 'Trigger WhatsApp, email, push, and in-platform nudges so no announcement gets missed.',
        accent: 'Engagement'
    },
    {
        title: 'Live Analytics',
        description: 'Monitor progress, attention, and completion in real time with classroom-ready dashboards.',
        accent: 'Intelligence'
    }
];

const performanceMetrics: Metric[] = [
    { value: '1000+', label: 'Students Enrolled' },
    { value: '100+', label: 'Courses Created' },
    { value: '1000+', label: 'Assignments Managed' }
];

const personas: Persona[] = [
    {
        id: 'institutes',
        label: 'Training Institutes',
        summary: 'Launch signature programs with modular content, built-in commerce, and crystal clear pacing guides.',
        bullets: [
            'Design competency-based journeys with reusable study slides',
            'Blend prerecorded lessons with live cohorts and office hours',
            'Gate premium modules behind drip schedules or performance'
        ],
        utilities: ['Integrated payments & invoicing', 'Batch-based announcements', 'Revenue & utilization analytics'],
        media: <SchoolOSDashboardMockup />
    },
    {
        id: 'schools',
        label: 'Schools & Colleges',
        summary: 'Deliver CBSE-aligned learning with evidence-backed remediation for every child.',
        bullets: [
            'Mirror textbook structure with chapter + topic level access control',
            'Surface real-time mastery heatmaps and pacing variance',
            'Push targeted remedial worksheets or AI tutor nudges instantly'
        ],
        utilities: ['Timetabled live classes', 'Guardian-ready progress reports', 'Attendance + homework tracking'],
        media: <SchoolUIMockup />
    },
    {
        id: 'corporate',
        label: 'Upskilling & Corporate Academies',
        summary: 'Onboard and reskill teams with immersive labs, gated certifications, and Slack/Teams nudges.',
        bullets: [
            'Package code labs, compliance docs, and simulations in one path',
            'Auto-issue verifiable certificates on skill mastery',
            'Score engagement with meeting-ready analytics packages'
        ],
        utilities: ['SSO & HRIS sync', 'Role-specific learning tracks', 'Built-in feedback & discussion boards'],
        media: <TeacherUIMockup />
    }
];

const solutionStacks: SolutionStack[] = [
    {
        id: 'course',
        kicker: 'Advanced Course Creation',
        title: 'Build rich, interactive learning experiences',
        description:
            'Drag-and-drop anything—from PDFs and decks to coding exercises, quizzes, and Scratch/Jupyter embeds—into a modular course that adapts to each learner.',
        bullets: [
            'Version-controlled study slides with per-batch visibility',
            'Inline practice questions, polls, and reflections',
            'AI-assisted outline builder plus blueprint-aligned assessments',
            'Reusable library of multimedia blocks and question banks'
        ],
        media: <AdaptiveLessonPlayerMockup />
    },
    {
        id: 'live',
        kicker: 'Live Classes',
        title: 'Synchronous teaching without the juggling act',
        description:
            'Schedule Zoom/Meet sessions, take attendance, share decks, and capture notes without leaving the LMS.',
        bullets: [
            'Calendar-integrated live sessions with reminders',
            'Instant resource drop + whiteboard snapshots',
            'Auto-generated attendance + engagement summaries',
            'One-click replays with chat + question history'
        ],
        media: <SchoolOSDashboardMockup />
    },
    {
        id: 'students',
        kicker: 'Student Management',
        title: 'Every learner, every insight, one dashboard',
        description:
            'Bulk onboard via CSV, SIS, or LTI, then follow each learner through consolidated activity logs and mastery predictions.',
        bullets: [
            'Smart rosters with cohort/batch level policies',
            'Heatmaps for time-on-task, completion, and accuracy',
            'Discussion + doubt threads tied to each study slide',
            'Built-in notes, bookmarks, and revision markers'
        ],
        media: <StudentUIMockup />
    },
    {
        id: 'communication',
        kicker: 'Communication Suite',
        title: 'Reach learners where they already are',
        description:
            'Send targeted nudges across WhatsApp, email, push notifications, and announcement feeds—fully automated and auditable.',
        bullets: [
            'Template library for reminders, homework, and fee alerts',
            'Two-way doubt resolution threads',
            'Broadcast by batch, program, or entire institution',
            'Engagement scoring to keep teams proactive'
        ],
        media: (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
                <ParentUIMockup />
            </div>
        )
    },
    {
        id: 'certification',
        kicker: 'Certificates & Credentials',
        title: 'Recognize achievement with branded proof',
        description:
            'Auto-generate institute-branded certificates with QR verification, instructor signatures, and portfolio-ready layouts.',
        bullets: [
            'Drag-and-drop certificate template editor',
            'Unique verification codes for every credential',
            'Instant downloads from the learner dashboard',
            'Exports for alumni sharing and placement cells'
        ],
        media: <ParentUIMockup />
    }
];
const channelHighlights = [
    'Email alerts for classes, homework, and pacing checkpoints',
    'WhatsApp nudges for instant engagement',
    'Push notifications for the mobile app',
    'Announcement boards for institutes, batches, or cohorts'
];

const sessionHighlights = [
    'Flexible session calendars with extensions and make-up classes',
    'Auto-sync attendance, notes, and shared resources',
    'Smart filters to manage past, current, and upcoming batches'
];

const engagementHighlights = [
    'Discussion forums linked to specific study slides',
    'Personal notes, highlights, and revision pins',
    'Badge-based gamification and leaderboard widgets'
];

const reportHighlights = [
    'Daily and weekly digests with concentration + mastery scores',
    'Parent-friendly visualizations, accessible on web or mobile',
    'Export-ready evidence for PTMs and compliance'
];

const learnerDashboardHighlights = [
    'One-click access to enrolled courses and upcoming lives',
    'Progress tracker with adaptive recommendations',
    'Doubt inbox, saved notes, and certificate locker'
];

const faqItems = [
    {
        question: 'What is this LMS designed to solve?',
        answer:
            'A single workspace for course creation, live delivery, assessments, and analytics so teams stop stitching multiple tools together.'
    },
    {
        question: 'How does it reduce faculty workload?',
        answer:
            'Automation handles enrollments, reminders, attendance, grading queues, and report creation. Educators focus on coaching, not admin.'
    },
    {
        question: 'What content types are supported?',
        answer:
            'Upload PDFs, decks, SCORM, videos, audio, practice items, code editors, Scratch embeds, Jupyter notebooks, and AI-generated assets.'
    },
    {
        question: 'Can I run multiple batches and sessions?',
        answer:
            'Yes. Each batch can have its own timetable, instructors, visibility rules, announcements, and pacing plans.'
    },
    {
        question: 'How is learner progress tracked?',
        answer:
            'Deep knowledge tracing, activity logs, and quiz analytics feed into dashboards for teachers, school leaders, and parents.'
    },
    {
        question: 'Is there granular access control?',
        answer:
            'Gate content by cohort, drip schedule, or performance. Provide guardian/observer accounts with limited scopes.'
    }
];

const trustBadges = [
    { icon: LockIcon, title: 'ISO/IEC 27001 Ready', description: 'Enterprise-grade security, encryption at rest + in transit.' },
    { icon: FileTextIcon, title: 'FERPA/GDPR Aligned', description: 'Privacy-first handling for minors and institutional data.' },
    { icon: CheckCircleIcon, title: 'Curriculum Accurate', description: 'Every asset passes a CBSE & competency compliance check.' }
];

const techPillars = [
    { icon: CpuIcon, title: 'Multimodal AI', copy: 'Gemini-powered tutors, Veo video generation, and Imagen visuals elevate every lesson.' },
    { icon: BrainCircuitIcon, title: 'Cognitive Modeling', copy: 'Hybrid DKT + FSRS engine predicts mastery and schedules revision automatically.' },
    { icon: CodeIcon, title: 'Scalable Architecture', copy: 'React + TypeScript front-end with offline-ready caches and LTI 1.3 connectivity.' }
];

const GradientBackdrop = () => (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-indigo-200 opacity-60 blur-3xl"></div>
        <div className="absolute top-20 -left-10 h-96 w-96 rounded-full bg-cyan-200 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-300 opacity-40 blur-3xl"></div>
    </div>
);
const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activePersona, setActivePersona] = useState<Persona['id']>(personas[0].id);
    const [activeStack, setActiveStack] = useState<SolutionStack['id']>(solutionStacks[0].id);

    useEffect(() => {
        const handler = () => setIsScrolled(window.scrollY > 12);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        event.preventDefault();
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    const selectedPersona = personas.find((persona) => persona.id === activePersona) ?? personas[0];
    const selectedStack = solutionStacks.find((stack) => stack.id === activeStack) ?? solutionStacks[0];

    return (
        <div className="bg-white text-slate-900 font-sans leading-relaxed">
            <header
                className={`sticky top-0 z-30 transition-all duration-300 ${
                    isScrolled ? 'bg-white/80 backdrop-blur border-b border-slate-100 shadow-sm' : 'bg-white'
                }`}
            >
                <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold shadow-inner">
                            <span>A</span>
                        </div>
                        <div>
                            <p className="font-bold text-lg">Alfanumrik LMS</p>
                            <p className="text-xs text-slate-500">Powered by Vacademy-grade workflows</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
                        <a href="#solutions" onClick={(e) => scrollToSection(e, 'solutions')} className="hover:text-indigo-600">
                            Solutions
                        </a>
                        <a href="#modules" onClick={(e) => scrollToSection(e, 'modules')} className="hover:text-indigo-600">
                            Modules
                        </a>
                        <a href="#reports" onClick={(e) => scrollToSection(e, 'reports')} className="hover:text-indigo-600">
                            Reports
                        </a>
                        <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className="hover:text-indigo-600">
                            Contact
                        </a>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className="btn border border-slate-200">
                            Book a Demo
                        </a>
                        <button onClick={onLaunch} className="btn btn-primary">
                            Launch App
                        </button>
                    </div>
                </nav>
            </header>

            <main>
                <section id="hero" className="relative overflow-hidden bg-slate-50">
                    <GradientBackdrop />
                    <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-14 items-center">
                        <div className="space-y-6 reveal">
                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
                                <SparklesIcon className="w-4 h-4" /> Trusted by 10,000+ learners
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                                    The smartest, AI-powered LMS for institutes that demand more.
                                </h1>
                                <p className="mt-4 text-lg text-slate-600">
                                    Mirror Vacademy&apos;s battle-tested playbook: unified course creation, live teaching, assessment, and
                                    analytics—all in one beautiful workspace built for CBSE schools, training academies, and upskilling teams.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <button onClick={onLaunch} className="btn btn-primary px-6 py-3 text-base">
                                    Get Started Now
                                </button>
                                <a
                                    href="https://wa.me/919315940211?text=I%20want%20a%20demo%20of%20the%20Alfanumrik%20LMS"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn px-6 py-3 text-base bg-white border border-slate-200 hover:border-indigo-200"
                                >
                                    Talk to Sales
                                </a>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                                {heroStats.map((stat) => (
                                    <div key={stat.label} className="bg-white/70 rounded-2xl p-4 shadow-sm text-center">
                                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                        <p className="text-sm text-slate-500">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative reveal">
                            <div className="rounded-[32px] border border-white/80 shadow-2xl backdrop-blur bg-white/80 p-4">
                                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                                    <AdaptiveLessonPlayerMockup />
                                </div>
                            </div>
                            <div className="absolute -bottom-6 -left-6 w-40 rounded-2xl bg-white shadow-xl border border-slate-100 p-4">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Live Analytics</p>
                                <p className="text-2xl font-bold text-indigo-600">98%</p>
                                <p className="text-sm text-slate-500">Lesson engagement</p>
                            </div>
                            <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-48">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Next Session</p>
                                <p className="text-base font-semibold text-slate-800">Physics Lab • 5 PM</p>
                                <p className="text-sm text-emerald-500">Attendance synced</p>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="solutions" className="py-20 bg-white border-t border-b border-slate-100">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto space-y-3 reveal">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">Why Institutes Switch</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Smarter learning meets seamless management</h2>
                            <p className="text-slate-600">
                                Exactly like Vacademy&apos;s LMS, every workflow is modular, automated, and designed to keep educators, learners, and parents in perfect sync.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                            {managementHighlights.map((highlight) => (
                                <div key={highlight.title} className="p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition reveal">
                                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">{highlight.accent}</p>
                                    <h3 className="text-lg font-semibold mt-2">{highlight.title}</h3>
                                    <p className="text-sm text-slate-600 mt-3">{highlight.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-slate-900 text-white py-16">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="text-center space-y-4 reveal">
                            <p className="text-slate-300 text-sm uppercase tracking-[0.3em]">Where we stand</p>
                            <h2 className="text-3xl font-bold">Impact by the numbers</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
                            {performanceMetrics.map((metric) => (
                                <div key={metric.label} className="bg-white/5 rounded-2xl p-6 text-center border border-white/10 reveal">
                                    <p className="text-4xl font-extrabold">{metric.value}</p>
                                    <p className="text-sm text-slate-300 mt-2">{metric.label}</p>
                                    {metric.sublabel && <p className="text-xs text-slate-400 mt-1">{metric.sublabel}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="audience" className="py-20 bg-slate-50">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="space-y-4 text-center reveal">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.3em]">Who we serve</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Purpose-built workflows for every institution</h2>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-10 justify-center">
                            {personas.map((persona) => (
                                <button
                                    key={persona.id}
                                    onClick={() => setActivePersona(persona.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                                        activePersona === persona.id
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
                                    }`}
                                >
                                    {persona.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-12 grid lg:grid-cols-2 gap-10 items-center">
                            <div className="space-y-6 reveal">
                                <p className="text-indigo-500 font-semibold">{selectedPersona.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900">{selectedPersona.summary}</h3>
                                <ul className="space-y-3 text-slate-600">
                                    {selectedPersona.bullets.map((bullet) => (
                                        <li key={bullet} className="flex items-start gap-3">
                                            <span className="mt-1 inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex flex-wrap gap-3">
                                    {selectedPersona.utilities.map((chip) => (
                                        <span key={chip} className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600">
                                            {chip}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-3xl border border-white shadow-xl bg-white p-6 reveal">
                                {selectedPersona.media}
                            </div>
                        </div>
                    </div>
                </section>
                <section id="modules" className="py-20 bg-white">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center space-y-3 reveal">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.3em]">Modules</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything your team uses—now in one place</h2>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-10 justify-center">
                            {solutionStacks.map((stack) => (
                                <button
                                    key={stack.id}
                                    onClick={() => setActiveStack(stack.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                                        activeStack === stack.id
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {stack.kicker}
                                </button>
                            ))}
                        </div>
                        <div className="mt-12 grid lg:grid-cols-2 gap-10 items-center">
                            <div className="space-y-5 reveal">
                                <p className="text-indigo-500 font-semibold uppercase tracking-[0.3em]">{selectedStack.kicker}</p>
                                <h3 className="text-3xl font-bold text-slate-900">{selectedStack.title}</h3>
                                <p className="text-slate-600">{selectedStack.description}</p>
                                <ul className="space-y-3 text-slate-600">
                                    {selectedStack.bullets.map((bullet) => (
                                        <li key={bullet} className="flex gap-3">
                                            <span className="mt-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="reveal">
                                <div className="rounded-3xl border border-slate-100 shadow-2xl bg-white p-6">{selectedStack.media}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-slate-50" id="communication">
                    <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12">
                        <div className="space-y-6 reveal">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.3em]">Communication suite</p>
                            <h2 className="text-3xl font-bold text-slate-900">Reach learners where they are</h2>
                            <p className="text-slate-600">
                                Keep every batch aligned with automated nudges across every channel—just like Vacademy&apos;s inbuilt communication cockpit.
                            </p>
                            <ul className="space-y-3 text-slate-600">
                                {channelHighlights.map((item) => (
                                    <li key={item} className="flex gap-3">
                                        <span className="mt-1 inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-6 reveal">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.3em]">Session &amp; batch management</p>
                            <h2 className="text-3xl font-bold text-slate-900">Orchestrate every cohort with ease</h2>
                            <ul className="space-y-3 text-slate-600">
                                {sessionHighlights.map((item) => (
                                    <li key={item} className="flex gap-3">
                                        <span className="mt-1 inline-flex w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section id="reports" className="py-20 bg-white">
                    <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-3 gap-10">
                        <div className="space-y-5 reveal">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.3em]">Engagement</p>
                            <h2 className="text-3xl font-bold text-slate-900">Keep learners motivated</h2>
                            <ul className="space-y-3 text-slate-600">
                                {engagementHighlights.map((item) => (
                                    <li key={item} className="flex gap-3">
                                        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-5 reveal">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.3em]">Reports &amp; analytics</p>
                            <h2 className="text-3xl font-bold text-slate-900">Evidence for parents &amp; leadership</h2>
                            <ul className="space-y-3 text-slate-600">
                                {reportHighlights.map((item) => (
                                    <li key={item} className="flex gap-3">
                                        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-3xl border border-slate-100 shadow-lg bg-slate-50 p-6 reveal">
                            <ParentUIMockup />
                        </div>
                    </div>
                </section>

                <section id="learner-dashboard" className="py-20 bg-slate-900 text-white">
                    <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
                        <div className="space-y-6 reveal">
                            <p className="text-sm font-semibold text-indigo-200 uppercase tracking-[0.3em]">Learner dashboard</p>
                            <h2 className="text-3xl md:text-4xl font-bold">
                                A smart space for students to learn, revise, and ask doubts.
                            </h2>
                            <p className="text-slate-300">
                                Mirror the Vacademy learner experience with a personal command center that keeps everything one tap away.
                            </p>
                            <ul className="space-y-3 text-slate-200">
                                {learnerDashboardHighlights.map((item) => (
                                    <li key={item} className="flex gap-3">
                                        <span className="mt-1 inline-flex w-2.5 h-2.5 rounded-full bg-white"></span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="reveal">
                            <div className="rounded-[32px] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl">
                                <StudentUIMockup />
                            </div>
                        </div>
                    </div>
                </section>
                <section className="py-20 bg-white">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center space-y-3 reveal">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.3em]">Technology &amp; trust</p>
                            <h2 className="text-3xl font-bold text-slate-900">Engineered for scale and safety</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 mt-12">
                            {techPillars.map((pillar) => (
                                <div key={pillar.title} className="p-6 rounded-2xl border border-slate-100 shadow-sm reveal">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 mb-4">
                                        <pillar.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{pillar.title}</h3>
                                    <p className="text-sm text-slate-600 mt-2">{pillar.copy}</p>
                                </div>
                            ))}
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 mt-8">
                            {trustBadges.map((badge) => (
                                <div key={badge.title} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 reveal">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-indigo-600 mb-4">
                                        <badge.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{badge.title}</h3>
                                    <p className="text-sm text-slate-600 mt-2">{badge.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="faq" className="py-20 bg-slate-50">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="text-center space-y-3 reveal">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.3em]">FAQs</p>
                            <h2 className="text-3xl font-bold text-slate-900">All the details teams ask before switching</h2>
                        </div>
                        <div className="mt-10 space-y-4">
                            {faqItems.map((faq) => (
                                <details key={faq.question} className="bg-white border border-slate-200 rounded-2xl p-5 reveal">
                                    <summary className="cursor-pointer text-lg font-semibold text-slate-800">{faq.question}</summary>
                                    <p className="mt-3 text-slate-600 text-sm">{faq.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
                <section id="contact" className="relative py-20 bg-gradient-to-br from-indigo-600 to-slate-900 text-white overflow-hidden">
                    <div className="absolute inset-0 opacity-20" aria-hidden="true">
                        <GradientBackdrop />
                    </div>
                    <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6 reveal">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">Let&apos;s build your LMS</p>
                            <h2 className="text-3xl md:text-4xl font-bold">
                                Get the Vacademy experience with Alfanumrik&apos;s platform.
                            </h2>
                            <p className="text-indigo-100">
                                Book a walkthrough, connect on WhatsApp, or jump straight in with a 7-day pilot environment.
                            </p>
                            <div className="space-y-4 text-indigo-100">
                                <div className="flex items-center gap-3">
                                    <MailIcon className="w-5 h-5" />
                                    <a href="mailto:Sales@alfanumrik.com" className="hover:underline">
                                        Sales@alfanumrik.com
                                    </a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <PhoneIcon className="w-5 h-5" />
                                    <a href="tel:+919315940211" className="hover:underline">
                                        +91 93159 40211
                                    </a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPinIcon className="w-5 h-5" />
                                    <span>New Delhi, India</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="https://wa.me/919315940211?text=I%20want%20to%20experience%20the%20LMS"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn bg-emerald-400/20 border border-emerald-300 text-white"
                                >
                                    Connect on WhatsApp
                                </a>
                                <button onClick={onLaunch} className="btn btn-primary">
                                    Start Free Trial
                                </button>
                            </div>
                        </div>
                        <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl reveal">
                            <h3 className="text-2xl font-bold mb-2">Book a live demo</h3>
                            <p className="text-slate-500 mb-6">Tell us about your institution and we&apos;ll tailor the walkthrough.</p>
                            <form
                                className="space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    alert("Thank you! We'll reach out shortly.");
                                }}
                            >
                                <div>
                                    <input type="text" placeholder="Full Name" className="contact-input w-full" required />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input type="email" placeholder="Work Email" className="contact-input w-full" required />
                                    <input type="text" placeholder="Institute / Organization" className="contact-input w-full" required />
                                </div>
                                <textarea placeholder="What are you planning to build?" rows={4} className="contact-input w-full" required></textarea>
                                <button type="submit" className="btn btn-primary w-full py-3">
                                    Submit Request
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-900 text-slate-300">
                <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-bold">A</div>
                            <span className="text-xl font-bold text-white">Alfanumrik</span>
                        </div>
                        <p className="text-sm">
                            Vacademy-style LMS + assessment suite for institutes that expect premium experiences.
                        </p>
                        <div className="flex gap-4 text-white">
                            <a href="#" className="hover:text-indigo-300">
                                <TwitterIcon className="w-5 h-5" />
                            </a>
                            <a href="#" className="hover:text-indigo-300">
                                <LinkedInIcon className="w-5 h-5" />
                            </a>
                            <a href="#" className="hover:text-indigo-300">
                                <FacebookIcon className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-3">Platform</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#solutions" className="hover:text-white">
                                    Solutions
                                </a>
                            </li>
                            <li>
                                <a href="#modules" className="hover:text-white">
                                    Modules
                                </a>
                            </li>
                            <li>
                                <a href="#learner-dashboard" className="hover:text-white">
                                    Learner App
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-3">Resources</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#faq" className="hover:text-white">
                                    FAQs
                                </a>
                            </li>
                            <li>
                                <a href="#reports" className="hover:text-white">
                                    Analytics
                                </a>
                            </li>
                            <li>
                                <a href="#contact" className="hover:text-white">
                                    Support
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-3">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li>Privacy Policy</li>
                            <li>Terms of Service</li>
                            <li>Data Processing Addendum</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} Alfanumrik by Briusha Associates. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
