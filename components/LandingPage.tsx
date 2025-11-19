import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '../constants/icons';

interface LandingPageProps {
  onLaunch: () => void;
}

const navLinks = [
  { label: 'Solutions', target: 'solutions' },
  { label: 'Metrics', target: 'metrics' },
  { label: 'Audiences', target: 'audiences' },
  { label: 'Platform', target: 'platform' },
  { label: 'FAQ', target: 'faq' },
  { label: 'Contact', target: 'contact' },
];

const heroStats = [
  { value: '10,000+', label: 'Learners on Vacademy', helper: 'Trusted by institutes worldwide' },
  { value: '120+', label: 'Institutes Launched', helper: 'Across K-12, coaching & higher-ed' },
  { value: '4.9/5', label: 'Adoption Score', helper: 'Rated by teachers & admins' },
];

const managementFeatures = [
  {
    title: 'Effortless Management',
    description: 'Automate student enrollment, batch creation, content organisation and reminders with zero spreadsheets.',
  },
  {
    title: 'Customizable Learning Paths',
    description: "Tailor courses, study materials and assessments exactly the way your faculty wants to teach.",
  },
  {
    title: 'Seamless Communication',
    description: 'Push instant announcements, run doubt forums and keep every stakeholder aligned in minutes.',
  },
  {
    title: 'Advanced Progress Tracking',
    description: 'Get real-time insights into engagement, mastery and completion to trigger timely interventions.',
  },
];

const metrics = [
  { value: '1000+', label: 'Students Enrolled', detail: 'Active across CBSE & competitive programmes' },
  { value: '100+', label: 'Courses Created', detail: 'Rich media lessons, tests and micro-learning series' },
  { value: '1000+', label: 'Assignments Managed', detail: 'Auto-graded, reviewed and pushed to parents' },
];

const audienceSegments = [
  {
    title: 'Training Institutes',
    description: 'Deliver a white-labelled, AI-assisted classroom for distance and blended programmes.',
    highlights: ['Course Management', 'Custom Study Materials', 'Personalized Learning', 'Real-time Progress Tracking', 'Live Class & Doubt Rooms'],
    accent: 'from-orange-500/20 via-orange-500/10 to-orange-500/0 border-orange-200/60',
  },
  {
    title: 'Schools & Colleges',
    description: 'Unify ERP, LMS and assessments with competency-based planning that mirrors CBSE and NEP expectations.',
    highlights: ['Board exam pacing & planner', 'Attendance + transport dashboards', 'Fee & compliance workflows', 'Parent engagement on mobile'],
    accent: 'from-indigo-500/20 via-indigo-500/10 to-indigo-500/0 border-indigo-200/60',
  },
  {
    title: 'EdTech & L&D Teams',
    description: 'Launch immersive cohort and self-paced academies with monetisation, API hooks and analytics built in.',
    highlights: ['White-labelled portals', 'API-first content layer', 'Cohort orchestration toolkit', 'Revenue-share & billing controls'],
    accent: 'from-emerald-500/20 via-emerald-500/10 to-emerald-500/0 border-emerald-200/60',
  },
];

const dashboardHighlights = [
  'View enrolled courses, track progress and revisit adaptive content.',
  'Join upcoming live classes or replays with one click.',
  'Ask doubts, save notes and mark slides for revision later.',
  'Download certificates and receive every announcement in one place.',
];

const modules = [
  {
    title: 'Course Builder & Content Library',
    description: 'Mix live, recorded, documents, question banks, immersive slides and AI-generated study packs with granular access controls.',
  },
  {
    title: 'Assessments & Assignments',
    description: 'Design blueprints, auto-generate question papers, capture handwritten responses and push instant analytics to mentors.',
  },
  {
    title: 'Communication & Community',
    description: 'Forums, announcements, in-context chat and WhatsApp-ready nudges keep every learner and parent informed.',
  },
  {
    title: 'Analytics & Operations',
    description: 'Deep knowledge tracing dashboards, revenue trackers, fee reminders and compliance-ready exports.',
  },
];

const complianceBadges = [
  {
    icon: LockIcon,
    title: 'ISO/IEC 27001',
    description: 'Enterprise-grade security controls with encryption at rest and in transit.',
  },
  {
    icon: FileTextIcon,
    title: 'FERPA & GDPR',
    description: 'Privacy-first data handling for institutions across geographies.',
  },
  {
    icon: CheckCircleIcon,
    title: 'CBSE Validated Content',
    description: 'Every AI-generated asset passes human review for syllabus alignment.',
  },
];

