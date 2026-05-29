import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import Sidebar from '../components/Sidebar'

export default function GestaoRH() {
    const { cooperativa } = useAuth()
    const [view, setView] = useState('list') // 'list' or 'registration'
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [newMember, setNewMember] = useState({
        nome: '',
        data_nascimento: '',
        email: '',
        password: '',
        grau_escolaridade: '',
        nome_pai: '',
        sexo: '',
        telefone_principal: '',
        estado_civil: '',
        nome_mae: '',
        etnia: '',
        telefone_secundario: '',
        data_entrada_cooperativa: '',
        rg: '',
        rg_data_expedicao: '',
        cpf: '',
        rg_orgao_emissor: '',
        rg_uf: '',
        numero_pis: '',
        endereco: '',
        quantidade_dependentes: 0,
        profissao: 'medico',
        conselho_profissional: '',
        numero_conselho: '',
        conselho_data_emissao: '',
        banco_nome: '',
        banco_agencia: '',
        banco_conta: '',
        banco_tipo_conta: ''
    })
    const [foto, setFoto] = useState(null)
    const [fotoPreview, setFotoPreview] = useState(null)
    const [documentos, setDocumentos] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    // Multi-record lists
    const [profissoesList, setProfissoesList] = useState([])
    const [contasBancariasList, setContasBancariasList] = useState([])

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('todos')
    const [filterProfissao, setFilterProfissao] = useState('todas')
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

    // Edit State
    const [editingMemberId, setEditingMemberId] = useState(null)
    const [openMenuId, setOpenMenuId] = useState(null)

    const menuItems = [
        { id: 'quadro', label: 'Quadro de Sócios', icon: 'people' },
    ]

    const formatCPF = (value) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1-$2')
            .substring(0, 14)
    }

    const formatPhone = (value) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .substring(0, 15)
    }

    useEffect(() => {
        if (cooperativa) {
            fetchMembers()
        }
    }, [cooperativa])

    const fetchMembers = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('cooperados')
                .select('*')
                .eq('cooperativa_id', cooperativa.id)
                .order('nome', { ascending: true })

            if (error) throw error
            setMembers(data)
        } catch (err) {
            console.error('Error fetching members:', err)
        } finally {
            setLoading(false)
        }
    }

    const addProfession = () => {
        if (!newMember.profissao) return;
        setProfissoesList([...profissoesList, {
            profissao: newMember.profissao,
            conselho_profissional: newMember.conselho_profissional,
            numero_conselho: newMember.numero_conselho,
            conselho_data_emissao: newMember.conselho_data_emissao
        }]);
        // Clear professional fields
        setNewMember({
            ...newMember,
            profissao: 'medico',
            conselho_profissional: '',
            numero_conselho: '',
            conselho_data_emissao: ''
        });
    }

    const removeProfession = (index) => {
        setProfissoesList(profissoesList.filter((_, i) => i !== index));
    }

    const addBank = () => {
        if (!newMember.banco_nome) return;
        setContasBancariasList([...contasBancariasList, {
            banco_nome: newMember.banco_nome,
            banco_agencia: newMember.banco_agencia,
            banco_conta: newMember.banco_conta,
            banco_tipo_conta: newMember.banco_tipo_conta
        }]);
        // Clear bank fields
        setNewMember({
            ...newMember,
            banco_nome: '',
            banco_agencia: '',
            banco_conta: '',
            banco_tipo_conta: ''
        });
    }

    const removeBank = (index) => {
        setContasBancariasList(contasBancariasList.filter((_, i) => i !== index));
    }

    const resetForm = () => {
        setNewMember({
            nome: '',
            data_nascimento: '',
            email: '',
            password: '',
            grau_escolaridade: '',
            nome_pai: '',
            sexo: '',
            telefone_principal: '',
            estado_civil: '',
            nome_mae: '',
            etnia: '',
            telefone_secundario: '',
            data_entrada_cooperativa: '',
            rg: '',
            rg_data_expedicao: '',
            cpf: '',
            rg_orgao_emissor: '',
            rg_uf: '',
            numero_pis: '',
            endereco: '',
            quantidade_dependentes: 0,
            profissao: 'medico',
            conselho_profissional: '',
            numero_conselho: '',
            conselho_data_emissao: '',
            banco_nome: '',
            banco_agencia: '',
            banco_conta: '',
            banco_tipo_conta: ''
        })
        setProfissoesList([])
        setContasBancariasList([])
        setFoto(null)
        setFotoPreview(null)
        setDocumentos(null)
        setEditingMemberId(null)
    }

    const handleEdit = (member) => {
        setEditingMemberId(member.id)
        setNewMember({
            nome: member.nome || '',
            email: member.email || '',
            data_nascimento: member.data_nascimento || '',
            grau_escolaridade: member.grau_escolaridade || '',
            nome_pai: member.nome_pai || '',
            sexo: member.sexo || '',
            telefone_principal: member.telefone_principal || '',
            estado_civil: member.estado_civil || '',
            nome_mae: member.nome_mae || '',
            etnia: member.etnia || '',
            telefone_secundario: member.telefone_secundario || '',
            data_entrada_cooperativa: member.data_entrada_cooperativa || '',
            rg: member.rg || '',
            rg_data_expedicao: member.rg_data_expedicao || '',
            cpf: member.cpf || '',
            rg_orgao_emissor: member.rg_orgao_emissor || '',
            rg_uf: member.rg_uf || '',
            numero_pis: member.numero_pis || '',
            endereco: member.endereco || '',
            quantidade_dependentes: member.quantidade_dependentes || 0,
            profissao: member.profissao || 'medico',
            conselho_profissional: member.conselho_profissional || '',
            numero_conselho: member.numero_conselho || '',
            conselho_data_emissao: member.conselho_data_emissao || '',
            banco_nome: member.banco_nome || '',
            banco_agencia: member.banco_agencia || '',
            banco_conta: member.banco_conta || '',
            banco_tipo_conta: member.banco_tipo_conta || ''
        })
        setProfissoesList(member.profissoes_adicionais || [])
        setContasBancariasList(member.contas_bancarias_adicionais || [])
        setFotoPreview(member.foto_url)
        setView('registration')
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este cooperado?')) return
        try {
            const { error } = await supabase
                .from('cooperados')
                .delete()
                .eq('id', id)
            if (error) throw error
            fetchMembers()
        } catch (err) {
            console.error('Error deleting member:', err)
            alert('Erro ao excluir membro')
        }
    }

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.cpf?.includes(searchTerm) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = filterStatus === 'todos' || member.status === filterStatus
        const matchesProfissao = filterProfissao === 'todas' || member.profissao === filterProfissao

        return matchesSearch && matchesStatus && matchesProfissao
    })

    const handleFotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFoto(file)
            setFotoPreview(URL.createObjectURL(file))
        }
    }

    const handleAddMember = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            let foto_url = ''
            let documentos_url = ''

            // 1. Upload Foto if exists
            if (foto) {
                const fileExt = foto.name.split('.').pop()
                const fileName = `member-${Math.random().toString(36).substring(2)}.${fileExt}`
                const filePath = `members/photos/${fileName}`
                const { error: uploadError } = await supabase.storage.from('public').upload(filePath, foto)
                if (uploadError) throw uploadError
                const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath)
                foto_url = publicUrl
            }

            // 2. Upload Documentos if exists
            if (documentos) {
                const fileExt = documentos.name.split('.').pop()
                const fileName = `docs-${Math.random().toString(36).substring(2)}.${fileExt}`
                const filePath = `members/documents/${fileName}`
                const { error: uploadError } = await supabase.storage.from('public').upload(filePath, documentos)
                if (uploadError) throw uploadError
                const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath)
                documentos_url = publicUrl
            }

            // 3. Update or Sign up user
            let userId = null
            if (editingMemberId) {
                const { data: memberData } = await supabase.from('cooperados').select('user_id').eq('id', editingMemberId).single()
                userId = memberData.user_id
            } else {
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: newMember.email,
                    password: newMember.password || 'Mudar123!',
                    options: {
                        data: {
                            full_name: newMember.nome
                        }
                    }
                })
                if (authError) throw authError
                userId = authData.user.id
            }

            const memberData = {
                user_id: userId,
                cooperativa_id: cooperativa.id,
                nome: newMember.nome,
                email: newMember.email,
                data_nascimento: newMember.data_nascimento || null,
                grau_escolaridade: newMember.grau_escolaridade,
                nome_pai: newMember.nome_pai,
                sexo: newMember.sexo,
                telefone_principal: newMember.telefone_principal,
                estado_civil: newMember.estado_civil,
                nome_mae: newMember.nome_mae,
                etnia: newMember.etnia,
                telefone_secundario: newMember.telefone_secundario,
                data_entrada_cooperativa: newMember.data_entrada_cooperativa || null,
                rg: newMember.rg,
                rg_data_expedicao: newMember.rg_data_expedicao || null,
                cpf: newMember.cpf,
                rg_orgao_emissor: newMember.rg_orgao_emissor,
                rg_uf: newMember.rg_uf,
                numero_pis: newMember.numero_pis,
                endereco: newMember.endereco,
                quantidade_dependentes: parseInt(newMember.quantidade_dependentes) || 0,
                profissao: newMember.profissao,
                conselho_profissional: newMember.conselho_profissional,
                numero_conselho: newMember.numero_conselho,
                conselho_data_emissao: newMember.conselho_data_emissao || null,
                banco_nome: newMember.banco_nome,
                banco_agencia: newMember.banco_agencia,
                banco_conta: newMember.banco_conta,
                banco_tipo_conta: newMember.banco_tipo_conta,
                profissoes_adicionais: profissoesList,
                contas_bancarias_adicionais: contasBancariasList,
                foto_url: foto_url || newMember.foto_url,
                documentos_url: documentos_url || newMember.documentos_url,
                status: 'ativo'
            }

            // 4. Insert or Update member record
            const { error: dbError } = editingMemberId
                ? await supabase.from('cooperados').update(memberData).eq('id', editingMemberId)
                : await supabase.from('cooperados').insert([memberData])

            if (dbError) throw dbError

            // 5. Success
            setView('list')
            resetForm()
            fetchMembers()
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex">
            <Sidebar
                title="Gestão de RH"
                menuItems={menuItems}
                activeId="quadro"
                onItemClick={(id) => {
                    if (id === 'quadro') setView('list')
                    if (id === 'assembleias') window.location.href = '/assembleias'
                }}
            />

            <div className="flex-1 with-sidebar relative">
                {/* Background Decor */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-blue-400/10 blur-[100px] rounded-full" />
                </div>

                <header className="sticky top-0 z-40 glass-panel border-b border-white/20 px-8 py-6 backdrop-blur-md">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                {view === 'list' ? 'Quadro de Sócios' : 'Cadastrar Cooperado'}
                            </h1>
                            <p className="text-slate-500 font-medium">
                                {view === 'list'
                                    ? `Gerenciamento de profissionais da ${cooperativa?.nome}`
                                    : 'Preencha os dados abaixo para registrar um novo membro'}
                            </p>
                        </div>
                        {view === 'list' ? (
                            <button
                                onClick={() => setView('registration')}
                                className="glass-button bg-blue-600 px-6 !py-3 flex items-center gap-2 group"
                            >
                                <span className="material-icons text-xl transition-transform group-hover:rotate-90">add</span>
                                NOVO COOPERADO
                            </button>
                        ) : (
                            <button
                                onClick={() => { setView('list'); resetForm(); }}
                                className="glass-button bg-slate-100 !text-slate-600 px-6 !py-3 flex items-center gap-2 group"
                            >
                                <span className="material-icons text-xl">arrow_back</span>
                                VOLTAR AO QUADRO
                            </button>
                        )}
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-8 py-10">
                    {view === 'list' ? (
                        <>
                            {/* Search and Filters Bar */}
                            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
                                <div className="relative flex-1 group">
                                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">search</span>
                                    <input
                                        type="text"
                                        placeholder="Pesquisar por nome, CPF ou email..."
                                        className="glass-input w-full pl-12 pr-4 !py-4"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                        className={`glass-button !py-4 px-6 flex items-center gap-2 ${showAdvancedFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-600'}`}
                                    >
                                        <span className="material-icons">filter_list</span>
                                        Filtros
                                    </button>
                                </div>
                            </div>

                            {/* Advanced Filters Panel */}
                            {showAdvancedFilters && (
                                <div className="mb-8 p-6 glass-card border border-white/40 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                        <select
                                            className="glass-input w-full !py-3"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="todos">Todos os Status</option>
                                            <option value="ativo">Ativo</option>
                                            <option value="inativo">Inativo</option>
                                            <option value="pendente">Pendente</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissão</label>
                                        <select
                                            className="glass-input w-full !py-3"
                                            value={filterProfissao}
                                            onChange={(e) => setFilterProfissao(e.target.value)}
                                        >
                                            <option value="todas">Todas as Profissões</option>
                                            <option value="medico">Médico</option>
                                            <option value="enfermeiro">Enfermeiro</option>
                                            <option value="fisioterapeuta">Fisioterapeuta</option>
                                            <option value="biomedico">Biomédico</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setFilterStatus('todos');
                                                setFilterProfissao('todas');
                                            }}
                                            className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline ml-auto"
                                        >
                                            Limpar Filtros
                                        </button>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <span className="material-icons animate-spin text-4xl text-blue-500">sync</span>
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="glass-card p-20 text-center flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <span className="material-icons text-4xl">person_off</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">Nenhum cooperado encontrado</h3>
                                        <p className="text-slate-500 text-sm">Tente ajustar seus filtros ou cadastre um novo sócio.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredMembers.map(member => (
                                        <div key={member.id} className="glass-card group p-6 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 relative border border-white/40 overflow-hidden min-h-[220px]">
                                            {/* Three-dot menu icon */}
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                                                className="absolute top-4 right-4 z-[20] w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                <span className="material-icons">{openMenuId === member.id ? 'close' : 'more_vert'}</span>
                                            </button>

                                            {/* Legacy-style Menu Overlay */}
                                            {openMenuId === member.id && (
                                                <div className="absolute inset-0 z-[30] bg-white animate-in slide-in-from-left duration-300 p-6 flex flex-col gap-4 shadow-inner">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Opções do Sócio</span>
                                                        <button
                                                            onClick={() => setOpenMenuId(null)}
                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <span className="material-icons text-sm">close</span>
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => { setOpenMenuId(null); handleEdit(member); }}
                                                        className="flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-colors py-2 border-b border-slate-50"
                                                    >
                                                        <span className="material-icons text-lg">edit</span>
                                                        <span className="text-xs font-bold uppercase tracking-wide">Editar Sócio-cooperado</span>
                                                    </button>

                                                    <button
                                                        className="flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-colors py-2 border-b border-slate-50"
                                                        onClick={() => {
                                                            if (member.documentos_url) window.open(member.documentos_url, '_blank')
                                                            else alert('Nenhuma pasta disponível para este cooperado.')
                                                        }}
                                                    >
                                                        <span className="material-icons text-lg">folder_open</span>
                                                        <span className="text-xs font-bold uppercase tracking-wide">Baixar pasta</span>
                                                    </button>

                                                    <button className="flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-colors py-2 border-b border-slate-50 opacity-50 cursor-not-allowed">
                                                        <span className="material-icons text-lg">print</span>
                                                        <span className="text-xs font-bold uppercase tracking-wide">Imprimir Ficha</span>
                                                    </button>

                                                    <button className="flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-colors py-2 opacity-50 cursor-not-allowed">
                                                        <span className="material-icons text-lg">attach_money</span>
                                                        <span className="text-xs font-bold uppercase tracking-wide">Integralização</span>
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-4">
                                                {member.foto_url ? (
                                                    <img src={member.foto_url} alt={member.nome} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-black text-2xl shadow-inner">
                                                        {member.nome[0]}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-black text-slate-800 truncate leading-tight transition-colors">
                                                        {member.nome}
                                                    </h3>
                                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">
                                                        {member.profissao || 'Não definida'}
                                                    </p>
                                                    <div className="mt-3 space-y-1">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <span className="material-icons text-[14px]">alternate_email</span>
                                                            <span className="text-xs font-semibold truncate text-slate-600">{member.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <span className="material-icons text-[14px]">smartphone</span>
                                                            <span className="text-xs font-semibold text-slate-600">{member.telefone_principal || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-slate-100/50 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entrada</span>
                                                    <span className="text-[10px] font-bold text-slate-500">
                                                        {member.data_entrada_cooperativa ? new Date(member.data_entrada_cooperativa).toLocaleDateString('pt-BR') : '-'}
                                                    </span>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full ${member.status === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'} border border-current/20`}>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{member.status || 'Ativo'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="glass-panel p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {error && (
                                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
                                    <span className="material-icons">error_outline</span>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleAddMember} className="space-y-12">
                                {/* SECTION 1: Personal Info */}
                                <div className="space-y-8">
                                    <div className="flex flex-col items-center mb-10">
                                        <label className="relative group cursor-pointer">
                                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center transition-all group-hover:scale-105">
                                                {fotoPreview ? (
                                                    <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center text-slate-300">
                                                        <span className="material-icons text-4xl">add_a_photo</span>
                                                        <span className="text-[10px] font-black uppercase mt-1">Adicionar Foto</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFotoChange} />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-1 space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Nome completo do cooperado</label>
                                            <input required className="glass-input w-full" value={newMember.nome} onChange={e => setNewMember({ ...newMember, nome: e.target.value })} placeholder="Nome Completo" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Data de nascimento</label>
                                            <input type="date" className="glass-input w-full" value={newMember.data_nascimento} onChange={e => setNewMember({ ...newMember, data_nascimento: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Email</label>
                                            <input required type="email" className="glass-input w-full" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} placeholder="Email" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Grau de escolaridade</label>
                                            <select className="glass-input w-full" value={newMember.grau_escolaridade} onChange={e => setNewMember({ ...newMember, grau_escolaridade: e.target.value })}>
                                                <option value="">Selecione</option>
                                                <option value="fundamental">Fundamental</option>
                                                <option value="medio">Médio</option>
                                                <option value="superior">Superior</option>
                                                <option value="pos">Pós-graduação</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Nome do pai</label>
                                            <input className="glass-input w-full" value={newMember.nome_pai} onChange={e => setNewMember({ ...newMember, nome_pai: e.target.value })} placeholder="Nome do pai" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Sexo</label>
                                            <select className="glass-input w-full" value={newMember.sexo} onChange={e => setNewMember({ ...newMember, sexo: e.target.value })}>
                                                <option value="">Selecione</option>
                                                <option value="masculino">Masculino</option>
                                                <option value="feminino">Feminino</option>
                                                <option value="outros">Outros</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Contato / Telefone Principal</label>
                                            <input className="glass-input w-full" value={newMember.telefone_principal} onChange={e => setNewMember({ ...newMember, telefone_principal: formatPhone(e.target.value) })} placeholder="Contato" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Estado Civil</label>
                                            <select className="glass-input w-full" value={newMember.estado_civil} onChange={e => setNewMember({ ...newMember, estado_civil: e.target.value })}>
                                                <option value="">Selecione</option>
                                                <option value="solteiro">Solteiro</option>
                                                <option value="casado">Casado</option>
                                                <option value="divorciado">Divorciado</option>
                                                <option value="viuvo">Viúvo</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Nome da mãe</label>
                                            <input className="glass-input w-full" value={newMember.nome_mae} onChange={e => setNewMember({ ...newMember, nome_mae: e.target.value })} placeholder="Nome da mãe" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Etnia</label>
                                            <select className="glass-input w-full" value={newMember.etnia} onChange={e => setNewMember({ ...newMember, etnia: e.target.value })}>
                                                <option value="">Selecione</option>
                                                <option value="branca">Branca</option>
                                                <option value="parda">Parda</option>
                                                <option value="preta">Preta</option>
                                                <option value="amarela">Amarela</option>
                                                <option value="indigena">Indígena</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Contato / Telefone Reserva</label>
                                            <input className="glass-input w-full" value={newMember.telefone_secundario} onChange={e => setNewMember({ ...newMember, telefone_secundario: formatPhone(e.target.value) })} placeholder="Contato reserva" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Data de entrada na cooperativa</label>
                                            <input type="date" className="glass-input w-full" value={newMember.data_entrada_cooperativa} onChange={e => setNewMember({ ...newMember, data_entrada_cooperativa: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: Documents */}
                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">RG</label>
                                            <input className="glass-input w-full" value={newMember.rg} onChange={e => setNewMember({ ...newMember, rg: e.target.value })} placeholder="RG" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Data de Expedição</label>
                                            <input type="date" className="glass-input w-full" value={newMember.rg_data_expedicao} onChange={e => setNewMember({ ...newMember, rg_data_expedicao: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">CPF</label>
                                            <input required className="glass-input w-full" value={newMember.cpf} onChange={e => setNewMember({ ...newMember, cpf: formatCPF(e.target.value) })} placeholder="CPF do cooperado" />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Orgão Emissor</label>
                                                <input className="glass-input w-full" value={newMember.rg_orgao_emissor} onChange={e => setNewMember({ ...newMember, rg_orgao_emissor: e.target.value })} placeholder="Orgão Emissor" />
                                            </div>
                                            <div className="w-20 space-y-1">
                                                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">UF</label>
                                                <input className="glass-input w-full text-center" value={newMember.rg_uf} onChange={e => setNewMember({ ...newMember, rg_uf: e.target.value.toUpperCase() })} maxLength={2} placeholder="UF" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Nº Pis</label>
                                            <input className="glass-input w-full" value={newMember.numero_pis} onChange={e => setNewMember({ ...newMember, numero_pis: e.target.value })} placeholder="Pis" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Upload de Pasta</label>
                                            <div className="relative h-[52px]">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    onChange={e => setDocumentos(e.target.files[0])}
                                                />
                                                <div className="glass-input w-full h-full flex items-center justify-center gap-2 text-slate-500 group-hover:bg-slate-50 transition-colors">
                                                    <span className="material-icons text-sm">upload</span>
                                                    <span className="text-[10px] font-black">{documentos ? documentos.name.substring(0, 15) + '...' : 'Clique para upload'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Digite o endereço completo</label>
                                            <input className="glass-input w-full" value={newMember.endereco} onChange={e => setNewMember({ ...newMember, endereco: e.target.value })} placeholder="Digite o endereço aqui" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Dependentes</label>
                                            <input type="number" className="glass-input w-full" value={newMember.quantidade_dependentes} onChange={e => setNewMember({ ...newMember, quantidade_dependentes: e.target.value })} placeholder="0,0" />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: Professional */}
                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Profissão</label>
                                            <select className="glass-input w-full" value={newMember.profissao} onChange={e => setNewMember({ ...newMember, profissao: e.target.value })}>
                                                <option value="medico">Médico</option>
                                                <option value="enfermeiro">Enfermeiro</option>
                                                <option value="fisioterapeuta">Fisioterapeuta</option>
                                                <option value="biomedico">Biomédico</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Conselho</label>
                                            <input className="glass-input w-full" value={newMember.conselho_profissional} onChange={e => setNewMember({ ...newMember, conselho_profissional: e.target.value })} placeholder="Conselho" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Nº do conselho</label>
                                            <input className="glass-input w-full" value={newMember.numero_conselho} onChange={e => setNewMember({ ...newMember, numero_conselho: e.target.value })} placeholder="Nº do conselho" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Data da emissão</label>
                                            <input type="date" className="glass-input w-full" value={newMember.conselho_data_emissao} onChange={e => setNewMember({ ...newMember, conselho_data_emissao: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* List of Added Professions */}
                                    {profissoesList.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            {profissoesList.map((p, idx) => (
                                                <div key={idx} className="glass-card !bg-white/40 p-4 flex justify-between items-center group">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">{p.profissao}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{p.conselho_profissional} - {p.numero_conselho}</p>
                                                    </div>
                                                    <button type="button" onClick={() => removeProfession(idx)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="material-icons text-sm">remove</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button type="button" onClick={addProfession} className="glass-button bg-blue-500 !py-2 px-6 flex items-center gap-2 mx-auto active:scale-95 transition-transform">
                                        <span className="material-icons text-sm">add</span>
                                        <span className="text-[10px] font-black">ADICIONAR +</span>
                                    </button>
                                </div>

                                {/* SECTION 4: Bank */}
                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Banco</label>
                                            <input className="glass-input w-full" value={newMember.banco_nome} onChange={e => setNewMember({ ...newMember, banco_nome: e.target.value })} placeholder="Escolha o banco" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Agência</label>
                                            <input className="glass-input w-full" value={newMember.banco_agencia} onChange={e => setNewMember({ ...newMember, banco_agencia: e.target.value })} placeholder="Digite a Agência" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Nº da conta</label>
                                            <input className="glass-input w-full" value={newMember.banco_conta} onChange={e => setNewMember({ ...newMember, banco_conta: e.target.value })} placeholder="Digite o Nº da Conta" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1 text-xs">Tipo de conta ou chave</label>
                                            <select className="glass-input w-full" value={newMember.banco_tipo_conta} onChange={e => setNewMember({ ...newMember, banco_tipo_conta: e.target.value })}>
                                                <option value="">Escolha</option>
                                                <option value="corrente">Corrente</option>
                                                <option value="poupanca">Poupança</option>
                                                <option value="pix">PIX</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* List of Added Banks */}
                                    {contasBancariasList.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            {contasBancariasList.map((b, idx) => (
                                                <div key={idx} className="glass-card !bg-white/40 p-4 flex justify-between items-center group">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">{b.banco_nome}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{b.banco_agencia} - {b.banco_conta} ({b.banco_tipo_conta})</p>
                                                    </div>
                                                    <button type="button" onClick={() => removeBank(idx)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="material-icons text-sm">remove</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button type="button" onClick={addBank} className="glass-button bg-blue-500 !py-2 px-6 flex items-center gap-2 mx-auto active:scale-95 transition-transform">
                                        <span className="material-icons text-sm">add</span>
                                        <span className="text-[10px] font-black">ADICIONAR +</span>
                                    </button>
                                </div>

                                <div className="pt-10 flex flex-col items-center">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="glass-button w-full max-w-sm bg-blue-600 shadow-xl shadow-blue-500/20 !py-5 text-sm font-black tracking-[0.2em] uppercase flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                    >
                                        {submitting ? (
                                            <span className="material-icons animate-spin">sync</span>
                                        ) : (
                                            <span className="material-icons">{editingMemberId ? 'save' : 'send'}</span>
                                        )}
                                        {editingMemberId ? 'ATUALIZAR COOPERADO' : 'CADASTRAR COOPERADO +'}
                                    </button>
                                    <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">A senha temporária é: Mudar123!</p>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div >
    )
}
