import React from 'react';
import Markdown from 'react-markdown';

interface AiResultCardProps {
    title: string;
    icon: React.ReactNode;
    content: string;
}

const AiResultCard: React.FC<AiResultCardProps> = ({ title, icon, content }) => {

    const sections = content.split('### ').filter(s => s.trim() !== '');

    return (
        <div className="mt-4 bg-brand-secondary border border-brand-border rounded-xl animate-fade-in-fast">
            <div className="p-4 border-b border-brand-border flex items-center">
                <div className="w-6 h-6 mr-3 text-brand-primary">{icon}</div>
                <h3 className="text-xl font-semibold text-brand-text-primary">{title}</h3>
            </div>
            <div className="p-4 space-y-4">
                {sections.map((section, index) => {
                    const parts = section.split('\n');
                    const sectionTitle = parts[0].trim();
                    const sectionContent = parts.slice(1).join('\n').trim();

                    return (
                        <div key={index} className={index > 0 ? "pt-4 border-t border-brand-border" : ""}>
                            <h4 className="font-semibold text-brand-text-primary mb-2">{sectionTitle}</h4>
                            <div className="prose prose-invert max-w-none text-brand-text-secondary prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                                <Markdown>{sectionContent}</Markdown>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default AiResultCard;
