import React from 'react';
import { XIcon } from '../../constants/icons';

interface BrandingModalProps {
    isOpen: boolean;
    onClose: () => void;
    schoolName: string;
    setSchoolName: (name: string) => void;
}

const BrandingModal: React.FC<BrandingModalProps> = ({ isOpen, onClose, schoolName, setSchoolName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Edit Branding</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5"/></button>
                </div>
                <div>
                    <label htmlFor="school-name" className="text-sm font-medium">School Name</label>
                    <input id="school-name" type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="form-input w-full mt-1"/>
                </div>
                <button onClick={onClose} className="btn btn-primary w-full mt-4">Save</button>
            </div>
        </div>
    );
};

export default BrandingModal;