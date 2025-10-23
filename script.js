// ================= COMPANY =================
const COMPANY = {
  name: "IMPEL Panamá",
  phone: "+507 394-8830 / +507 6728-6386 / +507 6283-8021",
  phones: ["+5073948830","+50767286386","+50762838021"],
  whatsapp: "+50762838021",
  whatsapp_alt: ["+50767286386"],
  email: "ventasimpelpanama@gmail.com",
  address: "Río Abajo, Calle 11 1/2, al lado de Nikos Café, Ciudad de Panamá",
  ig: "https://www.instagram.com/partes_electromecanicas_panama/"
};
const waLink = (text='Hola, quisiera una cotización') => `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`;

// ================= HELPERS =================
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>Array.from(el.querySelectorAll(s));
const io = new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target);}})},{threshold:.12});
function initReveal(){ $$('.reveal').forEach(n=>io.observe(n)); }
function toggleNav(){ const nav=$('.nav'); nav.classList.toggle('open'); }

// ================= PRODUCTS =================
async function fetchProducts(){ const res = await fetch('data/products.json'); return res.json(); }
async function renderProducts(){
  const grid=$('#product-grid'); if(!grid) return;
  const items = await fetchProducts();
  const term=($('#q')?.value||'').toLowerCase(); const cat=$('#cat')?.value||'Todas'; const order=$('#order')?.value||'az';
  let list = items.filter(p => (cat==='Todas'||p.cat===cat) && (p.name.toLowerCase().includes(term) || p.ref.toLowerCase().includes(term)));
  list.sort((a,b)=> order==='az' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name) );
  grid.innerHTML = list.map(p => `
    <article class="product reveal">
      <div class="img"><img src="assets/${p.img}" alt="${p.name}"></div>
      <div class="body">
        <strong>${p.name}</strong>
        <div class="meta">Ref. ${p.ref} · ${p.cat}</div>
        <div class="actions">
          <a class="btn btn-primary" target="_blank" rel="noopener" href="${waLink('Quiero cotizar: '+p.name)}">Cotizar</a>
          <button class="btn btn-outline" data-open="${p.id}">Detalles</button>
        </div>
      </div>
    </article>`).join('');
  $$('.product.reveal').forEach(el=>io.observe(el));
  $$('[data-open]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.getAttribute('data-open'))));
}

async function openModal(id){
  const items = await fetchProducts();
  const item = items.find(p=>String(p.id)===String(id)); if(!item) return;
  $('#m-title').textContent=item.name; $('#m-ref').textContent=item.ref; $('#m-cat').textContent=item.cat;
  $('#m-img').setAttribute('src','assets/'+item.img); $('#m-wa').setAttribute('href',waLink('Quiero cotizar: '+item.name)); $('#modal').showModal();
}
function closeModal(){ $('#modal').close(); }

// ================= FORMULARIO DE CONTACTO =================
function initForm() {
    const form = document.querySelector('#contact-form');
    if (!form) return;

    const status = document.querySelector('#form-status');
    if (!status) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Recolecta los datos del formulario
        const data = Object.fromEntries(new FormData(form).entries());

        // Validación simple de campos obligatorios
        if (!data.nombre || !data.email || !data.mensaje) {
            status.textContent = '⚠️ Complete todos los campos.';
            status.style.color = '#b42318'; // rojo
            return;
        }

        try {
            // Intento de envío vía API
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                status.textContent = '✅ Mensaje enviado. Gracias.';
                status.style.color = '#16a34a'; // verde
                form.reset();
                return;
            } else {
                throw new Error('Error en el servidor');
            }
        } catch (error) {
            // Fallback: abre mailto si falla la API
            const mailto = `mailto:${COMPANY.email}?subject=${encodeURIComponent('Consulta — ' + data.nombre)}&body=${encodeURIComponent(data.mensaje + '\n\nContacto: ' + data.nombre + ' (' + data.email + ')')}`;
            window.location.href = mailto;
        }
    });
}

// Inicializar formulario cuando cargue la página
document.addEventListener('DOMContentLoaded', initForm);


// ================= INIT =================
document.addEventListener('DOMContentLoaded',()=>{
  initReveal(); renderProducts(); initForm();
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  $$('.js-phone').forEach(n=>n.textContent=COMPANY.phone);
  $$('.js-address').forEach(n=>n.textContent=COMPANY.address);
  $$('.js-wa').forEach(n=>n.setAttribute('href', waLink()));
});

