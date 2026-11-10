
const data = JSON.parse(document.querySelector('#station-data').textContent);
const right = function right(answer, raw, options=false, places=2) {
 if(typeof raw!=="string" || !raw.trim()) return false;
 if(options) return raw===String(answer);
 const trimmed=raw.trim();
 if(!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(trimmed)) return false;
 const value=Number(trimmed.replace(',','.'));
 const multiplier=10**places;
 return Math.abs(value-answer)<1e-8 || Math.abs(value-Math.round(answer*multiplier)/multiplier)<1e-8;
};
for(const button of document.querySelectorAll('[data-level]')) {
 button.addEventListener('click',()=>{
  document.querySelectorAll('[data-level]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
  document.querySelectorAll('[data-panel]').forEach(x=>x.hidden=x.dataset.panel!==button.dataset.level);
 });
}
for(const button of document.querySelectorAll('[data-check]')) {
 button.addEventListener('click',()=>{
  const key=button.dataset.check, area=button.closest('fieldset');
  const raw=area.querySelector('input[type=text],input:checked')?.value||'';
  const isChoice=Boolean(area.querySelector('input[type=radio]'));
  const correct=right(data.levels[Number(key[1])][Number(key[2])],raw,isChoice,area.textContent.includes('fünf Nachkommastellen')?5:2);
  const status=area.querySelector('.status');
  status.className='status '+(correct?'good':'retry');
  status.textContent=correct?'Richtig!':raw?'Prüfe deinen Rechenweg oder öffne den Tipp.':'Gib zuerst eine Antwort ein.';
 });
}
const form=document.querySelector('#exit'), status=document.querySelector('#exit-status');
const send=form.querySelector('[type=submit]'), reset=form.querySelector('[type=reset]');
form.addEventListener('reset',()=>{status.textContent='';send.disabled=false;});
form.addEventListener('submit',async event=>{
 event.preventDefault();
 const values=new FormData(form);
 const answers=[0,1,2].map(i=>String(values.get('exit'+i)||'').trim());
 if(answers.some(x=>!x)){status.textContent='Beantworte zuerst alle drei Aufgaben.';return;}
 send.disabled=true;reset.disabled=true;
 status.textContent='Wird abgegeben …';
 try{
  const response=await fetch('https://mathe-9e-kreise-zylinder.jnwbr.chatgpt.site/api/exit',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:data.id,answers})});
  if(!response.ok)throw Error('Abgabe');
  const result=await response.json();
  status.textContent=result.points+' von 3 Punkten. '+result.items.map((x,i)=>(i+1)+'. '+(x?'richtig':'noch üben')).join(' · ')+'.';
 }catch{status.textContent='Die Abgabe konnte nicht bestätigt werden. Versuche es erneut.';send.disabled=false;}
 finally{reset.disabled=false;}
});
