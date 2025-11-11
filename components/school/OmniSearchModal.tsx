import React, { useState, useEffect, useCallback } from 'react';
import { processOmniSearchQuery } from '../../services/geminiService';
import { SearchIcon, XIcon, SparklesIcon, UserIcon } from '../../constants/icons';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, Assignment } from '../../types';
import { SchoolTab } from '../SchoolDashboard';

interface OmniSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    setActiveTab: (tab: SchoolTab) => void;
}

type SearchResult = 
    | { type: 'student'; data: UserProfile }
    | { type: 'assignment'; data: Assignment };

const OmniSearchModal: React.FC<OmniSearchModalProps> = ({ isOpen, onClose, setActiveTab }) => {
    const { userProfiles, allAssignments } = useAuth();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const functionCalls = await processOmniSearchQuery(searchQuery);

                if (functionCalls && functionCalls.length > 0) {
                  const call = functionCalls[0]; // Handle first call for simplicity
                  const args = (call.args ?? {}) as Record<string, unknown>;
                  switch (call.name) {
                      case 'navigate': {
                          const tabName = typeof args.tabName === 'string' ? args.tabName : undefined;
                          if (tabName) {
                              setActiveTab(tabName as SchoolTab);
                              onClose();
                          }
                          break;
                      }
                      case 'findStudent': {
                          const studentNameRaw = typeof args.studentName === 'string' ? args.studentName : '';
                          const studentName = studentNameRaw.toLowerCase();
                          const foundStudents = userProfiles
                              .filter(p => !p.schoolRole && !p.childIds && p.name.toLowerCase().includes(studentName))
                              .map(p => ({ type: 'student', data: p } as SearchResult));
                          setResults(foundStudents);
                          break;
                      }
                      case 'createAnnouncement':
                          // This action would be handled by passing down more props from SchoolDashboard
                          // For now, we just navigate.
                          setActiveTab('announcements');
                          onClose();
                          break;
                      default:
                          setResults([]);
                  }
              } else {
                 setResults([]);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [userProfiles, allAssignments, setActiveTab, onClose]);

    useEffect(() => {
        const handler = setTimeout(() => {
            handleSearch(query);
        }, 300); // Debounce
        return () => clearTimeout(handler);
    }, [query, handleSearch]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-20" onClick={onClose}>
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col" 
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="p-4 border-b flex items-center gap-3">
                    <SearchIcon className="w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for students, navigate, or create..."
                        className="w-full text-base bg-transparent focus:outline-none"
                        autoFocus
                    />
                    {isLoading && <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-indigo-600"></div>}
                </div>
                <div className="p-4 min-h-[200px] max-h-[60vh] overflow-y-auto">
                    {results.length > 0 && (
                        <div className="space-y-2">
                            {results.map((res, i) => {
                                if (res.type === 'student') {
                                    return (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100">
                                            <UserIcon className="w-5 h-5 text-slate-500"/>
                                            <p className="font-semibold">{res.data.name}</p>
                                            <p className="text-sm text-slate-500">Class {res.data.grade}</p>
                                        </div>
                                    )
                                }
                                return null;
                            })}
                        </div>
                    )}
                     {!isLoading && query && results.length === 0 && (
                         <p className="text-center text-slate-500 py-8">No results found.</p>
                     )}
                     {!query && !isLoading && (
                          <p className="text-center text-slate-400 py-8">
                            Try queries like "go to students", "find Rohan", or "create announcement for class 10".
                        </p>
                     )}
                </div>
                <footer className="p-2 border-t bg-slate-50 text-xs text-slate-500 flex items-center justify-end gap-1">
                    <SparklesIcon className="w-3 h-3 text-indigo-500"/>
                    <span>AI-Powered Search by Gemini</span>
                </footer>
            </div>
        </div>
    );
};

export default OmniSearchModal;