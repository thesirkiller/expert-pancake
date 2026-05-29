import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Sidebar Component - Apple Liquid Glass Style
 * @param {Array} menuItems - [{ id, label, icon }]
 * @param {string} activeId - Current active item id
 * @param {function} onItemClick - Callback for item selection
 * @param {string} title - Sidebar expanded title
 */
export default function Sidebar({ menuItems = [], activeId, onItemClick, title = "Menu" }) {
    const navigate = useNavigate();

    return (
        <aside className="fixed left-0 top-0 h-screen z-[100] group">
            {/* Base Sidebar */}
            <div className="h-full glass-panel border-r border-white/20 flex flex-col transition-all duration-500 ease-in-out w-[80px] group-hover:w-[260px] shadow-2xl overflow-hidden">

                {/* Header / Logo Area */}
                <div className="p-5 flex items-center gap-4 min-w-[260px]">
                    <div className="w-10 h-10 bg-[#1F93FF] rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-white font-bold text-xl">G</span>
                    </div>
                    <span className="font-bold text-slate-800 text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        {title}
                    </span>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {/* Home/Back Button - Always present */}
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-4 p-3 rounded-xl text-slate-500 hover:bg-white/40 hover:text-[#1F93FF] transition-all duration-300 group/item min-w-[200px]"
                    >
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-2xl transition-transform group-hover/item:scale-110">
                            <span className="material-symbols-rounded">home</span>
                        </div>
                        <span className="font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                            Início
                        </span>
                    </button>

                    <div className="my-4 border-t border-slate-100/50 mx-2" />

                    {/* Contextual Items */}
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onItemClick(item.id)}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group/item min-w-[200px] ${activeId === item.id
                                ? 'bg-[#1F93FF] text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-500 hover:bg-white/40 hover:text-[#1F93FF]'
                                }`}
                        >
                            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-2xl transition-transform group-hover/item:scale-110">
                                <span className="material-symbols-rounded">{item.icon}</span>
                            </div>
                            <span className="font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Footer Area - Potential for Exit/Profile */}
                <div className="p-3 mt-auto border-t border-slate-100/50">
                    <button
                        onClick={() => navigate('/login')} // Simplified for now
                        className="w-full flex items-center gap-4 p-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 min-w-[200px]"
                    >
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-2xl">
                            <span className="material-symbols-rounded">logout</span>
                        </div>
                        <span className="font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                            Sair do App
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
