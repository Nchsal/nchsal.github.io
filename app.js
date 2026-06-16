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

const contenedorLinea = document.getElementById("contenedor-linea");
let añoActualGlobal = "";
let eventosCargadosGlobal = []; // Copia local para abrir la tarjeta Maxi sin consultar de nuevo a internet
let eventoSeleccionadoId = null; // Guardará el ID del documento activo

function renderizarLineaDeTiempo(eventos) {
    contenedorLinea.innerHTML = '<div class="linea-vertical"></div>'; 

    // Ordenar cronológicamente
    eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    let ultimoAño = null;
    let ultimoMes = null;
    let ultimaFecha = null;

    eventos.forEach((evento, index) => {
        const fechaActual = new Date(evento.fecha);
        const añoActual = fechaActual.getFullYear();
        const mesActual = fechaActual.toLocaleDateString('es-ES', { month: 'long' });

        // Separador de meses
        if (mesActual !== ultimoMes || añoActual !== ultimoAño) {
            const separador = document.createElement("div");
            separador.classList.add('separador-mes');
            separador.innerHTML = `
                <span class="mes-texto">${mesActual}</span>
                <div class="mes-linea"></div>
            `;
            contenedorLinea.appendChild(separador);
            ultimoMes = mesActual;
            ultimoAño = añoActual;
        }

        // Crear tarjeta de evento (Se añade data-id y resumen recortado)
        const bloque = document.createElement("div");
        bloque.classList.add('evento-bloque');
        bloque.dataset.anio = añoActual;

        // Si la descripción es muy larga, la recortamos para la minitarjeta
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

        // Distancia temporal
        if (index > 0 && ultimaFecha) {
            const diferenciaTiempo = fechaActual - ultimaFecha;
            const diferenciaDias = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));
            const margenExtra = Math.min(diferenciaDias * 1.5, 200);
            bloque.style.marginTop = `${margenExtra}px`;
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
        if (factor > 1) factor = 1;
        
        const escala = 0.4 + (factor * 0.7);
        const opacidad = 0.15 + (factor * 0.85);
        
        bloque.style.transform = `scale(${escala})`;
        bloque.style.opacity = opacidad;
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

// --- ESCUCHA DE FIREBASE EN TIEMPO REAL ---
db.collection("eventos")
  .onSnapshot((snapshot) => {
    const listaEventos = [];
    snapshot.forEach((doc) => {
        listaEventos.push({ id: doc.id, ...doc.data() });
    });
    eventosCargadosGlobal = listaEventos; // Guardamos copia en memoria local
    console.log("Datos actualizados:", listaEventos);
    renderizarLineaDeTiempo(listaEventos);
  }, (error) => {
    console.error("Error en Firestore: ", error);
  });

window.addEventListener('scroll', actualizarEfectoCilindro);

// --- MODAL DEL FORMULARIO DE INSERCIÓN ---
const modalFormulario = document.getElementById("modal-formulario");
const btnAñadir = document.getElementById("btn-añadir");
const btnCerrarModal = document.querySelector(".cerrar-modal");
const formularioEvento = document.getElementById("formulario-evento");

if (btnAñadir) {
    btnAñadir.addEventListener("click", () => { modalFormulario.style.display = "flex"; });
}
if (btnCerrarModal) {
    btnCerrarModal.addEventListener("click", () => { modalFormulario.style.display = "none"; formularioEvento.reset(); });
}

// Guardar desde el formulario web hacia Firebase
if (formularioEvento) {
    formularioEvento.addEventListener("submit", (e) => {
        e.preventDefault();
        const nuevoEvento = {
            fecha: document.getElementById("form-fecha").value,
            titulo: document.getElementById("form-titulo").value,
            localizacion: document.getElementById("form-ciudad").value,
            descripcion: document.getElementById("form-descripcion").value,
            pnjs: document.getElementById("form-pnjs").value ? document.getElementById("form-pnjs").value.split(",").map(p => p.trim()) : [],
            etiquetas: document.getElementById("form-etiquetas").value ? document.getElementById("form-etiquetas").value.split(",").map(e => e.trim()) : []
        };

        db.collection("eventos").add(nuevoEvento)
            .then(() => {
                modalFormulario.style.display = "none";
                formularioEvento.reset();
            })
            .catch(err => console.error("Error al guardar:", err));
    });
}

// ==========================================================================
// --- LÓGICA DE LA TARJETA MAXIMIZADA, BORRADO Y MODIFICACIÓN ---
// ==========================================================================
const modalMaxi = document.getElementById("modal-tarjeta-maxi");
const btnCerrarMaxi = document.querySelector(".cerrar-modal-maxi");
const btnEliminarEvento = document.getElementById("btn-eliminar-evento");
const btnModificarEvento = document.getElementById("btn-modificar-evento");

// Variables de control para saber si estamos editando
let modoEdicion = false;
let eventoEdicionId = null;

// FUNCIONES PARA CONTROLAR LA APERTURA CON EFECTO SUAVE
function abrirModalConEfecto(modalElemento) {
    modalElemento.style.display = "flex";
    // Necesitamos un mini-retraso (setTimeout) para que el navegador capte el cambio de display y aplique la animación CSS
    setTimeout(() => {
        modalElemento.classList.add("mostrar-modal");
    }, 10);
}

function cerrarModalConEfecto(modalElemento) {
    modalElemento.classList.remove("mostrar-modal");
    // Esperamos a que termine la animación (350ms) antes de ocultarlo con display none
    setTimeout(() => {
        modalElemento.style.display = "none";
    }, 350);
}

// 1. ESCUCHAR CLICS EN LAS TARJETAS MINIS PARA ABRIR LA GIGANTE
contenedorLinea.addEventListener("click", (e) => {
    const tarjeta = e.target.closest(".tarjeta-evento");
    if (!tarjeta) return;

    const idEvento = tarjeta.dataset.id;
    const evento = eventosCargadosGlobal.find(ev => ev.id === idEvento);
    
    if (evento) {
        eventoSeleccionadoId = idEvento;
        
        // Inyectar datos en la tarjeta Maxi
        document.getElementById("maxi-fecha").innerText = evento.fecha;
        document.getElementById("maxi-localizacion").innerText = `📍 ${evento.localizacion}`;
        document.getElementById("maxi-titulo").innerText = evento.titulo;
        document.getElementById("maxi-descripcion").innerText = evento.descripcion;

        // Pintar PNJs en formato píldora
        const contPnjs = document.getElementById("maxi-pnjs");
        contPnjs.innerHTML = "";
        if (evento.pnjs && evento.pnjs.length > 0 && evento.pnjs[0] !== "") {
            evento.pnjs.forEach(pnj => { contPnjs.innerHTML += `<span class="tag-pnj">${pnj}</span>`; });
        } else {
            contPnjs.innerHTML = "<span style='color:#555; font-size:0.85rem;'>Ninguno</span>";
        }

        // Pintar Etiquetas en formato píldora
        const contEtiquetas = document.getElementById("maxi-etiquetas");
        contEtiquetas.innerHTML = "";
        if (evento.etiquetas && evento.etiquetas.length > 0 && evento.etiquetas[0] !== "") {
            evento.etiquetas.forEach(eti => { contEtiquetas.innerHTML += `<span class="tag-etiqueta">${eti}</span>`; });
        } else {
            contEtiquetas.innerHTML = "<span style='color:#555; font-size:0.85rem;'>Ninguna</span>";
        }

        // Abrir con la nueva animación
        abrirModalConEfecto(modalMaxi);
    }
});

// 2. LOGICA DE BORRADO (CON DOBLE CONFIRMACIÓN)
if (btnEliminarEvento) {
    btnEliminarEvento.addEventListener("click", () => {
        if (!eventoSeleccionadoId) return;

        // Recuperamos el título para personalizar el aviso
        const evento = eventosCargadosGlobal.find(ev => ev.id === eventoSeleccionadoId);
        
        // Primera confirmación
        const primeraConfirmacion = confirm(`¿Estás seguro de que quieres eliminar el evento: "${evento.titulo}"?`);
        
        if (primeraConfirmacion) {
            // Segunda confirmación de seguridad
            const segundaConfirmacion = confirm("⚠️ ATENCIÓN: Esta acción es irreversible y borrará el evento de la base de datos en la nube. ¿Continuar de todos modos?");
            
            if (segundaConfirmacion) {
                // Procedemos al borrado real en Firebase
                db.collection("eventos").doc(eventoSeleccionadoId).delete()
                    .then(() => {
                        console.log("¡Evento borrado con éxito de la nube!");
                        cerrarModalConEfecto(modalMaxi);
                        eventoSeleccionadoId = null;
                    })
                    .catch((error) => {
                        console.error("Error al eliminar el documento: ", error);
                        alert("Hubo un error de conexión al intentar borrar.");
                    });
            }
        }
    });
}

// 3. LOGICA DE MODIFICACIÓN (REUTILIZANDO EL FORMULARIO ORIGINAL)
if (btnModificarEvento) {
    btnModificarEvento.addEventListener("click", () => {
        if (!eventoSeleccionadoId) return;

        const evento = eventosCargadosGlobal.find(ev => ev.id === eventoSeleccionadoId);
        if (!evento) return;

        // Cambiamos las variables de control a modo edición
        modoEdicion = true;
        eventoEdicionId = eventoSeleccionadoId;

        // Rellenamos el formulario con los datos actuales que ya tenemos
        document.getElementById("form-fecha").value = evento.fecha;
        document.getElementById("form-titulo").value = evento.titulo;
        document.getElementById("form-ciudad").value = evento.localizacion;
        document.getElementById("form-descripcion").value = evento.descripcion;
        document.getElementById("form-pnjs").value = evento.pnjs ? evento.pnjs.join(", ") : "";
        document.getElementById("form-etiquetas").value = evento.etiquetas ? evento.etiquetas.join(", ") : "";

        // Cambiamos estéticamente el formulario para que sepa que está editando
        modalFormulario.querySelector("h2").innerText = "Editar Evento de Campaña";
        modalFormulario.querySelector(".btn-guardar").innerText = "Actualizar Cambios";

        // Cerramos la Maxi y abrimos el formulario con efecto suave
        cerrarModalConEfecto(modalMaxi);
        setTimeout(() => {
            abrirModalConEfecto(modalFormulario);
        }, 350);
    });
}

// 4. ADAPTAR EL ENVÍO DEL FORMULARIO PARA QUE ADMITA INSERCIÓN Y EDICIÓN
// Busca la línea donde estaba tu "formularioEvento.addEventListener('submit'..." y asegúrate de cambiar su lógica interna por esta:
if (formularioEvento) {
    formularioEvento.replaceWith(formularioEvento.cloneNode(true)); // Limpiar escuchas antiguos
    const nuevoForm = document.getElementById("formulario-evento");
    
    nuevoForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const datosEvento = {
            fecha: document.getElementById("form-fecha").value,
            titulo: document.getElementById("form-titulo").value,
            localizacion: document.getElementById("form-ciudad").value,
            descripcion: document.getElementById("form-descripcion").value,
            pnjs: document.getElementById("form-pnjs").value ? document.getElementById("form-pnjs").value.split(",").map(p => p.trim()) : [],
            etiquetas: document.getElementById("form-etiquetas").value ? document.getElementById("form-etiquetas").value.split(",").map(e => e.trim()) : []
        };

        if (modoEdicion && eventoEdicionId) {
            // Actualizar documento existente en Firebase
            db.collection("eventos").doc(eventoEdicionId).update(datosEvento)
                .then(() => {
                    console.log("¡Evento actualizado en la nube!");
                    cerrarModalConEfecto(modalFormulario);
                    reestablecerFormulario();
                })
                .catch(err => console.error("Error al actualizar:", err));
        } else {
            // Crear documento nuevo
            db.collection("eventos").add(datosEvento)
                .then(() => {
                    cerrarModalConEfecto(modalFormulario);
                    reestablecerFormulario();
                })
                .catch(err => console.error("Error al guardar:", err));
        }
    });
}

