import React from 'react';
import { explorationItems, ExplorationItem } from '../../constants/explorations';
import { BrainCircuitIcon, GlobeIcon, DatabaseIcon } from '../../constants/icons';

const ExplorationHub: React.FC = () => {

    const sections: {
        title: string;
        icon: React.FC<{className?: string}>;
        type: ExplorationItem['type'];
        description: string;
    }[] = [
        { title: "From the Lab", icon: BrainCircuitIcon, type: 'research', description: "Simplified summaries of cutting-edge research papers relevant to your subjects." },
        { title: "Global Connect", icon: GlobeIcon, type: 'global', description: "See how your syllabus concepts apply to real-world technologies, events, and challenges across the globe." },
        { title: "Data Dive", icon: DatabaseIcon, type: 'data', description: "Explore interesting datasets to practice your analytical skills and see the power of data firsthand." },
    ];

    const Card: React.FC<{ item: ExplorationItem }> = ({ item }) => (
        <div className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:shadow-xl hover:border-transparent transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-lg line-clamp-2 flex-1 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </div>
            <p className="text-sm text-slate-600 mt-2 flex-grow leading-relaxed line-clamp-3">{item.summary}</p>
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                    {item.subjects.map(subject => (
                        <span key={subject} className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">{subject}</span>
                    ))}
                </div>
                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1">
                    Explore
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );

    return (
        <div className="animate-slide-in-up space-y-12">
            {/* Hero Section */}
            <div className="text-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 md:p-12 border border-indigo-100">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                </div>
                <h1 className="text-4xl font-extrabold text-slate-800 mb-3">Explore Beyond the Syllabus</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Your courses from teachers will appear here. In the meantime, dive into our curated collection of research papers, global case studies, and data sets to broaden your horizons.
                </p>
            </div>
            
            {/* Exploration Sections */}
            {sections.map(section => (
                <div key={section.type}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <section.icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold text-slate-800">{section.title}</h2>
                            <p className="text-slate-600 mt-1">{section.description}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {explorationItems.filter(item => item.type === section.type).map(item => (
                            <Card key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ExplorationHub;
