import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import MobileBottomNav from '../components/MobileBottomNav';
import { useNavigate } from 'react-router-dom';

const CooperadoAssembleias = () => {
    const { cooperativa } = useAuth();
    const [activeTab, setActiveTab] = useState('proximas');
    const [assembleias, setAssembleias] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (cooperativa) {
            fetchAssembleias();
        }
    }, [cooperativa, activeTab]);

    const fetchAssembleias = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('assembleias')
                .select('*')
                .eq('cooperativa_id', cooperativa.id);

            if (activeTab === 'proximas') {
                query = query.eq('finalizou', false).order('created_at', { ascending: false });
            } else {
                query = query.eq('finalizou', true).order('created_at', { ascending: false });
            }

            const { data, error } = await query;
            if (error) throw error;
            setAssembleias(data || []);
        } catch (error) {
            console.error('Erro ao buscar assembleias:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-inter">
            {/* Header Sticky */}
            <div className="bg-white px-6 pt-12 pb-4 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => navigate('/portal')} className="text-blue-600">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-black text-slate-800 uppercase tracking-widest text-center flex-1">
                        Assembleias - {cooperativa?.nome}
                    </h1>
                    <div className="w-6" /> {/* Spacer */}
                </div>

                <div className="flex items-center">
                    <button
                        onClick={() => setActiveTab('proximas')}
                        className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'proximas' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 border-b border-slate-100'}`}
                    >
                        Próximas Assembleias
                    </button>
                    <button
                        onClick={() => setActiveTab('finalizadas')}
                        className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'finalizadas' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 border-b border-slate-100'}`}
                    >
                        Assembleias Finalizadas
                        {activeTab === 'finalizadas' && <span className="absolute top-0 right-2 w-2 h-2 bg-blue-500 rounded-full" />}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="px-6 pt-8 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center py-20 opacity-30">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Carregando...</span>
                    </div>
                ) : assembleias.length === 0 ? (
                    <div className="flex flex-col items-center py-20 opacity-30 grayscale">
                        <span className="material-symbols-rounded text-6xl mb-4">event_busy</span>
                        <p className="text-[11px] font-black uppercase tracking-widest">Nenhuma assembleia encontrada</p>
                    </div>
                ) : (
                    assembleias.map((assembleia) => (
                        <div key={assembleia.id} className="glass-card bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center p-6 transition-all active:scale-[0.98]">
                            <div className="w-full h-40 bg-blue-50 rounded-2xl mb-6 flex items-center justify-center p-8">
                                <span className="material-symbols-rounded text-blue-400 text-6xl opacity-50">diversity_3</span>
                            </div>

                            <h3 className="text-lg font-black text-slate-800 mb-4 text-center">
                                {assembleia.nome}
                            </h3>

                            <div className="flex flex-col items-center gap-2 mb-8">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="material-symbols-rounded text-sm">schedule</span>
                                    {assembleia.finalizou ? 'Fim:' : 'Início:'} {new Date(assembleia.data_inicio).toLocaleString('pt-BR')}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-slate-400">Status:</span>
                                    <span className={assembleia.finalizou ? 'text-red-500' : 'text-emerald-500 font-black'}>
                                        {assembleia.finalizou ? 'Finalizada' : 'Em Curso'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/portal/assembleia/${assembleia.id}`)}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
                            >
                                Entrar <span className="material-symbols-rounded text-sm">arrow_forward</span>
                            </button>
                        </div>
                    ))
                )}
            </div>

            <MobileBottomNav />
        </div>
    );
};

export default CooperadoAssembleias;
