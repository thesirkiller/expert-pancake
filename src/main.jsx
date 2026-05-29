import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import './styles/index.css'

import Login from './pages/Login'
import Home from './pages/Home'
import Profile from './pages/Profile'
import CooperativeRegistration from './pages/CooperativeRegistration'
import GestaoRH from './pages/GestaoRH'
import Assembleias from './pages/Assembleias'
import PortalCooperado from './pages/PortalCooperado'
import CooperadoAssembleias from './pages/CooperadoAssembleias'
import ParticiparAssembleia from './pages/ParticiparAssembleia'
import GestaoGeral from './pages/GestaoGeral'

function PrivateRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="w-8 h-8 border-4 border-[#1F93FF] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return user ? children : <Navigate to="/login" replace />
}

function HomeRedirection() {
    const { cooperado, loading } = useAuth()

    if (loading) return null

    // Se for um cooperado comum (sem time, não interno, não admin), vai para o portal
    // Se tiver time OU for admin/colaborador, vai para a Home (Dashboard Admin)
    if (cooperado && !cooperado.admin_coop && !cooperado.colaborador_interno && (!cooperado.team_count || cooperado.team_count === 0)) {
        return <Navigate to="/portal" replace />
    }

    return <Home />
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <HomeRedirection />
                    </PrivateRoute>
                }
            />
            <Route
                path="/portal"
                element={
                    <PrivateRoute>
                        <PortalCooperado />
                    </PrivateRoute>
                }
            />
            <Route
                path="/portal/assembleias"
                element={
                    <PrivateRoute>
                        <CooperadoAssembleias />
                    </PrivateRoute>
                }
            />
            <Route
                path="/portal/assembleia/:id"
                element={
                    <PrivateRoute>
                        <ParticiparAssembleia />
                    </PrivateRoute>
                }
            />
            <Route
                path="/perfil"
                element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                }
            />
            {/* Onboarding Flow */}
            <Route path="/onboarding/cooperativa" element={<CooperativeRegistration />} />

            {/* Private Management Routes */}
            <Route
                path="/gestao-rh"
                element={
                    <PrivateRoute>
                        <GestaoRH />
                    </PrivateRoute>
                }
            />

            <Route
                path="/gestao"
                element={
                    <PrivateRoute>
                        <GestaoGeral />
                    </PrivateRoute>
                }
            />

            <Route
                path="/assembleias"
                element={
                    <PrivateRoute>
                        <Assembleias />
                    </PrivateRoute>
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
)