function reestablecerFormulario() {
    const form = document.getElementById("formulario-evento");
    form.reset();
    modoEdicion = false;
    eventoEdicionId = null;
    modalFormulario.querySelector("h2").innerText = "Nuevo Evento de Campaña";
    modalFormulario.querySelector(".btn-guardar").innerText = "Guardar Evento";
}

// 5. ENLAZAR BOTONES DE CIERRE CON LA NUEVA ANIMACIÓN
if (btnAñadir) {
    btnAñadir.addEventListener("click", () => { reestablecerFormulario(); abrirModalConEfecto(modalFormulario); });
}
if (btnCerrarModal) {
    btnCerrarModal.addEventListener("click", () => { cerrarModalConEfecto(modalFormulario); });
}
if (btnCerrarMaxi) {
    btnCerrarMaxi.addEventListener("click", () => { cerrarModalConEfecto(modalMaxi); });
}

window.addEventListener("click", (e) => {
    if (e.target === modalFormulario) { cerrarModalConEfecto(modalFormulario); }
    if (e.target === modalMaxi) { cerrarModalConEfecto(modalMaxi); }
});

// ==========================================================================
// --- LÓGICA DEL BUSCADOR FLOTANTE INFERIOR EN TIEMPO REAL ---
// ==========================================================================
const btnBuscar = document.getElementById("btn-buscar");
const contenedorBuscador = document.querySelector(".contenedor-buscador");
const inputBusqueda = document.getElementById("input-busqueda");

