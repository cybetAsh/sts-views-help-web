const wpQrForm = document.getElementById('wpQrForm');
const qrResult = document.getElementById('qrResult');
wpQrForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(wpQrForm);
  const number = fd.get('number') || '';
  qrResult.innerText = 'Generating...';
  const res = await fetch('/api/generate-wpqr',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({number})});
  const d = await res.json();
  if(res.ok && d.dataUrl){
    qrResult.innerHTML = `<img src="${d.dataUrl}" alt="QR" style="max-width:240px"> <a class="btn" href="${d.dataUrl}" download="wp-${number}.png">Download QR</a>`;
  } else { qrResult.innerText = d.error || 'Error' }
});