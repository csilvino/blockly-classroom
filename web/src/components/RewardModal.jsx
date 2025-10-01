
import React, { useEffect } from 'react'

export default function RewardModal({ open, stars=1, onClose }){
  useEffect(()=>{
    if(open){
      try{
        const ctx = new (window.AudioContext||window.webkitAudioContext)()
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type='triangle'; o.frequency.value=660; g.gain.value=0.1; o.start();
        setTimeout(()=>{o.frequency.value=880},200);
        setTimeout(()=>{o.stop(); ctx.close()},400)
      }catch(e){}
      // confetti simples
      const el = document.createElement('div')
      el.style.position='fixed'; el.style.left=0; el.style.top=0; el.style.width='100%'; el.style.height='100%'; el.style.pointerEvents='none'
      for(let i=0;i<120;i++){
        const s=document.createElement('div'); s.style.position='absolute'; s.style.width='8px'; s.style.height='8px';
        s.style.background=['#22c55e','#60a5fa','#f59e0b','#e879f9'][i%4]; s.style.left=Math.random()*100+'%'; s.style.top='-10px';
        s.style.transform=`translateY(${Math.random()*-100}px)`; s.style.opacity='0.9'; s.style.borderRadius='2px';
        s.animate([{transform:`translateY(-20px) rotate(0deg)`},{transform:`translateY(${window.innerHeight+40}px) rotate(360deg)`}],{duration: 1000+Math.random()*1400, easing:'ease-out'})
        el.appendChild(s)
      }
      document.body.appendChild(el)
      setTimeout(()=>{ document.body.removeChild(el) }, 1600)
    }
  }, [open])

  if(!open) return null
  return (
    <div style={{position:'fixed', inset:0, display:'grid', placeItems:'center', background:'rgba(0,0,0,.4)'}}>
      <div className="card" style={{textAlign:'center'}}>
        <h2>🎉 Parabéns!</h2>
        <p>Você concluiu o desafio.</p>
        <div className="stars">{'★'.repeat(stars)}{'☆'.repeat(Math.max(0,3-stars))}</div>
        <button className="btn primary" onClick={onClose}>Continuar</button>
      </div>
    </div>
  )
}
