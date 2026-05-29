import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Sidebar from '../components/Sidebar'
import { supabase } from '../services/supabase'

// Helper Components & Functions (Moved Outside to avoid re-renders & focus loss)
const formatDate = (dateString) => {
    if (!dateString) return '-'
    // Handle YYYY-MM-DD from input[type="date"]
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

const Field = ({ label, value, name, type = "text", icon, editable = true, isEditing, onChange, formData }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
            {label}
        </label>
        {isEditing && editable ? (
            <div className="relative group">
                <input
                    type={type}
                    name={name}
                    value={formData[name] || ''}
                    onChange={onChange}
                    className="glass-input w-full text-slate-700 bg-white/80 focus:bg-white transition-all border-blue-100"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-rounded text-sm">edit</span>
                </div>
            </div>
        ) : (
            <div className="glass-input text-slate-700 bg-white/50 min-h-[48px] flex items-center">
                {icon && <span className="material-symbols-rounded mr-2 text-slate-400 text-xl">{icon}</span>}
                <span className="font-medium">
                    {type === 'date' ? formatDate(value) : (value || '-')}
                </span>
            </div>
        )}
    </div>
)

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000)
        return () => clearTimeout(timer)
    }, [onClose])

    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info'
    }

    return (
        <div className={`toast toast-${type}`}>
            <span className="material-symbols-rounded">{icons[type]}</span>
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-auto opacity-70 hover:opacity-100">
                <span className="material-symbols-rounded text-sm">close</span>
            </button>
        </div>
    )
}

