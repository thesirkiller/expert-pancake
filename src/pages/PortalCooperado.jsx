import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import MobileBottomNav from '../components/MobileBottomNav';

const PortalCooperado = () => {
    const { cooperado, cooperativa } = useAuth();
    const [activeTab, setActiveTab] = useState('proximos');
    const [escalas, setEscalas] = useState([]);
    const [stats, setStats] = useState({ proximos: 0, finalizados: 0 });
    const [loading, setLoading] = useState(true);
    const [startingShift, setStartingShift] = useState(null);

    useEffect(() => {
        if (cooperado) {
            fetchEscalas();
        }
    }, [cooperado, activeTab]);

    const fetchEscalas = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('escalas')
                .select('*')
                .eq('cooperado_id', cooperado.id);

            if (activeTab === 'proximos') {
                query = query.in('status', ['pendente', 'confirmada']).order('data_inicio', { ascending: true });
            } else {
                query = query.in('status', ['executada', 'cancelada']).order('data_inicio', { ascending: false });
            }

            const { data, error } = await query;
            if (error) throw error;
            setEscalas(data || []);

            // Fetch Stats
            const { count: proxCount } = await supabase.from('escalas').select('*', { count: 'exact', head: true }).eq('cooperado_id', cooperado.id).in('status', ['pendente', 'confirmada']);
            const { count: finCount } = await supabase.from('escalas').select('*', { count: 'exact', head: true }).eq('cooperado_id', cooperado.id).in('status', ['executada', 'cancelada']);

            setStats({ proximos: proxCount || 0, finalizados: finCount || 0 });
        } catch (error) {
            console.error('Erro ao buscar escalas:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    };

    const handleStartShift = async (escala) => {
        setStartingShift(escala.id);

        if (!navigator.geolocation) {
            alert("Geolocalização não suportada pelo seu navegador.");
            setStartingShift(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            // 1. Check Distance (500m radius)
            // Se lat_alvo/lng_alvo não estiverem definidos, ignoramos o bloqueio mas avisamos
            let distance = 0;
            if (escala.lat_alvo && escala.lng_alvo) {
                distance = calculateDistance(latitude, longitude, escala.lat_alvo, escala.lng_alvo);
                if (distance > 500) {
                    alert(`Você está muito longe do local (${Math.round(distance)}m). A distância máxima é 500m.`);
                    setStartingShift(null);
                    return;
                }
            }

            // 2. Calculate Delay
            const now = new Date();
            const startExpected = new Date(escala.data_inicio);
            let delay = 0;
            if (now > startExpected) {
                delay = Math.floor((now - startExpected) / 1000 / 60);
            }

            // 3. Update DB
            try {
                const { error } = await supabase
                    .from('escalas')
                    .update({
                        inicio_real: now.toISOString(),
                        lat_inicio: latitude,
                        lng_inicio: longitude,
                        distancia_inicio: Math.round(distance),
                        atraso_minutos: delay,
                        status: 'confirmada' // Ou um status intermediário se necessário
                    })
                    .eq('id', escala.id);

                if (error) throw error;

                alert(`Plantão iniciado com sucesso! ${delay > 0 ? `Atraso de ${delay} min.` : ''}`);
                fetchEscalas();
            } catch (error) {
                alert("Erro ao iniciar plantão.");
            } finally {
                setStartingShift(null);
            }

        }, (error) => {
            alert("Erro ao obter localização. Certifique-se de que o GPS está ligado.");
            setStartingShift(null);
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-inter">
            {/* Header Sticky */}
            <div className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm border-b border-slate-100">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-blue-50 overflow-hidden mb-4 shadow-inner">
                        {cooperado?.foto_url ? (
                            <img src={cooperado.foto_url} alt={cooperado.nome} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <span className="material-symbols-rounded text-4xl">person</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mb-1">
                        <span className="material-symbols-rounded text-sm">expand_more</span>
                        <span className="uppercase tracking-widest">{cooperativa?.nome || 'Minha Cooperativa'}</span>
                    </div>

                    <h1 className="text-xl font-black text-slate-800 mb-2">
                        {cooperado?.nome} {cooperado?.sobrenome}
                    </h1>

                    <div className="flex items-center gap-1 text-amber-500 mb-6">
                        <span className="material-symbols-rounded text-sm fill-amber-500">star</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Avaliações (0)</span>
                    </div>

                    <button className="w-full py-3.5 border border-blue-100 text-blue-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 transition-colors">
                        Ver Perfil
                    </button>

                    {(cooperado?.admin_coop || cooperado?.colaborador_interno || cooperado?.team_count > 0) && (
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full mt-3 py-3.5 bg-slate-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-rounded text-sm">dashboard</span>
                            Painel Administrativo
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 px-6 -mt-4 mb-8">
                <div className="glass-card bg-white p-4 text-center rounded-3xl border border-white/40 shadow-sm transition-all active:scale-95">
                    <div className="text-2xl font-black text-slate-800">{stats.proximos}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Próximos Serviços</div>
                </div>
                <div className="glass-card bg-white p-4 text-center rounded-3xl border border-white/40 shadow-sm transition-all active:scale-95">
                    <div className="text-2xl font-black text-slate-800">{stats.finalizados}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Serviços Finalizados</div>
                </div>
            </div>

            {/* Services Modules Grid */}
            <div className="mb-10 px-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Serviços Disponíveis
                </h2>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'ead', title: 'Cursos', icon: 'play_circle', color: 'blue', path: '/portal/cursos' },
                        { id: 'finance', title: 'Financeiro', icon: 'payments', color: 'emerald', path: '/portal/financeiro' },
                        { id: 'assemblies', title: 'Assembleia', icon: 'groups', color: 'indigo', path: '/portal/assembleias' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => window.location.href = item.path}
                            className="glass-card flex flex-col items-center justify-center p-6 gap-3 group active:scale-95 transition-all text-center bg-white"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 bg-${item.color}-50 text-${item.color}-500 group-hover:bg-${item.color}-500 group-hover:text-white shadow-sm`}>
                                <span className={`material-symbols-rounded text-2xl group-hover:scale-110 transition-transform`}>{item.icon}</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{item.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Tabs */}
            <div className="px-6">
                <div className="flex items-center border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar justify-center">
                    <button
                        onClick={() => setActiveTab('proximos')}
                        className={`pb-4 px-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'proximos' ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                        Próximos
                        {activeTab === 'proximos' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('finalizados')}
                        className={`pb-4 px-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'finalizados' ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                        Finalizados
                        {activeTab === 'finalizados' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
                    </button>
                </div>

                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center py-12 opacity-30">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</span>
                        </div>
                    ) : escalas.length === 0 ? (
                        <div className="flex flex-col items-center py-12 opacity-30 grayscale">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                <span className="material-symbols-rounded text-blue-500 text-3xl">sensors</span>
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
                                Nada encontrado por aqui
                            </p>
                        </div>
                    ) : (
                        escalas.map((escala) => (
                            <div key={escala.id} className="glass-card bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <span className="material-symbols-rounded text-xl">medical_services</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{escala.titulo || 'Serviço de Saúde'}</h4>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{escala.setor || 'Geral'}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${escala.status === 'vago' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {escala.status}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-rounded text-blue-400 text-sm">calendar_today</span>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Data</span>
                                            <span className="text-[11px] font-bold text-slate-700">{new Date(escala.data_inicio).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-rounded text-blue-400 text-sm">schedule</span>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Horário</span>
                                            <span className="text-[11px] font-bold text-slate-700">{new Date(escala.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-slate-500">
                                    <span className="material-symbols-rounded text-sm">location_on</span>
                                    <span className="text-[10px] font-medium truncate">{escala.local || 'Local não informado'}</span>
                                </div>

                                {activeTab === 'proximos' && !escala.inicio_real && (
                                    <button
                                        disabled={startingShift === escala.id}
                                        onClick={() => handleStartShift(escala)}
                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {startingShift === escala.id ? 'Localizando...' : 'Iniciar Plantão'}
                                        <span className="material-symbols-rounded text-sm">play_circle</span>
                                    </button>
                                )}

                                {escala.inicio_real && (
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Iniciado em</span>
                                            <span className="text-xs font-bold text-emerald-700">{new Date(escala.inicio_real).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Atraso</span>
                                            <span className="text-xs font-bold text-emerald-700">{escala.atraso_minutos || 0} min</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <button className="w-full mt-10 bg-white py-4 rounded-2xl shadow-sm border border-slate-100 text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                    Visualizar em calendário
                    <span className="material-symbols-rounded text-sm">calendar_month</span>
                </button>
            </div>

            <MobileBottomNav />
        </div>
    );
};

export default PortalCooperado;
