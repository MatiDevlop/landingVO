// script.js
import { bookSlot, getSlots } from './firebase.js';

const API = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  checkAdminCreateForm();
  loadAllEvents();
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

function checkAdminCreateForm() {
  const adminDiv = document.getElementById('admin-create-event');
  const formCreate = document.getElementById('form-create-event');
  if (!adminDiv || !formCreate) return;

  // 1) Mostrar el formulario de creación solo si eres Presidenta/Vice
  fetch(`${API}/profile`, { credentials: 'include' })
    .then(r => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then(({ usuario }) => {
      if (['Presidenta','Vicepresidente'].includes(usuario.rol)) {
        adminDiv.classList.remove('hidden');
      }
    })
    .catch(() => {/* no mostrar el form */});

  // 2) Hook de envío para crear eventos
  formCreate.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(formCreate);
    const payload = {
      nombre: fd.get('nombre'),
      descripcion: fd.get('descripcion'),
      horarios: fd.get('horarios').split(',').map(x => x.trim()),
      roles:    fd.get('roles').split(',').map(x => x.trim())
    };

    fetch(`${API}/events`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => {
      if (!r.ok) throw new Error('No autorizado o datos inválidos');
      return r.json();
    })
    .then(() => {
      formCreate.reset();
      loadAllEvents();
    })
    .catch(err => {
      alert(err.message || 'Error al crear evento');
    });
  });
}

async function loadAllEvents() {
  let events = [];
  try {
    const res = await fetch(`${API}/events`, { credentials: 'include' });
    events = await res.json();
  } catch (err) {
    console.error('Error cargando eventos:', err);
  }

  renderEventsList(events);
  renderReservationUI(events);
}

function renderEventsList(events) {
  const eventsList = document.getElementById('events-list');
  if (!eventsList) return;
  eventsList.innerHTML = '';

  if (!events.length) {
    eventsList.innerHTML = '<p>No hay eventos aún.</p>';
    return;
  }

  events.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'p-4 border rounded shadow mb-4';
    const hrs = ev.horarios.map(h => `<li>${h}</li>`).join('');
    const roles = ev.roles.map(r => `<li>${r}</li>`).join('');
    card.innerHTML = `
      <h4 class="font-bold text-lg">${ev.nombre}</h4>
      <p class="text-sm mb-2">${ev.descripcion}</p>
      <div class="flex gap-6">
        <div>
          <strong>Horarios:</strong>
          <ul class="list-disc list-inside text-sm">${hrs}</ul>
        </div>
        <div>
          <strong>Roles:</strong>
          <ul class="list-disc list-inside text-sm">${roles}</ul>
        </div>
      </div>
    `;
    eventsList.appendChild(card);
  });
}

function renderReservationUI(events) {
  const container = document.getElementById('events-container');
  if (!container) return;
  container.innerHTML = '';

  if (!events.length) {
    container.innerHTML = '<p>No hay eventos aún.</p>';
    return;
  }

  events.forEach(evt => {
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-lg shadow flex flex-col gap-2 mb-6';
    card.innerHTML = `
      <h3 class="font-bold text-lg">${evt.nombre}</h3>
      <p class="text-sm text-gray-600">${evt.descripcion}</p>
      <div class="flex gap-2">
        <select id="horario-${evt.id}" class="flex-1 form-select">
          ${evt.horarios.map(h => `<option value="${h}">${h}</option>`).join('')}
        </select>
        <select id="rol-${evt.id}" class="flex-1 form-select">
          ${evt.roles.map(r => `<option value="${r}">${r}</option>`).join('')}
        </select>
      </div>
      <button data-id="${evt.id}" class="btn-reservar mt-2 bg-blue-500 text-white py-1 rounded">
        Reservar turno
      </button>
      <ul id="slots-${evt.id}" class="mt-2 text-xs text-gray-700"></ul>
    `;
    container.appendChild(card);

    // pinta los slots ya tomados
    getSlots(evt.id).then(slots => {
      const ul = document.getElementById(`slots-${evt.id}`);
      ul.innerHTML = Object.values(slots || {})
        .map(s => `<li>${s.horario} – ${s.rol} (mtr: ${s.matricula})</li>`)
        .join('');
    });
  });

  // engancha los botones de reserva
  container.querySelectorAll('.btn-reservar').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      const horario = document.getElementById(`horario-${id}`).value;
      const rol      = document.getElementById(`rol-${id}`).value;

      // 1) registra en tu backend
      await fetch(`${API}/events/${id}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ horario, rol })
      });

      // 2) trae tu perfil y guarda en Firebase
      const perfil = await fetch(`${API}/profile`, { credentials:'include' })
                          .then(r => r.json());
      await bookSlot(id, perfil.usuario.matricula, rol, horario);

      // 3) actualiza la lista en pantalla
      const ul = document.getElementById(`slots-${id}`);
      ul.innerHTML += `<li>${horario} – ${rol} (mtr: ${perfil.usuario.matricula})</li>`;

      alert('Turno reservado con éxito');
    });
  });
}