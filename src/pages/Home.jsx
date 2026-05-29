import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
    const navigate = useNavigate()
    const { cooperado, cooperativa, signOut } = useAuth()

    const modules = [
        { id: 'meus_dados', title: 'Meus Dados', path: '/perfil' },
        { id: 'gestao_geral', title: 'Gestão Geral', path: '/gestao' },
        { id: 'gestao_rh', title: 'Gestão de RH', path: '/gestao-rh' },
        { id: 'escalas', title: 'Escalas', path: '/escalas' },
        { id: 'financeiro', title: 'Financeiro', path: '/financeiro' },
        { id: 'educacao', title: 'Educação', path: '/educacao' },
        { id: 'assembleias', title: 'Assembleias', path: '/assembleias' },
        { id: 'orcamentos', title: 'Orçamentos', path: '/orcamentos' }
    ]

    return (
        <div className="min-h-screen bg-[#F0F4F8] relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-indigo-400/10 blur-[100px] rounded-full" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 glass-panel border-b border-white/20 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#1F93FF] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white font-bold">G</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800">GestorCoop</h1>
                            <p className="text-xs text-slate-500 font-medium">{cooperativa?.nome}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-700">{cooperado?.nome}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cooperado</span>
                        </div>
                        <button
                            onClick={signOut}
                            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                            title="Sair"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">
                        Olá, <span className="text-[#1F93FF]">{cooperado?.nome?.split(' ')[0]}</span>
                    </h2>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Bem-vindo ao seu painel de controle.</p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {modules.map((module, index) => (
                        <button
                            key={module.id}
                            onClick={() => navigate(module.path)}
                            className="glass-card p-6 text-left group animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="w-14 h-14 bg-white rounded-2xl mb-5 flex items-center justify-center text-slate-400 group-hover:bg-[#1F93FF] group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-blue-500/30">
                                <span className="material-symbols-rounded text-3xl transition-transform duration-500 group-hover:scale-110">
                                    {module.id === 'meus_dados' ? 'person' :
                                        module.id === 'entregas' ? 'local_shipping' :
                                            module.id === 'gestao_geral' ? 'settings' :
                                                module.id === 'gestao_rh' ? 'groups' :
                                                    module.id === 'escalas' ? 'calendar_month' :
                                                        module.id === 'financeiro' ? 'payments' :
                                                            module.id === 'educacao' ? 'school' :
                                                                module.id === 'assembleias' ? 'handshake' :
                                                                    module.id === 'orcamentos' ? 'assessment' : 'folder'}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg mb-1">{module.title}</h3>
                            <p className="text-slate-400 text-sm font-medium">Acessar módulo de {module.title.toLowerCase()}</p>
                        </button>
                    ))}
                </div>
            </main>
        </div>
    )
}