const faqItems = [
  {
    question: 'What is Vacademy LMS?',
    answer:
      'Vacademy is an AI-powered learning and assessment platform purpose-built for institutes that need distance learning, live classes, recorded content and frontline analytics in one place.',
  },
  {
    question: 'How does Vacademy reduce faculty workload?',
    answer:
      'Automations handle enrolment, batch duplication, attendance, doubt management and blueprint-driven paper generation, freeing teachers to focus on mentoring.',
  },
  {
    question: 'What types of content can I add to courses?',
    answer:
      'Upload videos, SCORM files, PDFs, slides, podcasts, live sessions, question banks, adaptive quizzes and AI-generated study notes. Mix and match inside modules or drip schedules.',
  },
  {
    question: 'Can I manage different batches and sessions?',
    answer:
      'Yes. Create unlimited batches, map facilitators, reuse content, set prerequisites and run staggered cohorts across cities or centres.',
  },
  {
    question: 'How is engagement and mastery tracked?',
    answer:
      'A Deep Knowledge Tracing engine watches every interaction to surface risk alerts, mastery gaps, completion heatmaps and intervention-ready cohorts.',
  },
  {
    question: 'Can I control who sees what?',
    answer:
      'Role-based access, time-bound links, device controls and single-sign-on (including LTI 1.3) let you decide exactly how learners, faculty and parents participate.',
  },
  {
    question: 'Can I create and grade homework digitally?',
    answer:
      'Create templated or AI-generated assignments, accept handwritten uploads, auto-grade objective sections and push personalised feedback instantly.',
  },
];

