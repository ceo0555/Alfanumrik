import React from 'react';
import { 
    SparklesIcon, 
    BookIcon, 
    UserGroupIcon, 
    ChartBarIcon, 
    PlayIcon,
    CheckCircleIcon,
    LightningBoltIcon,
    AcademicCapIcon
} from '../../constants/icons';

interface LmsLandingProps {
    onGetStarted: () => void;
}

const LmsLanding: React.FC<LmsLandingProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 font-semibold text-sm mb-6">
                        <SparklesIcon className="w-4 h-4" />
                        <span>Trusted by 10,000+ learners</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 mb-6">
                        The smartest, <span className="text-indigo-600">AI-powered LMS</span> built for seamless distance learning
                    </h1>
                    <h2 className="text-xl md:text-2xl text-slate-600 mb-8">
                        Step Into the Future with <span className="font-bold text-indigo-600">AI-Powered</span> Learning
                    </h2>
                    <p className="text-lg text-slate-600 mb-12 max-w-3xl mx-auto">
                        Our LMS features advanced tools for course creation, student management, and real-time learning analytics.
                    </p>
                    
                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button 
                            onClick={onGetStarted}
                            className="btn btn-primary text-lg px-8 py-4 flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <PlayIcon className="w-5 h-5" />
                            Get Started
                        </button>
                        <button 
                            onClick={onGetStarted}
                            className="btn bg-white text-indigo-600 border-2 border-indigo-600 text-lg px-8 py-4 hover:bg-indigo-50"
                        >
                            Take a Tour
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                    <span className="text-slate-700">Empower Your Institute with</span>{' '}
                    <span className="text-indigo-600">Smarter Learning & Seamless Management</span>!
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                    {/* Feature Card 1 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
                        <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                            <LightningBoltIcon className="w-8 h-8 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Effortless Management</h3>
                        <p className="text-slate-600">
                            Automate student enrollment, batch creation, and content organization reducing hassle.
                        </p>
                    </div>

                    {/* Feature Card 2 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                            <BookIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Rich Course Creation</h3>
                        <p className="text-slate-600">
                            Create engaging courses with videos, interactive content, quizzes, and AI-generated materials.
                        </p>
                    </div>

                    {/* Feature Card 3 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
                        <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                            <ChartBarIcon className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Real-time Analytics</h3>
                        <p className="text-slate-600">
                            Track student progress, engagement, and performance with detailed analytics and insights.
                        </p>
                    </div>

                    {/* Feature Card 4 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
                        <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                            <UserGroupIcon className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Student Management</h3>
                        <p className="text-slate-600">
                            Easily manage student profiles, enrollments, and track their learning journey.
                        </p>
                    </div>

                    {/* Feature Card 5 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
                        <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                            <AcademicCapIcon className="w-8 h-8 text-pink-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">AI-Powered Learning</h3>
                        <p className="text-slate-600">
                            Personalized learning paths, AI tutoring, and adaptive assessments for every student.
                        </p>
                    </div>

                    {/* Feature Card 6 */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
                        <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                            <CheckCircleIcon className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">Assignment & Grading</h3>
                        <p className="text-slate-600">
                            Streamlined assignment distribution, submission, and automated grading with feedback.
                        </p>
                    </div>
                </div>
            </section>

            {/* Learner Dashboard Preview */}
            <section className="container mx-auto px-4 py-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl my-16">
                <div className="text-center text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        A Smart Space to Learn and Grow
                    </h1>
                    <h2 className="text-2xl md:text-3xl mb-8 text-indigo-100">
                        Vacademy's Learner Dashboard
                    </h2>
                    <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
                        Students get a personalized dashboard with AI assistance, progress tracking, gamification, and seamless access to all their courses.
                    </p>
                    <button 
                        onClick={onGetStarted}
                        className="btn bg-white text-indigo-600 hover:bg-indigo-50 text-lg px-8 py-4"
                    >
                        Explore Dashboard
                    </button>
                </div>
            </section>

            {/* Benefits List */}
            <section className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-800">
                        Why Choose Our LMS?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            'Seamless video conferencing integration',
                            'Interactive whiteboard and collaboration tools',
                            'Mobile-friendly responsive design',
                            'Secure cloud-based storage',
                            'Automated reporting and certificates',
                            'Parent and teacher communication portal',
                            'Multi-language support',
                            'LTI integration with major platforms'
                        ].map((benefit, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                                <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                <span className="text-slate-700 font-medium">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-12 md:p-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Learning Experience?
                    </h2>
                    <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                        Join thousands of educators and students already using our platform.
                    </p>
                    <button 
                        onClick={onGetStarted}
                        className="btn btn-primary text-lg px-10 py-4 shadow-xl hover:shadow-2xl transition-shadow"
                    >
                        Start Your Free Trial
                    </button>
                </div>
            </section>
        </div>
    );
};

export default LmsLanding;
