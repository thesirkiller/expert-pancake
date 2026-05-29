import React from 'react';
import { NavLink } from 'react-router-dom';

const MobileBottomNav = () => {
    const navItems = [
        { id: 'ead', icon: 'play_circle', path: '/portal/cursos' },
        { id: 'finance', icon: 'payments', path: '/portal/financeiro' },
        { id: 'location', icon: 'place', path: '/portal/mapa' },
        { id: 'assembleias', icon: 'groups', path: '/portal/assembleias' },
        { id: 'home', icon: 'account_circle', path: '/portal' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-2 flex justify-between items-center z-50 md:hidden pb-safe">
            {navItems.map((item) => (
                <NavLink
                    key={item.id}
                    to={item.path}
                    className={({ isActive }) => `
            flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300
            ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-600'}
          `}
                >
                    <span className={`material-symbols-rounded text-2xl ${isActive ? 'icon-filled' : ''}`}>{item.icon}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default MobileBottomNav;
