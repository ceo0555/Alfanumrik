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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col hover:shadow-md hover:border-indigo-300 transition-all">
            <h4 className="font-bold text-slate-800 text-base">{item.title}</h4>
            <p className="text-sm text-slate-600 mt-2 flex-grow">{item.summary}</p>
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                <div className="flex flex-wrap gap-1">
                    {item.subjects.map(subject => (
                        <span key={subject} className="text-2xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{subject}</span>
                    ))}
                </div>
                <button className="text-xs font-bold text-indigo-600 hover:underline">Explore</button>
            </div>
        </div>
    );

    return (
        <div className="animate-slide-in-up space-y-12">
            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-slate-800">Explore Beyond the Syllabus</h1>
                <p className="text-slate-500 mt-2 max-w-2xl mx-auto">Your courses from teachers will appear here. In the meantime, dive into our curated collection of research papers, global case studies, and data sets to broaden your horizons.</p>
            </div>
            
            {sections.map(section => (
                <div key={section.type}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                            <section.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-700">{section.title}</h2>
                            <p className="text-sm text-slate-500">{section.description}</p>
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