// ================= AI ASSISTANT =================
function ensureAssistant(){
  if(document.getElementById('assistant')) return;
  const box=document.createElement('div'); box.className='contact-card'; box.id='assistant';
  box.innerHTML = `
    <h3 style="margin-top:0">Asistente IMPEL</h3>
    <div id="chat" style="border:1px solid var(--border);border-radius:12px;padding:12px;max-height:340px;overflow:auto;margin-bottom:10px">
      <div class="note">Bienvenido. Puedo ayudar con disponibilidad, compatibilidad y garantías. Pregunte lo que necesite.</div>
    </div>
    <div style="display:flex;gap:8px">
      <input id="chat-input" class="input input-full" placeholder="Escriba su consulta..."/>
      <button class="btn btn-primary" id="send-btn">Enviar</button>
    </div>
    <div class="note" style="margin-top:8px">El asistente usa IA. Para urgencias use WhatsApp.</div>
  `;
  document.getElementById('assistant-mount')?.appendChild(box);

  const chat=$('#chat'); const input=$('#chat-input'); const send=$('#send-btn');
  function push(role, text){ const p=document.createElement('div'); p.style.margin='6px 0'; p.innerHTML = role==='user' ? `<div><strong>Usted:</strong> ${text}</div>` : `<div><strong>Asistente:</strong> ${text}</div>`; chat.appendChild(p); chat.scrollTop=chat.scrollHeight; }
  async function callAI(prompt){ return kbAnswer(prompt); }
  async function handleSend(){
    const text=(input.value||'').trim(); if(!text) return;
    push('user', text); input.value=''; push('assistant', 'Procesando…');
    const reply = await callAI(text); chat.lastChild.innerHTML = `<div><strong>Asistente:</strong> ${reply}</div>`; pushChatHistory('assistant', reply);
  }
  send.addEventListener('click', handleSend);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') handleSend(); });
}
document.addEventListener('DOMContentLoaded', ensureAssistant);


// ================= THEME & BRAND COLORS =================
(function(){
  const url = new URL(location.href);
  const qs = (k)=> url.searchParams.get(k);
  const store = { get:(k)=>localStorage.getItem(k), set:(k,v)=>localStorage.setItem(k,v) };

  const savedTheme = store.get('impel.theme') || 'light';
  function setLogo(t){
    const src = t==='navy' ? 'assets/logo-on-navy.png' : 'assets/logo.png';
    document.querySelectorAll('.brand img, .drawer .hdr .logo').forEach(img=>{ if(img) img.setAttribute('src', src); });
  }
  function applyTheme(t){
    document.body.classList.remove('theme-light','theme-dark','theme-navy');
    document.body.classList.add(t==='navy' ? 'theme-navy' : 'theme-light');
    store.set('impel.theme', t);
    const btn = document.querySelector('.theme-toggle');
    if(btn){
      btn.innerHTML = (t==='navy' ? 'Azul marino' : 'Blanco');
    }
    setLogo(t);
  }
  window.toggleTheme = function(){
    const current = store.get('impel.theme') || 'light';
    applyTheme(current==='light' ? 'navy' : 'light');
  };
  applyTheme(savedTheme);

  // Brand color overrides remain
  const p = qs('primary') || store.get('impel.primary');
  const s = qs('secondary') || store.get('impel.secondary');
  if(p){ document.documentElement.style.setProperty('--primary', p); store.set('impel.primary', p); }
  if(s){ document.documentElement.style.setProperty('--secondary', s); store.set('impel.secondary', s); }
})();


// ================= PRELOADER & PROGRESS =================
(function(){
  const pre = document.getElementById('preloader');
  const prog = document.getElementById('progress');
  if(pre){ window.addEventListener('load', ()=> setTimeout(()=> pre.classList.add('hide'), 300)); }
  if(prog){
    const onScroll = ()=>{
      const s = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
      const p = (h>0) ? (s/h)*100 : 0; prog.style.width = p + '%';
    };
    onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
  }
})();

// ================= OPEN/CLOSED CLOCK (America/Panama) =================
(function(){
  function getPA(){return new Date(new Date().toLocaleString('en-US',{timeZone:'America/Panama'}));}
  function statusNow(){
    const d = getPA(); const day = d.getDay(); const h = d.getHours(); const m = d.getMinutes();
    const hm = h*60 + m;
    let open=false;
    if(day>=1 && day<=5){ open = hm>=8*60 && hm<17*60; } // Mon-Fri 08:00–17:00
    if(day===6){ open = hm>=9*60 && hm<16*60; }          // Sat 09:00–16:00
    if(day===0){ open = false; }                         // Sun closed
    const clock = d.toLocaleTimeString('es-PA',{hour:'2-digit',minute:'2-digit',timeZone:'America/Panama'});
    const el = document.getElementById('open-status');
    if(el){ el.innerHTML = open ? `<span style="color:#16a34a;font-weight:700">Abierto ahora</span> · ${clock} (PA)`
                                : `<span style="color:#b91c1c;font-weight:700">Cerrado</span> · ${clock} (PA)`; }
  }
  statusNow(); setInterval(statusNow, 30*1000);
})();

