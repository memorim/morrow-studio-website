const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-category]');

function showCategory() {
  const value = new URL(location.href).searchParams.get('category');
  const category = [...filters].some(item => item.dataset.filter === value) ? value : 'all';
  for (const button of filters) {
    button.classList.toggle('active', button.dataset.filter === category);
    button.setAttribute('aria-pressed', String(button.dataset.filter === category));
  }
  projects.forEach(project => project.classList.toggle('hidden', category !== 'all' && project.dataset.category !== category));
}
document.querySelector('.filters').addEventListener('submit', event => {
  event.preventDefault();
  const url = new URL(location.href);
  url.searchParams.set('category', event.submitter.value);
  url.hash = 'work';
  history.pushState(null, '', url);
  showCategory();
});
window.addEventListener('popstate', showCategory);
showCategory();

const form = document.querySelector('#contact-form');
const status = form.querySelector('.form-status');
let submission;
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  for (const key of Object.keys(data)) data[key] = data[key].trim();
  if(data.name.length<2||data.message.length<5){status.textContent='Введите имя и краткое описание задачи.';return;}
  const payload = JSON.stringify(data);
  if (submission?.payload !== payload) submission = {payload, id: crypto.randomUUID()};
  const button = form.querySelector('button');
  if (button.disabled) return;
  button.disabled = true;
  status.textContent = 'Отправляем заявку…';
  try {
    const base = location.hostname === 'memorim.github.io' ? 'https://memorim-morrow.onrender.com' : '';
    const response = await fetch(base + '/api/inquiries', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({...data, id:submission.id}),
    });
    const result = await response.json();
    if (!response.ok || result.id !== submission.id) throw new Error(result.error || 'Повторите отправку.');
    status.textContent = `Спасибо, ${data.name}. Заявка принята.`;
    if (Object.entries(data).every(([key,value]) => form.elements[key].value.trim() === value)) form.reset();
    submission = null;
  } catch (error) {
    status.textContent = 'Не удалось сохранить заявку. ' + (error.message || 'Повторите отправку.');
  } finally { button.disabled = false; }
});

const cursor = document.querySelector('.cursor-dot');
if (matchMedia('(pointer: fine)').matches) {
  document.addEventListener('mousemove', (event) => {
    cursor.style.opacity = '1';
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('revealed');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.project, .service-list article').forEach((item) => observer.observe(item));


const menuButton=document.querySelector('.menu-button');
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('header nav').classList.contains('mobile-open')){menuButton.click();menuButton.focus();}});
menuButton.addEventListener('click',()=>{const open=document.querySelector('header nav').classList.toggle('mobile-open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
document.querySelectorAll('header nav a').forEach(a=>a.addEventListener('click',()=>{document.querySelector('header nav').classList.remove('mobile-open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');}));
const caseDialog=document.createElement('dialog');caseDialog.className='case-dialog';caseDialog.setAttribute('aria-labelledby','case-title');caseDialog.innerHTML='<button type="button" aria-label="Закрыть описание">×</button><h2 id="case-title"></h2><p></p><small>Визуальная концепция проекта.</small>';document.body.append(caseDialog);caseDialog.querySelector('button').onclick=()=>caseDialog.close();
document.querySelectorAll('a[href^="#case-"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();caseDialog.querySelector('h2').textContent=a.querySelector('h3')?.textContent||'Концепция';caseDialog.querySelector('p').textContent=a.querySelector('p')?.textContent||'';caseDialog.showModal();}));
