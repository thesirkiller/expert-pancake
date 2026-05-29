import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import Sidebar from '../components/Sidebar'

export default function Assembleias() {
    const { cooperativa } = useAuth()
    const [view, setView] = useState('list') // 'list', 'create', or 'agendas'
    const [assemblies, setAssemblies] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    // Agendas & Questions State
    const [currentAssembly, setCurrentAssembly] = useState(null)
    const [agendas, setAgendas] = useState([])
    const [newAgenda, setNewAgenda] = useState({ nome: '', modo: 'proposta' })
    const [editingAgenda, setEditingAgenda] = useState(null)
    const [expandedPautaId, setExpandedPautaId] = useState(null)
    const [questions, setQuestions] = useState({}) // { pautaId: [questions] }

    // Quorum & Attendance State
    const [totalCooperators, setTotalCooperators] = useState(0)
    const [presentCount, setPresentCount] = useState(0)
    const [attendanceList, setAttendanceList] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard', 'chamadas', 'pautas', 'documentos'

    const [newAssembly, setNewAssembly] = useState({
        nome: '',
        data_inicio: '',
        tipo: 'ago_oficial',
        hash_reuniao: ''
    })

    // Modal State
    const [modal, setModal] = useState({
        show: false,
        title: '',
        message: '',
        type: 'alert', // 'alert', 'confirm', 'input'
        inputValue: '',
        onConfirm: () => { },
        confirmLabel: 'OK'
    })

    const menuItems = view === 'manage' ? [
        { id: 'dashboard', label: 'Resumo Geral', icon: 'grid_view' },
        { id: 'pautas', label: 'Itens de Pauta', icon: 'receipt_long' },
        { id: 'chamadas', label: 'Chamadas & Quórum', icon: 'history' },
        { id: 'documentos', label: 'Documentos', icon: 'folder' },
        { id: 'voltar', label: 'Voltar ao Início', icon: 'arrow_back' },
    ] : [
        { id: 'assembleias', label: 'Assembleias', icon: 'handshake' },
    ]

    useEffect(() => {
        if (cooperativa) {
            fetchAssemblies()
        }
    }, [cooperativa])

    const fetchAssemblies = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('assembleias')
                .select('*')
                .eq('cooperativa_id', cooperativa.id)
                .order('data_inicio', { ascending: false })

            if (error) throw error
            setAssemblies(data)
        } catch (err) {
            console.error('Error fetching assemblies:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddAssembly = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const { error: insertError } = await supabase
                .from('assembleias')
                .insert([{
                    cooperativa_id: cooperativa.id,
                    nome: newAssembly.nome,
                    data_inicio: newAssembly.data_inicio,
                    tipo: newAssembly.tipo,
                    hash_reuniao: newAssembly.hash_reuniao,
                    iniciou: false,
                    finalizou: false
                }])

            if (insertError) throw insertError

            setView('list')
            setNewAssembly({
                nome: '',
                data_inicio: '',
                tipo: 'ago_oficial',
                hash_reuniao: ''
            })
            fetchAssemblies()
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const fetchAgendas = async (assemblyId) => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('pautas_reuniao')
                .select('*, votos:votos_assembleia(*)')
                .eq('assembleia_id', assemblyId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setAgendas(data)
        } catch (err) {
            console.error('Error fetching agendas:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchTotalCooperatorsCount = async () => {
        try {
            const { count, error } = await supabase
                .from('cooperados')
                .select('*', { count: 'exact', head: true })
                .eq('cooperativa_id', cooperativa.id)

            if (error) throw error
            setTotalCooperators(count || 0)
            return count || 0
        } catch (err) {
            console.error('Error fetching cooperator count:', err)
            return 0
        }
    }

    const fetchAttendance = async (assemblyId) => {
        try {
            const { data, error, count } = await supabase
                .from('presencas_assembleia')
                .select('*, cooperado:cooperados(nome, cpf)', { count: 'exact' })
                .eq('assembleia_id', assemblyId)

            if (error) throw error
            setAttendanceList(data)
            setPresentCount(count || 0)
        } catch (err) {
            console.error('Error fetching attendance:', err)
        }
    }

    const handleAddAgenda = async (e) => {
        e.preventDefault()
        if (!newAgenda.nome) return
        setSubmitting(true)

        try {
            const { error: insertError } = await supabase
                .from('pautas_reuniao')
                .insert([{
                    assembleia_id: currentAssembly.id,
                    nome: newAgenda.nome,
                    modo: newAgenda.modo,
                    liberada: false,
                    finalizada: false
                }])

            if (insertError) throw insertError

            setNewAgenda({ nome: '', modo: 'proposta' })
            fetchAgendas(currentAssembly.id)
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleRegisterPresence = async (cooperadoId) => {
        try {
            const { error } = await supabase
                .from('presencas_assembleia')
                .insert([{
                    assembleia_id: currentAssembly.id,
                    cooperado_id: cooperadoId
                }])

            if (error) {
                if (error.code === '23505') { // Unique violation
                    setModal({ show: true, title: 'Aviso', message: 'Este cooperado já registrou presença.', type: 'alert' })
                } else {
                    throw error
                }
                return
            }

            fetchAttendance(currentAssembly.id)
            setSearchTerm('')
            setSearchResults([])
        } catch (err) {
            setModal({ show: true, title: 'Erro', message: 'Erro ao registrar presença.', type: 'alert' })
        }
    }

    const handleNextCall = async () => {
        if (currentAssembly.chamada_atual >= 3) return

        const nextCall = currentAssembly.chamada_atual + 1
        try {
            const { error } = await supabase
                .from('assembleias')
                .update({ chamada_atual: nextCall })
                .eq('id', currentAssembly.id)

            if (error) throw error
            setCurrentAssembly(prev => ({ ...prev, chamada_atual: nextCall }))
        } catch (err) {
            setModal({ show: true, title: 'Erro', message: 'Erro ao trocar chamada.', type: 'alert' })
        }
    }

    const searchCooperators = async (term) => {
        if (!term || term.length < 2) {
            setSearchResults([])
            return
        }
        try {
            const { data, error } = await supabase
                .from('cooperados')
                .select('id, nome, cpf')
                .eq('cooperativa_id', cooperativa.id)
                .or(`nome.ilike.%${term}%,cpf.ilike.%${term}%`)
                .limit(5)

            if (error) throw error
            setSearchResults(data)
        } catch (err) {
            console.error('Error searching cooperators:', err)
        }
    }

    const fetchQuestions = async (pautaId) => {
        try {
            const { data, error } = await supabase
                .from('perguntas_assembleia')
                .select(`
                    *,
                    alternativas:alternativas_assembleias(*)
                `)
                .eq('pauta_id', pautaId)

            if (error) throw error
            setQuestions(prev => ({ ...prev, [pautaId]: data }))
        } catch (err) {
            console.error('Error fetching questions:', err)
        }
    }
    const handleUpdatePautaStatus = async (agenda, field) => {
        try {
            const { error } = await supabase
                .from('pautas_reuniao')
                .update({ [field]: !agenda[field] })
                .eq('id', agenda.id)

            if (error) throw error
            fetchAgendas(currentAssembly.id)
        } catch (err) {
            setModal({
                show: true,
                title: 'Erro',
                message: `Não foi possível atualizar o status da pauta.`,
                type: 'alert'
            })
        }
    }

    const handleEditPauta = async (e) => {
        e.preventDefault()
        if (!editingAgenda?.nome) return
        setSubmitting(true)

        try {
            const { error } = await supabase
                .from('pautas_reuniao')
                .update({
                    nome: editingAgenda.nome,
                    modo: editingAgenda.modo
                })
                .eq('id', editingAgenda.id)

            if (error) throw error
            setEditingAgenda(null)
            fetchAgendas(currentAssembly.id)
        } catch (err) {
            setModal({
                show: true,
                title: 'Erro',
                message: 'Não foi possível atualizar a pauta.',
                type: 'alert'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const generatePautaPDF = async (agenda) => {
        const pdfMake = (await import('pdfmake/build/pdfmake')).default
        const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default
        if (pdfFonts && pdfFonts.pdfMake) {
            pdfMake.vfs = pdfFonts.pdfMake.vfs
        }

        const votes = agenda.votos || []
        const counts = votes.reduce((acc, v) => {
            acc[v.voto_opcao] = (acc[v.voto_opcao] || 0) + 1
            return acc
        }, { voto_sim: 0, voto_nao: 0, abstencao: 0 })

        const docDefinition = {
            content: [
                { text: `Relatório de Pauta - ${agenda.nome}`, style: 'header' },
                { text: `Assembleia: ${currentAssembly.nome}`, style: 'subheader' },
                { text: `Data do Relatório: ${new Date().toLocaleString()}`, margin: [0, 0, 0, 20] },

                { text: 'Resultado da Votação', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            [{ text: 'Opção', style: 'tableHeader' }, { text: 'Quantidade', style: 'tableHeader' }],
                            ['Favoráveis (Sim)', counts.voto_sim],
                            ['Contrários (Não)', counts.voto_nao],
                            ['Abstenções', counts.abstencao],
                            [{ text: 'Total de Votos', bold: true }, { text: votes.length, bold: true }]
                        ]
                    },
                    margin: [0, 0, 0, 20]
                },

                { text: 'Conclusão', style: 'sectionHeader' },
                {
                    text: agenda.finalizada
                        ? 'Votação encerrada e auditada.'
                        : 'Votação ainda em processo ou não iniciada.',
                    italics: true
                }
            ],
            styles: {
                header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10], color: '#1E293B' },
                subheader: { fontSize: 16, bold: true, margin: [0, 0, 0, 5], color: '#334155' },
                sectionHeader: { fontSize: 14, bold: true, margin: [0, 15, 0, 10], color: '#2563EB' },
                tableHeader: { bold: true, fontSize: 12, color: 'white', fillColor: '#2563EB' }
            }
        }

        pdfMake.createPdf(docDefinition).download(`pauta_${agenda.id}.pdf`)
    }

    const handleAddQuestion = async (pautaId, text) => {
        if (!text) return
        try {
            const { error } = await supabase
                .from('perguntas_assembleia')
                .insert([{ pauta_id: pautaId, pergunta: text }])

            if (error) throw error
            fetchQuestions(pautaId)
        } catch (err) {
            setModal({
                show: true,
                title: 'Erro',
                message: 'Não foi possível adicionar a pergunta.',
                type: 'alert'
            })
        }
    }
    const handleStartAssembly = async () => {
        try {
            const { error } = await supabase
                .from('assembleias')
                .update({ iniciou: true })
                .eq('id', currentAssembly.id)

            if (error) throw error
            const updated = { ...currentAssembly, iniciou: true }
            setCurrentAssembly(updated)
            fetchAssemblies()
        } catch (err) {
            setModal({
                show: true,
                title: 'Erro',
                message: 'Não foi possível iniciar a assembleia.',
                type: 'alert'
            })
        }
    }

    const handleFinishAssembly = async () => {
        setModal({
            show: true,
            title: 'Finalizar Assembleia',
            message: 'Deseja realmente finalizar esta assembleia? Esta ação é irreversível e encerrará todas as votações.',
            type: 'confirm',
            confirmLabel: 'FINALIZAR',
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('assembleias')
                        .update({ finalizou: true, iniciou: false })
                        .eq('id', currentAssembly.id)

                    if (error) throw error
                    const updated = { ...currentAssembly, finalizou: true, iniciou: false }
                    setCurrentAssembly(updated)
                    fetchAssemblies()
                    setModal(prev => ({ ...prev, show: false }))
                } catch (err) {
                    setModal({
                        show: true,
                        title: 'Erro',
                        message: 'Não foi possível finalizar a assembleia.',
                        type: 'alert'
                    })
                }
            }
        })
    }

    const [voteResults, setVoteResults] = useState({}) // { pautaId: { sim: 0, nao: 0, abstencao: 0 } }

    const fetchResults = async (pautaId) => {
        try {
            const { data, error } = await supabase
                .from('votos_assembleia')
                .select('voto_opcao')
                .eq('pauta_id', pautaId)

            if (error) throw error
            const results = data.reduce((acc, vote) => {
                acc[vote.voto_opcao] = (acc[vote.voto_opcao] || 0) + 1
                return acc
            }, { voto_sim: 0, voto_nao: 0, abstencao: 0 })
            setVoteResults(prev => ({ ...prev, [pautaId]: results }))
        } catch (err) {
            console.error('Error fetching results:', err)
        }
    }

    const handleOpenManage = async (assembly) => {
        setCurrentAssembly(assembly)
        setView('manage')
        setActiveTab('dashboard')
        fetchAgendas(assembly.id)
        fetchAttendance(assembly.id)
        const partnersCount = await fetchTotalCooperatorsCount()
        setTotalCooperators(partnersCount)
    }

    const getStatusBadge = (assembly) => {
        if (assembly.finalizou) return { label: 'Finalizada', class: 'bg-slate-100 text-slate-500' }
        if (assembly.iniciou) return { label: 'Em Andamento', class: 'bg-emerald-50 text-emerald-600 animate-pulse' }
        return { label: 'Agendada', class: 'bg-blue-50 text-blue-600' }
    }

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex">
            <Sidebar
                title={view === 'manage' ? 'Gerenciar' : 'Assembleias'}
                menuItems={menuItems}
                activeId={view === 'manage' ? activeTab : 'assembleias'}
                onItemClick={(id) => {
                    if (id === 'voltar') setView('list')
                    else if (view === 'manage') setActiveTab(id)
                }}
            />

            <div className="flex-1 with-sidebar relative">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[10%] -right-[5%] w-[30%] h-[30%] bg-blue-400/10 blur-[100px] rounded-full" />
                </div>

                <header className="sticky top-0 z-40 glass-panel border-b border-white/20 px-8 py-6 backdrop-blur-md">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                {view === 'list' ? 'Assembleias Gerais' : view === 'create' ? 'Nova Assembleia' : 'Gerenciar Assembleia'}
                            </h1>
                            <p className="text-slate-500 font-medium">
                                {view === 'list'
                                    ? 'Gerencie as reuniões e votações da cooperativa'
                                    : view === 'create' ? 'Configure os detalhes da próxima assembleia' : currentAssembly?.nome}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {view === 'manage' && !currentAssembly?.finalizou && (
                                <button
                                    onClick={currentAssembly?.iniciou ? handleFinishAssembly : handleStartAssembly}
                                    className={`glass-button px-6 !py-3 flex items-center gap-2 ${currentAssembly?.iniciou ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}
                                >
                                    <span className="material-symbols-rounded">{currentAssembly?.iniciou ? 'stop' : 'play_arrow'}</span>
                                    {currentAssembly?.iniciou ? 'FINALIZAR AGORA' : 'INICIAR ASSEMBLEIA'}
                                </button>
                            )}
                            <button
                                onClick={() => setView(view === 'list' ? 'create' : 'list')}
                                className={`glass-button ${view === 'list' ? 'bg-blue-600' : 'bg-slate-100 !text-slate-600'} px-6 !py-3 flex items-center gap-2 group`}
                            >
                                <span className="material-symbols-rounded text-xl">
                                    {view === 'list' ? 'add' : 'arrow_back'}
                                </span>
                                {view === 'list' ? 'NOVA ASSEMBLEIA' : 'VOLTAR'}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-8 py-10">
                    {view === 'list' ? (
                        <>
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <span className="material-symbols-rounded animate-spin text-4xl text-blue-500">sync</span>
                                </div>
                            ) : assemblies.length === 0 ? (
                                <div className="glass-card p-20 text-center flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-rounded text-4xl">handshake</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">Nenhuma assembleia encontrada</h3>
                                        <p className="text-slate-500">Comece criando sua primeira assembleia geral.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {assemblies.map(assembly => (
                                        <div key={assembly.id} className="glass-card group p-6 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 border border-white/40">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`px-3 py-1 rounded-full border border-current/20 ${getStatusBadge(assembly).class}`}>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{getStatusBadge(assembly).label}</span>
                                                </div>
                                                <span className="text-slate-400 material-symbols-rounded">more_vert</span>
                                            </div>

                                            <h3 className="text-lg font-black text-slate-800 mb-2 truncate group-hover:text-blue-600 transition-colors">
                                                {assembly.nome}
                                            </h3>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <span className="material-symbols-rounded text-sm">calendar_today</span>
                                                    <span className="text-xs font-bold uppercase tracking-wider">
                                                        {new Date(assembly.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <span className="material-symbols-rounded text-sm">schedule</span>
                                                    <span className="text-xs font-bold">
                                                        {new Date(assembly.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <span className="material-symbols-rounded text-sm">category</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {assembly.tipo.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-slate-100/50">
                                                <button
                                                    onClick={() => handleOpenManage(assembly)}
                                                    className="w-full glass-button bg-blue-50 !text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white transition-all font-black text-[10px] tracking-widest uppercase"
                                                >
                                                    GERENCIAR ASSEMBLEIA
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : view === 'create' ? (
                        <div className="glass-panel p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                            {error && (
                                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                                    <span className="material-symbols-rounded">error_outline</span>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleAddAssembly} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Título da Assembleia</label>
                                        <input
                                            required
                                            className="glass-input w-full"
                                            value={newAssembly.nome}
                                            onChange={e => setNewAssembly({ ...newAssembly, nome: e.target.value })}
                                            placeholder="Ex: AGO 2024 - Prestação de Contas"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Data e Hora de Início</label>
                                            <input
                                                required
                                                type="datetime-local"
                                                className="glass-input w-full"
                                                value={newAssembly.data_inicio}
                                                onChange={e => setNewAssembly({ ...newAssembly, data_inicio: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Tipo de Assembleia</label>
                                            <select
                                                className="glass-input w-full"
                                                value={newAssembly.tipo}
                                                onChange={e => setNewAssembly({ ...newAssembly, tipo: e.target.value })}
                                            >
                                                <option value="age_oficial">AGE Oficial</option>
                                                <option value="ago_oficial">AGO Oficial</option>
                                                <option value="assembleia_teste">Assembleia de Teste</option>
                                                <option value="ago_e_age_oficiais">AGO e AGE Oficiais</option>
                                                <option value="age_especial_oficial">AGE Especial Oficial</option>
                                            </select>
                                        </div>
                                    </div>

                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="glass-button w-full bg-blue-600 shadow-xl shadow-blue-500/20 !py-5 text-sm font-black tracking-[0.2em] uppercase flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                    >
                                        {submitting ? (
                                            <span className="material-symbols-rounded animate-spin">sync</span>
                                        ) : (
                                            <span className="material-symbols-rounded">save</span>
                                        )}
                                        CRIAR ASSEMBLEIA +
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : ( // This is the 'manage' view
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Dashboard Header Info */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <span className="material-symbols-rounded">
                                            {activeTab === 'dashboard' ? 'grid_view' :
                                                activeTab === 'chamadas' ? 'history' :
                                                    activeTab === 'pautas' ? 'receipt_long' : 'folder'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                            {activeTab === 'dashboard' ? 'Resumo da Assembleia' :
                                                activeTab === 'chamadas' ? 'Controle de Quórum' :
                                                    activeTab === 'pautas' ? 'Itens de Pauta' : 'Documentos'}
                                        </h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {activeTab === 'dashboard' ? 'Visão consolidada da reunião' :
                                                activeTab === 'chamadas' ? 'Registro de presença e convocatórias' :
                                                    activeTab === 'pautas' ? 'Gestão de pautas e perguntas' : 'Arquivos disponíveis para os sócios'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="glass-button bg-white !text-blue-600 border border-blue-100 px-6 !py-3 flex items-center gap-2 shadow-sm">
                                        <span className="material-symbols-rounded text-sm">file_download</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Relatório Geral</span>
                                    </button>
                                    <div className={`px-4 py-2 rounded-2xl border border-current/10 ${getStatusBadge(currentAssembly).class}`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{getStatusBadge(currentAssembly).label}</span>
                                    </div>
                                </div>
                            </div>

                            {/* TAB: DASHBOARD */}
                            {activeTab === 'dashboard' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col lg:flex-row gap-8">
                                    <div className="flex-1 space-y-8">
                                        {/* Call Summary Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {[1, 2, 3].map(callNum => (
                                                <div key={callNum} className={`glass-card p-6 border border-white/40 transition-all ${currentAssembly?.chamada_atual === callNum ? 'bg-blue-600/5 ring-2 ring-blue-500/20' : 'bg-white/40'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{callNum}ª Chamada</h4>
                                                        {currentAssembly?.chamada_atual === callNum && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário da chamada</div>
                                                        <div className="text-sm font-bold text-slate-700">13:55</div> {/* Mocked for now */}
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <span className="material-symbols-rounded text-xs">person</span>
                                                            Usuários presentes
                                                        </div>
                                                        <div className="text-lg font-black text-blue-600">
                                                            {attendanceList.filter(p => p.tipo_chamada === callNum).length}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Agenda Summary */}
                                        <div className="glass-card p-8 bg-white/60 border border-white/40">
                                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Itens de Pauta</h3>
                                                <button onClick={() => setActiveTab('pautas')} className="text-blue-600 text-[10px] font-black hover:underline uppercase tracking-widest">Ver Todos</button>
                                            </div>
                                            <div className="space-y-4">
                                                {agendas.length === 0 ? (
                                                    <p className="text-[10px] text-slate-400 italic">Nenhuma pauta adicionada.</p>
                                                ) : agendas.slice(0, 5).map(agenda => (
                                                    <div key={agenda.id} className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/20 group hover:bg-white/80 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                                <span className="material-symbols-rounded text-sm">receipt_long</span>
                                                            </div>
                                                            <span className="font-bold text-slate-700">{agenda.nome}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Proposta</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${agenda.liberada ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                                                <span className={`text-[8px] font-black uppercase tracking-widest ${agenda.finalizada ? 'text-blue-600' : agenda.liberada ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                                    {agenda.finalizada ? 'Finalizada' : agenda.liberada ? 'Em Votação' : 'Aguardando Liberação'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Participants Sidebar */}
                                    <div className="lg:w-80 space-y-4">
                                        <div className="glass-card bg-white/60 border border-white/40 overflow-hidden min-h-[500px] flex flex-col">
                                            <div className="p-6 border-b border-slate-100 bg-white/40 flex items-center justify-between">
                                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                    Participantes
                                                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[8px]">{presentCount}</span>
                                                </h3>
                                                <button className="text-blue-600 text-[10px] font-black hover:underline uppercase tracking-widest flex items-center gap-1">
                                                    <span className="material-symbols-rounded text-xs">file_download</span>
                                                    Relatório
                                                </button>
                                            </div>

                                            <div className="p-4 bg-slate-50/50">
                                                <button className="w-full py-3 bg-white border border-blue-200 border-dashed rounded-xl text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-all uppercase tracking-widest">
                                                    Cooperados Presentes
                                                </button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                                {attendanceList.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-20 opacity-30 grayscale">
                                                        <span className="material-symbols-rounded text-4xl mb-2">person_off</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Ninguém aqui</span>
                                                    </div>
                                                ) : attendanceList.map((at, idx) => (
                                                    <div key={at.id} className="flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/40 group hover:border-blue-100 transition-all">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                                            <span className="material-symbols-rounded text-sm">person</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">
                                                                {at.cooperados?.nome || 'Cooperado Exemplo'}
                                                            </div>
                                                        </div>
                                                        <div className="w-1 h-32 bg-blue-600/10 rounded-full overflow-hidden absolute right-0 group-hover/list:bg-blue-600 transition-all" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: CHAMADAS */}
                            {activeTab === 'chamadas' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                                    {[1, 2, 3].map(callNum => (
                                        <div key={callNum} className="glass-card p-8 bg-white/60 border border-white/40 relative overflow-hidden group">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                                                        {callNum}ª chamada
                                                        <button className="text-blue-600 text-[10px] font-black hover:underline uppercase tracking-widest flex items-center gap-1 ml-4 border border-blue-100 px-3 py-1 rounded-full bg-white transition-all shadow-sm">
                                                            <span className="material-symbols-rounded text-xs">file_download</span>
                                                            Relatório
                                                        </button>
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                            Cooperados Presentes: <span className="text-emerald-500 font-black">{attendanceList.filter(p => p.tipo_chamada === callNum).length}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                            Cooperados necessários: <span className="text-emerald-500 font-black">
                                                                {callNum === 1 ? Math.ceil(totalCooperators * 0.66) :
                                                                    callNum === 2 ? Math.ceil(totalCooperators * 0.5) + 1 : 10}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {currentAssembly?.chamada_atual === callNum && (
                                                        <div className="px-6 py-2 bg-emerald-500 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                                            Em Curso
                                                        </div>
                                                    )}
                                                    {currentAssembly?.chamada_atual > callNum && (
                                                        <div className="px-6 py-2 bg-red-500 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-red-500/20">
                                                            Finalizada
                                                        </div>
                                                    )}
                                                    {currentAssembly?.chamada_atual < callNum && (
                                                        <div className="px-6 py-2 bg-slate-200 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                            Aguardando
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress Bar for Call 3 specific logic if needed */}
                                            {callNum === 3 && currentAssembly?.chamada_atual === 3 && (
                                                <div className="absolute top-0 right-0 p-4">
                                                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
                                                        <span className="material-symbols-rounded text-xs">check_circle</span>
                                                        Quórum batido
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Action Footers */}
                                    <div className="pt-8 flex justify-center">
                                        <button
                                            onClick={handleNextCall}
                                            disabled={currentAssembly?.chamada_atual >= 3}
                                            className={`glass-button text-white px-12 !py-5 flex items-center gap-3 shadow-xl transition-all active:scale-95 ${currentAssembly?.chamada_atual >= 3 ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
                                        >
                                            <span className="text-xs font-black uppercase tracking-[0.2em]">
                                                {currentAssembly?.chamada_atual === 0 ? 'Iniciar 1ª Chamada →' :
                                                    currentAssembly?.chamada_atual === 1 ? 'Iniciar 2ª Chamada →' :
                                                        currentAssembly?.chamada_atual === 2 ? 'Iniciar 3ª Chamada →' : 'Assembleia em Curso'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: PAUTAS */}
                            {activeTab === 'pautas' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                    <form onSubmit={handleAddAgenda} className="glass-card p-6 bg-white/40 border border-white/40 flex flex-wrap md:flex-nowrap gap-4 items-end">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Título da Pauta</label>
                                            <input
                                                required
                                                className="glass-input w-full !bg-white"
                                                value={newAgenda.nome}
                                                onChange={e => setNewAgenda({ ...newAgenda, nome: e.target.value })}
                                                placeholder="Ex: Aprovação do Balanço 2023"
                                            />
                                        </div>
                                        <div className="w-full md:w-48 space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Modo de Votação</label>
                                            <select
                                                className="glass-input w-full !bg-white"
                                                value={newAgenda.modo}
                                                onChange={e => setNewAgenda({ ...newAgenda, modo: e.target.value })}
                                            >
                                                <option value="proposta">Proposta (Sim/Não)</option>
                                                <option value="eleicao">Eleição (Nomes)</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="glass-button bg-emerald-500 text-white px-6 !py-4 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                        >
                                            <span className="material-symbols-rounded text-sm">{submitting ? 'sync' : 'add'}</span>
                                            <span className="text-[10px] font-black uppercase">ADICIONAR</span>
                                        </button>
                                    </form>

                                    <div className="grid grid-cols-1 gap-4">
                                        {agendas.map((agenda, idx) => (
                                            <div key={agenda.id} className="glass-card p-8 bg-white/60 border border-white/40 animate-in slide-in-from-top-2 group">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-black uppercase tracking-widest">Proposta</span>
                                                                <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                                                                    <span className="text-emerald-600">Sim: {agenda.votos?.filter(v => v.voto_opcao === 'voto_sim').length || 0}</span>
                                                                    <span className="text-red-500">Não: {agenda.votos?.filter(v => v.voto_opcao === 'voto_nao').length || 0}</span>
                                                                    <span className="text-slate-400">Abst.: {agenda.votos?.filter(v => v.voto_opcao === 'abstencao').length || 0}</span>
                                                                </div>
                                                            </div>
                                                            <h4 className="text-lg font-black text-slate-800 mt-1">{agenda.nome}</h4>
                                                            <p className="text-[10px] font-medium text-slate-400 uppercase mt-1">Assunto: {agenda.nome}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => setEditingAgenda(agenda)}
                                                            className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                                                        >
                                                            <span className="material-symbols-rounded">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => generatePautaPDF(agenda)}
                                                            className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"
                                                            title="Gerar PDF da Pauta"
                                                        >
                                                            <span className="material-symbols-rounded">picture_as_pdf</span>
                                                        </button>
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${agenda.finalizada ? 'bg-slate-100 text-slate-500' : agenda.liberada ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-amber-100 text-amber-500'}`}>
                                                            {agenda.finalizada ? '• Finalizada' : agenda.liberada ? '• Em Votação' : '• Aguardando Liberação'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {!agenda.finalizada && (
                                                    <button
                                                        onClick={() => handleUpdatePautaStatus(agenda, agenda.liberada ? 'finalizada' : 'liberada')}
                                                        className={`w-full py-4 border border-dashed rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${agenda.liberada ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-blue-100 text-blue-600 hover:bg-blue-50'}`}
                                                    >
                                                        <span className="material-symbols-rounded text-sm">{agenda.liberada ? 'lock' : 'rocket_launch'}</span>
                                                        {agenda.liberada ? 'Encerrar Votação da Pauta' : 'Liberar Pauta para Votação'}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB: DOCUMENTOS */}
                            {activeTab === 'documentos' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                    <div className="glass-card p-12 bg-white/40 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center gap-6 group hover:border-blue-400 transition-all cursor-pointer">
                                        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-rounded text-4xl">cloud_upload</span>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Fazer upload de documentos</h3>
                                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">PDF, DOCX ou Imagens (Máx 10MB)</p>
                                        </div>
                                        <button className="glass-button bg-blue-600 text-white px-8 !py-3 font-black text-[10px] tracking-widest uppercase shadow-lg shadow-blue-500/20">
                                            ADICIONAR NOVO DOCUMENTO
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center py-20 opacity-20 grayscale">
                                        <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-box-4828135-4017409.png" alt="Não encontrado" className="w-48 mb-6" />
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Não encontramos nenhum documento!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal: Editar Pauta */}
            {editingAgenda && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingAgenda(null)} />
                    <div className="glass-panel w-full max-w-lg relative z-10 shadow-2xl border border-white/40 overflow-hidden animate-in zoom-in-95 duration-300 rounded-[40px] bg-white">
                        <form onSubmit={handleEditPauta} className="p-10 space-y-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-2">Editar Pauta</h3>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Altere os detalhes deste item</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Título da Pauta</label>
                                    <input
                                        required
                                        className="glass-input w-full !bg-slate-50"
                                        value={editingAgenda.nome}
                                        onChange={e => setEditingAgenda({ ...editingAgenda, nome: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Modo de Votação</label>
                                    <select
                                        className="glass-input w-full !bg-slate-50"
                                        value={editingAgenda.modo}
                                        onChange={e => setEditingAgenda({ ...editingAgenda, modo: e.target.value })}
                                    >
                                        <option value="proposta">Proposta (Sim/Não)</option>
                                        <option value="eleicao">Eleição (Nomes)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingAgenda(null)}
                                    className="flex-1 glass-button !rounded-2xl bg-slate-100 !text-slate-500 font-black text-[10px] tracking-widest uppercase"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 glass-button !rounded-2xl bg-blue-600 text-white font-black text-[10px] tracking-widest uppercase shadow-xl shadow-blue-500/20"
                                >
                                    {submitting ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Premium Glass Modal */}
            {modal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setModal({ ...modal, show: false })} />
                    <div className="glass-panel w-full max-w-md relative z-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/40 overflow-hidden animate-in zoom-in-95 duration-300 rounded-[40px]">
                        <div className="p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-16 h-16 shrink-0 rounded-[24px] flex items-center justify-center shadow-2xl ${modal.type === 'alert' ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-blue-600 text-white shadow-blue-500/30'}`}>
                                    <span className="material-symbols-rounded text-3xl">
                                        {modal.type === 'alert' ? 'error_outline' : modal.type === 'confirm' ? 'help_outline' : 'edit_note'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{modal.title}</h3>
                                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Confirme a ação</p>
                                </div>
                            </div>

                            <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                                {modal.message}
                            </p>

                            {modal.type === 'input' && (
                                <div className="mb-8">
                                    <input
                                        autoFocus
                                        className="glass-input w-full !rounded-2xl !bg-white/70 border-slate-200 focus:border-blue-500 transition-all !py-4"
                                        value={modal.inputValue}
                                        onChange={e => setModal({ ...modal, inputValue: e.target.value })}
                                        placeholder="Digite aqui..."
                                        onKeyDown={e => e.key === 'Enter' && modal.onConfirm(modal.inputValue)}
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                {(modal.type === 'confirm' || modal.type === 'input') && (
                                    <button
                                        onClick={() => setModal({ ...modal, show: false })}
                                        className="flex-1 glass-button !rounded-2xl bg-white/50 !text-slate-500 font-black text-[10px] tracking-widest uppercase hover:bg-slate-100 border border-slate-200/50"
                                    >
                                        CANCELAR
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (modal.onConfirm) modal.onConfirm(modal.inputValue)
                                        setModal(prev => ({ ...prev, show: false }))
                                    }}
                                    className={`flex-1 glass-button !rounded-2xl font-black text-[10px] tracking-widest uppercase text-white shadow-xl ${modal.type === 'alert' ? 'bg-red-500 shadow-red-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}
                                >
                                    {modal.confirmLabel || 'OK'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