// ================= CHAT: REALISTIC UI + TYPING + PRODUCT SUGGESTIONS =================
async function productSuggest(query){
  try{
    const res = await fetch('data/products.json'); const items = await res.json();
    const q = (query||'').toLowerCase();
    if(!q) return [];
    return items.filter(p=> p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q) ).slice(0,3);
  }catch(e){ return []; }
}
function mountChat(){
  const mount = document.getElementById('assistant-mount'); if(!mount) return;
  if(mount.dataset.mounted) return; mount.dataset.mounted = '1';
  mount.innerHTML = `<div class="chatbox" id="chatbox">
    <header><img src="assets/app-icon.png" alt=""><div><strong>Asistente IMPEL</strong><div class="note">IA en vivo</div></div>
    <div class="quick" style="margin-left:auto"><button class="btn btn-outline" data-q="Horario">Horario</button><button class="btn btn-outline" data-q="Cómo llegar">Cómo llegar</button><button class="btn btn-outline" data-q="Cotizar alternador Corolla 2012">Cotizar</button></div></header>
    <div class="msgs" id="msgs"><div class="msg-row"><div class="msg bubble">Hola, soy tu asistente. Escribe pieza y vehículo (ej. “alternador Hilux 2015”).</div></div></div>
    <footer><input id="chat-input" class="input" placeholder="Escribe tu consulta..."/><button class="btn btn-primary" id="chat-send">Enviar</button></footer>
  </div>`;
  const msgs = document.getElementById('msgs'); const input = document.getElementById('chat-input'); const send = document.getElementById('chat-send');
  function bubble(role,text){
    const row=document.createElement('div'); row.className='msg-row '+(role==='me'?'me':'');
    const b=document.createElement('div'); b.className='msg bubble'; b.textContent=text; row.appendChild(b); msgs.appendChild(row); msgs.scrollTop=msgs.scrollHeight; return b;
  }
  function typing(){
    const row=document.createElement('div'); row.className='msg-row typing-row';
    const b=document.createElement('div'); b.className='msg bubble'; b.innerHTML='<div class="typing"><span></span><span></span><span></span></div>';
    row.appendChild(b); msgs.appendChild(row); msgs.scrollTop=msgs.scrollHeight; return row;
  }
  async function callAI(prompt){
    // serverless first
    try{
      const r = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'system',content:'Eres un asesor técnico de repuestos electromecánicos. Pide datos de vehículo y ofrece alternativas concretas.'},{role:'user',content:prompt}]})});
      if(r.ok){ const data = await r.json(); return data.reply || '…'; }
    }catch(e){}
    // fallback BYOK
    const key = localStorage.getItem('impel.byok');
    if(key){
      const r = await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'system',content:'Eres un asesor técnico de repuestos electromecánicos.'},{role:'user',content:prompt}]})});
      const data = await r.json(); return data.choices?.[0]?.message?.content || '…';
    }
    return 'No se pudo contactar al servicio de IA.';
  }
  async function sendPrompt(text){
    if(!text) return; bubble('me', text); pushChatHistory('user', text); input.value='';
    // suggestions
    const sug = await productSuggest(text);
    if(sug.length){
      const row=document.createElement('div'); row.className='msg-row';
      const b=document.createElement('div'); b.className='msg bubble';
      b.innerHTML = '<strong>Sugerencias del catálogo:</strong><br>'+sug.map(s=>`• ${s.name} <em>(${s.ref})</em>`).join('<br>');
      row.appendChild(b); msgs.appendChild(row);
    }
    const t = typing();
    const reply = await callAI(text);
    t.remove();
    // stream-like print
    const b = bubble('bot',''); let i=0;
    const timer = setInterval(()=>{ b.textContent += reply[i]||''; i++; if(i>=reply.length){ clearInterval(timer); } }, 8);
  }
  send.addEventListener('click', ()=> sendPrompt(input.value.trim()) );
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') sendPrompt(input.value.trim()); });
  mount.querySelectorAll('[data-q]').forEach(btn=> btn.addEventListener('click', ()=> sendPrompt(btn.getAttribute('data-q')) ));
}
document.addEventListener('DOMContentLoaded', mountChat);

