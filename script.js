const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-category]');

filters.forEach((button) => {
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  button.addEventListener('click', () => {
    filters.forEach((item) => {item.classList.remove('active');item.setAttribute('aria-pressed','false');});
    button.classList.add('active');
    button.setAttribute('aria-pressed','true');
    projects.forEach((project) => {
      const visible = button.dataset.filter === 'all' || project.dataset.category === button.dataset.filter;
      project.classList.toggle('hidden', !visible);
    });
  });
});

const form = document.querySelector('#contact-form');
const status = form.querySelector('.form-status');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = new FormData(form).get('name').trim();
  if(name.length<2||new FormData(form).get('message').trim().length<5){status.textContent='Введите имя и краткое описание задачи.';return;}
  status.textContent = `Спасибо, ${name}. Это демонстрационная форма: данные не отправлены.`;
  form.reset();
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
