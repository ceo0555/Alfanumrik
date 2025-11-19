import React, { useRef } from 'react';
import { AwardIcon, DownloadIcon, ShareIcon } from '../../constants/icons';

interface CourseCertificateProps {
    studentName: string;
    courseTitle: string;
    completionDate: string;
    instructorName: string;
    courseGrade: string;
    certificateId: string;
}

const CourseCertificate: React.FC<CourseCertificateProps> = ({
    studentName,
    courseTitle,
    completionDate,
    instructorName,
    courseGrade,
    certificateId
}) => {
    const certificateRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        // In a real implementation, this would generate a PDF
        // For now, we'll use the browser's print functionality
        window.print();
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Course Completion Certificate',
            text: `I've completed ${courseTitle}!`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                alert('Certificate link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Certificate Display */}
            <div 
                ref={certificateRef}
                className="bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-indigo-600 print:shadow-none print:border-8"
            >
                {/* Decorative Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 h-8"></div>
                
                <div className="p-12 relative">
                    {/* Watermark Pattern */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <div className="absolute top-10 left-10 w-32 h-32 border-8 border-indigo-600 rounded-full"></div>
                        <div className="absolute bottom-10 right-10 w-32 h-32 border-8 border-purple-600 rounded-full"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                            <AwardIcon className="w-full h-full text-indigo-600" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 text-center">
                        {/* Logo/Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <AwardIcon className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl font-extrabold text-slate-800 mb-2">
                            Certificate of Completion
                        </h1>
                        <div className="w-32 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 mx-auto mb-8"></div>

                        {/* Presentation Text */}
                        <p className="text-lg text-slate-600 mb-6">This is to certify that</p>
                        
                        {/* Student Name */}
                        <h2 className="text-4xl font-bold text-indigo-600 mb-6 border-b-2 border-slate-300 pb-2 inline-block px-8">
                            {studentName}
                        </h2>

                        {/* Course Info */}
                        <p className="text-lg text-slate-600 mb-2">has successfully completed the course</p>
                        <h3 className="text-3xl font-bold text-slate-800 mb-8">
                            {courseTitle}
                        </h3>

                        {/* Details */}
                        <div className="flex justify-center gap-16 mb-8 text-slate-600">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 mb-1">COMPLETION DATE</p>
                                <p className="text-lg font-bold">{formatDate(completionDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-500 mb-1">GRADE</p>
                                <p className="text-lg font-bold">{courseGrade}</p>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-center gap-24 mt-12">
                            <div className="text-center">
                                <div className="border-t-2 border-slate-800 pt-2 px-8">
                                    <p className="font-bold text-slate-800">{instructorName}</p>
                                    <p className="text-sm text-slate-500">Instructor</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="border-t-2 border-slate-800 pt-2 px-8">
                                    <p className="font-bold text-slate-800">Alfanumrik LMS</p>
                                    <p className="text-sm text-slate-500">Platform</p>
                                </div>
                            </div>
                        </div>

                        {/* Certificate ID */}
                        <div className="mt-12 pt-6 border-t border-slate-200">
                            <p className="text-xs text-slate-400">
                                Certificate ID: <span className="font-mono font-semibold">{certificateId}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Decorative Footer */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 h-8"></div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8 print:hidden">
                <button
                    onClick={handleDownload}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Download Certificate
                </button>
                <button
                    onClick={handleShare}
                    className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-2"
                >
                    <ShareIcon className="w-5 h-5" />
                    Share
                </button>
            </div>

            {/* Verification Notice */}
            <div className="mt-8 p-4 bg-indigo-50 rounded-lg text-center print:hidden">
                <p className="text-sm text-indigo-700">
                    This certificate can be verified at <span className="font-mono font-semibold">alfanumrik.com/verify/{certificateId}</span>
                </p>
            </div>
        </div>
    );
};

export default CourseCertificate;