// ================= IMAGE ENHANCEMENTS =================
(function(){
  document.querySelectorAll('img[loading="lazy"]').forEach(img=>{
    const onload=()=> img.classList.remove('blur'); img.addEventListener('load', onload, {once:true}); img.classList.add('blur');
  });
})();


// ================= DRAWER (OFFCANVAS) =================
(function(){
  if(document.getElementById('drawer')) return;
  const d = document.createElement('div'); d.id='drawer'; d.className='drawer';
  d.innerHTML = `<div class="backdrop" onclick="toggleDrawer(false)"></div>
    <aside class="panel">
      <div class="menu">
        <div class="title">Navegación</div>
        <a href="index.html#inicio">Inicio</a>
        <a href="catalogo.html">Catálogo</a>
        <a href="contacto.html">Contacto</a>
        <div class="title">Cuenta</div>
        <a href="registro.html">Registrarse</a>
        <a href="login.html">Iniciar sesión</a>
      </div>
      <div class="account-pill" id="account-pill">Sesión: invitado</div>
    </aside>`;
  document.body.appendChild(d);
  window.toggleDrawer = function(force){
    const el = document.getElementById('drawer');
    const open = force!==undefined ? force : !el.classList.contains('open');
    el.classList.toggle('open', open);
  }
  // Update pill with current session
  function updatePill(){
    try{
      const s = JSON.parse(localStorage.getItem('impel.session')||'null');
      const pill = document.getElementById('account-pill');
      if(!pill) return;
      if(s && s.name){ pill.textContent = 'Sesión: ' + s.name; } else { pill.textContent = 'Sesión: invitado'; }
    }catch(e){}
  }
  updatePill(); window.addEventListener('storage', updatePill);
})();

// ================= BASIC AUTH (DEMO, client-side) =================
async function sha256(txt){ const data = new TextEncoder().encode(txt); const h = await crypto.subtle.digest('SHA-256', data); return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join(''); }
async function registerUser({name,email,phone,password}){
  const users = JSON.parse(localStorage.getItem('impel.users')||'{}');
  if(users[email]) throw new Error('Ya existe un usuario con ese correo');
  users[email] = { name, email, phone, pass: await sha256(password) };
  localStorage.setItem('impel.users', JSON.stringify(users));
  localStorage.setItem('impel.session', JSON.stringify({name,email}));
  return true;
}
async function loginUser(email,password){
  const users = JSON.parse(localStorage.getItem('impel.users')||'{}');
  const u = users[email]; if(!u) throw new Error('Usuario no encontrado');
  const ok = u.pass === await sha256(password); if(!ok) throw new Error('Contraseña incorrecta');
  localStorage.setItem('impel.session', JSON.stringify({name:u.name,email:u.email}));
  return true;
}
function logoutUser(){
  localStorage.removeItem('impel.session');
}


// ===== Session helpers =====
function getSession(){ try{ return JSON.parse(localStorage.getItem('impel.session')||'null'); }catch(e){ return null; } }
function getUsers(){ try{ return JSON.parse(localStorage.getItem('impel.users')||'{}'); }catch(e){ return {}; } }
async function updateProfile(up){ const s=getSession(); if(!s) throw new Error('Sin sesión');
  const users=getUsers(); const u=users[s.email]; if(!u) throw new Error('Usuario no encontrado');
  users[s.email] = {...u, ...up}; localStorage.setItem('impel.users', JSON.stringify(users));
  if(up.name){ localStorage.setItem('impel.session', JSON.stringify({name:up.name, email:s.email})); }
  return true;
}

// ===== Drawer dynamic rendering =====


