import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircleIcon, ThumbsUpIcon, SendIcon, PinIcon, SearchIcon, FilterIcon, UserIcon } from '../../constants/icons';

export interface DiscussionThread {
    id: string;
    courseId: string;
    authorId: number;
    title: string;
    content: string;
    timestamp: string;
    isPinned: boolean;
    likes: number[];
    replies: DiscussionReply[];
    tags: string[];
}

export interface DiscussionReply {
    id: string;
    authorId: number;
    content: string;
    timestamp: string;
    likes: number[];
}

interface DiscussionForumProps {
    courseId: string;
    threads: DiscussionThread[];
    onCreateThread: (thread: Omit<DiscussionThread, 'id' | 'timestamp' | 'likes' | 'replies'>) => void;
    onReply: (threadId: string, reply: Omit<DiscussionReply, 'id' | 'timestamp' | 'likes'>) => void;
    onLike: (threadId: string, replyId?: string) => void;
    onPin: (threadId: string) => void;
}

const DiscussionForum: React.FC<DiscussionForumProps> = ({
    courseId,
    threads,
    onCreateThread,
    onReply,
    onLike,
    onPin
}) => {
    const { activeProfile, userProfiles } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string>('All');
    const [showNewThread, setShowNewThread] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [newThreadTags, setNewThreadTags] = useState<string[]>([]);
    const [selectedThread, setSelectedThread] = useState<DiscussionThread | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        threads.forEach(thread => thread.tags.forEach(tag => tags.add(tag)));
        return ['All', ...Array.from(tags)];
    }, [threads]);

    const filteredThreads = useMemo(() => {
        return threads.filter(thread => {
            const matchesSearch = thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                thread.content.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = selectedTag === 'All' || thread.tags.includes(selectedTag);
            return matchesSearch && matchesTag;
        }).sort((a, b) => {
            // Pinned threads first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Then by most recent
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }, [threads, searchQuery, selectedTag]);

    const handleCreateThread = () => {
        if (!activeProfile || !newThreadTitle.trim() || !newThreadContent.trim()) return;

        onCreateThread({
            courseId,
            authorId: activeProfile.id,
            title: newThreadTitle,
            content: newThreadContent,
            isPinned: false,
            tags: newThreadTags
        });

        setNewThreadTitle('');
        setNewThreadContent('');
        setNewThreadTags([]);
        setShowNewThread(false);
    };

    const handleReply = () => {
        if (!activeProfile || !selectedThread || !replyContent.trim()) return;

        onReply(selectedThread.id, {
            authorId: activeProfile.id,
            content: replyContent
        });

        setReplyContent('');
    };

    const getAuthorName = (userId: number) => {
        return userProfiles.find(p => p.id === userId)?.name || 'Unknown User';
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    const availableTags = ['Question', 'Discussion', 'Resource', 'Help', 'Announcement'];

    if (selectedThread) {
        return (
            <div className="animate-slide-in-up">
                <button
                    onClick={() => setSelectedThread(null)}
                    className="mb-4 text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2"
                >
                    ← Back to Discussions
                </button>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {selectedThread.isPinned && (
                                    <PinIcon className="w-4 h-4 text-amber-500" />
                                )}
                                <h2 className="text-2xl font-bold text-slate-800">{selectedThread.title}</h2>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span className="font-semibold">{getAuthorName(selectedThread.authorId)}</span>
                                <span>•</span>
                                <span>{formatDate(selectedThread.timestamp)}</span>
                            </div>
                        </div>
                        {activeProfile?.schoolRole && (
                            <button
                                onClick={() => onPin(selectedThread.id)}
                                className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                {selectedThread.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {selectedThread.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <p className="text-slate-700 leading-relaxed mb-4">{selectedThread.content}</p>

                    <button
                        onClick={() => onLike(selectedThread.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                            selectedThread.likes.includes(activeProfile?.id || 0)
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <ThumbsUpIcon className="w-4 h-4" />
                        <span className="text-sm font-semibold">{selectedThread.likes.length}</span>
                    </button>

                    {/* Replies */}
                    <div className="mt-8 space-y-4">
                        <h3 className="text-lg font-bold text-slate-800">
                            {selectedThread.replies.length} {selectedThread.replies.length === 1 ? 'Reply' : 'Replies'}
                        </h3>

                        {selectedThread.replies.map(reply => (
                            <div key={reply.id} className="bg-slate-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-slate-700">{getAuthorName(reply.authorId)}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-slate-500">{formatDate(reply.timestamp)}</span>
                                    </div>
                                    <button
                                        onClick={() => onLike(selectedThread.id, reply.id)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                                            reply.likes.includes(activeProfile?.id || 0)
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        <ThumbsUpIcon className="w-3 h-3" />
                                        <span className="text-xs">{reply.likes.length}</span>
                                    </button>
                                </div>
                                <p className="text-slate-700">{reply.content}</p>
                            </div>
                        ))}
                    </div>

                    {/* Reply Input */}
                    <div className="mt-6 pt-6 border-t">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write your reply..."
                            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            rows={3}
                        />
                        <div className="mt-2 flex justify-end">
                            <button
                                onClick={handleReply}
                                disabled={!replyContent.trim()}
                                className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <SendIcon className="w-4 h-4" />
                                Post Reply
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-in-up">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Discussion Forum</h2>
                <button
                    onClick={() => setShowNewThread(true)}
                    className="btn btn-primary"
                >
                    + New Discussion
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search discussions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        {allTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* New Thread Modal */}
            {showNewThread && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Create New Discussion</h3>
                        
                        <input
                            type="text"
                            placeholder="Discussion title..."
                            value={newThreadTitle}
                            onChange={(e) => setNewThreadTitle(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                        />
                        
                        <textarea
                            placeholder="What would you like to discuss?"
                            value={newThreadContent}
                            onChange={(e) => setNewThreadContent(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
                            rows={6}
                        />

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            if (newThreadTags.includes(tag)) {
                                                setNewThreadTags(newThreadTags.filter(t => t !== tag));
                                            } else {
                                                setNewThreadTags([...newThreadTags, tag]);
                                            }
                                        }}
                                        className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                                            newThreadTags.includes(tag)
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowNewThread(false);
                                    setNewThreadTitle('');
                                    setNewThreadContent('');
                                    setNewThreadTags([]);
                                }}
                                className="flex-1 btn bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateThread}
                                disabled={!newThreadTitle.trim() || !newThreadContent.trim()}
                                className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Post Discussion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Thread List */}
            <div className="space-y-4">
                {filteredThreads.map(thread => (
                    <button
                        key={thread.id}
                        onClick={() => setSelectedThread(thread)}
                        className="w-full bg-white p-5 rounded-xl shadow-sm border hover:border-indigo-400 hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                                {thread.isPinned && (
                                    <PinIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                )}
                                <h3 className="font-bold text-slate-800 text-lg">{thread.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <MessageCircleIcon className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600 font-semibold">{thread.replies.length}</span>
                            </div>
                        </div>

                        <p className="text-slate-600 text-sm mb-3 line-clamp-2">{thread.content}</p>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                                {thread.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>{getAuthorName(thread.authorId)}</span>
                                <span>•</span>
                                <span>{formatDate(thread.timestamp)}</span>
                                <div className="flex items-center gap-1">
                                    <ThumbsUpIcon className="w-3 h-3" />
                                    <span>{thread.likes.length}</span>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}

                {filteredThreads.length === 0 && (
                    <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-xl">
                        <MessageCircleIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-lg font-semibold">No discussions yet</p>
                        <p className="text-sm mt-1">Be the first to start a conversation!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscussionForum;
