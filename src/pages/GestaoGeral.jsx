import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import Sidebar from '../components/Sidebar'

const GestaoGeral = () => {
    const { cooperativa } = useAuth()
    const [activeTab, setActiveTab] = useState('colaboradores')

    const menuItems = [
        { id: 'colaboradores', label: 'Colaboradores', icon: 'badge' },
        { id: 'times', label: 'Gestão de Times', icon: 'groups' },
        { id: 'contratos', label: 'Contratos e Unidades', icon: 'contract' },
    ]

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar
                title="Gestão Geral"
                menuItems={menuItems}
                activeId={activeTab}
                onItemClick={(id) => setActiveTab(id)}
            />

            <div className="flex-1 with-sidebar relative">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-blue-400/10 blur-[100px] rounded-full" />
                </div>

                <header className="sticky top-0 z-40 glass-panel border-b border-white/20 px-8 py-6 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestão Geral</h1>
                            <p className="text-slate-500 font-medium">Administração central da {cooperativa?.nome}</p>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-8 py-10">
                    <div className="space-y-6">
                        {activeTab === 'colaboradores' && <ColaboradoresInternos />}
                        {activeTab === 'times' && <GestaoTimes />}
                        {activeTab === 'contratos' && <GestaoContratos />}
                    </div>
                </main>
            </div>
        </div>
    )
}

