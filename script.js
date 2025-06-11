'use strict';

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form-contacto');
    const datosFormulario = document.getElementById('datos-formulario');
    const datosLista = document.getElementById('datos-lista');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.email.value;
            const motivo = this.motivo.value;

            fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, motivo })
            })
            .then(response => response.json())
            .then(data => {
                datosLista.innerHTML = `
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Motivo:</strong> ${motivo}</li>
                    <li><strong>Respuesta POST (id):</strong> ${data.id}</li>
                `;
                datosFormulario.classList.remove('hidden');
                form.reset();
            })
            .catch(() => {
                datosLista.innerHTML = `<li>Error al enviar los datos.</li>`;
                datosFormulario.classList.remove('hidden');
            });
        });
    }

    fetch('https://jsonplaceholder.typicode.com/posts/1')
        .then(response => response.json())
        .then(data => {
            console.log('GET ejemplo:', data);
        });
});