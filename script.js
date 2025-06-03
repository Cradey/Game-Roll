// Conjunto de posiciones ya utilizadas (para evitar duplicados)
const usedPositions = new Set();

// Diccionario para guardar las tarjetas por posición
const cards = {};

// Intervalo del juego
let intervalId = null;

let rollId = null; // para guardar el intervalo interno de ruleta


// Lista de ganadores
let winners = [];

// 🎵 Sonido para cada clic de la ruleta
const clickSound = new Audio('sonidos/click.mp3');
clickSound.volume = 0.5; // volumen moderado

// 🔔 Sonido para ganadores
const winSound = new Audio('sonidos/win.mp3');
winSound.volume = 0.7;


/**
 * Inicializa las 12 tarjetas vacías al cargar
 */
function createEmptyCards() {
  const container = document.getElementById('cardContainer');
  for (let i = 1; i <= 12; i++) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.id = 'card-' + i;
    card.dataset.position = i;

    const title = document.createElement('h3');
    title.textContent = '—'; // nombre vacío
    card.appendChild(title);

    const numberLabel = document.createElement('div');
    numberLabel.className = 'number-label';
    numberLabel.textContent = `#${i}`;
    card.appendChild(numberLabel);

    const circlesContainer = document.createElement('div');
    circlesContainer.className = 'circles';
    for (let j = 0; j < 5; j++) {
      const circle = document.createElement('div');
      circle.className = 'circle';
      circlesContainer.appendChild(circle);
    }
    card.appendChild(circlesContainer);

    const winnerMsg = document.createElement('div');
    winnerMsg.className = 'winner-message';
    card.appendChild(winnerMsg);

    cards[i] = card;
    container.appendChild(card);
  }
}

//Esto asegura que al presionar Enter en el campo de posición, se activa la función del botón Agregar.
document.getElementById('positionInput').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Previene que el form se envíe si existe

    // Simula clic en el botón Agregar
    document.getElementById('addBtn').click();
  }
});


/**
 * Agrega una nueva tarjeta/card con nombre y posición
 */
function addCard() {
  const name = document.getElementById('nameInput').value.trim();
  const position = parseInt(document.getElementById('positionInput').value);

  if (!name || isNaN(position) || position < 1 || position > 12) {
    alert("Nombre o posición inválida.");
    return;
  }

  const card = document.getElementById('card-' + position);

  if (!card) {
    alert("Tarjeta no encontrada.");
    return;
  }

  const currentName = card.querySelector('h3').textContent;
  if (!card || currentName !== '—') {
    alert("Ya hay un jugador en esta posición. Elimínalo primero.");
    return;
  }

  // Asignar el nombre
  card.querySelector('h3').textContent = name;

  // Crear botón eliminar (posicionado arriba a la derecha)
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'X';
  deleteBtn.classList.add('delete-btn');
  deleteBtn.onclick = () => removePlayer(position);
  card.appendChild(deleteBtn);


  usedPositions.add(position);

  // Limpiar inputs
  document.getElementById('nameInput').value = '';
  document.getElementById('positionInput').value = '';
  
}


function removePlayer(position) {
  const card = document.getElementById('card-' + position);
  if (!card) return;

  // Resetear nombre
  card.querySelector('h3').textContent = '—';

  // Reiniciar círculos
  const circles = card.querySelectorAll('.circle');
  circles.forEach(c => c.classList.remove('active'));

  // Borrar mensaje de ganador
  const msg = card.querySelector('.winner-message');
  msg.textContent = '';

  // Quitar clase activa si está encendida
  card.classList.remove('active');

  // Quitar de lista de ganadores si estaba
  winners = winners.filter(w => w !== position);

  // Marcar posición como libre
  usedPositions.delete(position);
}


/**
 * Inicia el sorteo aleatorio de números
 */
/**
 * Inicia el sorteo aleatorio de números con efecto ruleta
 */
