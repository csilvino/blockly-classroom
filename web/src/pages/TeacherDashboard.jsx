
import React, { useEffect, useMemo, useRef, useState } from 'react'
import BlocklyEditor from '../components/BlocklyEditor.jsx'
import { useSessionStore } from '../store.js'

const PRESETS = {
  starter: `
  <xml>
    <category name="Início">
      <block type="print"></block>
    </category>
    <category name="Laços">
      <block type="controls_repeat_ext">
        <value name="TIMES"><shadow type="math_number"><field name="NUM">3</field></shadow></value>
      </block>
    </category>
    <category name="Texto"><block type="text"></block></category>
    <category name="Números"><block type="math_number"></block></category>
  </xml>`,
  logic: `
  <xml>
    <category name="Saída"><block type="print"></block></category>
    <category name="Lógica">
      <block type="controls_if"></block>
      <block type="logic_compare"></block>
      <block type="logic_boolean"></block>
    </category>
    <category name="Laços">
      <block type="controls_repeat_ext"></block>
      <block type="controls_whileUntil"></block>
    </category>
    <category name="Matemática"><block type="math_number"></block><block type="math_arithmetic"></block></category>
  </xml>`,
  full: `
  <xml>
    <category name="Saída"><block type="print"></block></category>
    <category name="Lógica"><block type="controls_if"></block><block type="logic_compare"></block><block type="logic_operation"></block><block type="logic_boolean"></block></category>
    <category name="Laços"><block type="controls_repeat_ext"></block><block type="controls_whileUntil"></block><block type="controls_for"></block></category>
    <category name="Variáveis" custom="VARIABLE"></category>
    <category name="Funções" custom="PROCEDURE"></category>
    <category name="Texto"><block type="text"></block><block type="text_join"></block></category>
    <category name="Matemática"><block type="math_number"></block><block type="math_arithmetic"></block><block type="math_modulo"></block></category>
  </xml>`
}

export default function TeacherDashboard(){
  const { api } = useSessionStore()
  const [lessons,setLessons] = useState([])
  const [title,setTitle] = useState('Lição de exemplo')
  const [description,setDescription] = useState('Imprima Olá! três vezes')
  const [ageRange,setAgeRange] = useState('6-8')
  const [preset,setPreset] = useState('starter')
  const [customToolboxXml,setCustomToolboxXml] = useState('')
  const [startingXml,setStartingXml] = useState('')
  const [expectedType,setExpectedType] = useState('OUTPUT_MATCH')
  const [expectedLines,setExpectedLines] = useState('Olá!
Olá!
Olá!')
  const [scenarioType,setScenarioType] = useState('MAZE')
  const [scenarioConfig,setScenarioConfig] = useState(JSON.stringify({ cols:10, rows:8, start:[0,0], goal:[5,3], walls:[[1,0],[2,0],[2,1],[4,2]] }, null, 2))
  const [requiredBlocks,setRequiredBlocks] = useState('print, controls_repeat_ext')
  const [isPublished,setIsPublished] = useState(true)

  async function loadMine(){
    const { data } = await api.get('/lessons/mine')
    setLessons(data)
  }
  useEffect(()=>{ loadMine() }, [])

  async function saveAll(){
    // 1) criar lição
    const expectedData = expectedType==='OUTPUT_MATCH' ? { lines: expectedLines.split('
').map(s=>s.trim()).filter(Boolean) } : { validatorJs: 'return true' }
    const { data: lesson } = await api.post('/lessons', { title, description, ageRange, toolboxPreset:preset, customToolboxXml: customToolboxXml || null, startingXml, expectedType, expectedData })

    // 2) criar cenário
    const { data: scen } = await api.post('/scenarios', { type: scenarioType, config: JSON.parse(scenarioConfig||'{}') })

    // 3) criar challenge
    const required = requiredBlocks.split(',').map(s=>s.trim()).filter(Boolean)
    const { data: chal } = await api.post('/challenges', { lessonId: lesson.id, scenarioId: scen.id, requiredBlocks: required, orderIndex: 0, isPublished })

    alert('Lição + cenário + desafio publicados!')
    loadMine()
  }

  const toolboxXml = useMemo(()=> customToolboxXml || PRESETS[preset], [customToolboxXml, preset])

  return (
    <div className="grid">
      <div className="card">
        <h2>Editor de Lições</h2>
        <div className="grid cols-2">
          <div>
            <label>Título<input value={title} onChange={e=>setTitle(e.target.value)} /></label>
            <label>Descrição<textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} /></label>
            <div className="grid cols-3">
              <label>Faixa etária
                <select value={ageRange} onChange={e=>setAgeRange(e.target.value)}>
                  <option>6-8</option><option>9-11</option><option>12-14</option><option>15+</option>
                </select>
              </label>
              <label>Preset
                <select value={preset} onChange={e=>setPreset(e.target.value)}>
                  <option value="starter">Iniciante</option>
                  <option value="logic">Lógica</option>
                  <option value="full">Completo</option>
                </select>
              </label>
              <label>Publicar?
                <select value={isPublished? '1':'0'} onChange={e=>setIsPublished(e.target.value==='1')}>
                  <option value="1">Sim</option>
                  <option value="0">Não</option>
                </select>
              </label>
            </div>
            <label>Toolbox custom (XML, opcional)
              <textarea rows={6} value={customToolboxXml} onChange={e=>setCustomToolboxXml(e.target.value)} placeholder="<xml>...</xml>" />
            </label>
            <label>Saída esperada (linhas)
              <textarea rows={4} value={expectedLines} onChange={e=>setExpectedLines(e.target.value)} />
            </label>
            <label>Blocos obrigatórios (IDs, vírgulas)
              <input value={requiredBlocks} onChange={e=>setRequiredBlocks(e.target.value)} />
            </label>
            <div className="toolbar"><button className="btn primary" onClick={saveAll}>💾 Salvar & Publicar</button></div>
          </div>
          <div>
            <div className="badge">Arraste blocos (dica: "imprimir" + laço)</div>
            <BlocklyEditor toolboxXml={toolboxXml} initialXml={startingXml} onXmlChange={setStartingXml} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Cenário</h3>
        <div className="grid cols-2">
          <label>Tipo
            <select value={scenarioType} onChange={e=>setScenarioType(e.target.value)}>
              <option value="MAZE">Labirinto</option>
              <option value="CHARACTER">Personagem</option>
            </select>
          </label>
          <div></div>
          <label>Config (JSON)
            <textarea rows={10} value={scenarioConfig} onChange={e=>setScenarioConfig(e.target.value)} />
          </label>
          <div>
            <p className="small">Exemplo MAZE:
              <pre className="console">{`{
  "cols":10, "rows":8,
  "start":[0,0], "goal":[5,3],
  "walls":[[1,0],[2,0],[2,1],[4,2]]
}`}</pre>
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Minhas lições</h3>
        <ul>
          {lessons.map(l=> (
            <li key={l.id}>
              <span className="badge">{l.ageRange}</span> <strong>{l.title}</strong> — {l.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
