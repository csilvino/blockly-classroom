
import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as Blockly from 'blockly/core'
import 'blockly/blocks'
import 'blockly/javascript'
import ScenarioMaze from '../components/ScenarioMaze.jsx'
import RewardModal from '../components/RewardModal.jsx'
import { useSessionStore } from '../store.js'

// Define blocos de cenário (movimentação)
function defineMazeBlocks(){
  if(Blockly.Blocks['maze_move']) return
  Blockly.Blocks['maze_move'] = { init(){ this.appendDummyInput().appendField('andar para frente'); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour('#f59e0b') } }
  Blockly.JavaScript['maze_move'] = b => `__maze__.moveForward();
`
  Blockly.Blocks['maze_turn_left'] = { init(){ this.appendDummyInput().appendField('virar à esquerda'); this.setPreviousStatement(true); this.setNextStatement(true); this.setColour('#f59e0b') } }
  Blockly.JavaScript['maze_turn_left'] = b => `__maze__.turnLeft();
`
  Blockly.Blocks['maze_front_clear'] = { init(){ this.appendDummyInput().appendField('frente livre?'); this.setOutput(true,'Boolean'); this.setColour('#60a5fa') } }
  Blockly.JavaScript['maze_front_clear'] = b => [ `__maze__.frontIsClear()`, Blockly.JavaScript.ORDER_ATOMIC ]
  Blockly.Blocks['maze_at_goal'] = { init(){ this.appendDummyInput().appendField('no objetivo?'); this.setOutput(true,'Boolean'); this.setColour('#22c55e') } }
  Blockly.JavaScript['maze_at_goal'] = b => [ `__maze__.isAtGoal()`, Blockly.JavaScript.ORDER_ATOMIC ]
}

