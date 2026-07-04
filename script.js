const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-category]');

filters.forEach((button) => {
  button.addEventListener('click', () => {
    filters.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
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
  status.textContent = `Спасибо, ${name}. Мы ответим в течение рабочего дня.`;
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

