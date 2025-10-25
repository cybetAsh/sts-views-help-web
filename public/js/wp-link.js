const wpForm = document.getElementById('wpLinkForm');
const linkResult = document.getElementById('linkResult');
wpForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(wpForm);
  const number = fd.get('number') || '';
  const res = await fetch('/api/generate-wplink',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number})});
  const d = await res.json();
  if(res.ok){
    linkResult.innerHTML = `<input value="${d.link}" id="wpLinkInput" readonly style="width:100%;padding:8px;border-radius:8px"> <button id="copyBtn" class="btn">COPY</button>`;
    document.getElementById('copyBtn').addEventListener('click', ()=>{navigator.clipboard.writeText(d.link); alert('Copied!')});
  } else { linkResult.innerText = d.error || 'Error' }
});