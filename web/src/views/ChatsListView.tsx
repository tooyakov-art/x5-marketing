
import React, { useState } from 'react';
import { ChevronLeft, MessageCircle, Check, Clock, Search, UserPlus } from 'lucide-react';
import { Specialist, ViewProps } from '../types';
import { db } from '../firebase';

interface ChatsListViewProps extends ViewProps {
    chats: { specialist: Specialist, lastMessage: string, time: string, unread: number }[];
    onSelectChat: (spec: Specialist) => void;
    currentUserId?: string;
}

export const ChatsListView: React.FC<ChatsListViewProps> = ({ onBack, chats, onSelectChat, currentUserId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Specialist[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            // Search users by name (case-insensitive partial match via Firestore)
            const snapshot = await db.collection('users')
                .where('name', '>=', searchQuery)
                .where('name', '<=', searchQuery + '\uf8ff')
                .limit(10)
                .get();

            const results: Specialist[] = snapshot.docs
                .filter(doc => doc.id !== currentUserId)
                .map(doc => ({
                    id: doc.id,
                    name: doc.data().name || 'User',
                    avatar: doc.data().avatar,
                    role: 'User',
                    online: false,
                    rating: 0,
                    price: '0',
                    skills: []
                }));
            setSearchResults(results);
        } catch (e) {
            console.error("Search error", e);
        } finally {
            setIsSearching(false);
        }
    };

    const filteredChats = chats.filter(c =>
        c.specialist.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[#f2f4f6]">
            {/* Header */}
            <div className="px-6 pt-12 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center gap-4 shrink-0 shadow-sm z-20">
                <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform hover:bg-slate-50">
                    <ChevronLeft className="text-slate-900" size={22} />
                </button>
                <h2 className="text-xl font-extrabold text-slate-900">Сообщения</h2>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 bg-white border-b border-slate-100">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Найти пользователя..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-4 bg-slate-900 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
                    >
                        {isSearching ? '...' : 'Найти'}
                    </button>
                </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Результаты поиска</p>
                    {searchResults.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => onSelectChat(user)}
                            className="flex items-center gap-3 p-2 bg-white rounded-xl mb-1 cursor-pointer active:scale-[0.98] transition-transform"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{user.name[0]}</div>}
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                            <UserPlus size={16} className="ml-auto text-blue-500" />
                        </div>
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredChats.length === 0 && searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] opacity-50">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle size={32} className="text-slate-400" />
                        </div>
                        <p className="font-bold text-slate-500">У вас нет активных чатов</p>
                        <p className="text-xs text-slate-400 mt-1">Найдите пользователя через поиск выше</p>
                    </div>
                ) : (
                    chats.map((chat, idx) => (
                        <div
                            key={idx}
                            onClick={() => onSelectChat(chat.specialist)}
                            className="bg-white p-4 rounded-[20px] flex items-center gap-4 active:scale-[0.98] transition-transform shadow-sm border border-slate-100 cursor-pointer"
                        >
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                                    {chat.specialist.avatar ? (
                                        <img src={chat.specialist.avatar} className="w-full h-full object-cover" alt={chat.specialist.name} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 bg-slate-100">
                                            {chat.specialist.name[0]}
                                        </div>
                                    )}
                                </div>
                                {chat.specialist.online && (
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-slate-900 text-sm truncate">{chat.specialist.name}</h3>
                                    <span className="text-[10px] text-slate-400 font-medium">{chat.time}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-slate-500 truncate pr-2 font-medium">{chat.lastMessage}</p>
                                    {chat.unread > 0 ? (
                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                            {chat.unread}
                                        </div>
                                    ) : (
                                        <Check size={14} className="text-blue-500" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
