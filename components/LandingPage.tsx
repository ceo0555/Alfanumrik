import React, { useState, useEffect } from 'react';
import { SparklesIcon, MailIcon, PhoneIcon, MapPinIcon, TwitterIcon, LinkedInIcon, FacebookIcon, LockIcon, FileTextIcon, CheckCircleIcon, CpuIcon, BrainCircuitIcon, CodeIcon } from '../constants/icons';
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

type Role = 'student' | 'teacher' | 'school' | 'parent';

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
    const [activeRole, setActiveRole] = useState<Role>('student');
    const [isScrolled, setIsScrolled] = useState(false);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const handleRoleChange = (newRole: Role) => {
        if (newRole === activeRole) return;
        setIsFading(true);
        setTimeout(() => {
            setActiveRole(newRole);
            setIsFading(false);
        }, 300);
    };

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    const roleContent = {
        student: { title: "Unlock Your Genius, Not Your Textbook.", description: "Our system models your unique cognitive fingerprint, predicting areas of difficulty and scheduling spaced repetition reviews to transfer knowledge from working memory to long-term storage, ensuring exam readiness is a byproduct of true mastery.", features: ["Adaptive Learning Path", "AI-Powered Live Tutor", "Interactive Simulations & Videos", "Gamified Practice & Rewards"], component: <StudentUIMockup /> },
        teacher: { title: "The Classroom That Knows Your Name.", description: "Automate psychometrically-sound paper generation, get AI-driven insights into common misconceptions across your class, and deploy targeted remedial assignments with a single click. Focus on mentoring, not just marking.", features: ["AI Question Paper Generator", "Automated Attendance & Catch-up", "Live Classroom Dashboards", "SAFAL & FLN Diagnostic Tools"], component: <TeacherUIMockup /> },
        school: { title: "The Central Nervous System for Your Institution.", description: "Monitor real-time academic health, streamline operations from transport to finance, and ensure pedagogical consistency across all grades. Make data-backed strategic decisions that elevate your school's academic standing.", features: ["Full-Fledged School ERP", "Operational Dashboards", "Board Exam Planner & Pacing", "LTI & LMS Integration"], component: <SchoolUIMockup /> },
        parent: { title: "Gain Unprecedented Insight Into Your Child's Cognitive Development.", description: "Our AI-generated reports translate complex learning data into clear, actionable insights, highlighting conceptual strengths and offering specific, research-backed strategies to support their learning at home.", features: ["AI-Generated Performance Reports", "Real-time Progress Tracking", "Actionable Insights & Tips", "Attendance & Assignment Alerts"], component: <ParentUIMockup /> }
    };
    const selectedRoleContent = roleContent[activeRole];

    return (
        <div className="bg-white text-slate-800 font-sans leading-relaxed">
            <header id="landing-page-header" className={`sticky top-0 z-10 transition-all duration-300 ${isScrolled ? 'scrolled' : ''}`}>
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-inner transform rotate-[-12deg]"><span className="text-white font-bold text-lg font-poppins transform rotate-[12deg]">A</span></div><span className="text-xl font-bold font-poppins text-slate-800">Alfanumrik</span></div>
                    <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
                        <a href="#features-in-action" onClick={(e) => scrollToSection(e, 'features-in-action')} className="hover:text-indigo-600">Features</a>
                        <a href="#platform" onClick={(e) => scrollToSection(e, 'platform')} className="hover:text-indigo-600">Platform</a>
                        <a href="#research" onClick={(e) => scrollToSection(e, 'research')} className="hover:text-indigo-600">Research</a>
                        <a href="#technology" onClick={(e) => scrollToSection(e, 'technology')} className="hover:text-indigo-600">Technology</a>
                        <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className="hover:text-indigo-600">Contact</a>
                    </div>
                    <button onClick={onLaunch} className="btn btn-primary px-5 py-2 text-sm">Launch App</button>
                </nav>
            </header>

            <main>
                <section id="home" className="relative py-20 md:py-32 text-center bg-slate-50 overflow-hidden">
                    <div className="hero-shapes"><div style={{ width: '60px', height: '60px', top: '10vh', left: '10vw', animationDuration: '25s' }}></div><div style={{ width: '100px', height: '100px', top: '50vh', left: '80vw', animationDuration: '18s', animationDelay: '2s' }}></div><div style={{ width: '30px', height: '30px', top: '80vh', left: '20vw', animationDuration: '30s' }}></div></div>
                    <div className="container mx-auto px-6 relative">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight animate-slide-in-up">Learning That Learns You.</h1>
                        <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600 animate-slide-in-up-hero">Alfanumrik is an <strong>AI-powered adaptive learning app for CBSE</strong> students. We leverage proprietary deep learning models and proven cognitive science frameworks—like <strong>Deep Knowledge Tracing (DKT)</strong> and <strong>Spaced Repetition (FSRS)</strong>—to engineer a hyper-personalized learning ecosystem for the <strong>CBSE curriculum</strong>.</p>
                        <button onClick={onLaunch} className="mt-8 btn btn-primary px-8 py-3 text-lg animate-slide-in-up-hero" style={{ animationDelay: '0.4s' }}>Get Started Now</button>
                    </div>
                </section>

                <section className="py-12 bg-white"><div className="container mx-auto px-6 text-center reveal"><h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Trusted by Leading Institutions</h4><div className="mt-6 flex justify-center items-center gap-10 md:gap-16 opacity-60 grayscale flex-wrap">
                    <svg height="40" viewBox="0 0 120 40"><text x="60" y="25" textAnchor="middle" fontFamily="Poppins" fontSize="12" fontWeight="600" fill="#475569">SCHOOL LOGO</text></svg>
                    <svg height="40" viewBox="0 0 120 40"><text x="60" y="25" textAnchor="middle" fontFamily="Poppins" fontSize="12" fontWeight="600" fill="#475569">ANOTHER SCHOOL</text></svg>
                    <svg height="40" viewBox="0 0 120 40"><text x="60" y="25" textAnchor="middle" fontFamily="Poppins" fontSize="12" fontWeight="600" fill="#475569">ACADEMY INC.</text></svg>
                </div></div></section>

                <section id="about" className="py-20 bg-white">
                    <div className="container mx-auto px-6 max-w-4xl text-center">
                        <div className="reveal">
                            <h2 className="text-3xl md:text-4xl font-bold">Every Brain Deserves Its Own Teacher.</h2>
                            <p className="mt-4 text-slate-600 text-lg">For over a century, the educational paradigm has remained largely unchanged: a one-to-many broadcast model designed for industrial-era scale, not individual cognitive development. This 'factory model' inevitably leaves students behind and places an unsustainable burden on educators. Alfanumrik was founded on a simple, first-principles question: what if we could build an educational ecosystem engineered around the individual learner?</p>
                            <p className="mt-4 text-slate-600 text-lg"><strong>Alfanumrik, a product of Briusha Associates,</strong> is the result of years of rigorous R&amp;D at the intersection of machine learning, cognitive psychology, and pedagogical science. Our mission is to provide every student with a personal cognitive tutor that creates a unique <strong>personalized learning path</strong>, every teacher with an intelligent co-pilot, and every institution with a unified data plane to drive academic excellence.</p>
                        </div>
                    </div>
                </section>

                <section id="features-in-action" className="py-20 bg-slate-50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12 reveal"><h2 className="text-3xl md:text-4xl font-bold">Features in Action</h2><p className="mt-2 text-slate-600">See how Alfanumrik transforms the educational experience.</p></div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="reveal"><h3 className="text-2xl font-bold">Adaptive Lesson Player</h3><p className="mt-2 text-slate-600">Our player is more than a content delivery system; it's a real-time diagnostic tool. Each interaction refines our DKT model of the student's knowledge state, dynamically inserting micro-remediation loops or accelerating content to ensure optimal cognitive load and engagement.</p></div>
                            <div className="reveal browser-mockup"><div className="browser-mockup-header"><div className="bg-red-400"></div><div className="bg-yellow-400"></div><div className="bg-green-400"></div></div><AdaptiveLessonPlayerMockup /></div>
                        </div>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-16">
                            <div className="reveal browser-mockup lg:order-last"><div className="browser-mockup-header"><div className="bg-red-400"></div><div className="bg-yellow-400"></div><div className="bg-green-400"></div></div><SchoolOSDashboardMockup /></div>
                            <div className="reveal lg:order-first"><h3 className="text-2xl font-bold">School Operating System</h3><p className="mt-2 text-slate-600">Unify disparate data streams into a single, actionable intelligence layer. Our ERP provides principals with predictive analytics on student performance, operational efficiency metrics for resource management, and strategic planning tools aligned with NCF guidelines.</p></div>
                        </div>
                    </div>
                </section>
                
                <section id="platform" className="py-20 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12 reveal"><h2 className="text-3xl md:text-4xl font-bold">A Vertically Integrated Solution</h2></div>
                        <div className="flex justify-center mb-8 border-b">
                            {Object.keys(roleContent).map(role => (<button key={role} onClick={() => handleRoleChange(role as Role)} className={`px-4 py-2 text-sm md:text-base font-semibold capitalize border-b-2 transition-colors ${activeRole === role ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{role}s</button>))}
                        </div>
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-opacity duration-300 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                             <div>
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-800">{selectedRoleContent.title}</h3>
                                <p className="mt-4 text-slate-600">{selectedRoleContent.description}</p>
                                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectedRoleContent.features.map(feature => (<li key={feature} className="flex items-center"><div className="w-5 h-5 flex items-center justify-center bg-green-100 rounded-full mr-2"><span className="text-green-600 text-xs font-bold">✓</span></div><span className="text-slate-700 text-sm">{feature}</span></li>))}
                                </ul>
                            </div>
                            <div className="rounded-xl shadow-lg overflow-hidden border">
                                {selectedRoleContent.component}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="research" className="py-20 bg-slate-50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12 reveal"><h2 className="text-3xl md:text-4xl font-bold">Adaptive Learning. Actual Results.</h2><p className="mt-2 text-slate-600 max-w-2xl mx-auto">Our platform isn't just technology; it's applied pedagogy. We build upon established, peer-reviewed research in cognitive science and education.</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <a href="#" onClick={(e) => e.preventDefault()} className="block p-6 bg-white rounded-xl shadow-sm border research-card reveal" style={{transitionDelay: '100ms'}}><h3 className="font-bold text-indigo-600">Deep Knowledge Tracing (DKT)</h3><p className="text-sm text-slate-600 mt-2">At the core of our adaptive engine is a recurrent neural network that analyzes the entire sequence of a student's answers. This allows us to model their knowledge state with high fidelity, predicting performance and identifying conceptual gaps before they become critical.</p></a>
                            <a href="#" onClick={(e) => e.preventDefault()} className="block p-6 bg-white rounded-xl shadow-sm border research-card reveal" style={{transitionDelay: '300ms'}}><h3 className="font-bold text-indigo-600">Free Spaced Repetition Scheduler (FSRS)</h3><p className="text-sm text-slate-600 mt-2">Combatting the 'forgetting curve' is critical. We've implemented a state-of-the-art spaced repetition algorithm based on a three-component model of memory (stability, retrievability, difficulty) to schedule reviews at the scientifically optimal moment.</p></a>
                            <a href="#" onClick={(e) => e.preventDefault()} className="block p-6 bg-white rounded-xl shadow-sm border research-card reveal" style={{transitionDelay: '500ms'}}><h3 className="font-bold text-indigo-600">Generative Models in Pedagogy</h3><p className="text-sm text-slate-600 mt-2">We utilize state-of-the-art Large Language Models, including <strong>Google's Gemini 2.5 Pro</strong>, not just for content, but as pedagogical tools. They power our Socratic dialogue engine, generate nuanced feedback for our <strong>AI tutor</strong>, and create diverse, <strong>CBSE-aligned</strong> assessment items.</p></a>
                        </div>
                    </div>
                </section>
                
                <section id="technology" className="py-20 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12 reveal">
                            <h2 className="text-3xl md:text-4xl font-bold">Engineered for Excellence: Our Technology Stack</h2>
                            <p className="mt-2 text-slate-600 max-w-2xl mx-auto">We build on a foundation of cutting-edge, reliable technologies to deliver a world-class educational experience.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <div className="text-center p-6 reveal">
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-indigo-100 text-indigo-500">
                                    <CpuIcon className="w-8 h-8"/>
                                </div>
                                <h3 className="font-bold text-lg">AI & Machine Learning</h3>
                                <p className="text-sm text-slate-500 mt-2">Our platform's intelligence is powered by <strong>Google's Gemini 2.5 Pro</strong>, enabling advanced reasoning, content generation, and the AI-powered features that make learning truly interactive and personalized.</p>
                            </div>
                            <div className="text-center p-6 reveal" style={{transitionDelay: '200ms'}}>
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-indigo-100 text-indigo-500">
                                    <BrainCircuitIcon className="w-8 h-8"/>
                                </div>
                                <h3 className="font-bold text-lg">Cognitive Science Engine</h3>
                                <p className="text-sm text-slate-500 mt-2">We go beyond standard AI by implementing proven cognitive models like <strong>Deep Knowledge Tracing (DKT)</strong> and <strong>FSRS</strong> to accurately model student knowledge and memory, ensuring our adaptive learning paths are scientifically optimized.</p>
                            </div>
                            <div className="text-center p-6 reveal" style={{transitionDelay: '400ms'}}>
                                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-indigo-100 text-indigo-500">
                                    <CodeIcon className="w-8 h-8"/>
                                </div>
                                <h3 className="font-bold text-lg">Modern & Secure Platform</h3>
                                <p className="text-sm text-slate-500 mt-2">Built on a reliable stack including <strong>React and TypeScript</strong>, our application is designed to be fast, responsive, and secure. We are also <strong>LTI 1.3 compliant</strong>, allowing for seamless integration with your school's existing Learning Management System (LMS).</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section id="compliance" className="py-20 bg-slate-50">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12 reveal"><h2 className="text-3xl md:text-4xl font-bold">Our Commitment & Compliance</h2><p className="mt-2 text-slate-600 max-w-2xl mx-auto">We are committed to the highest standards of data security, privacy, and pedagogical accuracy.</p></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            <div className="compliance-badge reveal"><div className="compliance-badge-icon"><LockIcon className="w-8 h-8"/></div><h3 className="font-bold">ISO/IEC 27001 Certified</h3><p className="text-sm text-slate-500 mt-1">Our information security management system is certified, ensuring your data is protected with enterprise-grade security controls.</p></div>
                            <div className="compliance-badge reveal" style={{transitionDelay: '200ms'}}><div className="compliance-badge-icon"><FileTextIcon className="w-8 h-8"/></div><h3 className="font-bold">FERPA & GDPR Compliant</h3><p className="text-sm text-slate-500 mt-1">We adhere to global data privacy regulations, including the Family Educational Rights and Privacy Act, to protect student data.</p></div>
                            <div className="compliance-badge reveal" style={{transitionDelay: '400ms'}}><div className="compliance-badge-icon"><CheckCircleIcon className="w-8 h-8"/></div><h3 className="font-bold">CBSE Content Validated</h3><p className="text-sm text-slate-500 mt-1">All AI-generated educational content undergoes rigorous validation to ensure 100% alignment with the latest CBSE curriculum.</p></div>
                        </div>
                    </div>
                </section>
                
                <section id="testimonials" className="py-20 bg-white">
                    <div className="container mx-auto px-6 reveal">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">What People Are Saying</h2>
                            <p className="mt-4 text-xl md:text-2xl font-bold text-indigo-600">"Because Average Was Never Your Destiny"</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="testimonial-card reveal"><img src="https://placehold.co/48x48/e0e7ff/4338ca" alt="avatar" className="testimonial-card-avatar rounded-full w-12 h-12" /><div className="pl-4"><p className="text-slate-600">"The adaptive lessons are amazing. I used to struggle with trigonometry, but Alfanumrik kept giving me small practice problems and explanations until it just 'clicked'. My confidence for the board exams is so much higher now."</p><div className="mt-4 font-semibold">- Rohan S., Class 10 Student</div></div></div>
                            <div className="testimonial-card reveal" style={{transitionDelay: '200ms'}}><img src="https://placehold.co/48x48/c7d2fe/4338ca" alt="avatar" className="testimonial-card-avatar rounded-full w-12 h-12" /><div className="pl-4"><p className="text-slate-600">"The AI Question Paper Generator is a game-changer. I created a full 80-mark pre-board paper, perfectly aligned with my blueprint and CBSE competency weightage, in under 10 minutes. This has given me back hours every week."</p><div className="mt-4 font-semibold">- Mrs. Davis, Science Teacher</div></div></div>
                            <div className="testimonial-card reveal" style={{transitionDelay: '400ms'}}><img src="https://placehold.co/48x48/a5b4fc/4338ca" alt="avatar" className="testimonial-card-avatar rounded-full w-12 h-12" /><div className="pl-4"><p className="text-slate-600">"The 'Live Pacing Guide' in the Board Planner is incredible. For the first time, I have a real-time dashboard showing exactly where each class is in the syllabus against our academic calendar. It allows us to be proactive, not reactive."</p><div className="mt-4 font-semibold">- Mr. Singh, Principal</div></div></div>
                        </div>
                    </div>
                </section>
                
                <section id="faq" className="py-20 bg-slate-50">
                    <div className="container mx-auto px-6 max-w-3xl">
                        <div className="text-center mb-12 reveal"><h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2></div>
                        <div className="faq space-y-4 reveal">
                            <details><summary>Is this aligned with the CBSE curriculum?</summary><div className="text-slate-600 text-sm mt-2">Absolutely. Our entire content generation and assessment framework is algorithmically aligned with the latest CBSE syllabus, learning outcomes, competency weightages, and National Curriculum Framework (NCF) guidelines.</div></details>
                            <details><summary>How does the AI personalization work?</summary><div className="text-slate-600 text-sm mt-2">Our system uses a Deep Knowledge Tracing (DKT) model. Every answer you give updates the model's prediction of your mastery for thousands of underlying concepts. The platform then uses these predictions to create a unique learning path for you in real-time.</div></details>
                            <details><summary>Can this integrate with our school's existing LMS?</summary><div className="text-slate-600 text-sm mt-2">Yes. Alfanumrik is fully compliant with the LTI 1.3 standard, providing secure, seamless integration with major Learning Management Systems like Moodle, Canvas, and Blackboard for single sign-on (SSO) and AGS-based grade passback.</div></details>
                            <details><summary>What technology does Alfanumrik use?</summary><div className="text-slate-600 text-sm mt-2">Our platform is built on a foundation of cutting-edge technology. The core intelligence is powered by <strong>Google's Gemini 2.5 Pro</strong> AI model. Our adaptive learning engine uses advanced cognitive science models like <strong>Deep Knowledge Tracing (DKT)</strong> and <strong>Spaced Repetition (FSRS)</strong>. The application itself is a modern web app built with React and TypeScript for a fast and reliable experience.</div></details>
                        </div>
                    </div>
                </section>

                <section id="privacy" className="py-20 bg-white">
                    <div className="container mx-auto px-6 max-w-4xl legal-doc">
                        <div className="text-center mb-12 reveal"><h2 className="text-3xl md:text-4xl font-bold">Privacy Policy</h2><p className="mt-2 text-slate-500">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                        <div className="reveal">
                            <h3>1. Introduction</h3>
                            <p>This Privacy Policy explains how Alfanumrik ("we," "us," "our"), a product of Briusha Associates, collects, uses, and discloses information about our users. This policy applies to all users, including students, parents, teachers, and school administrators.</p>
                            <h3>2. Information We Collect</h3>
                            <h4>a. Information Provided by Users:</h4>
                            <ul>
                                <li><strong>Student Information:</strong> Name, grade, and progress data.</li>
                                <li><strong>Teacher & School Information:</strong> Name, email, school affiliation, and classes managed.</li>
                            </ul>
                            <h4>b. Information from LTI Integration:</h4>
                            <p>When you access Alfanumrik through an LMS, we receive user ID, name, roles, and course context as provided by the LMS.</p>
                            <h4>c. Information Collected Automatically:</h4>
                            <p>We collect usage data, such as features accessed, time spent, and performance on assessments, to power our adaptive learning engine and improve our services.</p>
                            <h3>3. How We Use Your Information</h3>
                            <ul>
                                <li>To provide, maintain, and personalize our services.</li>
                                <li>To generate student progress reports for teachers, parents, and administrators.</li>
                                <li>To train and improve our AI models. All data used for training is anonymized and aggregated to protect individual privacy.</li>
                                <li>To comply with legal obligations and school requirements.</li>
                            </ul>
                            <h3>4. Data Security</h3>
                            <p>We implement robust security measures, aligned with ISO/IEC 27001 standards, including encryption of data at rest and in transit, to protect your information from unauthorized access.</p>
                            <h3>5. Children's Privacy</h3>
                            <p>We are compliant with the Children's Online Privacy Protection Act (COPPA) and GDPR-K. We do not collect personal information from children without consent from a parent or school.</p>
                        </div>
                    </div>
                </section>

                <section id="terms" className="py-20 bg-slate-50">
                    <div className="container mx-auto px-6 max-w-4xl legal-doc">
                        <div className="text-center mb-12 reveal"><h2 className="text-3xl md:text-4xl font-bold">Terms of Service</h2></div>
                        <div className="reveal">
                            <h3>1. Acceptance of Terms</h3>
                            <p>By accessing or using the Alfanumrik platform, you agree to be bound by these Terms of Service. If you are a school, these terms supplement your institutional agreement.</p>
                            <h3>2. Acceptable Use</h3>
                            <p>You agree not to use the platform to: (a) engage in any form of academic dishonesty; (b) reverse-engineer, decompile, or attempt to extract the source code of our software or AI models; (c) disrupt the integrity or performance of the platform.</p>
                            <h3>3. Intellectual Property</h3>
                            <p>All content and software on the Alfanumrik platform, including AI models, lesson content, and branding, are the exclusive property of Briusha Associates. You are granted a limited, non-exclusive license to use the platform for educational purposes.</p>
                            <h3>4. Disclaimer of Warranties</h3>
                            <p>The service is provided "as is" without any warranties. While we strive for accuracy, we do not guarantee any specific academic outcomes from using the platform.</p>
                            <h3>5. Limitation of Liability</h3>
                            <p>To the fullest extent permitted by law, Briusha Associates shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our service.</p>
                        </div>
                    </div>
                </section>
                
                <section id="contact" className="py-20 bg-white">
                    <div className="container mx-auto px-6 max-w-4xl"><div className="text-center mb-12 reveal"><h2 className="text-3xl md:text-4xl font-bold">Partner with Us</h2><p className="mt-2 text-slate-600 max-w-2xl mx-auto">Join us in deploying a new paradigm of learning. Whether you're an institution ready for systemic transformation or a teacher seeking to pilot our platform, we're ready to collaborate.</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="reveal"><form onSubmit={e => { e.preventDefault(); alert("Thank you for your message!"); }}><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><input type="text" placeholder="Your Name" className="contact-input w-full" required/></div><div><input type="email" placeholder="Your Email" className="contact-input w-full" required/></div></div><div className="mt-4"><input type="text" placeholder="Subject" className="contact-input w-full" required/></div><div className="mt-4"><textarea placeholder="Your Message" rows={5} className="contact-input w-full" required></textarea></div><button type="submit" className="btn btn-primary w-full mt-4 py-3">Send Message</button></form></div>
                            <div className="reveal"><h3 className="font-bold text-lg mb-4">Contact Information</h3><div className="space-y-4 text-slate-600">
                                <div className="flex items-start gap-3"><MailIcon className="w-5 h-5 mt-1 text-indigo-500"/><a href="mailto:Sales@alfanumrik.com" className="hover:text-indigo-600">Sales@alfanumrik.com</a></div>
                                <div className="flex items-start gap-3"><PhoneIcon className="w-5 h-5 mt-1 text-indigo-500"/><a href="tel:+919315940211" className="hover:text-indigo-600">+91 9315940211</a></div>
                                <div className="flex items-start gap-3"><MapPinIcon className="w-5 h-5 mt-1 text-indigo-500"/><span>New Delhi, India</span></div>
                            </div></div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-800 text-slate-400">
                <div className="container mx-auto px-6 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        <div className="col-span-2 lg:col-span-2"><div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center shadow-inner transform rotate-[-12deg]"><span className="text-white font-bold text-lg font-poppins transform rotate-[12deg]">A</span></div><span className="text-xl font-bold font-poppins text-white">Alfanumrik</span></div><p className="text-sm">The intelligent platform for modern CBSE education.</p></div>
                        <div><h4 className="font-semibold text-white mb-2">Platform</h4><ul className="space-y-1 text-sm">
                            <li><a href="#platform" onClick={(e) => scrollToSection(e, 'platform')} className="hover:text-white">For Students</a></li>
                            <li><a href="#platform" onClick={(e) => scrollToSection(e, 'platform')} className="hover:text-white">For Teachers</a></li>
                            <li><a href="#platform" onClick={(e) => scrollToSection(e, 'platform')} className="hover:text-white">For Schools</a></li>
                        </ul></div>
                        <div><h4 className="font-semibold text-white mb-2">Company</h4><ul className="space-y-1 text-sm">
                            <li><a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="hover:text-white">About Us</a></li>
                            <li><a href="#research" onClick={(e) => scrollToSection(e, 'research')} className="hover:text-white">Research</a></li>
                            <li><a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className="hover:text-white">Contact</a></li>
                        </ul></div>
                        <div><h4 className="font-semibold text-white mb-2">Legal</h4><ul className="space-y-1 text-sm">
                            <li><a href="#privacy" onClick={(e) => scrollToSection(e, 'privacy')} className="hover:text-white">Privacy Policy</a></li>
                            <li><a href="#terms" onClick={(e) => scrollToSection(e, 'terms')} className="hover:text-white">Terms of Service</a></li>
                        </ul></div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center text-sm">
                        <p>&copy; {new Date().getFullYear()} Alfanumrik by Briusha Associates. All rights reserved.</p>
                        <div className="flex gap-4 mt-4 sm:mt-0"><a href="#" className="hover:text-white"><TwitterIcon className="w-5 h-5"/></a><a href="#" className="hover:text-white"><LinkedInIcon className="w-5 h-5"/></a><a href="#" className="hover:text-white"><FacebookIcon className="w-5 h-5"/></a></div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;