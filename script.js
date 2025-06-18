// script.js
// --------------
// Si lo incluyes en <script> pon type="module":
// <script type="module" src="script.js"></script>

import { bookSlot, getSlots } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  loadAndRenderEvents();
});

function initContactForm() {
  const form = document.getElementById('form-contacto');
  const datosFormulario = document.getElementById('datos-formulario');
  const datosLista = document.getElementById('datos-lista');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.email.value;
    const motivo = form.motivo.value;
    fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, motivo })
    })
    .then(r=>r.json())
    .then(data=>{
      datosLista.innerHTML = `
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Motivo:</strong> ${motivo}</li>
        <li><strong>Respuesta POST (id):</strong> ${data.id}</li>
      `;
      datosFormulario.classList.remove('hidden');
      form.reset();
    })
    .catch(()=>{
      datosLista.innerHTML = `<li>Error al enviar los datos.</li>`;
      datosFormulario.classList.remove('hidden');
    });
  });
}

async function loadAndRenderEvents() {
  // 1) Traer eventos del backend
  let events = [];
  try {
    const res = await fetch('/events', { credentials: 'include' });
    events = await res.json();
  } catch (err) {
    console.error('No pude cargar eventos:', err);
    return;
  }

  // 2) Renderizar cada evento en el DOM
  const container = document.getElementById('events-container');
  if (!container) {
    console.warn('No encontré #events-container para pegar los eventos');
    return;
  }
  container.innerHTML = ''; // limpio

  events.forEach(evt => {
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-lg shadow flex flex-col gap-2';
    card.innerHTML = `
      <h3 class="font-bold text-lg">${evt.nombre}</h3>
      <p class="text-sm text-gray-600">${evt.descripcion}</p>
      <div class="flex gap-2">
        <select id="horario-${evt.id}" class="flex-1 form-select">
          ${evt.horarios.map(h=>`<option value="${h}">${h}</option>`).join('')}
        </select>
        <select id="rol-${evt.id}" class="flex-1 form-select">
          ${evt.roles.map(r=>`<option value="${r}">${r}</option>`).join('')}
        </select>
      </div>
      <button data-id="${evt.id}" class="btn-reservar mt-2 bg-blue-500 text-white py-1 rounded">
        Reservar turno
      </button>
      <ul id="slots-${evt.id}" class="mt-2 text-xs text-gray-700"></ul>
    `;
    container.appendChild(card);

    // 3) Traer slots ya reservados de Firebase y mostrarlos
    getSlots(evt.id).then(slots => {
      const ul = document.getElementById(`slots-${evt.id}`);
      ul.innerHTML = Object.values(slots).map(s=>
        `<li>${s.horario} – ${s.rol} (mtr: ${s.matricula})</li>`
      ).join('');
    });
  });

  // 4) Agregar listener a cada botón de “Reservar turno”
  container.querySelectorAll('.btn-reservar').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const horario = document.getElementById(`horario-${id}`).value;
      const rol = document.getElementById(`rol-${id}`).value;

      // 4.1) Registra en tu backend
      await fetch(`/events/${id}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ horario, rol })
      });

      // 4.2) Guarda en Firebase
      // Aquí necesitas la matrícula/rol del user: la puedes obtener con un fetch a /profile
      const perfil = await fetch('/profile', { credentials: 'include' })
                        .then(r=>r.json());
      await bookSlot(id, perfil.usuario.matricula, rol, horario);

      // 4.3) Actualiza la lista de slots en pantalla
      const ul = document.getElementById(`slots-${id}`);
      ul.innerHTML += `<li>${horario} – ${rol} (mtr: ${perfil.usuario.matricula})</li>`;

      alert('Turno reservado con éxito');
    });
  });
}