
import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Generating questions..." }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-slate-300">{message}</p>
        </div>
    );
};
