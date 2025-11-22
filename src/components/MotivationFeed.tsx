
import React from 'react';
import { MotivationPost } from '../types';
import { UserCircleIcon, TrashIcon } from './icons/Icons';
import Markdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
// FIX: Import auth to access the current user's UID.
import { auth } from '../firebase/config';
import { useTranslation } from '../context/TranslationContext';

interface MotivationFeedProps {
    posts: MotivationPost[];
    onEdit: (post: MotivationPost) => void;
}

const MotivationFeed: React.FC<MotivationFeedProps> = ({ posts, onEdit }) => {
    const { user, deleteMotivationPost } = useAuth();
    const { t } = useTranslation();
    
    const handleDelete = async (postId: string) => {
        if (window.confirm("Weet u zeker dat u dit bericht wilt verwijderen?")) {
            try {
                await deleteMotivationPost(postId);
            } catch (error: any) {
                alert(`Fout bij verwijderen: ${error.message}`);
            }
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-22rem)] overflow-y-auto pr-2 -mr-2">
            {posts.length > 0 ? posts.map(post => {
                // FIX: Check authorId against auth.currentUser.uid, as the user object from context does not contain the uid.
                // FIX: Also allow 'leader' and 'manager' role to modify posts for consistency.
                const canModify = auth.currentUser?.uid === post.authorId || user?.role === 'team-leader' || user?.role === 'leader' || user?.role === 'manager' || user?.role === 'owner';
                return (
                    <div key={post.id} className="bg-brand-secondary rounded-lg p-5 border border-brand-border">
                        <div className="flex justify-between items-start">
                             <div className="flex items-center mb-3">
                                {post.authorProfilePicture ? (
                                    <img src={post.authorProfilePicture} alt={post.authorName} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <UserCircleIcon className="w-10 h-10 text-brand-text-secondary" />
                                )}
                                <div className="ml-3">
                                    <p className="font-semibold text-brand-text-primary">{post.authorName}</p>
                                    <p className="text-xs text-brand-text-secondary">{new Date(post.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            {canModify && (
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => onEdit(post)} className="text-xs text-brand-primary hover:underline">Bewerken</button>
                                    <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-red-700">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center">
                            <h3 className="text-xl font-bold text-brand-text-primary mb-2">{post.title}</h3>
                            {post.keep && (
                                // FIX: The 'title' attribute is not valid on SVG elements in React. It has been replaced with a nested <title> element for accessibility and tooltips.
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-text-secondary ml-2">
                                  <title>Dit bericht is vastgepind en verloopt niet.</title>
                                  <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75V8a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.113 4.41a.75.75 0 0 1 .157 1.05l-2.005 3.473a.75.75 0 0 1-1.21-.698l2.005-3.473a.75.75 0 0 1 1.05-.157ZM15.94 5.46a.75.75 0 0 1 1.05.157l2.005 3.473a.75.75 0 1 1-1.21.698l-2.005-3.473a.75.75 0 0 1 .155-1.05ZM8.5 8.75A.75.75 0 0 1 9.25 8h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 8.5 8.75ZM3.75 12a.75.75 0 0 1 .75-.75h11a.75.75 0 0 1 0 1.5h-11a.75.75 0 0 1-.75-.75ZM3 15.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>

                        <div className="prose prose-invert max-w-none text-brand-text-secondary prose-p:my-2">
                            <Markdown>{post.content}</Markdown>
                        </div>
                    </div>
                )
            }) : (
                <div className="text-center text-brand-text-secondary py-10">
                    <p>{t('team_updates_empty')}</p>
                </div>
            )}
        </div>
    );
};

export default MotivationFeed;