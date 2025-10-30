import React from 'react';
import { BrushIcon } from '../constants/icons';

const ImageEditor: React.FC = () => {
    return (
        <div className="text-center flex flex-col items-center justify-center h-full text-slate-400">
            <BrushIcon className="w-16 h-16 mb-4"/>
            <h3 className="text-xl font-bold text-slate-700">Image Editor</h3>
            <p className="mt-2">This feature is coming soon!</p>
            <p className="text-sm">You'll be able to upload an image and use AI to edit it.</p>
        </div>
    );
};

export default ImageEditor;