function startRandom() {
  if (intervalId !== null || winners.length >= 3) return;

  intervalId = setInterval(() => {
    let count = 0;
    const rollDuration = 1000;
    const rollInterval = 100;
    const maxRolls = rollDuration / rollInterval;
    clickSound.currentTime = 0;
    clickSound.play();


    const display = document.getElementById('numberDisplay');
    display.classList.add('rolling'); // ⬅️ Añadir aquí

    rollId = setInterval(() => {
      const fakeNum = Math.floor(Math.random() * 12) + 1;
      display.textContent = fakeNum;

      // 🎵 Reproducir sonido
      clickSound.currentTime = 0;
      clickSound.play();

      // ⭐ Iluminar tarjeta correspondiente si existe
      const fakeCard = document.getElementById('card-' + fakeNum);
      if (fakeCard) {
        fakeCard.classList.add('highlight');
        setTimeout(() => fakeCard.classList.remove('highlight'), rollInterval - 10); // quita un poco antes del siguiente
      }

      count++;
      if (count >= maxRolls) {
        clearInterval(rollId);
        display.classList.remove('rolling'); // ⬅️ Y quitar aquí
        const validPositions = Array.from(usedPositions);
        if (validPositions.length === 0) return;

       const realNum = validPositions[Math.floor(Math.random() * validPositions.length)];
       display.textContent = realNum;

       // 🗣️ Decir el número en voz alta
       const utterance = new SpeechSynthesisUtterance(realNum.toString());
       utterance.lang = "es-ES"; // español
       speechSynthesis.speak(utterance);
      


        // 🎉 Animación al número final
        display.classList.add('flash');
        setTimeout(() => display.classList.remove('flash'), 500);

        // 🔄 Quitar estado activo de todas las tarjetas
        for (let i = 1; i <= 12; i++) {
          const c = document.getElementById('card-' + i);
          if (c) c.classList.remove('active');
        }

        // ✅ Activar tarjeta final
        const card = document.getElementById('card-' + realNum);
        if (card) {
          card.classList.add('active');

          const circles = card.querySelectorAll('.circle');
          for (let i = 0; i < circles.length; i++) {
            if (!circles[i].classList.contains('active')) {
              circles[i].classList.add('active');

              const filled = Array.from(circles).filter(c => c.classList.contains('active')).length;
              if (filled === 5 && !winners.includes(realNum)) {
                const msg = card.querySelector('.winner-message');

                

                // 🔊 Sonido de victoria
                winSound.currentTime = 0;
                winSound.play();

                let announcement = "";
                const playerName = card.querySelector('h3')?.textContent || "Jugador desconocido";

                if (winners.length === 0) {
                  msg.textContent = "🏆 1er lugar";
                  announcement = `¡${playerName}, primer lugar!`;
                } else if (winners.length === 1) {
                  msg.textContent = "🥈 2do lugar";
                  announcement = `¡${playerName}, segundo lugar!`;
                } else if (winners.length === 2) {
                  msg.textContent = "🥉 3er lugar";
                  announcement = `¡${playerName}, tercer lugar!`;
                }
                winners.push(realNum);
              
                const winnerVoice = new SpeechSynthesisUtterance(announcement);
                winnerVoice.lang = "es-ES";
                speechSynthesis.speak(winnerVoice);

                if (winners.length >= 3) {
                  stopRandom();
                }
              }
              
              break;
            }
          }
        }
      }
    }, rollInterval);
  }, 2000);
}



/**
 * Detiene el sorteo aleatorio
 */
function stopRandom() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (rollId !== null) {
    clearInterval(rollId);
    rollId = null;
  }
  // 🚀 Detener el giro al finalizar
  const display = document.getElementById('numberDisplay');
  display.classList.remove('rolling'); // Detener la animación de giro
}

/**
 * Limpia todo el juego y reinicia
 */
function clearAll() {
  stopRandom();
  usedPositions.clear();
  winners = [];
  document.getElementById('cardContainer').innerHTML = '';
  document.getElementById('numberDisplay').textContent = '—';
  document.getElementById('nameInput').value = '';
  document.getElementById('positionInput').value = '';
  Object.keys(cards).forEach(k => delete cards[k]); // Vaciar diccionario
  createEmptyCards();
}


window.onload = createEmptyCards;