function renderDrawer(){
  const el = document.getElementById('drawer'); if(!el) return;
  const menu = el.querySelector('.menu'); const pill = document.getElementById('account-pill');
  const s = getSession();
  let nav = `
    <div class="title">Navegación</div>
    <a class="row" href="index.html#inicio"><span class="left"><span class="ico ico-home"></span><span class="label">Inicio</span></span><span class="chev"></span></a>
    <a class="row" href="catalogo.html"><span class="left"><span class="ico ico-box"></span><span class="label">Catálogo</span></span><span class="chev"></span></a>
    <a class="row" href="contacto.html"><span class="left"><span class="ico ico-pin"></span><span class="label">Contacto</span></span><span class="chev"></span></a>
    <a class="row brand" href="#" onclick="window.open(COMPANY.ig,'_blank')" rel="noopener"><span class="left"><span class="ico ico-ig"></span><span class="label">Instagram</span></span><span class="chev"></span></a>
    <a class="row brand" href="${waLink()}" target="_blank" rel="noopener"><span class="left"><span class="ico ico-wa"></span><span class="label">WhatsApp</span></span><span class="chev"></span></a>
    <div class="title">Cuenta</div>`;
  if(s){
    nav += `<a class="row" href="mi-cuenta.html"><span class="left"><span class="ico ico-user"></span><span class="label">Mi cuenta</span></span><span class="chev"></span></a>
            <a class="row" href="#" data-logout="1"><span class="left"><span class="ico ico-logout"></span><span class="label">Cerrar sesión</span></span><span class="chev"></span></a>`;
    if(pill) pill.textContent = 'Sesión: ' + (s.name || s.email);
  }else{
    nav += `<a class="row" href="registro.html"><span class="left"><span class="ico ico-user"></span><span class="label">Registrarse</span></span><span class="chev"></span></a>
            <a class="row" href="login.html"><span class="left"><span class="ico ico-user"></span><span class="label">Iniciar sesión</span></span><span class="chev"></span></a>`;
    if(pill) pill.textContent = 'Sesión: invitado';
  }
  if(menu) menu.innerHTML = nav;
  const lo = el.querySelector('[data-logout]');
  if(lo){ lo.addEventListener('click', (e)=>{ e.preventDefault(); logoutUser(); renderDrawer(); }); }
}


document.addEventListener('DOMContentLoaded', renderDrawer);
window.addEventListener('storage', renderDrawer);

// ===== Persist chat history =====
function pushChatHistory(role,text){
  try{
    const now = new Date().toISOString();
    const arr = JSON.parse(localStorage.getItem('impel.chatlog')||'[]');
    arr.push({t:now, role, text}); 
    localStorage.setItem('impel.chatlog', JSON.stringify(arr.slice(-200))); // keep last 200
  }catch(e){}
}


// ================= QUOTE LIST =================
function getList(){ try{ return JSON.parse(localStorage.getItem('impel.list')||'[]'); }catch(e){ return []; } }
function saveList(arr){ localStorage.setItem('impel.list', JSON.stringify(arr)); updateListBadge(); }
function addToList(item){ const arr=getList(); if(!arr.find(x=>x.id===item.id)){ arr.push({...item, qty:1}); saveList(arr); } }
function removeFromList(id){ saveList(getList().filter(x=>x.id!==id)); }
function updateListBadge(){
  const n = getList().length;
  let btn = document.getElementById('list-fab');
  if(!btn){
    btn = document.createElement('a'); btn.id='list-fab'; btn.className='fab-wa'; btn.href='lista.html'; btn.innerHTML='<span class="ico"></span><span>Lista</span>'; document.body.appendChild(btn);
  }
  btn.querySelector('span').textContent = 'Lista ('+n+')';
}

