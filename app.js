// Este array simula la base de datos por ahora (Datos de prueba)
const eventosDePrueba = [
    {
        id: "1",
        fecha: "1920-01-15",
        titulo: "La muerte de Jackson Elias",
        descripcion: "Jackson Elias nos citó en el Hotel Chelsea. Lo encontramos asesinado en su habitación. Había símbolos extraños tallados en su frente y pistas que apuntan a una secta.",
        localizacion: "Nueva York"
    },
    {
        id: "2",
        fecha: "1920-01-20",
        titulo: "Investigación en la Gaceta del Profesor",
        descripcion: "Revisamos los archivos del periódico de la Universidad y descubrimos recortes sobre la expedición Carlyle. Todo parece encajar de forma terrorífica.",
        localizacion: "Nueva York"
    }
];

// Comprobación en la consola del navegador para ver que todo está enlazado
console.log("¡JavaScript enlazado correctamente!");
console.log("Eventos cargados:", eventosDePrueba);

const contenedorLinea = document.getElementById("contenedor-linea");
// Variable global para controlar el año actual en pantalla
let añoActualGlobal = "";

function renderizarLineaDeTiempo(eventos) {
    contenedorLinea.innerHTML = '<div class="linea-vertical"></div>'; // Limpiar antes de renderizar

    // Ordenamos los eventos por fecha por si acaso vienen desordenados
    eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    let ultimoAño = null;
    let ultimoMes = null;
    let ultimaFecha = null;

    eventos.forEach((evento, index) => {
        const fechaActual = new Date(evento.fecha);
        const añoActual = fechaActual.getFullYear();
        
        // Obtener el nombre del mes en español
        const mesActual = fechaActual.toLocaleDateString('es-ES', { month: 'long' });

        // 1. SEPARADOR DE MES: Si cambia el mes (o el año), metemos la línea divisoria
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

        // 2. CREAR EL BLOQUE DEL EVENTO
        const bloque = document.createElement("div");
        bloque.classList.add('evento-bloque');
        // Guardamos el año en el elemento para que el scroll sepa cuál es
        bloque.dataset.anio = añoActual;

        bloque.innerHTML = `
            <div class="nodo-circulo"></div>
            <div class="tarjeta-evento">
                <span class="evento-fecha">${evento.fecha}</span>
                <h3>${evento.titulo}</h3>
                <p>${evento.descripcion}</p>
                <small class="evento-localizacion">📍 ${evento.localizacion}</small>
            </div>
        `;

        // 3. DISTANCIA RELATIVA: Ajustamos el espacio según el tiempo pasado
        if (index > 0 && ultimaFecha) {
            const diferenciaTiempo = fechaActual - ultimaFecha;
            const diferenciaDias = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));
            
            // Cada día añade 1.5px de separación, con un tope máximo de 200px para que no se vuelva infinito
            const margenExtra = Math.min(diferenciaDias * 1.5, 200);
            bloque.style.marginTop = `${margenExtra}px`;
        }

        contenedorLinea.appendChild(bloque);
        ultimaFecha = fechaActual;
    });
}

// --- EFECTO CILINDRO Y DETECCIÓN DE AÑO AL HACER SCROLL ---
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
        
        // Buscamos cuál es el bloque que está cruzando el centro de la pantalla ahora mismo
        if (distanciaAlCentro < distanciaMinima) {
            distanciaMinima = distanciaAlCentro;
            bloqueMasCercano = bloque;
        }

        // Aplicamos el efecto cilindro que ya tenías
        const radioEfecto = 400;
        let factor = 1 - (distanciaAlCentro / radioEfecto);
        
        if (factor < 0) factor = 0;
        if (factor > 1) factor = 1;
        
        const escala = 0.4 + (factor * 0.7);
        const opacidad = 0.15 + (factor * 0.85);
        
        bloque.style.transform = `scale(${escala})`;
        bloque.style.opacity = opacidad;
    });

    // Cambiar el año flotante con fundido rápido si cambia el año del bloque central
    if (bloqueMasCercano && divAño) {
        const añoBloque = bloqueMasCercano.dataset.anio;
        if (añoBloque !== añoActualGlobal) {
            añoActualGlobal = añoBloque;
            
            // Añadimos clase para difuminar rápido
            divAño.classList.add("año-cambiando");
            
            setTimeout(() => {
                divAño.innerText = añoActualGlobal;
                // Quitamos clase para que vuelva a aparecer suavemente
                divAño.classList.remove("año-cambiando");
            }, 150); // El cambio ocurre a mitad de la animación
        }
    }
}

// Inicialización de la app
renderizarLineaDeTiempo(eventosDePrueba);
window.addEventListener('scroll', actualizarEfectoCilindro);
actualizarEfectoCilindro();