if (btnBuscar && contenedorBuscador && inputBusqueda) {
    btnBuscar.addEventListener("click", (e) => {
        e.stopPropagation(); // Evita que se cierre el evento global
        
        contenedorBuscador.classList.toggle("activo");
        
        if (contenedorBuscador.classList.contains("activo")) {
            inputBusqueda.focus();
        } else {
            inputBusqueda.value = "";
            renderizarLineaDeTiempo(eventosCargadosGlobal);
        }
    });

    contenedorBuscador.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    // Si se hace clic fuera del buscador y está vacío, se repliega de forma automática
    window.addEventListener("click", () => {
        if (contenedorBuscador.classList.contains("activo") && inputBusqueda.value.trim() === "") {
            contenedorBuscador.classList.remove("activo");
        }
    });

    // FILTRADO EN TIEMPO REAL
    inputBusqueda.addEventListener("input", (e) => {
        const textoUsuario = e.target.value.toLowerCase().trim();

        if (textoUsuario === "") {
            renderizarLineaDeTiempo(eventosCargadosGlobal);
            return;
        }

        const eventosFiltrados = eventosCargadosGlobal.filter(evento => {
            const tituloOk = evento.titulo ? evento.titulo.toLowerCase().includes(textoUsuario) : false;
            const locOk = evento.localizacion ? evento.localizacion.toLowerCase().includes(textoUsuario) : false;
            const descOk = evento.descripcion ? evento.descripcion.toLowerCase().includes(textoUsuario) : false;
            
            const pnjOk = evento.pnjs ? evento.pnjs.some(pnj => pnj.toLowerCase().includes(textoUsuario)) : false;
            const etiquetaOk = evento.etiquetas ? evento.etiquetas.some(eti => eti.toLowerCase().includes(textoUsuario)) : false;

            return tituloOk || locOk || descOk || pnjOk || etiquetaOk;
        });

        renderizarLineaDeTiempo(eventosFiltrados);
    });
}