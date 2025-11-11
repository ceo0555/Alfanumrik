import React, { useState, useMemo } from 'react';
import { QuestionPoolItem } from '../types';
import { CBSE_COMPETENCIES, DOK_LEVELS } from '../constants/competencies';
import { curriculum } from '../constants/curriculum';
import { useAuth } from '../contexts/AuthContext';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface ItemBankExplorerProps {
    grade: string;
}

const ItemBankExplorer: React.FC<ItemBankExplorerProps> = ({ grade }) => {
    const { itemBank, handleUpdateItemBank } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');

    const subjectsInGrade = Object.keys(curriculum[grade as keyof typeof curriculum] || {});

    const filteredItems = useMemo(() => {
        return itemBank.filter(item => {
            const tabMatch = activeTab === 'approved' ? item.status !== 'pending' : item.status === 'pending';
            const searchMatch = !searchTerm || item.question.toLowerCase().includes(searchTerm.toLowerCase());
            const gradeMatch = item.q_id.startsWith(`G${grade}-`) || item.q_id.startsWith('gen-'); // Include generated items
            const filterMatch = Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                if (key === 'subject') {
                    const subjectCode = (value as string).substring(0, 1).toUpperCase();
                    return item.q_id.split('-')[1].startsWith(subjectCode);
                }
                return String((item as any)[key]) === value;
            });
            return tabMatch && searchMatch && gradeMatch && filterMatch;
        });
    }, [itemBank, searchTerm, filters, grade, activeTab]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleUpdateStatus = (q_id: string, status: 'approved' | 'rejected') => {
        let updatedBank: QuestionPoolItem[];
        if (status === 'rejected') {
            updatedBank = itemBank.filter(item => item.q_id !== q_id);
        } else {
            updatedBank = itemBank.map(item => item.q_id === q_id ? { ...item, status: 'approved' } : item);
        }
        handleUpdateItemBank(updatedBank);
    };

    const FilterSelect: React.FC<{ label: string; filterKey: string; options: { value: string; label: string }[] }> = ({ label, filterKey, options }) => (
        <div>
            <label className="text-xs font-medium text-slate-500">{label}</label>
            <select value={filters[filterKey] || ''} onChange={e => handleFilterChange(filterKey, e.target.value)} className="form-select text-sm w-full">
                <option value="">All</option>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );

    const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
        const item = filteredItems[index];
        if (!item) return null;
        
        return (
            <div style={style}>
                <div className="p-4 bg-white rounded-lg border h-full flex flex-col" style={{ marginRight: '8px', marginBottom: '12px', height: 'calc(100% - 12px)' }}>
                    <p className="font-semibold text-slate-800 flex-grow">{item.question}</p>
                    {item.type === 'MCQ' && item.options && (
                        <ul className="list-disc list-inside text-sm text-slate-600 mt-2">
                            {item.options.map((opt, i) => <li key={i} className={opt === item.answer ? 'font-bold text-emerald-700' : ''}>{opt}</li>)}
                        </ul>
                    )}
                    {item.type !== 'MCQ' && <p className="text-sm mt-2 text-emerald-700 font-bold">Answer: {item.answer}</p>}
                    
                    <div className="flex flex-wrap gap-2 text-xs mt-3 pt-3 border-t">
                        <span className="font-bold bg-slate-100 px-2 py-1 rounded">Type: {item.type}</span>
                        <span className="font-bold bg-slate-100 px-2 py-1 rounded">Marks: {item.marks}</span>
                        <span className="font-bold bg-slate-100 px-2 py-1 rounded">Difficulty: {item.difficulty}</span>
                        {item.competency && <span className="font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{item.competency}</span>}
                        {item.dok && <span className="font-bold bg-purple-100 text-purple-800 px-2 py-1 rounded">DOK: {item.dok}</span>}
                    </div>

                    {activeTab === 'pending' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                            <button onClick={() => handleUpdateStatus(item.q_id, 'approved')} className="btn text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Approve</button>
                            <button onClick={() => handleUpdateStatus(item.q_id, 'rejected')} className="btn text-xs bg-red-100 text-red-700 hover:bg-red-200">Reject</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
            <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-bold text-lg mb-4">Filter Questions</h3>
                <div className="space-y-4">
                    <input type="text" placeholder="Search questions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input w-full" />
                    <FilterSelect label="Subject" filterKey="subject" options={subjectsInGrade.map(s => ({ value: s, label: s }))} />
                    <FilterSelect label="Type" filterKey="type" options={['MCQ', 'SA', 'LA', 'Case'].map(t => ({ value: t, label: t }))} />
                    <FilterSelect label="Difficulty" filterKey="difficulty" options={[{value: 'E', label: 'Easy'}, {value: 'M', label: 'Medium'}, {value: 'H', label: 'Hard'}]} />
                    <FilterSelect label="Competency" filterKey="competency" options={CBSE_COMPETENCIES.map(c => ({ value: c, label: c }))} />
                    <FilterSelect label="DOK Level" filterKey="dok" options={Object.entries(DOK_LEVELS).map(([val, lab]) => ({ value: val, label: `${val}: ${lab}` }))} />
                </div>
            </div>

            <div className="flex flex-col h-[75vh]">
                 <div className="border-b mb-4 flex-shrink-0">
                    <button onClick={() => setActiveTab('approved')} className={`py-2 px-4 text-sm font-semibold border-b-2 ${activeTab === 'approved' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>Approved Questions</button>
                    <button onClick={() => setActiveTab('pending')} className={`py-2 px-4 text-sm font-semibold border-b-2 ${activeTab === 'pending' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>Pending Review ({itemBank.filter(i => i.status === 'pending').length})</button>
                </div>
                <p className="text-sm font-semibold text-slate-600 mb-2 flex-shrink-0">Showing {filteredItems.length} questions</p>
                <div className="flex-grow">
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                itemCount={filteredItems.length}
                                itemSize={250} // Estimated average item height
                                width={width}
                            >
                                {Row}
                            </List>
                        )}
                    </AutoSizer>
                </div>
            </div>
        </div>
    );
};

export default ItemBankExplorer;