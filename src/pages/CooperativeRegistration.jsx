import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

export default function CooperativeRegistration() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        nome: '',
        cnpj: '',
        slug: '',
        admin_nome: '',
        admin_email: '',
        admin_password: ''
    })
    const [logo, setLogo] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)
    const [error, setError] = useState(null)

    const formatCNPJ = (value) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 18)
    }

    const handleInputChange = (e) => {
        let { name, value } = e.target

        if (name === 'nome') {
            const slug = value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')
            setFormData(prev => ({ ...prev, nome: value, slug }))
        } else if (name === 'cnpj') {
            const maskedValue = formatCNPJ(value)
            setFormData(prev => ({ ...prev, [name]: maskedValue }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleLogoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setLogo(file)
            setLogoPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            let logo_url = ''

            // 1. Upload Logo if exists
            if (logo) {
                const fileExt = logo.name.split('.').pop()
                const fileName = `${formData.slug}-${Math.random().toString(36).substring(2)}.${fileExt}`
                const filePath = `logos/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('public')
                    .upload(filePath, logo)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('public')
                    .getPublicUrl(filePath)

                logo_url = publicUrl
            }

            // 2. Create Cooperative
            const { data: coopData, error: coopError } = await supabase
                .from('cooperativas')
                .insert([{
                    nome: formData.nome,
                    cnpj: formData.cnpj,
                    slug: formData.slug,
                    logo_url
                }])
                .select()
                .single()

            if (coopError) throw coopError

            // 3. Create Auth Admin User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.admin_email,
                password: formData.admin_password,
                options: {
                    data: {
                        full_name: formData.admin_nome
                    }
                }
            })

            if (authError) throw authError

            // 4. Create Member (Cooperado) Record for Admin
            const { error: memberError } = await supabase
                .from('cooperados')
                .insert([{
                    user_id: authData.user.id,
                    cooperativa_id: coopData.id,
                    nome: formData.admin_nome,
                    email: formData.admin_email,
                    admin_coop: true,
                    status: 'ativo'
                }])

            if (memberError) throw memberError

            // 5. Success -> Go to Home
            navigate('/', { replace: true })
        } catch (err) {
            console.error('Registration Error:', err)
            setError(err.message || 'Falha ao registrar cooperativa')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-400/20 blur-[100px] rounded-full animate-pulse" />
            </div>

            <div className="w-full max-w-2xl glass-panel p-10 relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl text-white shadow-xl shadow-blue-500/30 mb-6">
                        <span className="material-icons text-4xl">corporate_fare</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                        Nova Cooperativa
                    </h1>
                    <p className="text-slate-500 font-medium italic">
                        Inicie o processo de digitalização da sua gestão médica
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-4">
                        <span className="material-icons">error_outline</span>
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                            <span className="material-icons text-blue-500">business</span>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Dados da Instituição</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Logo Upload */}
                            <div className="md:col-span-2 flex flex-col items-center">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Logo da Cooperativa</label>
                                <label className="relative cursor-pointer group">
                                    <div className="w-28 h-28 rounded-[2rem] bg-white/50 border-2 border-dashed border-blue-100 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-300 group-hover:bg-white shadow-inner">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-4" />
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-300">
                                                <span className="material-icons text-3xl mb-1">add_a_photo</span>
                                                <span className="text-[8px] font-black">UPLOAD</span>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome Comercial</label>
                                <input
                                    required
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    placeholder="Ex: CooperSaúde"
                                    className="glass-input w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">CNPJ</label>
                                <input
                                    required
                                    name="cnpj"
                                    value={formData.cnpj}
                                    onChange={handleInputChange}
                                    placeholder="00.000.000/0000-00"
                                    className="glass-input w-full"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                            <span className="material-icons text-indigo-500">admin_panel_settings</span>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Acesso do Administrador</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome Completo</label>
                                <input
                                    required
                                    name="admin_nome"
                                    value={formData.admin_nome}
                                    onChange={handleInputChange}
                                    placeholder="Nome do responsável"
                                    className="glass-input w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">E-mail</label>
                                <input
                                    required
                                    type="email"
                                    name="admin_email"
                                    value={formData.admin_email}
                                    onChange={handleInputChange}
                                    placeholder="admin@coop.com"
                                    className="glass-input w-full border-indigo-50/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Senha de Acesso</label>
                                <input
                                    required
                                    type="password"
                                    name="admin_password"
                                    value={formData.admin_password}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    className="glass-input w-full border-indigo-50/50"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="glass-button w-full bg-blue-600 shadow-blue-600/20 !py-4 text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                        >
                            {loading ? (
                                <>
                                    <span className="material-icons animate-spin">sync</span>
                                    CRIANDO AMBIENTE...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons">rocket_launch</span>
                                    FINALIZAR E ACESSAR PAINEL
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
