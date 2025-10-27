import React, { useState } from 'react';
import { XIcon } from '../../constants/icons';
import { useAuth } from '../../contexts/AuthContext';
import { AfterSchoolProgram, FacilityBooking } from '../../types';

type ItemType = 'program' | 'booking';
interface ManageGrowthItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemType: ItemType;
    initialData?: AfterSchoolProgram | FacilityBooking;
}

const ManageGrowthItemModal: React.FC<ManageGrowthItemModalProps> = ({ isOpen, onClose, itemType, initialData }) => {
    const { afterSchoolPrograms, facilityBookings, handleUpdateAfterSchoolPrograms, handleUpdateFacilityBookings } = useAuth();
    
    // Form state
    const [programData, setProgramData] = useState({ title: '', instructor: '', capacity: 20 });
    const [bookingData, setBookingData] = useState({ facility: 'Auditorium', bookedBy: '', date: '', startTime: '', endTime: '', purpose: '' });

    if (!isOpen) return null;

    const handleSave = () => {
        if (itemType === 'program') {
            const newProgram: AfterSchoolProgram = {
                id: `asp-${Date.now()}`,
                ...programData,
                enrollment: 0,
            };
            handleUpdateAfterSchoolPrograms([...afterSchoolPrograms, newProgram]);
        } else {
             const newBooking: FacilityBooking = {
                id: `fb-${Date.now()}`,
                ...bookingData,
            } as FacilityBooking;
            handleUpdateFacilityBookings([...facilityBookings, newBooking]);
        }
        onClose();
    };

    const renderProgramForm = () => (
        <div className="space-y-3">
            <input type="text" placeholder="Program Title" value={programData.title} onChange={e => setProgramData(p => ({ ...p, title: e.target.value }))} className="form-input w-full"/>
            <input type="text" placeholder="Instructor Name" value={programData.instructor} onChange={e => setProgramData(p => ({ ...p, instructor: e.target.value }))} className="form-input w-full"/>
            <input type="number" placeholder="Capacity" value={programData.capacity} onChange={e => setProgramData(p => ({ ...p, capacity: parseInt(e.target.value) }))} className="form-input w-full"/>
        </div>
    );
    
    const renderBookingForm = () => (
         <div className="space-y-3">
            <select value={bookingData.facility} onChange={e => setBookingData(p => ({...p, facility: e.target.value as any}))} className="form-select w-full">
                <option>Auditorium</option>
                <option>Sports Ground</option>
                <option>Computer Lab</option>
            </select>
             <input type="text" placeholder="Booked By" value={bookingData.bookedBy} onChange={e => setBookingData(p => ({ ...p, bookedBy: e.target.value }))} className="form-input w-full"/>
             <input type="date" value={bookingData.date} onChange={e => setBookingData(p => ({ ...p, date: e.target.value }))} className="form-input w-full"/>
             <div className="grid grid-cols-2 gap-2">
                 <input type="time" value={bookingData.startTime} onChange={e => setBookingData(p => ({ ...p, startTime: e.target.value }))} className="form-input w-full"/>
                 <input type="time" value={bookingData.endTime} onChange={e => setBookingData(p => ({ ...p, endTime: e.target.value }))} className="form-input w-full"/>
             </div>
             <input type="text" placeholder="Purpose of booking" value={bookingData.purpose} onChange={e => setBookingData(p => ({ ...p, purpose: e.target.value }))} className="form-input w-full"/>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Add New {itemType === 'program' ? 'Program' : 'Booking'}</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5"/></button>
                </div>
                {itemType === 'program' ? renderProgramForm() : renderBookingForm()}
                <div className="mt-4 flex gap-4">
                    <button onClick={onClose} className="btn w-full bg-slate-200">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary w-full">Save</button>
                </div>
            </div>
        </div>
    );
};

export default ManageGrowthItemModal;