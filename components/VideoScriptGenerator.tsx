import React from 'react';
import { VideoIcon } from '../constants/icons';

const VideoScriptGenerator: React.FC = () => {
    return (
        <div className="text-center flex flex-col items-center justify-center h-full text-slate-400">
            <VideoIcon className="w-16 h-16 mb-4"/>
            <h3 className="text-xl font-bold text-slate-700">Video Script Generator</h3>
            <p className="mt-2">This feature is coming soon!</p>
            <p className="text-sm">You'll be able to generate video scripts for your lessons.</p>
        </div>
    );
};

export default VideoScriptGenerator;