// --- PILLAR 1: COLABORADORES INTERNOS ---
const ColaboradoresInternos = () => {
    const { cooperativa } = useAuth()
    const [collaborators, setCollaborators] = useState([])
    const [loading, setLoading] = useState(true)
    const [showSearchModal, setShowSearchModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)

    useEffect(() => { if (cooperativa) fetchCollaborators() }, [cooperativa])

    const fetchCollaborators = async () => {
        setLoading(true)
        const { data } = await supabase.from('cooperados').select('*').eq('cooperativa_id', cooperativa.id).eq('colaborador_interno', true).order('nome', { ascending: true })
        setCollaborators(data || [])
        setLoading(false)
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setSearching(true)
        const { data } = await supabase.from('cooperados').select('*').eq('cooperativa_id', cooperativa.id).or(`nome.ilike.%${searchQuery}%,cpf.eq.${searchQuery.replace(/\D/g, '')}`).limit(5)
        setSearchResults(data || [])
        setSearching(false)
    }

    const toggleInternalStatus = async (member) => {
        await supabase.from('cooperados').update({ colaborador_interno: !member.colaborador_interno }).eq('id', member.id)
        fetchCollaborators()
        if (showSearchModal) handleSearch()
    }

    return (
        <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="material-icons text-blue-500">badge</span> Colaboradores Internos
                        </h2>
                        <p className="text-sm text-slate-500">Gestão de cooperados com acesso administrativo</p>
                    </div>
                    <button onClick={() => setShowSearchModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-200">
                        <span className="material-icons">person_add</span> Designar
                    </button>
                </div>
                {loading ? <div className="p-12 text-center">Carregando...</div> : collaborators.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">Nenhum colaborador designado.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {collaborators.map(p => (
                            <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                    {p.foto_url ? <img src={p.foto_url} className="w-full h-full object-cover rounded-xl" /> : <span className="material-icons">person</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 truncate">{p.nome}</h3>
                                    <p className="text-xs text-slate-500">{p.cpf}</p>
                                </div>
                                <button onClick={() => toggleInternalStatus(p)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><span className="material-icons">person_remove</span></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {showSearchModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowSearchModal(false)} />
                    <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800">Designar Novo Colaborador</h3>
                            <button onClick={() => setShowSearchModal(false)}><span className="material-icons">close</span></button>
                        </div>
                        <div className="p-6">
                            <div className="relative mb-6">
                                <input type="text" placeholder="Nome ou CPF..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-slate-400">search</span>
                                <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200"><span className="material-icons">arrow_forward</span></button>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {searchResults.map(match => (
                                    <div key={match.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-lg flex justify-center items-center text-slate-300"><span className="material-icons">person</span></div>
                                            <div><p className="font-bold text-slate-800">{match.nome}</p><p className="text-xs text-slate-500">{match.cpf}</p></div>
                                        </div>
                                        <button onClick={() => toggleInternalStatus(match)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${match.colaborador_interno ? 'bg-red-50 text-red-500' : 'bg-white text-blue-600 shadow-sm'}`}>
                                            {match.colaborador_interno ? 'Remover' : 'Designar'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// --- PILLAR 2: GESTÃO DE TIMES ---
const GestaoTimes = () => {
    const { cooperativa } = useAuth()
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingTeam, setEditingTeam] = useState(null)
    const [internalCollaborators, setInternalCollaborators] = useState([])
    const [formData, setFormData] = useState({ nome: '', descricao: '', permissoes: [], membros: [] })

    const availablePermissions = [
        { id: 'dashboard', label: 'Dashboard' }, { id: 'gestao_geral', label: 'Gestão Geral' },
        { id: 'gestao_de_rh', label: 'Gestão de RH' }, { id: 'gestao_de_escalas', label: 'Escalas' },
        { id: 'financeiro', label: 'Financeiro' }, { id: 'assembleias', label: 'Assembleias' },
        { id: 'orcamentos', label: 'Orçamentos' }, { id: 'educacao_continuada', label: 'Educação' }
    ]

    useEffect(() => { if (cooperativa) { fetchTeams(); fetchInternalCollaborators(); } }, [cooperativa])

    const fetchTeams = async () => {
        setLoading(true)
        const { data } = await supabase.from('times_internos').select('*, membros:times_internos_cooperados(cooperado_id)').eq('cooperativa_id', cooperativa.id).order('nome', { ascending: true })
        setTeams(data || [])
        setLoading(false)
    }

    const fetchInternalCollaborators = async () => {
        const { data } = await supabase.from('cooperados').select('id, nome').eq('cooperativa_id', cooperativa.id).eq('colaborador_interno', true)
        setInternalCollaborators(data || [])
    }

    const handleOpenModal = (team = null) => {
        if (team) {
            setEditingTeam(team)
            setFormData({ nome: team.nome, descricao: team.descricao || '', permissoes: team.permissoes || [], membros: team.membros?.map(m => m.cooperado_id) || [] })
        } else {
            setEditingTeam(null)
            setFormData({ nome: '', descricao: '', permissoes: [], membros: [] })
        }
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        let teamId = editingTeam?.id
        if (editingTeam) {
            await supabase.from('times_internos').update({ nome: formData.nome, descricao: formData.descricao, permissoes: formData.permissoes }).eq('id', teamId)
        } else {
            const { data } = await supabase.from('times_internos').insert([{ nome: formData.nome, descricao: formData.descricao, permissoes: formData.permissoes, cooperativa_id: cooperativa.id }]).select()
            teamId = data[0].id
        }
        await supabase.from('times_internos_cooperados').delete().eq('time_id', teamId)
        if (formData.membros.length > 0) {
            await supabase.from('times_internos_cooperados').insert(formData.membros.map(cooperado_id => ({ time_id: teamId, cooperado_id })))
        }
        setShowModal(false); fetchTeams();
    }

    const handleDelete = async (id) => { if (confirm('Excluir time?')) { await supabase.from('times_internos').delete().eq('id', id); fetchTeams(); } }

    const togglePermission = (perm) => setFormData(prev => ({ ...prev, permissoes: prev.permissoes.includes(perm) ? prev.permissoes.filter(p => p !== perm) : [...prev.permissoes, perm] }))
    const toggleMember = (memberId) => setFormData(prev => ({ ...prev, membros: prev.membros.includes(memberId) ? prev.membros.filter(id => id !== memberId) : [...prev.membros, memberId] }))

    return (
        <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-8">
                    <div><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><span className="material-icons text-blue-500">groups</span> Gestão de Times</h2></div>
                    <button onClick={() => handleOpenModal()} className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200">Novo Time</button>
                </div>
                {loading ? <div>Carregando...</div> : (
                    <div className="space-y-4">
                        {teams.map(team => (
                            <div key={team.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center justify-between hover:shadow-lg transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><span className="material-icons text-3xl">groups</span></div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 leading-tight">{team.nome}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {team.permissoes?.map(p => <span key={p} className="px-2 py-1 bg-slate-100 text-[10px] font-black text-slate-500 rounded-lg uppercase tracking-wider">{availablePermissions.find(ap => ap.id === p)?.label || p}</span>)}
                                            <span className="px-2 py-1 bg-blue-50 text-[10px] font-black text-blue-600 rounded-lg uppercase tracking-wider">{team.membros?.length || 0} Membros</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(team)} className="p-2 text-slate-400 hover:text-blue-500"><span className="material-icons">edit</span></button>
                                    <button onClick={() => handleDelete(team.id)} className="p-2 text-slate-400 hover:text-red-500"><span className="material-icons">delete</span></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-xl font-black text-slate-800">{editingTeam ? 'Editar Time' : 'Novo Time'}</h3>
                            <input type="text" placeholder="Nome do Time" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold" required />
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Permissões</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {availablePermissions.map(p => (
                                        <button key={p.id} type="button" onClick={() => togglePermission(p.id)} className={`p-4 rounded-xl border-2 transition-all font-bold ${formData.permissoes.includes(p.id) ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-100 text-slate-500'}`}>{p.label}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Membros</h4>
                                <div className="space-y-2">
                                    {internalCollaborators.map(c => (
                                        <button key={c.id} type="button" onClick={() => toggleMember(c.id)} className={`w-full p-4 rounded-xl flex items-center justify-between border-2 transition-all font-bold ${formData.membros.includes(c.id) ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-100 text-slate-500'}`}>
                                            {c.nome} {formData.membros.includes(c.id) && <span className="material-icons">check</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border-2 border-slate-100 text-slate-400 font-black rounded-2xl">CANCELAR</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200">SALVAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

// --- PILLAR 3: GESTÃO DE CONTRATOS ---
const GestaoContratos = () => {
    const { cooperativa } = useAuth()
    const [path, setPath] = useState([{ type: 'list', id: null, name: 'Todos os Contratos' }])
    const current = path[path.length - 1]
    const navigateTo = (type, id, name) => setPath([...path, { type, id, name }])
    const goBack = () => { if (path.length > 1) setPath(path.slice(0, -1)) }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold">
                {path.map((p, i) => (
                    <React.Fragment key={i}>
                        <button onClick={() => setPath(path.slice(0, i + 1))} className={`hover:text-blue-600 transition-colors ${i === path.length - 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                            {p.name}
                        </button>
                        {i < path.length - 1 && <span className="material-icons text-slate-300 text-sm">chevron_right</span>}
                    </React.Fragment>
                ))}
            </div>
            {current.type === 'list' && <ContractList onSelect={(c) => navigateTo('contract', c.id, c.nome)} />}
            {current.type === 'contract' && <ContractDetail contractId={current.id} onSelectLocal={(l) => navigateTo('local', l.id, l.nome)} />}
            {current.type === 'local' && <LocalDetail localId={current.id} onSelectSector={(s) => navigateTo('sector', s.id, s.nome)} />}
            {current.type === 'sector' && <SectorDetail sector={current} onBack={goBack} />}
        </div>
    )
}

const ContractList = ({ onSelect }) => {
    const { cooperativa } = useAuth()
    const [contracts, setContracts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingContract, setEditingContract] = useState(null)
    const [newContract, setNewContract] = useState({ nome: '', cnpj_cliente: '' })
    const [openMenuId, setOpenMenuId] = useState(null)

    useEffect(() => { if (cooperativa) fetchContracts() }, [cooperativa])

    const fetchContracts = async () => {
        setLoading(true)
        const { data } = await supabase.from('contratos').select('*').eq('cooperativa_id', cooperativa.id)
        setContracts(data || [])
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (editingContract) {
            await supabase.from('contratos').update(newContract).eq('id', editingContract.id)
        } else {
            await supabase.from('contratos').insert([{ ...newContract, cooperativa_id: cooperativa.id }])
        }
        setShowModal(false); fetchContracts()
    }

    const handleDelete = async (e, id) => { e.stopPropagation(); if (confirm('Excluir contrato e todos os dados relacionados?')) { await supabase.from('contratos').delete().eq('id', id); fetchContracts(); } }

    return (
        <div className="glass-panel p-6 rounded-3xl shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8">
                <div><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><span className="material-icons text-blue-500">description</span> Contratos Ativos</h2></div>
                <button onClick={() => { setEditingContract(null); setNewContract({ nome: '', cnpj_cliente: '' }); setShowModal(true); }} className="glass-button bg-blue-600 px-6 py-2.5 flex items-center gap-2 font-bold text-white rounded-2xl">
                    <span className="material-icons">add</span> NOVO CONTRATO
                </button>
            </div>
            {loading ? <div className="p-12 text-center">Carregando...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contracts.map(c => (
                        <div key={c.id} onClick={() => onSelect(c)} className="glass-card p-6 cursor-pointer hover:scale-[1.02] transition-all relative group shadow-sm hover:shadow-xl hover:shadow-blue-100 border border-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><span className="material-icons text-2xl">business</span></div>
                                <div className="relative">
                                    <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : c.id); }} className="p-2 text-slate-400"><span className="material-icons">more_vert</span></button>
                                    {openMenuId === c.id && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingContract(c); setNewContract({ nome: c.nome, cnpj_cliente: c.cnpj_cliente || '' }); setShowModal(true); setOpenMenuId(null); }} className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-blue-50 text-slate-600 font-bold"><span className="material-icons text-blue-500">edit</span> Editar</button>
                                            <button onClick={(e) => { handleDelete(e, c.id); setOpenMenuId(null); }} className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-red-50 text-red-500 font-bold"><span className="material-icons">delete</span> Excluir</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-slate-800">{c.nome}</h3>
                            <p className="text-slate-500 text-sm font-medium">{c.cnpj_cliente || 'CNPJ não informado'}</p>
                            <div className="mt-4 flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">GERENCIAR UNIDADES <span className="material-icons text-sm">arrow_forward</span></div>
                        </div>
                    ))}
                </div>
            )}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 border border-white">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-2xl font-black text-slate-800 text-center">{editingContract ? 'Editar Contrato' : 'Novo Contrato'}</h3>
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Nome/Empresa</label>
                                <input type="text" required value={newContract.nome} onChange={e => setNewContract({ ...newContract, nome: e.target.value })} className="glass-input w-full px-6 py-4 outline-none" placeholder="Ex: Condomínio Solar" />
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">CNPJ (Opcional)</label>
                                <input type="text" value={newContract.cnpj_cliente} onChange={e => setNewContract({ ...newContract, cnpj_cliente: e.target.value })} className="glass-input w-full px-6 py-4 outline-none" placeholder="00.000.000/0000-00" />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-bold text-slate-400 border border-slate-100 rounded-2xl">CANCELAR</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200">SALVAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

const ContractDetail = ({ contractId, onSelectLocal }) => {
    const [locals, setLocals] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [newName, setNewName] = useState('')

    useEffect(() => { fetchLocals() }, [contractId])
    const fetchLocals = async () => {
        setLoading(true)
        const { data } = await supabase.from('contratos_locais').select('*').eq('contrato_id', contractId)
        setLocals(data || [])
        setLoading(false)
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        await supabase.from('contratos_locais').insert([{ contrato_id: contractId, nome: newName }])
        setShowModal(false); setNewName(''); fetchLocals()
    }

    const handleDelete = async (id) => { if (confirm('Excluir esta unidade?')) { await supabase.from('contratos_locais').delete().eq('id', id); fetchLocals(); } }

    return (
        <div className="glass-panel p-6 rounded-3xl shadow-xl border border-white">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><span className="material-icons text-blue-500">location_on</span> Unidades / Locais</h2>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2"><span className="material-icons">add</span> NOVA UNIDADE</button>
            </div>
            {loading ? <div className="p-12 text-center">Carregando...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locals.map(l => (
                        <div key={l.id} onClick={() => onSelectLocal(l)} className="glass-card p-6 cursor-pointer hover:shadow-lg transition-all relative group border border-slate-100/50">
                            <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-2xl w-fit mb-4 transition-colors"><span className="material-icons">home_work</span></div>
                            <h4 className="font-black text-slate-800 tracking-tight">{l.nome}</h4>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sectores</span>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(l.id); }} className="text-slate-300 hover:text-red-500 transition-colors"><span className="material-icons text-sm">delete</span></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-white">
                        <form onSubmit={handleAdd} className="space-y-6">
                            <h3 className="text-xl font-black text-slate-800 text-center">Nova Unidade</h3>
                            <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="glass-input w-full px-5 py-3 outline-none" placeholder="Ex: Sede Administrativa" />
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-slate-400 border border-slate-100 rounded-xl">CANCELAR</button>
                                <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200">ADICIONAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

const LocalDetail = ({ localId, onSelectSector }) => {
    const [sectors, setSectors] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [newName, setNewName] = useState('')

    useEffect(() => { fetchSectors() }, [localId])
    const fetchSectors = async () => {
        setLoading(true)
        const { data } = await supabase.from('contratos_setores').select('*').eq('local_id', localId)
        setSectors(data || [])
        setLoading(false)
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        await supabase.from('contratos_setores').insert([{ local_id: localId, nome: newName }])
        setShowModal(false); setNewName(''); fetchSectors()
    }

    const handleDelete = async (id) => { if (confirm('Excluir setor?')) { await supabase.from('contratos_setores').delete().eq('id', id); fetchSectors(); } }

    return (
        <div className="glass-panel p-6 rounded-3xl shadow-xl border border-white">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><span className="material-icons text-blue-500">grid_view</span> Setores da Unidade</h2>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2"><span className="material-icons">add</span> NOVO SETOR</button>
            </div>
            {loading ? <div className="p-12 text-center">Carregando...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sectors.map(s => (
                        <div key={s.id} onClick={() => onSelectSector(s)} className="glass-card p-6 cursor-pointer hover:shadow-lg transition-all border border-slate-100/50 group">
                            <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-2xl w-fit mb-4 transition-colors"><span className="material-icons">layers</span></div>
                            <h4 className="font-black text-slate-800 tracking-tight">{s.nome}</h4>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preços e Serviços</span>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-slate-300 hover:text-red-500 transition-colors"><span className="material-icons text-sm">delete</span></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-white">
                        <form onSubmit={handleAdd} className="space-y-6">
                            <h3 className="text-xl font-black text-slate-800 text-center">Novo Setor</h3>
                            <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="glass-input w-full px-5 py-3 outline-none" placeholder="Ex: Limpeza, Recepção" />
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-slate-400 border border-slate-100 rounded-xl">CANCELAR</button>
                                <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200">ADICIONAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

const SectorDetail = ({ sector, onBack }) => {
    const [prices, setPrices] = useState([])
    const [loading, setLoading] = useState(true)
    const [showPriceModal, setShowPriceModal] = useState(false)
    const [newPrice, setNewPrice] = useState({ descricao: '', valor: '', tipo: 'fixo' })

    useEffect(() => { fetchPrices() }, [sector.id])
    const fetchPrices = async () => {
        setLoading(true)
        const { data } = await supabase.from('contratos_precos').select('*').eq('setor_id', sector.id)
        setPrices(data || [])
        setLoading(false)
    }

    const handleAddPrice = async (e) => {
        e.preventDefault()
        await supabase.from('contratos_precos').insert([{ sector_id: sector.id, ...newPrice }])
        setShowPriceModal(false); setNewPrice({ descricao: '', valor: '', tipo: 'fixo' }); fetchPrices()
    }

    return (
        <div className="glass-panel p-8 rounded-3xl shadow-xl border border-white">
            <div className="flex justify-between items-center mb-8">
                <div><h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Tabela de Preços: {sector.nome}</h2><p className="text-sm text-slate-500 font-medium">Defina os valores cobrados por serviço neste setor</p></div>
                <button onClick={() => setShowPriceModal(true)} className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 flex items-center gap-2"><span className="material-icons">payments</span> NOVO ITEM DE PREÇO</button>
            </div>
            {loading ? <div className="p-12 text-center">Carregando preços...</div> : (
                <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Serviço/Descrição</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Valor Bruto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {prices.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">{p.descricao}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-[10px] font-black text-slate-500 rounded-lg uppercase tracking-wider">{p.tipo}</span></td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900 font-mono">R$ {parseFloat(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showPriceModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPriceModal(false)} />
                    <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 border border-white">
                        <form onSubmit={handleAddPrice} className="space-y-6">
                            <h3 className="text-2xl font-black text-slate-800 text-center">Configurar Preço</h3>
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Descrição do Serviço</label>
                                <input type="text" required value={newPrice.descricao} onChange={e => setNewPrice({ ...newPrice, descricao: e.target.value })} className="glass-input w-full px-6 py-4 outline-none" placeholder="Ex: Plantão de Limpeza 8h" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Valor</label>
                                        <input type="number" step="0.01" required value={newPrice.valor} onChange={e => setNewPrice({ ...newPrice, valor: e.target.value })} className="glass-input w-full px-6 py-4 outline-none" placeholder="0,00" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Tipo de Cobrança</label>
                                        <select value={newPrice.tipo} onChange={e => setNewPrice({ ...newPrice, tipo: e.target.value })} className="glass-input w-full px-6 py-4 outline-none appearance-none font-bold">
                                            <option value="fixo">Fixo Mensal</option>
                                            <option value="unitario">Por Unidade/Hora</option>
                                            <option value="variavel">Variável</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowPriceModal(false)} className="flex-1 py-4 font-bold text-slate-400 border border-slate-100 rounded-2xl">CANCELAR</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200">ADICIONAR PREÇO</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GestaoGeral