export default function Profile() {
    const navigate = useNavigate()
    const { cooperado, cooperativa } = useAuth()
    const [activeTab, setActiveTab] = useState('cooperado')
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({})
    const [loading, setLoading] = useState(false)
    const [toasts, setToasts] = useState([])

    useEffect(() => {
        if (cooperado) {
            // Remove joined objects to avoid Supabase update errors
            const { cooperativa: _, ...cleanData } = cooperado
            setFormData(cleanData)
        }
    }, [cooperado])

    const addToast = (message, type = 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
    }

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    const menuItems = [
        { id: 'cooperado', label: 'Dados Pessoais', icon: 'person' },
        { id: 'cooperativa', label: 'Minha Cooperativa', icon: 'business' }
    ]

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Supabase Update Logic
            const { error } = await supabase
                .from('cooperados')
                .update(formData)
                .eq('id', cooperado.id)

            if (error) throw error

            setIsEditing(false)
            addToast('Dados atualizados com sucesso!', 'success')

            // Note: In a real app, we'd update the AuthContext state here 
            // without a reload. For now, this confirms success to user.
        } catch (error) {
            console.error('Erro ao salvar dados:', error)
            addToast(`Erro: ${error.message || 'Falha ao salvar'}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex">
            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        {...toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* Sidebar Contextual */}
            <Sidebar
                menuItems={menuItems}
                activeId={activeTab}
                onItemClick={(id) => {
                    setActiveTab(id)
                    setIsEditing(false)
                }}
                title="Gestão de Perfil"
            />

            {/* Main Content Area */}
            <div className="flex-1 with-sidebar relative overflow-hidden">
                {/* Background Decor */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
                    <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-indigo-400/10 blur-[100px] rounded-full" />
                </div>

                {/* Header */}
                <header className="sticky top-0 z-50 glass-panel border-b border-white/20 px-8 py-4 backdrop-blur-md">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <div className="animate-in fade-in slide-in-from-left duration-500">
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                {activeTab === 'cooperado' ? 'Meu Perfil' : 'Dados da Cooperativa'}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">
                                {isEditing ? 'Você está editando seus dados' : 'Visualização completa das informações'}
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            {activeTab === 'cooperado' && (
                                <div className="flex gap-2 transition-all duration-300">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false)
                                                    setFormData(cooperado) // Reset
                                                }}
                                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={loading}
                                                className="glass-button bg-green-500 shadow-green-500/20 px-6 !py-2 flex items-center gap-2"
                                            >
                                                {loading ? (
                                                    <span className="material-symbols-rounded animate-spin text-sm">sync</span>
                                                ) : (
                                                    <span className="material-symbols-rounded text-sm">save</span>
                                                )}
                                                Salvar
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="glass-button px-6 !py-2 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-rounded text-sm">edit</span>
                                            Editar Dados
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-slate-700">{cooperado?.nome}</span>
                                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100">
                                        Ativo
                                    </span>
                                </div>
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                                    <img
                                        src={cooperado?.foto_url || `https://ui-avatars.com/api/?name=${cooperado?.nome}&background=1F93FF&color=fff`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-8 py-10 relative z-10">
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">

                        {activeTab === 'cooperado' ? (
                            /* Cooperado Section */
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                        <span className="material-symbols-rounded text-3xl">person_outline</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Informações Pessoais</h2>
                                        <p className="text-slate-400 text-sm font-medium">Dados de identificação e contato</p>
                                    </div>
                                </div>

                                <div className="glass-card p-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6 shadow-2xl shadow-blue-900/5">
                                    <div className="md:col-span-2 lg:col-span-3 pb-2 border-b border-slate-100/50">
                                        <Field label="Nome Completo" value={formData.nome} name="nome" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                    </div>
                                    <Field label="CPF" value={formData.cpf} name="cpf" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                    <Field label="RG" value={formData.rg} name="rg" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                    <Field label="Nascimento" value={formData.data_nascimento} name="data_nascimento" type="date" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                    <Field label="Email" value={formData.email} name="email" type="email" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                    <Field label="Telefone" value={formData.telefone_principal} name="telefone_principal" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                    <Field label="WhatsApp" value={formData.whatsapp} name="whatsapp" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                    <Field label="CRM" value={formData.crm} name="crm" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                    <Field label="Especialidade" value={formData.especialidade} name="especialidade" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                    <Field label="Conselho" value={formData.conselho_profissional} name="conselho_profissional" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                    <Field label="Nº Conselho" value={formData.numero_conselho} name="numero_conselho" isEditing={isEditing} onChange={handleInputChange} formData={formData} />

                                    <div className="md:col-span-2 lg:col-span-3 pt-6">
                                        <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                <span className="material-symbols-rounded text-lg">place</span>
                                            </div>
                                            Endereço Residencial
                                        </h3>
                                        <div className="grid md:grid-cols-4 gap-6">
                                            <div className="md:col-span-2">
                                                <Field label="Logradouro" value={formData.endereco} name="endereco" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                            </div>
                                            <Field label="Número" value={formData.numero} name="numero" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                            <Field label="Complemento" value={formData.complemento} name="complemento" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                            <Field label="Bairro" value={formData.bairro} name="bairro" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                            <div className="md:col-span-2">
                                                <Field label="Cidade" value={formData.cidade} name="cidade" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                            </div>
                                            <Field label="Estado" value={formData.estado} name="estado" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                            <Field label="CEP" value={formData.cep} name="cep" isEditing={isEditing} onChange={handleInputChange} formData={formData} />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ) : (
                            /* Cooperativa Section */
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                                        <span className="material-symbols-rounded text-3xl">corporate_fare</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dados da Cooperativa</h2>
                                        <p className="text-slate-400 text-sm font-medium">Informações institucionais e de suporte</p>
                                    </div>
                                </div>

                                <div className="glass-card p-10 shadow-2xl shadow-indigo-900/5 border-indigo-100/30">
                                    <div className="flex flex-col md:flex-row items-center gap-10 mb-12 pb-10 border-b border-slate-100/50">
                                        <div className="w-32 h-32 bg-white rounded-[2rem] p-4 shadow-2xl border border-slate-50 flex items-center justify-center">
                                            {cooperativa?.logo_url ? (
                                                <img src={cooperativa?.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-4xl font-black text-slate-200">
                                                    {cooperativa?.nome?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center md:text-left">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2 block">Institucional</span>
                                            <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-tight mb-2">
                                                {cooperativa?.nome}
                                            </h3>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                                <span className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                                    Cooperativa Ativa
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-sm text-slate-500 font-medium">Membro desde 2024</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="md:col-span-2">
                                            <Field label="Razão Social" value={cooperativa?.razao_social} editable={false} />
                                        </div>
                                        <Field label="CNPJ" value={cooperativa?.cnpj} editable={false} />

                                        <Field label="Telefone de Contato" value={cooperativa?.telefone} editable={false} />
                                        <div className="md:col-span-2">
                                            <Field label="Email Suporte" value={cooperativa?.email} editable={false} />
                                        </div>

                                        <div className="md:col-span-3 pt-8">
                                            <h4 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <span className="material-symbols-rounded text-lg">business</span>
                                                </div>
                                                Sede Administrativa
                                            </h4>
                                            <div className="grid md:grid-cols-3 gap-8">
                                                <div className="md:col-span-2">
                                                    <Field label="Endereço Fiscal" value={cooperativa?.endereco} editable={false} />
                                                </div>
                                                <Field label="CEP" value={cooperativa?.cep} editable={false} />
                                                <Field label="Cidade / UF" value={`${cooperativa?.cidade} - ${cooperativa?.estado}`} editable={false} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
