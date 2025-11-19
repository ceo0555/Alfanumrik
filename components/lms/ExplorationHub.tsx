import React, { useState, useMemo } from 'react';
import { explorationItems, ExplorationItem } from '../../constants/explorations';
import { BrainCircuitIcon, GlobeIcon, DatabaseIcon, SearchIcon, FilterIcon } from '../../constants/icons';

const ExplorationHub: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('All');
    const [selectedType, setSelectedType] = useState<string>('All');

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

    // Get unique subjects from all exploration items
    const allSubjects = useMemo(() => {
        const subjects = new Set<string>();
        explorationItems.forEach(item => item.subjects.forEach(s => subjects.add(s)));
        return ['All', ...Array.from(subjects)];
    }, []);

    // Filter exploration items based on search and filters
    const filteredItems = useMemo(() => {
        return explorationItems.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                item.summary.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSubject = selectedSubject === 'All' || item.subjects.includes(selectedSubject);
            const matchesType = selectedType === 'All' || item.type === selectedType;
            
            return matchesSearch && matchesSubject && matchesType;
        });
    }, [searchQuery, selectedSubject, selectedType]);

    const Card: React.FC<{ item: ExplorationItem }> = ({ item }) => (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col hover:shadow-lg hover:border-indigo-400 transition-all transform hover:-translate-y-1">
            <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-base flex-1">{item.title}</h4>
                <span className="ml-2 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-1 rounded-full">
                    {item.type}
                </span>
            </div>
            <p className="text-sm text-slate-600 mt-2 flex-grow leading-relaxed">{item.summary}</p>
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                <div className="flex flex-wrap gap-1">
                    {item.subjects.slice(0, 3).map(subject => (
                        <span key={subject} className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{subject}</span>
                    ))}
                    {item.subjects.length > 3 && (
                        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">+{item.subjects.length - 3}</span>
                    )}
                </div>
                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">Explore →</button>
            </div>
        </div>
    );

    return (
        <div className="animate-slide-in-up space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-slate-800 mb-3">Explore Beyond the Syllabus</h1>
                <p className="text-slate-500 mt-2 max-w-2xl mx-auto text-lg">Your courses from teachers will appear here. In the meantime, dive into our curated collection of research papers, global case studies, and data sets to broaden your horizons.</p>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search explorations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            {allSubjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="All">All Types</option>
                            <option value="research">Research</option>
                            <option value="global">Global</option>
                            <option value="data">Data</option>
                        </select>
                    </div>
                </div>
                <div className="mt-3 text-sm text-slate-600">
                    Showing {filteredItems.length} of {explorationItems.length} explorations
                </div>
            </div>

            {/* Filtered Results */}
            {selectedType === 'All' ? (
                sections.map(section => {
                    const sectionItems = filteredItems.filter(item => item.type === section.type);
                    if (sectionItems.length === 0) return null;
                    
                    return (
                        <div key={section.type}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <section.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{section.title}</h2>
                                    <p className="text-sm text-slate-500">{section.description}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sectionItems.map(item => (
                                    <Card key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <Card key={item.id} item={item} />
                    ))}
                </div>
            )}

            {filteredItems.length === 0 && (
                <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-xl">
                    <p className="text-lg font-semibold">No explorations found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
};

export default ExplorationHub;
