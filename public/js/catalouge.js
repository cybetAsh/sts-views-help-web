const formCat = document.getElementById('catalogueForm');
const result = document.getElementById('catalogueResult');
formCat.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(formCat);
  const file = fd.get('photo');
  if(!file || file.size===0){ alert('Please choose a photo'); return }
  result.innerHTML = 'Uploading and generating catalogue...';
  const r = await fetch('/api/upload-catalogue', { method:'POST', body: fd });
  const data = await r.json();
  if(r.ok && data.url){
    result.innerHTML = `Done — <a href="${data.url}">Download Catalogue ZIP</a>`;
  } else {
    result.innerText = 'Error creating catalogue';
  }
});