// Este array simula la base de datos por ahora (Datos de prueba)
const eventosDePrueba = [
    {
        id: "1",
        fecha: "1925-01-15",
        titulo: "La muerte de Jackson Elias",
        descripcion: "Jackson Elias nos citó en el Hotel Chelsea. Lo encontramos asesinado en su habitación. Había símbolos extraños tallados en su frente y pistas que apuntan a una secta.",
        localizacion: "Nueva York"
    },
    {
        id: "2",
        fecha: "1925-01-20",
        titulo: "Investigación en la Gaceta del Profesor",
        descripcion: "Revisamos los archivos del periódico de la Universidad y descubrimos recortes sobre la expedición Carlyle. Todo parece encajar de forma terrorífica.",
        localizacion: "Nueva York"
    }
];

// Comprobación en la consola del navegador para ver que todo está enlazado
console.log("¡JavaScript enlazado correctamente!");
console.log("Eventos cargados:", eventosDePrueba);

const contenedorLinea = document.getElementById("contenedor-linea");

function renderizarLineaDeTiempo(eventos) {
    contenedorLinea.innerHTML = '<div class="linea-vertical"></div>'; // Limpiar el contenedor antes de renderizar

    eventos.forEach(evento => {
        const bloque = document.createElement("div");
        bloque.classList.add('evento-bloque');

        bloque.innerHTML = `
            <div class="nodo-circulo"></div>
            <div class="tarjeta-evento">
            <span class="evento-fecha">${evento.fecha}</span>
                <h3>${evento.titulo}</h3>
                <p>${evento.descripcion}</p>
                <small class="evento-localizacion">📍 ${evento.localizacion}</small>
            </div>
        `;

        contenedorLinea.appendChild(bloque);
    });
}
// --- EFECTO CILINDRO CON EL SCROLL ---

function actualizarEfectoCilindro() {
    // 1. Encontramos la mitad vertical de la pantalla (la "cámara")
    const centroPantalla = window.innerHeight / 2;
    
    // 2. Capturamos todos los bloques de eventos que hay en la página
    const bloques = document.querySelectorAll('.evento-bloque');
    
    bloques.forEach(bloque => {
        // Obtenemos la posición del bloque respecto a la pantalla actual
        const rect = bloque.getBoundingClientRect();
        // Calculamos el centro vertical del bloque de la tarjeta
        const centroBloque = rect.top + (rect.height / 2);
        
        // 3. Calculamos la distancia absoluta entre el centro de la pantalla y el bloque
        const distanciaAlCentro = Math.abs(centroPantalla - centroBloque);
        
        // 4. Normalizamos la distancia (por ejemplo, en un radio de 400px)
        // Cuanto más cerca del centro, el factor se acercará a 1. Cuanto más lejos, a 0.
        const radioEfecto = 400; 
        let factor = 1 - (distanciaAlCentro / radioEfecto);
        
        // Ponemos límites para que no devuelva números negativos si se aleja mucho
        if (factor < 0) factor = 0;
        if (factor > 1) factor = 1;
        
        // 5. Convertimos ese factor en valores de Escala y Opacidad
        // En el centro (factor 1): escala 1.1 y opacidad 1
        // Fuera del radio (factor 0): escala 0.4 y opacidad 0.15 (casi invisibles y muy pequeñas)
        const escala = 0.4 + (factor * 0.7); 
        const opacidad = 0.15 + (factor * 0.85);
        
        // 6. Aplicamos la magia tridimensional con CSS dinámico
        // Usamos un ligero efecto de perspectiva hacia el fondo (translateZ)
        bloque.style.transform = `scale(${escala})`;
        bloque.style.opacity = opacidad;
    });
}

renderizarLineaDeTiempo(eventosDePrueba);
// Escuchamos el evento de scroll del navegador para ejecutar el cálculo
window.addEventListener('scroll', actualizarEfectoCilindro);

// Lo ejecutamos también una vez al cargar la página para que aplique el tamaño inicial
actualizarEfectoCilindro();
