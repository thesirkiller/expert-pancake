import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [cooperado, setCooperado] = useState(null)
    const [cooperativa, setCooperativa] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchCooperado = useCallback(async (userId) => {
        try {
            const { data } = await supabase
                .from('cooperados')
                .select('*, cooperativa:cooperativas(*)')
                .eq('user_id', userId)
                .single()

            if (data) {
                // Fetch team membership count
                const { count: teamCount } = await supabase
                    .from('times_internos_cooperados')
                    .select('*', { count: 'exact', head: true })
                    .eq('cooperado_id', data.id)

                setCooperado({ ...data, team_count: teamCount || 0 })
                setCooperativa(data.cooperativa)
            }
        } catch (error) {
            console.error('Erro ao buscar cooperado:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchCooperado(session.user.id)
            } else {
                setLoading(false)
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchCooperado(session.user.id)
            } else {
                setCooperado(null)
                setCooperativa(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [fetchCooperado])

    async function signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    }

    async function signOut() {
        await supabase.auth.signOut()
        setUser(null)
        setCooperado(null)
        setCooperativa(null)
    }

    const value = {
        user,
        cooperado,
        cooperativa,
        loading,
        signIn,
        signOut
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
