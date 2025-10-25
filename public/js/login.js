const form = document.getElementById('loginForm');
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const data = new FormData(form);
  const payload = { username: data.get('username'), password: data.get('password') };
  const res = await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(res.ok){ location.href = '/src/dashboard.html'; }
  else{ alert('Invalid credentials') }
});