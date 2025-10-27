import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AfterSchoolProgram, FacilityBooking } from '../types';
import { UsersIcon, CalendarDaysIcon, SparklesIcon, PlusIcon } from '../constants/icons';
import { generateRentalAgreement } from '../services/geminiService';
import ManageGrowthItemModal from './school/ManageGrowthItemModal';

type View = 'programs' | 'rentals';
type ItemToEdit = 
    | { type: 'program', data?: AfterSchoolProgram }
    | { type: 'booking', data?: FacilityBooking };

const GrowthDashboard: React.FC = () => {
    const { afterSchoolPrograms, facilityBookings } = useAuth();
    const [itemToEdit, setItemToEdit] = useState<ItemToEdit | null>(null);
    const [agreementModal, setAgreementModal] = useState<{ booking: FacilityBooking, agreement: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAgreement = async (booking: FacilityBooking) => {
        setIsGenerating(true);
        try {
            const agreementText = await generateRentalAgreement(booking);
            setAgreementModal({ booking, agreement: agreementText });
        } catch (e) {
            console.error(e);
            alert("Failed to generate agreement.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* After-School Programs Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2"><UsersIcon className="w-6 h-6 text-blue-600" /> After-School Programs</h3>
                    <button onClick={() => setItemToEdit({ type: 'program' })} className="btn text-xs bg-slate-100 hover:bg-slate-200"><PlusIcon className="w-3 h-3 mr-1" /> Create</button>
                </div>
                <div className="space-y-3">
                    {afterSchoolPrograms.map(program => {
                        const enrollmentPercentage = (program.enrollment / program.capacity) * 100;
                        return (
                            <div key={program.id} className="p-3 bg-slate-50 rounded-lg border">
                                <h4 className="font-bold text-sm">{program.title}</h4>
                                <p className="text-xs text-slate-500">Instructor: {program.instructor}</p>
                                <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1"><span>Enrollment</span><span>{program.enrollment}/{program.capacity}</span></div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${enrollmentPercentage}%` }}></div></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Facility Rentals Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2"><CalendarDaysIcon className="w-6 h-6 text-emerald-600" /> Facility Rentals</h3>
                    <button onClick={() => setItemToEdit({ type: 'booking' })} className="btn text-xs bg-slate-100 hover:bg-slate-200"><PlusIcon className="w-3 h-3 mr-1" /> Add Booking</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Facility</th>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {facilityBookings.map(booking => (
                                <tr key={booking.id} className="border-b">
                                    <td className="px-4 py-2 font-medium">{booking.facility}</td>
                                    <td className="px-4 py-2">{booking.date}</td>
                                    <td className="px-4 py-2">
                                       <button onClick={() => handleGenerateAgreement(booking)} disabled={isGenerating} className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                                           <SparklesIcon className="w-4 h-4" />
                                           AI Agreement
                                       </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {itemToEdit && (
                <ManageGrowthItemModal
                    isOpen={!!itemToEdit}
                    onClose={() => setItemToEdit(null)}
                    itemType={itemToEdit.type}
                    initialData={itemToEdit.data}
                />
            )}
            
            {/* Agreement Viewer Modal */}
        </div>
    );
};

export default GrowthDashboard;