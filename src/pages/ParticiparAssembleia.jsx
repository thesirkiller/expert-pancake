import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

const ParticiparAssembleia = () => {
    const { id: assemblyId } = useParams();
    const { user, cooperativa, cooperado } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [assembly, setAssembly] = useState(null);
    const [presence, setPresence] = useState(null);
    const [activeTab, setActiveTab] = useState('video'); // video, pautas, docs
    const [agendas, setAgendas] = useState([]);
    const [pautaAberta, setPautaAberta] = useState(null);

    useEffect(() => {
        if (user && assemblyId) {
            fetchInitialData();
            subscribeToAssembly();
        }
    }, [user, assemblyId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Assembly
            const { data: assData, error: assError } = await supabase
                .from('assembleias')
                .select('*')
                .eq('id', assemblyId)
                .single();
            if (assError) throw assError;
            setAssembly(assData);

            // 2. Fetch Presence
            const { data: presData, error: presError } = await supabase
                .from('presencas_assembleia')
                .select('*')
                .eq('assembleia_id', assemblyId)
                .eq('cooperado_id', cooperado.id)
                .maybeSingle();

            setPresence(presData);

            // 3. Fetch Agendas
            const { data: pautasData } = await supabase
                .from('pautas_reuniao')
                .select('*')
                .eq('assembleia_id', assemblyId)
                .order('created_at', { ascending: true });

            setAgendas(pautasData || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToAssembly = () => {
        const assemblySub = supabase
            .channel(`assembly_${assemblyId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'assembleias',
                filter: `id=eq.${assemblyId}`
            }, payload => {
                setAssembly(payload.new);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'pautas_reuniao',
                filter: `assembleia_id=eq.${assemblyId}`
            }, () => {
                fetchAgendas();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(assemblySub);
        };
    };

    const fetchAgendas = async () => {
        const { data } = await supabase
            .from('pautas_reuniao')
            .select('*')
            .eq('assembleia_id', assemblyId)
            .order('created_at', { ascending: true });
        setAgendas(data || []);
    };

    const handleConfirmConvocacao = async () => {
        try {
            if (presence) {
                const { error } = await supabase
                    .from('presencas_assembleia')
                    .update({ confirmou_convocacao: true })
                    .eq('id', presence.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('presencas_assembleia')
                    .insert([{
                        assembleia_id: assemblyId,
                        cooperado_id: cooperado.id,
                        confirmou_convocacao: true
                    }])
                    .select()
                    .single();
                if (error) throw error;
                setPresence(data);
            }
            // Update local state
            setPresence(prev => ({ ...prev, confirmou_convocacao: true }));
        } catch (error) {
            alert('Erro ao confirmar convocação');
        }
    };

    const handleConfirmPresenca = async () => {
        if (!assembly.chamada_atual) return;
        try {
            const { error } = await supabase
                .from('presencas_assembleia')
                .update({
                    confirmou_presenca: true,
                    tipo_chamada: assembly.chamada_atual
                })
                .eq('id', presence.id);
            if (error) throw error;
            setPresence(prev => ({ ...prev, confirmou_presenca: true, tipo_chamada: assembly.chamada_atual }));
        } catch (error) {
            alert('Erro ao confirmar presença');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center opacity-30">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6" />
            <span className="text-[11px] font-black uppercase tracking-widest">Aguarde...</span>
        </div>
    );

    // Flow Logic
    const hasConfirmedConvocacao = presence?.confirmou_convocacao;
    const hasConfirmedPresence = presence?.confirmou_presenca;
    const isMeetingActive = assembly?.chamada_atual > 0;

    return (
        <div className="min-h-screen bg-slate-50 font-inter">
            {/* Liquid Glass Header */}
            <div className="bg-white/80 backdrop-blur-xl px-6 pt-12 pb-4 sticky top-0 z-50 border-b border-white/20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/portal/assembleias')} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">
                            {assembly?.nome}
                        </h1>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            {hasConfirmedPresence ? 'Você está na sala' : 'Confirmação de Acesso'}
                        </p>
                    </div>
                    {hasConfirmedPresence && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Ao Vivo</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 pb-24">
                {/* STEP 1: CONVOCACAO */}
                {!hasConfirmedConvocacao && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="glass-card bg-white p-8 rounded-[40px] border border-white shadow-2xl flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-8">
                                <span className="material-symbols-rounded text-5xl">inventory</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-4 leading-tight">
                                Confirme sua<br />convocação
                            </h2>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-10 px-4">
                                Para participar desta assembleia, você precisa confirmar que recebeu o edital de convocação.
                            </p>
                            <button
                                onClick={handleConfirmConvocacao}
                                className="w-full bg-blue-600 text-white py-5 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                Confirmar Recebimento
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: PRESENCA */}
                {hasConfirmedConvocacao && !hasConfirmedPresence && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="glass-card bg-white p-8 rounded-[40px] border border-white shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                            {/* Background light logic */}
                            <div className={`absolute top-0 right-0 p-6 ${isMeetingActive ? 'opacity-100' : 'opacity-20'}`}>
                                <span className={`w-3 h-3 rounded-full flex ${isMeetingActive ? 'bg-emerald-500 shadow-[0_0_15px_#22c55e]' : 'bg-slate-300'}`} />
                            </div>

                            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 transition-colors ${isMeetingActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                <span className="material-symbols-rounded text-5xl">record_voice_over</span>
                            </div>

                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-4 leading-tight">
                                {isMeetingActive ? 'Presença Liberada!' : 'Aguardando o Início'}
                            </h2>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-10 px-4">
                                {isMeetingActive
                                    ? `A ${assembly.chamada_atual}ª chamada está aberta. Confirme sua presença para entrar na sala.`
                                    : 'A assembleia ainda não foi iniciada pelo administrador. Por favor, aguarde o sinal.'}
                            </p>

                            <button
                                onClick={handleConfirmPresenca}
                                disabled={!isMeetingActive}
                                className={`w-full py-5 rounded-2xl text-[13px] font-black uppercase tracking-[0.1em] transition-all shadow-xl active:scale-95 ${isMeetingActive ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-200 text-slate-400 shadow-none'}`}
                            >
                                {isMeetingActive ? 'Confirmar Presença' : 'Aguarde o Administrador'}
                            </button>
                        </div>

                        {/* Additional Info Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-card bg-white/60 p-5 rounded-3xl border border-white flex flex-col items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Chamada</span>
                                <span className="text-lg font-black text-slate-800">{assembly?.chamada_atual || '-'}ª</span>
                            </div>
                            <div className="glass-card bg-white/60 p-5 rounded-3xl border border-white flex flex-col items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Início</span>
                                <span className="text-sm font-black text-slate-800">{new Date(assembly?.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: ACTIVE MEETING */}
                {hasConfirmedPresence && (
                    <div className="animate-in fade-in duration-700 space-y-6">
                        {/* Video / Tab Control */}
                        <div className="space-y-4">
                            <div className="flex border-b border-slate-200">
                                {['video', 'pautas', 'documentos'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-slate-400'}`}
                                    >
                                        {tab === 'video' ? 'Transmissão' : tab === 'pautas' ? 'Pautas' : 'Documentos'}
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-blue-600 rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'video' && (
                                <div className="animate-in zoom-in-95 duration-500">
                                    <div className="aspect-video bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden relative group">
                                        {/* Video Placeholder (Daily.co / YouTube / etc) */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white p-8 text-center">
                                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                                                <span className="material-symbols-rounded text-white">videocam</span>
                                            </div>
                                            <div>
                                                <h3 className="font-black uppercase tracking-widest text-xs">Conectando ao sinal...</h3>
                                                <p className="text-[10px] opacity-70 mt-1">O administrador iniciará a transmissão em breve.</p>
                                            </div>
                                        </div>
                                        {/* Overlay controls for cooperator */}
                                        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-4">
                                            <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                                                <span className="material-symbols-rounded">mic_off</span>
                                            </button>
                                            <button className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                                                <span className="material-symbols-rounded rotate-[135deg]">call</span>
                                            </button>
                                            <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                                                <span className="material-symbols-rounded">videocam_off</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pautas' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                                    {agendas.filter(a => a.liberada && !a.finalizada).length === 0 ? (
                                        <div className="py-20 flex flex-col items-center opacity-30 grayscale">
                                            <span className="material-symbols-rounded text-6xl">receipt_long</span>
                                            <p className="text-[11px] font-black uppercase mt-4">Nenhuma pauta em votação</p>
                                        </div>
                                    ) : (
                                        agendas.filter(a => a.liberada && !a.finalizada).map(agenda => (
                                            <div key={agenda.id} className="glass-card bg-white p-6 rounded-3xl border border-slate-100 shadow-xl">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                        Votação Aberta
                                                    </span>
                                                    <span className="material-symbols-rounded text-slate-300">more_horiz</span>
                                                </div>
                                                <h3 className="text-base font-black text-slate-800 mb-2 leading-snug">
                                                    {agenda.nome}
                                                </h3>
                                                <button
                                                    onClick={() => setPautaAberta(agenda)}
                                                    className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-50 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                                >
                                                    Dar meu voto
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'documentos' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                                    <div className="glass-card bg-white p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center py-20 opacity-30">
                                        <span className="material-symbols-rounded text-4xl mb-4">folder_off</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum documento anexado</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Opiniao/Voto Placeholder */}
            {pautaAberta && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-2">Sua Opinião</h2>
                        <p className="text-xs text-slate-500 font-medium mb-8">
                            {pautaAberta.nome}
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <button className="w-full py-5 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                Concordar Plenamente
                            </button>
                            <button className="w-full py-5 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all">
                                Discordar
                            </button>
                            <button onClick={() => setPautaAberta(null)} className="w-full py-5 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest">
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParticiparAssembleia;
