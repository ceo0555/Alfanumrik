import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { View } from '../App';
import AddWidgetModal from './AddWidgetModal';
import TodayFocusWidget from './widgets/TodayFocusWidget';
import PinnedChapterWidget from './widgets/PinnedChapterWidget';
import PinnedPracticeWidget from './widgets/PinnedPracticeWidget';
import QuickNoteWidget from './widgets/QuickNoteWidget';
import { PlusIcon } from '../constants/icons';
import { PracticeBlueprint, WidgetConfig } from '../types';

interface PlannerProps {
  setView: (view: View) => void;
  onStartPractice: (subject: string, blueprint: PracticeBlueprint) => void;
}

const Planner: React.FC<PlannerProps> = ({ setView, onStartPractice }) => {
  const { activeProfile, handleUpdateWidgets } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const widgets = activeProfile?.widgets || [];

  const handleRemoveWidget = (widgetId: string) => {
    const newWidgets = widgets.filter(w => w.id !== widgetId);
    handleUpdateWidgets(newWidgets);
  };
  
  const handleUpdateWidgetData = (widgetId: string, data: any) => {
    const newWidgets = widgets.map(w => {
        if (w.id === widgetId) {
            return { ...w, data: { ...(w as any).data, ...data } };
        }
        return w;
    });
    handleUpdateWidgets(newWidgets);
  };

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'today_focus':
        return <TodayFocusWidget key={widget.id} widget={widget} setView={setView} onRemove={handleRemoveWidget} />;
      case 'pinned_chapter':
        return <PinnedChapterWidget key={widget.id} widget={widget} setView={setView} onRemove={handleRemoveWidget} />;
      case 'pinned_practice':
        return <PinnedPracticeWidget key={widget.id} widget={widget} onStartPractice={onStartPractice} onRemove={handleRemoveWidget} />;
      case 'quick_note':
        return <QuickNoteWidget key={widget.id} widget={widget} onUpdate={handleUpdateWidgetData} onRemove={handleRemoveWidget} />;
      default:
        return null;
    }
  };

  return (
    <div className="animate-slide-in-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800">My Dashboard</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary flex items-center justify-center gap-2">
            <PlusIcon className="w-5 h-5" /> Add Widget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map(renderWidget)}
      </div>

      {isAddModalOpen && (
        <AddWidgetModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Planner;