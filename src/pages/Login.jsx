import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
    const navigate = useNavigate()
    const { signIn } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await signIn(email, password)
            navigate('/')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-[#1F93FF] rounded-2xl mx-auto mb-6 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">G</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">GestorCoop</h1>
                    <p className="text-slate-500 mt-2">Acesse sua conta</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1F93FF] focus:ring-2 focus:ring-[#1F93FF]/10 outline-none transition-all"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Senha
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1F93FF] focus:ring-2 focus:ring-[#1F93FF]/10 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-[#1F93FF] text-white font-bold rounded-xl hover:bg-[#1580E0] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>

                    <div className="pt-4 text-center border-t border-slate-100 mt-6">
                        <p className="text-slate-500 text-sm font-medium">
                            Ainda não tem uma cooperativa?
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/onboarding/cooperativa')}
                            className="mt-2 text-[#1F93FF] font-bold hover:underline transition-all"
                        >
                            Registrar Nova Instituição
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