// ================= FILTERED & PAGED RENDER =================
let PAGE=1, PER_PAGE=8, CURRENT=[];
async function renderProducts(){
  const grid=$('#product-grid'); if(!grid) return;
  const items = await fetchProducts();
  const term=($('#q')?.value||'').toLowerCase();
  const cat=$('#cat')?.value||'Todas';
  const brand=$('#brand')?.value||'Todas';
  const stock=$('#stock')?.value||'Todas';
  const order=$('#order')?.value||'az';
  let list = items.filter(p => (cat==='Todas'||p.cat===cat)
      && (brand==='Todas'||p.brand===brand)
      && (stock==='Todas'||p.stock===stock)
      && (p.name.toLowerCase().includes(term) || p.ref.toLowerCase().includes(term) || (p.compat||[]).join(' ').toLowerCase().includes(term)));
  list.sort((a,b)=> order==='az' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  CURRENT = list;
  $('#result-count').textContent = list.length + ' resultado(s)';
  // chips
  const chips=$('#active-chips'); if(chips){
    const arr=[]; if(cat!=='Todas') arr.push('Categoría: '+cat); if(brand!=='Todas') arr.push('Marca: '+brand); if(stock!=='Todas') arr.push('Disponibilidad: '+(stock==='stock'?'En stock':'Bajo pedido'));
    chips.innerHTML = arr.map(t=>`<span style="border:1px solid var(--border);padding:6px 10px;border-radius:999px;background:#fff">${t}</span>`).join('');
  }
  // pagination
  const total = list.length, pages = Math.max(1, Math.ceil(total/PER_PAGE)); PAGE = Math.min(PAGE, pages);
  const start = (PAGE-1)*PER_PAGE; const slice = list.slice(start, start+PER_PAGE);
  grid.innerHTML = slice.length ? slice.map(p => `
    <article class="product reveal">
      <div class="img"><img src="assets/${p.img}" alt="${p.name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/product-fallback.jpg';"></div>
      <div class="body">
        <strong>${p.name}</strong>
        <div class="meta">Ref. ${p.ref} · ${p.cat} · ${p.brand}</div>
        <div class="meta">${p.stock==='stock' ? 'En stock' : 'Bajo pedido'} · Garantía ${p.warranty}m</div>
        <div class="actions">
          <a class="btn btn-primary" target="_blank" rel="noopener" href="${waLink('Quiero cotizar: '+p.name+' ('+p.ref+')')}">Cotizar</a>
          <button class="btn btn-outline" data-open="${p.id}">Detalles</button>
          <button class="btn btn-outline" data-add="${p.id}">Agregar</button>
        </div>
      </div>
    </article>`).join('') : `<div class='empty'>No se encontraron resultados. Ajuste los filtros o el término de búsqueda.</div>`;
  $$('.product.reveal').forEach(el=>io.observe(el));
  $$('[data-open]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.getAttribute('data-open'))));
  $$('[data-add]').forEach(btn=>btn.addEventListener('click',async ()=>{
    const items = await fetchProducts(); const it = items.find(x=>String(x.id)===btn.getAttribute('data-add'));
    addToList({id:it.id,name:it.name,ref:it.ref}); alert('Agregado a la lista'); updateListBadge();
  }));
  // pager UI
  const pager = $('#pager'); if(pager){
    pager.innerHTML = Array.from({length:pages}, (_,i)=>`<button class="btn ${i+1===PAGE?'btn-primary':'btn-outline'}" data-page="${i+1}">${i+1}</button>`).join('');
    $$('[data-page]').forEach(b=> b.addEventListener('click',()=>{ PAGE=parseInt(b.getAttribute('data-page')); renderProducts(); window.scrollTo({top:0,behavior:'smooth'});}));
  }
}
document.addEventListener('DOMContentLoaded', updateListBadge);

// ================= MODAL SPECS + ADD BUTTON =================
async function openModal(id){
  const items = await fetchProducts();
  const item = items.find(p=>String(p.id)===String(id)); if(!item) return;
  $('#m-title').textContent=item.name; $('#m-ref').textContent=item.ref; $('#m-cat').textContent=item.cat;
  $('#m-img').setAttribute('src','assets/'+item.img);
  $('#m-wa').setAttribute('href',waLink('Quiero cotizar: '+item.name));
  $('#m-brand').textContent = item.brand || '-';
  $('#m-war').textContent = item.warranty || 0;
  $('#m-stock').textContent = item.stock==='stock' ? 'En stock' : 'Bajo pedido';
  $('#m-fit').textContent = (item.compat||[]).join(', ') || '—';
  $('#m-oem').textContent = (item.oem||[]).join(', ');
  const add = document.getElementById('m-add'); if(add){ add.onclick = ()=>{ addToList({id:item.id,name:item.name,ref:item.ref}); updateListBadge(); add.textContent='Agregado ✓'; setTimeout(()=>{ add.textContent='Agregar a lista'; },1200); }; }
  $('#modal').showModal();
}


// ================= LOCAL BOT (sin IA real) =================
const KB = [
  {k:['horario','abren','abierto','hora'], a:'Horario: L–V 08:00–17:00 y Sáb 09:00–16:00. Domingos cerrado.'},
  {k:['garantia','garantía','dev','cambio'], a:'Garantía: según pieza y fabricante (3 meses alternadores/arranques, 1 mes electrónicos). Requiere prueba de instalación.'},
  {k:['envio','delivery','entrega','domicilio','envíos'], a:'Entregas: en Ciudad de Panamá coordinamos motorizado. Al interior, envíos por paquetería.'},
  {k:['pago','pagar','metodo','método'], a:'Pagos: Yappy, ACH, transferencia bancaria y efectivo. Factura fiscal disponible.'},
  {k:['diagnostico','test','prueba','alternador','arranque'], a:'Realizamos pruebas de alternadores y arranques. Solicite cita para diagnóstico.'},
  {k:['cotizar','precio','disponible'], a:'Para cotizar indíquenos pieza, marca, modelo, año y motor. También puede usar el botón WhatsApp.'},
  {k:['direccion','ubicacion','cómo llegar','dónde están'], a:'Estamos en Vía España, Ciudad de Panamá. Ver mapa en Contacto.'},
  {k:['mayorista','taller','descuento'], a:'Atendemos talleres y distribuidores con precios preferentes.'},
];
function kbAnswer(q){
  const t = (q||'').toLowerCase();
  // simple matching by keywords
  for(const item of KB){
    if(item.k.some(k=> t.includes(k))) return item.a;
  }
  // fallback general
  return 'Puedo ayudar con disponibilidad, compatibilidad y garantías. Indique pieza y el vehículo (marca/modelo/año/motor).';
}


// ========== Catalog dynamic filters & events ==========
async function initCatalogFilters(){
  const brandSel = document.getElementById('brand'); if(!brandSel) return;
  const items = await fetchProducts();
  const brands = Array.from(new Set(items.map(i=>i.brand))).filter(Boolean).sort();
  brandSel.innerHTML = '<option value="Todas">Todas las marcas</option>' + brands.map(b=>`<option>${b}</option>`).join('');
  // Reset page on filter change
  ['q','cat','brand','stock','order'].forEach(id=>{
    const el = document.getElementById(id); if(!el) return;
    el.addEventListener('input', ()=>{ PAGE=1; renderProducts(); });
    el.addEventListener('change', ()=>{ PAGE=1; renderProducts(); });
  });
}
document.addEventListener('DOMContentLoaded', initCatalogFilters);


// ===== FAB stack (WhatsApp, Lista, Instagram) =====
document.addEventListener('DOMContentLoaded',()=>{
  if(!document.getElementById('fab-stack')){
    const stack = document.createElement('div'); stack.id='fab-stack';
    const wa = document.createElement('a'); wa.className='fab wa'; wa.href=waLink(); wa.target='_blank'; wa.rel='noopener'; wa.textContent='WhatsApp';
    const list = document.createElement('a'); list.className='fab list'; list.href='lista.html'; list.textContent='Lista ('+(getList().length||0)+')';
    const ig = document.createElement('a'); ig.className='fab ig'; ig.href=COMPANY.ig; ig.target='_blank'; ig.rel='noopener'; ig.textContent='Instagram';
    stack.appendChild(ig); stack.appendChild(list); stack.appendChild(wa);
    document.body.appendChild(stack);
  }
  // Inline links: if anchors .js-wa / .js-ig are not buttons, make them inline with icon + text
  document.querySelectorAll('.js-wa').forEach(a=>{
    const isButton = a.className.includes('btn');
    if(isButton){ a.classList.add('btn-wa'); if(!a.textContent.trim()) a.textContent='WhatsApp'; a.setAttribute('href', waLink()); }
    else { a.classList.add('wa-inline'); a.textContent = a.textContent.trim() || 'Abrir chat'; a.setAttribute('href', waLink()); }
  });
  document.querySelectorAll('.js-ig').forEach(a=>{
    const isButton = a.className.includes('btn');
    if(isButton){ a.classList.add('btn-ig'); if(!a.textContent.trim()) a.textContent='Instagram'; a.setAttribute('href', COMPANY.ig); a.target='_blank'; a.rel='noopener'; }
    else { a.classList.add('ig-inline'); a.textContent = a.textContent.trim() || 'Ver perfil'; a.setAttribute('href', COMPANY.ig); a.target='_blank'; a.rel='noopener'; }
  });
  // Update list badge in FAB when list changes
  window.addEventListener('storage', ()=>{
    const listBtn = document.querySelector('#fab-stack .list'); if(listBtn) listBtn.textContent='Lista ('+(getList().length||0)+')';
  });
});


// === Hero slider (Instagram) ===
document.addEventListener('DOMContentLoaded',()=>{
  const hs = document.querySelector('.hero-slider');
  if(hs){
    const imgs = hs.querySelectorAll('img');
    let i=0;
    function show(n){ imgs.forEach((im,ix)=> im.classList.toggle('active', ix===n)); }
    if(imgs.length){ show(0); setInterval(()=>{ i=(i+1)%imgs.length; show(i); }, 5000); }
  }
});

// === Chat assistant (scripted) ===
(function(){
  const root = document.getElementById('chatbox'); if(!root) return;
  const msgs = root.querySelector('#chat-msgs');
  const input = root.querySelector('#chat-input');
  const form = root.querySelector('#chat-form');
  root.querySelector('.chat-toggle').addEventListener('click',()=> root.classList.toggle('open'));
  root.querySelector('.chat-close').addEventListener('click',()=> root.classList.remove('open'));
  root.querySelectorAll('.chat-quick [data-q]').forEach(b=> b.addEventListener('click',()=>{
    input.value = b.getAttribute('data-q'); form.dispatchEvent(new Event('submit', {cancelable:true}));
  }));
  function push(role, text){
    const el = document.createElement('div'); el.className = 'msg ' + (role==='me'?'me':'bot');
    el.innerHTML = `<div class="b">${text}</div>`; msgs.appendChild(el); msgs.scrollTop = msgs.scrollHeight;
  }
  function answer(q){
    q=(q||'').toLowerCase();
    if(q.includes('whatsapp')||q.includes('contactar')){
      const links=[COMPANY.whatsapp, ...(COMPANY.whatsapp_alt||[])].map(n=>`<a href="${waLink('Hola, deseo cotizar.', n)}" target="_blank" rel="noopener">${n}</a>`).join(' · ');
      return `Escríbanos por WhatsApp: ${links}`;
    }
    if(q.includes('cotiz')) return `Para cotizar: pieza + marca/modelo/año/motor. También por <a href="${waLink('Hola, deseo cotizar.')}">WhatsApp</a>.`;
    if(q.includes('horario')||q.includes('ubic')) return `Horario: L–V 08:00–17:00 · Sáb 09:00–16:00 · Dom cerrado. Dirección: ${COMPANY.address}.`;
    if(q.includes('pago')||q.includes('método')) return `Pagos: Yappy, ACH/transferencia y efectivo. Factura fiscal.`;
    if(q.includes('correo')||q.includes('email')) return `Correo: <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>`;
    return `Indíquenos la pieza y el vehículo (marca/modelo/año/motor).`;
  }
  function greet(){ push('bot','¡Hola! Soy el asistente de IMPEL. ¿En qué le ayudo?'); }
  greet();
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const v=(input.value||'').trim(); if(!v) return;
    push('me', v); input.value=''; setTimeout(()=> push('bot', answer(v)), 250);
  });
})();