export default function StudentDashboard(){
  const { api } = useSessionStore()
  const [challenges,setChallenges] = useState([])
  const [current,setCurrent] = useState(null)
  const [toolboxXml,setToolboxXml] = useState('')
  const [xml,setXml] = useState('')
  const [outputs,setOutputs] = useState([])
  const [message,setMessage] = useState('')
  const [openReward,setOpenReward] = useState(false)
  const mazeRef = useRef({})

  useEffect(()=>{ defineMazeBlocks() }, [])

  async function load(){
    const { data } = await api.get('/challenges/published')
    setChallenges(data)
  }
  useEffect(()=>{ load() }, [])

  function buildToolbox(ch){
    const base = ch.lesson.toolboxPreset === 'starter' ? `
      <category name="Início"><block type="print"></block></category>
      <category name="Laços"><block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">3</field></shadow></value></block></category>
      <category name="Texto"><block type="text"></block></category>
    ` : ch.lesson.toolboxPreset === 'logic' ? `
      <category name="Saída"><block type="print"></block></category>
      <category name="Lógica"><block type="controls_if"></block><block type="logic_compare"></block><block type="logic_boolean"></block></category>
      <category name="Laços"><block type="controls_whileUntil"></block></category>
      <category name="Texto"><block type="text"></block></category>
      <category name="Números"><block type="math_number"></block></category>
    ` : `
      <category name="Saída"><block type="print"></block></category>
      <category name="Lógica"><block type="controls_if"></block><block type="logic_compare"></block><block type="logic_operation"></block><block type="logic_boolean"></block></category>
      <category name="Laços"><block type="controls_repeat_ext"></block><block type="controls_whileUntil"></block><block type="controls_for"></block></category>
      <category name="Variáveis" custom="VARIABLE"></category>
      <category name="Funções" custom="PROCEDURE"></category>
      <category name="Texto"><block type="text"></block><block type="text_join"></block></category>
      <category name="Matemática"><block type="math_number"></block><block type="math_arithmetic"></block><block type="math_modulo"></block></category>
    `
    const scenarioCats = ch.scenarioId ? `
      <sep></sep>
      <category name="Labirinto">
        <block type="maze_move"></block>
        <block type="maze_turn_left"></block>
        <block type="maze_front_clear"></block>
        <block type="maze_at_goal"></block>
      </category>
    ` : ''
    const custom = ch.lesson.customToolboxXml || ''
    return `<xml>${base}${scenarioCats}${custom}</xml>`
  }

  function open(ch){
    setCurrent(ch)
    setToolboxXml(buildToolbox(ch))
    setXml(ch.lesson.startingXml || '')
    setOutputs([]); setMessage('')
  }

  function run(){
    if(!current) return
    // Gera código
    const temp = document.createElement('div');
    const ws = Blockly.inject(temp, { readOnly:true })
    if(xml){ try{ const dom = Blockly.Xml.textToDom(xml); Blockly.Xml.domToWorkspace(dom, ws) }catch(e){} }
    const code = Blockly.JavaScript.workspaceToCode(ws)
    ws.dispose(); temp.remove()

    // Execução controlada
    const out = []
    function __print__(...args){ out.push(args.join(' ')) }
    const __maze__ = mazeRef.current

    const TRAP = 'if(++__loopCount__>10000){throw new Error("Laço infinito?")};
'
    Blockly.JavaScript.INFINITE_LOOP_TRAP = TRAP

    const wrapped = `"use strict"; (function(){ let __loopCount__=0; const window=undefined,document=undefined,fetch=undefined,Function=undefined,eval=undefined; const __print__=arguments[0], __maze__=arguments[1]; ${code} }).call(null);`
    let error=null
    try{ new Function(wrapped)(__print__, __maze__) }catch(e){ error=e }
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null

    setOutputs(out)

    // Validação simples por saída
    let ok = false
    if(current.lesson.expectedType==='OUTPUT_MATCH'){
      const exp = (current.lesson.expectedData?.lines||[]).join('
').trim()
      const got = out.join('
').trim()
      ok = (exp===got)
    } else {
      ok = true // placeholder para validatorJs no futuro
    }

    if(ok && !error){
      setMessage('✅ Parabéns, você conseguiu!');
      setOpenReward(true)
      submitProgress(true, out)
    } else {
      setMessage(error? '⚠ Erro: '+error.message : 'Tente novamente.')
      submitProgress(false, out)
    }
  }

  async function submitProgress(success, out){
    const stars = success ? 3 : 0 // regra simples: 3 estrelas ao concluir
    try{ await api.post('/progress/submit', { challengeId: current.id, success, outputs: out, starsAwarded: stars }) }catch(e){}
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Desafios disponíveis</h2>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))'}}>
          {challenges.map(ch=> (
            <div key={ch.id} className="card">
              <h3>{ch.lesson.title}</h3>
              <p className="small">{ch.lesson.description}</p>
              <button className="btn fun" onClick={()=>open(ch)}>Começar</button>
            </div>
          ))}
        </div>
      </div>

      {current && (
      <div className="card">
        <h2>Desafio</h2>
        <p className="small">{current.lesson.description}</p>
        <div className="grid cols-2">
          <div>
            <ScenarioMaze config={{ cols:10, rows:8, start:[0,0], goal:[5,3], walls:[[1,0],[2,0],[2,1],[4,2]] }} runnerRef={mazeRef} />
          </div>
          <div>
            <div className="badge">Workspace</div>
            <BlocklyRunner toolboxXml={toolboxXml} xml={xml} onXmlChange={setXml} />
            <div className="toolbar" style={{marginTop:8}}>
              <button className="btn" onClick={()=>mazeRef.current?.reset?.()}>🔄 Reset cenário</button>
              <button className="btn primary" onClick={run}>▶ Executar</button>
            </div>
            <div className="badge" style={{marginTop:8}}>Console</div>
            <div className="console">{outputs.map((l,i)=>(<div key={i}>{l}</div>))}</div>
            <div className="badge" style={{marginTop:8}}>Resultado</div>
            <div className="console {message.includes('Parabéns')?'success':message.includes('Erro')?'warn':'error'}">{message}</div>
          </div>
        </div>
        <RewardModal open={openReward} stars={3} onClose={()=>setOpenReward(false)} />
      </div>
      )}
    </div>
  )
}

function BlocklyRunner({ toolboxXml, xml, onXmlChange }){
  const ref = useRef(null)
  const wsRef = useRef(null)

  useEffect(()=>{
    const area = ref.current
    area.innerHTML = ''
    const div = document.createElement('div')
    div.style.height='520px'; div.style.width='100%'
    area.appendChild(div)

    const ws = Blockly.inject(div, { toolbox: new DOMParser().parseFromString(toolboxXml,'text/xml').firstChild, renderer:'zelos', grid:{spacing:20, length:3, colour:'#334155', snap:true}, zoom:{controls:true,wheel:true} })
    wsRef.current = ws
    if(xml){ try{ const dom=Blockly.Xml.textToDom(xml); Blockly.Xml.domToWorkspace(dom, ws)}catch(e){} }
    const listener = ()=>{ const dom=Blockly.Xml.workspaceToDom(ws); onXmlChange(Blockly.Xml.domToText(dom)) }
    ws.addChangeListener(listener)
    return ()=>ws.dispose()
  }, [toolboxXml])

  return <div id="blocklyArea" ref={ref}></div>
}
