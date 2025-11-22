import React, { useState } from 'react';
import { ChevronDownIcon } from './icons/Icons';
import Markdown from 'react-markdown';

interface AccordionSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-brand-border rounded-lg overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-brand-secondary hover:bg-brand-border transition-colors focus:outline-none"
            >
                <div className="flex items-center text-brand-text-primary">
                    <div className="w-6 h-6">{icon}</div>
                    <h3 className="font-semibold ml-3">{title}</h3>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-brand-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 bg-brand-surface border-t border-brand-border animate-fade-in-fast">
                    <div className="prose prose-invert max-w-none text-brand-text-secondary prose-headings:text-brand-text-primary prose-strong:text-brand-text-primary">
                        {children ? <Markdown>{String(children)}</Markdown> : <p>Geen data.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccordionSection;