// Fill extra contact anchors
document.addEventListener('DOMContentLoaded', ()=>{
  const alt = (COMPANY.whatsapp_alt||[])[0];
  document.querySelectorAll('.js-email').forEach(a=>{ a.textContent = COMPANY.email; a.href = 'mailto:'+COMPANY.email; });
  document.querySelectorAll('.js-wa-alt').forEach(a=>{ if(alt){ a.href = waLink('Hola, deseo cotizar.', alt); a.textContent = alt; } else { a.style.display='none'; } });
});

// JS para seguir el mouse
const cursor = document.querySelector('.custom-cursor');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

// Hacerlo “grande” al pasar sobre botones
document.querySelectorAll('a, .btn').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '40px';
    cursor.style.height = '40px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '24px';
    cursor.style.height = '24px';
  });
});

function actualizarEstado() {
  const elemento = document.getElementById("open-status");
  if (!elemento) return;

  const ahora = new Date();
  const opcionesHora = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const horaFormateada = ahora.toLocaleTimeString("es-PA", opcionesHora);

  const hora = ahora.getHours();
  const dia = ahora.getDay(); // 0=domingo, 6=sábado

  let abierto = false;
  let texto = "";
  let color = "";

  if (dia >= 1 && dia <= 5) {
    abierto = hora >= 8 && hora < 17;
  } else if (dia === 6) {
    abierto = hora >= 8 && hora < 15;
  } else if (dia === 0) {
    texto = "Domingo cerrado";
    color = "#aaa";
  }

  if (dia !== 0) {
    if (abierto) {
      texto = `Abierto · ${horaFormateada} (PA)`;
      color = "#22c55e"; // verde
    } else {
      texto = `Cerrado · ${horaFormateada} (PA)`;
      color = "#ef4444"; // rojo
    }
  }

  elemento.textContent = texto;
  elemento.style.color = color;
}

// Actualiza al cargar y cada minuto
actualizarEstado();
setInterval(actualizarEstado, 60000);

document.getElementById('open-status')

// Icono de reloj + texto dinámico (mejorado)
const icono = `<span class="material-symbols-outlined" style="font-size:26px;vertical-align:middle;margin-right:8px;">schedule</span>`;
if (abierto) {
  elemento.innerHTML = `
    ${icono}
    <span style="
      color:#16a34a;
      font-weight:700;
      font-size:1.4rem;
      letter-spacing:0.5px;
      text-shadow:0 1px 2px rgba(0,0,0,0.15);
    ">
      ABIERTO
    </span>`;
} else {
  elemento.innerHTML = `
    ${icono}
    <span style="
      color:#dc2626;
      font-weight:700;
      font-size:1.4rem;
      letter-spacing:0.5px;
      text-shadow:0 1px 2px rgba(0,0,0,0.15);
    ">
      CERRADO
    </span>`;
}

