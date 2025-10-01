
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import './styles.css'
import Login from './pages/Login.jsx'
import TeacherDashboard from './pages/TeacherDashboard.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import { useSessionStore } from './store.js'

function AppShell(){
  const { user, logout } = useSessionStore()
  return (
    <>
      <header>
        <nav className="toolbar">
          <Link to="/">🏠 Início</Link>
          <span style={{flex:1}} />
          {user ? (
            <>
              <span className="badge">{user.role}</span>
              <span>{user.name}</span>
              <button className="btn" onClick={logout}>Sair</button>
            </>
          ) : (
            <Link className="btn" to="/login">Entrar</Link>
          )}
        </nav>
      </header>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/teacher" element={
            <RequireRole role="TEACHER"><TeacherDashboard /></RequireRole>
          } />
          <Route path="/student" element={
            <RequireRole role="STUDENT"><StudentDashboard /></RequireRole>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <footer style={{marginTop:24, padding:16}}>
        <small>Blockly Classroom — MVP • Feito com ❤️</small>
      </footer>
    </>
  )
}

function Home(){
  const { user } = useSessionStore()
  return (
    <div className="grid">
      <div className="card">
        <h1>Blockly Classroom</h1>
        <p>Aprenda e ensine programação com blocos, cenários lúdicos e recompensas divertidas.</p>
        <div className="toolbar">
          {!user && <Link className="btn primary" to="/login">Entrar</Link>}
          {user?.role === 'TEACHER' && <Link className="btn fun" to="/teacher">Painel do Professor</Link>}
          {user?.role === 'STUDENT' && <Link className="btn fun" to="/student">Painel do Aluno</Link>}
        </div>
      </div>
    </div>
  )
}

function RequireRole({ role, children }){
  const { user } = useSessionStore()
  if(!user) return <Navigate to="/login" />
  if(user.role !== role) return <Navigate to="/" />
  return children
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
)
