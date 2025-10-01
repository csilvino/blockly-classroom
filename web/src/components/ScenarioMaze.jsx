
import React, { useEffect, useRef } from 'react'

// Config: { cols, rows, walls: [[x,y]...], start:[x,y], goal:[x,y] }
export default function ScenarioMaze({ config, runnerRef }){
  const canvasRef = useRef(null)
  const stateRef = useRef(null)

  useEffect(()=>{
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const cell = 32
    canvas.width = (config.cols||10)*cell
    canvas.height = (config.rows||10)*cell

    const state = {
      cell,
      pos: { x: (config.start?.[0]||0), y: (config.start?.[1]||0), dir: 0 }, // 0:right,1:down,2:left,3:up
      goal: { x: (config.goal?.[0]||0), y: (config.goal?.[1]||0) },
      walls: new Set((config.walls||[]).map(([x,y])=>`${x},${y}`)),
      cols: config.cols||10, rows: config.rows||10,
    }
    stateRef.current = state

    function draw(){
      ctx.fillStyle = '#06102a'; ctx.fillRect(0,0,canvas.width, canvas.height)
      // grid
      ctx.strokeStyle = '#1f2a44';
      for(let x=0; x<=state.cols; x++){ ctx.beginPath(); ctx.moveTo(x*cell,0); ctx.lineTo(x*cell, canvas.height); ctx.stroke() }
      for(let y=0; y<=state.rows; y++){ ctx.beginPath(); ctx.moveTo(0,y*cell); ctx.lineTo(canvas.width, y*cell); ctx.stroke() }
      // walls
      ctx.fillStyle = '#475569'
      for(const key of state.walls){ const [x,y] = key.split(',').map(Number); ctx.fillRect(x*cell, y*cell, cell, cell) }
      // goal
      ctx.fillStyle = '#22c55e'; ctx.fillRect(state.goal.x*cell+8, state.goal.y*cell+8, cell-16, cell-16)
      // player
      ctx.save();
      const px = state.pos.x*cell + cell/2; const py = state.pos.y*cell + cell/2
      ctx.translate(px, py); ctx.rotate(state.pos.dir * Math.PI/2)
      ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.moveTo(-10,-10); ctx.lineTo(12,0); ctx.lineTo(-10,10); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    draw()

    // Expor API para o runner (movimentos)
    runnerRef.current = {
      reset(){ state.pos = { x: (config.start?.[0]||0), y: (config.start?.[1]||0), dir: 0 }; draw() },
      moveForward(){
        const dirs = [[1,0],[0,1],[-1,0],[0,-1]]
        const [dx,dy] = dirs[state.pos.dir]
        const nx = state.pos.x+dx, ny = state.pos.y+dy
        const hitWall = nx<0||ny<0||nx>=state.cols||ny>=state.rows||state.walls.has(`${nx},${ny}`)
        if(!hitWall){ state.pos.x = nx; state.pos.y = ny; draw(); return true } else { return false }
      },
      turnLeft(){ state.pos.dir = (state.pos.dir+3)%4; draw() },
      isAtGoal(){ return state.pos.x===state.goal.x && state.pos.y===state.goal.y },
      frontIsClear(){
        const dirs = [[1,0],[0,1],[-1,0],[0,-1]]
        const [dx,dy] = dirs[state.pos.dir]
        const nx = state.pos.x+dx, ny = state.pos.y+dy
        const hitWall = nx<0||ny<0||nx>=state.cols||ny>=state.rows||state.walls.has(`${nx},${ny}`)
        return !hitWall
      }
    }

    return ()=>{ runnerRef.current = null }
  }, [JSON.stringify(config)])

  return <canvas className="maze" ref={canvasRef}></canvas>
}
