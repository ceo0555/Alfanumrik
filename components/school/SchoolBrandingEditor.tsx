import React, { useState } from 'react';
import { useSchool } from '../../contexts/SchoolContext';
import { XIcon, CheckCircleIcon, BrushIcon } from '../../constants/icons';
import { School } from '../../types';

interface SchoolBrandingEditorProps {
    isOpen: boolean;
    onClose: () => void;
}

const SchoolBrandingEditor: React.FC<SchoolBrandingEditorProps> = ({ isOpen, onClose }) => {
    const { activeSchool, updateSchool } = useSchool();
    const [formData, setFormData] = useState({
        name: activeSchool?.name || '',
        primaryColor: activeSchool?.primaryColor || '#6366f1',
        secondaryColor: activeSchool?.secondaryColor || '#a855f7',
        logo: activeSchool?.logo || '',
    });

    if (!isOpen || !activeSchool) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSchool(activeSchool.id, {
            name: formData.name,
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
            logo: formData.logo,
        });
        onClose();
    };

    const presetColors = [
        { name: 'Indigo', primary: '#6366f1', secondary: '#a855f7' },
        { name: 'Blue', primary: '#3b82f6', secondary: '#60a5fa' },
        { name: 'Green', primary: '#10b981', secondary: '#34d399' },
        { name: 'Purple', primary: '#9333ea', secondary: '#c084fc' },
        { name: 'Red', primary: '#ef4444', secondary: '#f87171' },
        { name: 'Orange', primary: '#f97316', secondary: '#fb923c' },
        { name: 'Teal', primary: '#14b8a6', secondary: '#5eead4' },
        { name: 'Pink', primary: '#ec4899', secondary: '#f472b6' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div 
                    className="p-6 text-white"
                    style={{
                        background: `linear-gradient(to right, ${formData.primaryColor}, ${formData.secondaryColor})`
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BrushIcon className="w-8 h-8" />
                            <div>
                                <h2 className="text-2xl font-bold">School Branding</h2>
                                <p className="text-white/80 text-sm">Customize your school's appearance</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* School Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            School Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input w-full"
                            required
                        />
                    </div>

                    {/* Color Presets */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Color Theme Presets
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {presetColors.map((preset) => (
                                <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => setFormData({
                                        ...formData,
                                        primaryColor: preset.primary,
                                        secondaryColor: preset.secondary,
                                    })}
                                    className="p-3 rounded-lg border-2 hover:border-indigo-500 transition-colors group"
                                    style={{
                                        background: `linear-gradient(to right, ${preset.primary}, ${preset.secondary})`
                                    }}
                                >
                                    <p className="text-white font-semibold text-sm">{preset.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Primary Color
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-slate-300"
                                />
                                <input
                                    type="text"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                    className="input flex-1"
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Secondary Color
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.secondaryColor}
                                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-slate-300"
                                />
                                <input
                                    type="text"
                                    value={formData.secondaryColor}
                                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                    className="input flex-1"
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logo URL */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Logo URL (optional)
                        </label>
                        <input
                            type="url"
                            value={formData.logo}
                            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                            className="input w-full"
                            placeholder="https://example.com/logo.png"
                        />
                        {formData.logo && (
                            <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600 mb-2">Logo Preview:</p>
                                <img 
                                    src={formData.logo} 
                                    alt="School logo preview" 
                                    className="h-16 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '';
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Preview
                        </label>
                        <div 
                            className="rounded-xl p-8 text-white"
                            style={{
                                background: `linear-gradient(to right, ${formData.primaryColor}, ${formData.secondaryColor})`
                            }}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                {formData.logo && (
                                    <img src={formData.logo} alt="Logo" className="h-12 object-contain" />
                                )}
                                <div>
                                    <h3 className="text-2xl font-bold">{formData.name || 'Your School Name'}</h3>
                                    <p className="text-white/80">Welcome Dashboard</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                    <p className="text-3xl font-bold">5,000</p>
                                    <p className="text-white/80 text-sm">Students</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                    <p className="text-3xl font-bold">250</p>
                                    <p className="text-white/80 text-sm">Teachers</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                    <p className="text-3xl font-bold">150</p>
                                    <p className="text-white/80 text-sm">Courses</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t bg-slate-50 flex gap-3">
                    <button onClick={onClose} className="btn bg-slate-200 text-slate-700 hover:bg-slate-300 flex-1">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        className="btn flex-1 text-white"
                        style={{
                            background: `linear-gradient(to right, ${formData.primaryColor}, ${formData.secondaryColor})`
                        }}
                    >
                        <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                        Save Branding
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SchoolBrandingEditor;
