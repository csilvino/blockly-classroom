
import React, { useEffect, useRef } from 'react'
import * as Blockly from 'blockly/core'
import 'blockly/blocks'
import 'blockly/javascript'

// Bloco custom imprimir -> integra com runner do aluno
function defineCustomBlocks(){
  if(Blockly.Blocks['print']) return
  Blockly.Blocks['print'] = {
    init: function(){
      this.appendValueInput('TEXT').appendField('imprimir')
      this.setPreviousStatement(true, null)
      this.setNextStatement(true, null)
      this.setColour('#22c55e')
      this.setTooltip('Envia texto para o console')
    }
  }
  Blockly.JavaScript['print'] = function(block){
    const value = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_NONE) || "''"
    return `__print__(${value});
`
  }
}

export default function BlocklyEditor({ toolboxXml, initialXml, onXmlChange }){
  const areaRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(()=>{ defineCustomBlocks() }, [])

  useEffect(()=>{
    const area = areaRef.current
    area.innerHTML = ''
    const div = document.createElement('div')
    div.style.height = '520px'; div.style.width = '100%'
    area.appendChild(div)

    const workspace = Blockly.inject(div, {
      toolbox: toolboxXml ? (new DOMParser().parseFromString(toolboxXml, 'text/xml').firstChild) : undefined,
      renderer: 'zelos', grid:{spacing:20, length:3, colour:'#334155', snap:true},
      zoom:{controls:true, wheel:true}
    })
    wsRef.current = workspace

    if(initialXml){
      try{
        const dom = Blockly.Xml.textToDom(initialXml)
        Blockly.Xml.domToWorkspace(dom, workspace)
      }catch(err){ console.warn('XML inválido', err) }
    }

    const listener = () => {
      const xml = Blockly.Xml.workspaceToDom(workspace)
      const text = Blockly.Xml.domToText(xml)
      onXmlChange && onXmlChange(text)
    }
    workspace.addChangeListener(listener)
    return ()=>workspace.dispose()
  }, [toolboxXml])

  return <div id="blocklyArea" ref={areaRef}></div>
}
