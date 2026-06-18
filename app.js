const firebaseConfig = {
  apiKey: "AIzaSyCguT78pwogNRFRRrsaEqsV1GOlIRSOEvc",
  authDomain: "linea-tiempo-mascaras.firebaseapp.com",
  projectId: "linea-tiempo-mascaras",
  storageBucket: "linea-tiempo-mascaras.firebasestorage.app",
  messagingSenderId: "323404903768",
  appId: "1:323404903768:web:8cd820b7a95e6f0bca612d"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("¡Conexión con Firebase establecida correctamente!");

// CONTRASEÑA DE LA CAMPAÑA
const CONTRASEÑA_CORRECTA = "Cthulhu2026"; 

const contenedorLinea = document.getElementById("contenedor-linea");
let añoActualGlobal = "";
let eventosCargadosGlobal = []; 
let eventoSeleccionadoId = null; 
let modoEdicion = false;
let eventoEdicionId = null;

// --- COMPROBAR SI LA SESIÓN YA TIENE EL TOKEN CORRECTO ---
function comprobarSesionGuardada() {
    return sessionStorage.getItem("clave_campaña") === CONTRASEÑA_CORRECTA;
}

// --- RENDERIZAR LA LÍNEA DE TIEMPO ---
function renderizarLineaDeTiempo(eventos) {
    contenedorLinea.innerHTML = '<div class="linea-vertical"></div>'; 
    eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    let ultimoAño = null;
    let ultimoMes = null;
    let ultimaFecha = null;

    eventos.forEach((evento, index) => {
        const fechaActual = new Date(evento.fecha);
        const añoActual = fechaActual.getFullYear();
        const mesActual = fechaActual.toLocaleDateString('es-ES', { month: 'long' });

        let diferenciaDias = 0;
        if (index > 0 && ultimaFecha) {
            diferenciaDias = Math.floor((fechaActual - ultimaFecha) / (1000 * 60 * 60 * 24));
        }

        // 1. PRIMERO: Si hay un salto de más de 30 días, se pone el cartel inmediatamente después de la tarjeta anterior
        if (diferenciaDias > 30) {
            const elementoSalto = document.createElement("div");
            elementoSalto.classList.add("salto-temporal");
            const meses = Math.floor(diferenciaDias / 30);
            elementoSalto.innerHTML = `<span>⏳ Salto de ${meses} ${meses === 1 ? 'mes' : 'meses'} ⏳</span>`;
            contenedorLinea.appendChild(elementoSalto);
        }

        // 2. SEGUNDO: Si cambia el mes o el año, pintamos la línea y el nombre del nuevo mes
        if (mesActual !== ultimoMes || añoActual !== ultimoAño) {
            const separador = document.createElement("div");
            separador.classList.add('separador-mes');
            separador.innerHTML = `<span class="mes-texto">${mesActual}</span><div class="mes-linea"></div>`;
            contenedorLinea.appendChild(separador);
            ultimoMes = mesActual;
            ultimoAño = añoActual;
        }

        // 3. TERCERO: Creamos el bloque de la tarjeta
        const bloque = document.createElement("div");
        bloque.classList.add('evento-bloque');
        bloque.dataset.anio = añoActual;

        const descripcionCorta = evento.descripcion.length > 140 
            ? evento.descripcion.substring(0, 140) + "..." 
            : evento.descripcion;

        bloque.innerHTML = `
            <div class="nodo-circulo"></div>
            <div class="tarjeta-evento" data-id="${evento.id}" style="cursor: pointer;">
                <span class="evento-fecha">${evento.fecha}</span>
                <h3>${evento.titulo}</h3>
                <p>${descripcionCorta}</p>
                <small class="evento-localizacion">📍 ${evento.localizacion}</small>
            </div>
        `;

        // 4. CUARTO: Aplicamos un margen súper compacto proporcional al tiempo
        if (index > 0) {
            if (diferenciaDias > 30) {
                // Margen muy pequeño si acaba de haber un cartel de salto
                bloque.style.marginTop = "8px";
            } else {
                // Distancia proporcional ultra compacta (solo 0.6px por día) + un mínimo de 4px
                bloque.style.marginTop = `${4 + (diferenciaDias * 0.6)}px`;
            }
        }

        contenedorLinea.appendChild(bloque);
        ultimaFecha = fechaActual;
    });

    actualizarEfectoCilindro();
}

// --- EFECTO CILINDRO ---
function actualizarEfectoCilindro() {
    const centroPantalla = window.innerHeight / 2;
    const bloques = document.querySelectorAll('.evento-bloque');
    const divAño = document.getElementById("año-flotante");
    
    let bloqueMasCercano = null;
    let distanciaMinima = Infinity;

    bloques.forEach(bloque => {
        const rect = bloque.getBoundingClientRect();
        const centroBloque = rect.top + (rect.height / 2);
        const distanciaAlCentro = Math.abs(centroPantalla - centroBloque);
        
        if (distanciaAlCentro < distanciaMinima) {
            distanciaMinima = distanciaAlCentro;
            bloqueMasCercano = bloque;
        }

        const radioEfecto = 400;
        let factor = 1 - (distanciaAlCentro / radioEfecto);
        if (factor < 0) factor = 0;
        
        bloque.style.transform = `scale(${0.4 + (factor * 0.7)})`;
        bloque.style.opacity = 0.15 + (factor * 0.85);
    });

    if (bloqueMasCercano && divAño) {
        const añoBloque = bloqueMasCercano.dataset.anio;
        if (añoBloque !== añoActualGlobal) {
            añoActualGlobal = añoBloque;
            divAño.classList.add("año-cambiando");
            setTimeout(() => {
                divAño.innerText = añoActualGlobal;
                divAño.classList.remove("año-cambiando");
            }, 150);
        }
    }
}

// --- ESCUCHA EN TIEMPO REAL ---
db.collection("eventos").onSnapshot((snapshot) => {
    const listaEventos = [];
    snapshot.forEach((doc) => { listaEventos.push({ id: doc.id, ...doc.data() }); });
    eventosCargadosGlobal = listaEventos;
    renderizarLineaDeTiempo(listaEventos);
});

window.addEventListener('scroll', actualizarEfectoCilindro);

// --- MODALES ---
const modalFormulario = document.getElementById("modal-formulario");
const modalMaxi = document.getElementById("modal-tarjeta-maxi");
const btnAñadir = document.getElementById("btn-añadir");
const btnCerrarModal = document.querySelector(".cerrar-modal");
const btnCerrarMaxi = document.querySelector(".cerrar-modal-maxi");
const formularioEvento = document.getElementById("formulario-evento");

function abrirModalConEfecto(modal) {
    modal.style.display = "flex";
    setTimeout(() => { modal.classList.add("mostrar-modal"); }, 10);
}
function cerrarModalConEfecto(modal) {
    modal.classList.remove("mostrar-modal");
    setTimeout(() => { modal.style.display = "none"; }, 350);
}

// --- CLICK MINI -> ABRIR MAXI ---
contenedorLinea.addEventListener("click", (e) => {
    const tarjeta = e.target.closest(".tarjeta-evento");
    if (!tarjeta) return;

    const evento = eventosCargadosGlobal.find(ev => ev.id === tarjeta.dataset.id);
    if (evento) {
        eventoSeleccionadoId = evento.id;
        document.getElementById("maxi-fecha").innerText = evento.fecha;
        document.getElementById("maxi-localizacion").innerText = `📍 ${evento.localizacion}`;
        document.getElementById("maxi-titulo").innerText = evento.titulo;
        document.getElementById("maxi-descripcion").innerText = evento.descripcion;

        const contPnjs = document.getElementById("maxi-pnjs");
        contPnjs.innerHTML = "";
        if (evento.pnjs && evento.pnjs.length > 0 && evento.pnjs[0] !== "") {
            evento.pnjs.forEach(pnj => { contPnjs.innerHTML += `<span class="tag-pnj">${pnj}</span>`; });
        } else { contPnjs.innerHTML = "<span style='color:#555; font-size:0.85rem;'>Ninguno</span>"; }

        const contEti = document.getElementById("maxi-etiquetas");
        contEti.innerHTML = "";
        if (evento.etiquetas && evento.etiquetas.length > 0 && evento.etiquetas[0] !== "") {
            evento.etiquetas.forEach(eti => { contEti.innerHTML += `<span class="tag-etiqueta">${eti}</span>`; });
        } else { contEti.innerHTML = "<span style='color:#555; font-size:0.85rem;'>Ninguna</span>"; }

        abrirModalConEfecto(modalMaxi);
    }
});

// --- GUARDAR FORMULARIO (CREAR O EDITAR) ---
if (formularioEvento) {
    formularioEvento.addEventListener("submit", (e) => {
        e.preventDefault();

        let tokenClave = "";
        
        // Si ya está validado, usamos el token guardado. Si no, leemos el campo de texto.
        if (comprobarSesionGuardada()) {
            tokenClave = CONTRASEÑA_CORRECTA;
        } else {
            const pswInput = document.getElementById("form-password").value;
            if (pswInput === CONTRASEÑA_CORRECTA) {
                sessionStorage.setItem("clave_campaña", CONTRASEÑA_CORRECTA);
                tokenClave = CONTRASEÑA_CORRECTA;
            } else {
                alert("❌ Contraseña incorrecta. No tienes permisos para modificar la base de datos.");
                return;
            }
        }

        const datosEvento = {
            fecha: document.getElementById("form-fecha").value,
            titulo: document.getElementById("form-titulo").value,
            localizacion: document.getElementById("form-ciudad").value,
            descripcion: document.getElementById("form-descripcion").value,
            pnjs: document.getElementById("form-pnjs").value ? document.getElementById("form-pnjs").value.split(",").map(p => p.trim()) : [],
            etiquetas: document.getElementById("form-etiquetas").value ? document.getElementById("form-etiquetas").value.split(",").map(e => e.trim()) : [],
            claveSecreta: tokenClave
        };

        if (modoEdicion && eventoEdicionId) {
            db.collection("eventos").doc(eventoEdicionId).update(datosEvento)
                .then(() => {
                    db.collection("eventos").doc(eventoEdicionId).update({ claveSecreta: firebase.firestore.FieldValue.delete() });
                    cerrarModalConEfecto(modalFormulario);
                    reestablecerFormulario();
                }).catch(() => alert("❌ Error de permisos en Firebase."));
        } else {
            db.collection("eventos").add(datosEvento)
                .then((docRef) => {
                    db.collection("eventos").doc(docRef.id).update({ claveSecreta: firebase.firestore.FieldValue.delete() });
                    cerrarModalConEfecto(modalFormulario);
                    reestablecerFormulario();
                }).catch(() => alert("❌ Error de permisos en Firebase."));
        }
    });
}

// --- MODIFICAR ---
document.getElementById("btn-modificar-evento").addEventListener("click", () => {
    const evento = eventosCargadosGlobal.find(ev => ev.id === eventoSeleccionadoId);
    if (!evento) return;

    modoEdicion = true;
    eventoEdicionId = eventoSeleccionadoId;

    document.getElementById("form-fecha").value = evento.fecha;
    document.getElementById("form-titulo").value = evento.titulo;
    document.getElementById("form-ciudad").value = evento.localizacion;
    document.getElementById("form-descripcion").value = evento.descripcion;
    document.getElementById("form-pnjs").value = evento.pnjs ? evento.pnjs.join(", ") : "";
    document.getElementById("form-etiquetas").value = evento.etiquetas ? evento.etiquetas.join(", ") : "";

    modalFormulario.querySelector("h2").innerText = "Editar Evento de Campaña";
    modalFormulario.querySelector(".btn-guardar").innerText = "Actualizar Cambios";

    // Si ya estamos autenticados, ocultamos el input de contraseña del formulario
    const capaPas = document.querySelector(".seccion-password-web");
    if (comprobarSesionGuardada() && capaPas) {
        capaPas.style.display = "none";
        document.getElementById("form-password").removeAttribute("required");
    } else if (capaPas) {
        capaPas.style.display = "flex";
        document.getElementById("form-password").setAttribute("required", "true");
    }

    cerrarModalConEfecto(modalMaxi);
    setTimeout(() => { abrirModalConEfecto(modalFormulario); }, 350);
});

// --- BORRAR ---
document.getElementById("btn-eliminar-evento").addEventListener("click", () => {
    const evento = eventosCargadosGlobal.find(ev => ev.id === eventoSeleccionadoId);
    
    // Si no está autenticado, le obligamos a abrir modificar una vez para meter la contraseña
    if (!comprobarSesionGuardada()) {
        alert("🔒 Por seguridad en móviles, para borrar primero necesitas validar la contraseña. Haz clic en '✏️ Modificar' e introdúcela una vez.");
        return;
    }

    if (confirm(`¿Seguro que quieres eliminar definitivamente: "${evento.titulo}"?`)) {
        db.collection("eventos").doc(eventoSeleccionadoId).delete()
            .then(() => {
                cerrarModalConEfecto(modalMaxi);
                eventoSeleccionadoId = null;
            }).catch(() => alert("No se pudo borrar. Error de autenticación."));
    }
});

function reestablecerFormulario() {
    formularioEvento.reset();
    modoEdicion = false;
    eventoEdicionId = null;
    modalFormulario.querySelector("h2").innerText = "Nuevo Evento";
    modalFormulario.querySelector(".btn-guardar").innerText = "Guardar Evento";
    
    const capaPas = document.querySelector(".seccion-password-web");
    if (comprobarSesionGuardada() && capaPas) {
        capaPas.style.display = "none";
        document.getElementById("form-password").removeAttribute("required");
    } else if (capaPas) {
        capaPas.style.display = "flex";
        document.getElementById("form-password").setAttribute("required", "true");
    }
    // Forzar a que vuelva a ser de tipo password al resetear el formulario
    if (inputPassword) inputPassword.type = "password";
    if (btnVerPassword) btnVerPassword.innerText = "👁️";
}

// --- BUSCADOR EN TIEMPO REAL ---
const btnBuscar = document.getElementById("btn-buscar");
const contenedorBuscador = document.querySelector(".contenedor-buscador");
const inputBusqueda = document.getElementById("input-busqueda");

btnBuscar.addEventListener("click", (e) => {
    e.stopPropagation();
    contenedorBuscador.classList.toggle("activo");
    if (contenedorBuscador.classList.contains("activo")) { inputBusqueda.focus(); } 
    else { inputBusqueda.value = ""; renderizarLineaDeTiempo(eventosCargadosGlobal); }
});
contenedorBuscador.addEventListener("click", (e) => e.stopPropagation());
window.addEventListener("click", () => {
    if (contenedorBuscador.classList.contains("activo") && inputBusqueda.value.trim() === "") { contenedorBuscador.classList.remove("activo"); }
});

inputBusqueda.addEventListener("input", (e) => {
    const txt = e.target.value.toLowerCase().trim();
    if (txt === "") { renderizarLineaDeTiempo(eventosCargadosGlobal); return; }
    const filtrados = eventosCargadosGlobal.filter(ev => {
        return (ev.titulo && ev.titulo.toLowerCase().includes(txt)) ||
               (ev.localizacion && ev.localizacion.toLowerCase().includes(txt)) ||
               (ev.descripcion && ev.descripcion.toLowerCase().includes(txt)) ||
               (ev.pnjs && ev.pnjs.some(p => p.toLowerCase().includes(txt))) ||
               (ev.etiquetas && ev.etiquetas.some(eti => eti.toLowerCase().includes(txt)));
    });
    renderizarLineaDeTiempo(filtrados);
});

// --- EVENTOS DE CIERRE ---
btnAñadir.addEventListener("click", () => { reestablecerFormulario(); abrirModalConEfecto(modalFormulario); });
btnCerrarModal.addEventListener("click", () => { cerrarModalConEfecto(modalFormulario); });
btnCerrarMaxi.addEventListener("click", () => { cerrarModalConEfecto(modalMaxi); });
window.addEventListener("click", (e) => {
    if (e.target === modalFormulario) { cerrarModalConEfecto(modalFormulario); }
    if (e.target === modalMaxi) { cerrarModalConEfecto(modalMaxi); }
});

// --- MOSTRAR / OCULTAR CONTRASEÑA ---
const btnVerPassword = document.getElementById("btn-ver-password");
const inputPassword = document.getElementById("form-password");

if (btnVerPassword && inputPassword) {
    btnVerPassword.addEventListener("click", () => {
        // Si es de tipo password, lo pasamos a texto, y viceversa
        if (inputPassword.type === "password") {
            inputPassword.type = "text";
            btnVerPassword.innerText = "🔒"; // Cambia el icono a un candado para ocultar
            btnVerPassword.title = "Ocultar contraseña";
        } else {
            inputPassword.type = "password";
            btnVerPassword.innerText = "👁️"; // Vuelve al ojo para mostrar
            btnVerPassword.title = "Mostrar contraseña";
        }
    });
}