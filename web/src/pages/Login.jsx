
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store.js'

export default function Login(){
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('STUDENT')
  const [error, setError] = useState('')
  const nav = useNavigate()
  const { login, register } = useSessionStore()

  async function submit(e){
    e.preventDefault()
    setError('')
    try{
      if(mode==='login'){
        await login(email, password)
      } else {
        await register(name, email, password, role)
      }
      nav(role==='TEACHER'?'/teacher':'/student')
    }catch(err){ setError(err?.response?.data?.error || 'Falha no login/registro') }
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>{mode==='login'?'Entrar':'Criar conta'}</h2>
        <form onSubmit={submit} className="grid" style={{gap:12}}>
          {mode==='register' && (
            <>
              <label>Nome<input value={name} onChange={e=>setName(e.target.value)} required /></label>
              <label>Perfil
                <select value={role} onChange={e=>setRole(e.target.value)}>
                  <option value="STUDENT">Aluno</option>
                  <option value="TEACHER">Professor</option>
                </select>
              </label>
            </>
          )}
          <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
          <label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} /></label>
          {error && <div className="error">{error}</div>}
          <div className="toolbar">
            <button className="btn primary" type="submit">{mode==='login'?'Entrar':'Registrar'}</button>
            <button type="button" className="btn" onClick={()=>setMode(mode==='login'?'register':'login')}>
              {mode==='login'?'Criar conta':'Já tenho conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