const HeroBackdrop: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
    <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-cyan-400/30 blur-[140px]" />
    <div className="absolute top-10 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-500/30 blur-[180px]" />
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const whatsappUrl = useMemo(
    () =>
      'https://wa.me/919315940211?text=Hi%20Vacademy%2C%20I%27d%20love%20to%20experience%20the%207-day%20LMS%20trial.',
    []
  );

  return (
    <div className="bg-[#020617] text-white">
      <header
        className={`fixed inset-x-0 top-0 z-30 transition-all duration-300 ${
          isScrolled
            ? 'backdrop-blur-lg bg-[#020617]/85 border-b border-white/10 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className={`${containerClass} flex items-center justify-between py-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-lg font-bold tracking-tight">
              V
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Vacademy</p>
              <p className="text-base font-semibold text-white/90">AI-Powered LMS</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-white/70 lg:flex">
            {navLinks.map((link) => (
              <button
                key={link.target}
                onClick={() => scrollToSection(link.target)}
                className="transition hover:text-white"
                type="button"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="/book-demo?from=book-demo-home"
              className="hidden rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-cyan-300 hover:text-white sm:inline-flex"
            >
              Book a Demo
            </a>
            <button onClick={onLaunch} className="btn btn-primary px-4 py-2 text-sm font-semibold">
              Launch App
            </button>
          </div>
        </div>
      </header>

      <main className="pt-28 md:pt-32">
        <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-[#050a1f] via-[#050a1f] to-[#0b163a] py-20 lg:py-28">
          <HeroBackdrop />
          <div className={`${containerClass} relative grid items-center gap-12 lg:grid-cols-2`}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Trusted by 10,000+ users
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                The smartest, AI-powered LMS built for seamless distance learning
              </h1>
              <p className="mt-6 text-lg text-white/80">
                Step into the future with <span className="text-cyan-300 font-semibold">AI-powered</span> learning.
                Vacademy LMS features advanced tools for course creation, student management and real-time analytics so
                every cohort stays ahead.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/book-demo?from=book-demo-home"
                  className="btn btn-primary flex items-center gap-2 px-6 py-3 text-base font-semibold"
                >
                  <SparklesIcon className="h-5 w-5" /> Book a Demo
                </a>
                <a
                  href="https://dash.vacademy.io/signup"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white/90 transition hover:text-white"
                >
                  Sign Up Free
                </a>
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-semibold text-cyan-200">{stat.label}</p>
                    <p className="mt-1 text-xs text-white/70">{stat.helper}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-[28px] border border-white/15 bg-white/5 p-3 shadow-2xl backdrop-blur">
                <video
                  className="h-full w-full rounded-2xl"
                  src="https://vacademy-media-storage-public.s3.ap-south-1.amazonaws.com/Videos/Vacademy+LMS+updated.mp4"
                  poster="https://site-assets.plasmic.app/cd460c38e74e104997e6c4830080bc3c.jpg"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              </div>
              <div className="absolute -bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-6 rounded-2xl border border-white/10 bg-[#050a1f] px-6 py-4 shadow-xl">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/60">Live analytics</p>
                  <p className="text-2xl font-bold text-white">1.2M+</p>
                  <p className="text-xs text-white/60">Events processed weekly</p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/60">Avg. go-live time</p>
                  <p className="text-2xl font-bold text-white">12 days</p>
                  <p className="text-xs text-white/60">From kickoff to cohort launch</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="bg-white py-20 text-slate-900">
          <div className={`${containerClass} space-y-12`}>
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">Solutions</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Empower your institute with smarter learning & seamless management.
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Vacademy unifies content, live classes, assessments, operations and communication into one cohesive
                  operating system so teams stop hopping across mismatched tools.
                </p>
                <a
                  href="/book-demo?from=take-tour-home"
                  className="mt-6 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Take a Product Tour →
                </a>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-xl">
                <img
                  src="https://img.plasmic.app/img-optimizer/v1/img?src=https%3A%2F%2Fimg.plasmic.app%2Fimg-optimizer%2Fv1%2Fimg%2F2023ed5a164610bb08783459361410f9.webp&w=1200&q=75"
                  alt="Vacademy workspace"
                  className="w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {managementFeatures.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="metrics" className="bg-slate-50 py-20 text-slate-900">
          <div className={`${containerClass} text-center`}>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">Proof</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Where we stand</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              From CBSE schools and coaching networks to corporate academies, Vacademy scales reliably across hundreds of
              cohorts.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
                  <p className="text-4xl font-bold text-indigo-600">{metric.value}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{metric.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="audiences" className="bg-white py-20 text-slate-900">
          <div className={`${containerClass}`}>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">Who we serve</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Tailored experiences for every learning business</h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {audienceSegments.map((segment) => (
                <div
                  key={segment.title}
                  className={`rounded-3xl border bg-gradient-to-br ${segment.accent} p-6 text-slate-900 shadow`}
                >
                  <h3 className="text-xl font-semibold">{segment.title}</h3>
                  <p className="mt-3 text-sm text-slate-700">{segment.description}</p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-800">
                    {segment.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2">
                        <span className="text-indigo-500">•</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="relative overflow-hidden bg-[#070c26] py-20 text-white">
          <HeroBackdrop />
          <div className={`${containerClass} relative space-y-16`}>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Learner dashboard</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A smart space to learn and grow</h2>
                <p className="mt-4 text-white/80">
                  The Vacademy dashboard is each student’s personal command centre. It keeps learners organised, motivated
                  and ready for every milestone.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/80">
                  {dashboardHighlights.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button onClick={onLaunch} className="btn btn-primary px-6 py-3 text-sm font-semibold">
                    Launch Student View
                  </button>
                  <a
                    href="https://dash.vacademy.io/signup"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/80 transition hover:text-white"
                  >
                    Create Trial Account
                  </a>
                </div>
              </div>
              <div className="rounded-[30px] border border-white/15 bg-white/5 p-3 shadow-2xl backdrop-blur">
                <img
                  src="https://img.plasmic.app/img-optimizer/v1/img?src=https%3A%2F%2Fimg.plasmic.app%2Fimg-optimizer%2Fv1%2Fimg%2F1848e49c13442c5f627485f2d2b2df86.png&w=1600&q=75"
                  alt="Vacademy learner dashboard"
                  className="w-full rounded-2xl"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {modules.map((module) => (
                <div key={module.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
                  <h3 className="text-xl font-semibold text-white">{module.title}</h3>
                  <p className="mt-3 text-sm text-white/80">{module.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className="bg-white py-20 text-slate-900">
          <div className={`${containerClass}`}>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">Trust & compliance</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Built for safety, privacy and reliability</h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {complianceBadges.map((badge) => (
                <div key={badge.title} className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow">
                  <badge.icon className="mx-auto h-8 w-8 text-indigo-500" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{badge.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 py-16 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_60%)]" aria-hidden="true" />
          <div className={`${containerClass} relative flex flex-col gap-6 text-center lg:flex-row lg:items-center lg:text-left`}>
            <div className="flex-1">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80">Limited time offer</p>
              <h2 className="mt-2 text-3xl font-bold">Get a 7-day Vacademy LMS trial</h2>
              <p className="mt-3 text-white/90">
                Explore the complete suite with your own content, invite faculty and experience AI-assisted operations.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row">
              <a href={whatsappUrl} className="btn btn-primary bg-white px-6 py-3 text-slate-900 hover:bg-slate-100">
                Chat on WhatsApp
              </a>
              <a
                href="mailto:Sales@vacademy.io"
                className="rounded-full border border-white px-6 py-3 text-sm font-semibold text-white/90 transition hover:text-white"
              >
                Email Sales
              </a>
            </div>
          </div>
        </section>

        <section id="privacy" className="bg-white py-16 text-slate-900">
          <div className={`${containerClass} max-w-4xl space-y-5`}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">Privacy</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Our promise to protect your community</h2>
            </div>
            <p className="text-slate-600">
              Vacademy follows regional privacy laws including COPPA, FERPA and GDPR-K. Personally identifiable data is
              minimised, encrypted and never used for model training without explicit consent.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Role-based controls ensure only authorised staff can access sensitive learner records.</li>
              <li>LTI-based launches inherit your LMS security model for single sign-on and grade passback.</li>
              <li>Parents can request exports or deletions any time and we respond within 48 business hours.</li>
            </ul>
          </div>
        </section>

        <section id="terms" className="bg-slate-50 py-16 text-slate-900">
          <div className={`${containerClass} max-w-4xl space-y-5`}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">Terms</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Clear guardrails for responsible usage</h2>
            </div>
            <p className="text-slate-600">
              Every Vacademy workspace ships with acceptable-use, honour code and content ownership clauses so your
              legal teams can roll out with confidence.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Institutes own all uploaded or AI-generated instructional material.</li>
              <li>Reverse engineering, chegg-style sharing or plagiarism triggers automated flags.</li>
              <li>Vacademy guarantees 99.5% uptime backed by service credits in the unlikely event of downtime.</li>
            </ul>
          </div>
        </section>

        <section id="faq" className="bg-slate-50 py-20 text-slate-900">
          <div className={`${containerClass} max-w-3xl`}> 
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">FAQs</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
            </div>
            <div className="mt-10 space-y-4">
              {faqItems.map((item) => (
                <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer text-base font-semibold text-slate-900">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="bg-white py-20 text-slate-900">
          <div className={`${containerClass} grid gap-10 lg:grid-cols-2`}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">Contact</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Partner with Vacademy</h2>
              <p className="mt-4 text-slate-600">
                Whether you are an institute ready for full-scale transformation or a teacher piloting a new cohort, we’d
                love to collaborate.
              </p>
              <div className="mt-6 space-y-4 text-sm">
                <a href="mailto:Sales@vacademy.io" className="flex items-center gap-3 text-slate-700 hover:text-indigo-600">
                  <MailIcon className="h-5 w-5 text-indigo-500" /> Sales@vacademy.io
                </a>
                <a href="tel:+919315940211" className="flex items-center gap-3 text-slate-700 hover:text-indigo-600">
                  <PhoneIcon className="h-5 w-5 text-indigo-500" /> +91 93159 40211
                </a>
                <p className="flex items-center gap-3 text-slate-700">
                  <MapPinIcon className="h-5 w-5 text-indigo-500" /> New Delhi, India
                </p>
              </div>
              <div className="mt-6 flex gap-4">
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 p-3 text-slate-500 transition hover:text-indigo-600">
                  <TwitterIcon className="h-5 w-5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 p-3 text-slate-500 transition hover:text-indigo-600">
                  <LinkedInIcon className="h-5 w-5" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 p-3 text-slate-500 transition hover:text-indigo-600">
                  <FacebookIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow">
              <h3 className="text-xl font-semibold text-slate-900">Tell us about your institution</h3>
              <form
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  alert('Thank you! Our team will reach out shortly.');
                }}
              >
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Work Email"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Institute / Organisation"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <textarea
                  required
                  placeholder="What would you like to achieve with Vacademy?"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  rows={4}
                />
                <button type="submit" className="btn btn-primary w-full py-3 text-sm font-semibold">
                  Request a Callback
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#040a1a] py-12 text-white">
        <div className={`${containerClass} grid gap-10 md:grid-cols-2 lg:grid-cols-4`}>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-lg font-bold">
                V
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">Vacademy</p>
                <p className="text-base font-semibold text-white">Learning that learns you</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/70">
              The all-in-one LMS and assessment platform for institutes that expect more than content hosting.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Navigate</h4>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/70">
              {navLinks.map((link) => (
                <button key={link.target} onClick={() => scrollToSection(link.target)} className="w-fit text-left hover:text-white">
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Legal</h4>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/70">
              <a href="#privacy" className="hover:text-white">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-white">
                Terms of Service
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Get updates</h4>
            <p className="mt-4 text-sm text-white/70">Join our newsletter for product releases and case studies.</p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                alert('Subscribed!');
              }}
            >
              <input
                type="email"
                required
                placeholder="Work email"
                className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/60 focus:border-cyan-300 focus:outline-none"
              />
              <button type="submit" className="rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900">
                Join
              </button>
            </form>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Vacademy. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
