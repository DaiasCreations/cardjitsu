const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
let difficulty = 'aprendiz';

// Configuración del juego
const CARD_WIDTH = 80;
const CARD_HEIGHT = 120;
const PLAYER_Y = 400;
const ENEMY_Y = 100;

let playerHealth = 10;
let enemyHealth = 10;
let turn = 'player';
let selectedCard = null;

// Tipos de cartas
const cardTypes = ['fire', 'water', 'snow'];

// Mazos
let playerDeck = [];
let enemyDeck = [];

// Cartas visibles
let playerHand = [];
let enemyHand = [];

let totalTime = 10 * 60; // 10 minutos
let turnTimer = 20;
let turnInterval = null;
let timerInterval = null;

function showDifficulty() {
  document.getElementById("menuScreen").classList.add("hidden");
  document.getElementById("difficultyScreen").classList.remove("hidden");
}

function startGame(selectedDifficulty) {
  difficulty = selectedDifficulty;
  document.getElementById("difficultyScreen").classList.add("hidden");
  document.getElementById("gameCanvas").style.display = "block";
  resetGame();
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

function goToMenu() {
  gameRunning = false;
  clearInterval(turnInterval);
  clearInterval(timerInterval);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  document.getElementById("endScreen").classList.add("hidden");
  document.getElementById("gameCanvas").style.display = "none";
  document.getElementById("menuScreen").style.display = "flex";
  document.getElementById("menuScreen").classList.remove("hidden");
}

function resetGame() {
  const count = Math.floor(30 / 3);
  function generateBalancedDeck(size) {
    let deck = [];
    for (let i = 0; i < count; i++) {
      deck.push('fire', 'water', 'snow');
    }
    while (deck.length < size) {
      deck.push(cardTypes[Math.floor(Math.random() * cardTypes.length)]);
    }
    return shuffle(deck);
  }

  playerDeck = generateBalancedDeck(30);
  enemyDeck = generateBalancedDeck(30);

  playerHand = drawInitialCards(6);
  enemyHand = Array(6).fill('back');

  playerHealth = 10;
  enemyHealth = 10;
  turn = 'player';
  selectedCard = null;
  totalTime = 10 * 60;
}

function drawInitialCards(count) {
  const hand = [];
  for (let i = 0; i < count && playerDeck.length > 0; i++) {
    hand.push(playerDeck.shift());
  }
  return hand;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function determineWinner(playerCard, enemyCard) {
  if (!playerCard || !enemyCard) return 'draw';
  if (playerCard === enemyCard) return 'draw';
  if (
    (playerCard === 'fire' && enemyCard === 'snow') ||
    (playerCard === 'snow' && enemyCard === 'water') ||
    (playerCard === 'water' && enemyCard === 'fire')
  ) {
    return 'player';
  } else {
    return 'enemy';
  }
}

function playTurn(playerCard) {
  if (!playerCard || !gameRunning || turn !== 'player') return;

  battleAnimation = {
    active: true,
    playerCard: playerCard,
    enemyCard: null
  };

  setTimeout(() => {
    const enemyIndex = enemyHand.indexOf('back');
    if (enemyIndex === -1 || enemyDeck.length === 0) {
      endGame('player');
      return;
    }

    let revealedEnemyCard;
    if (difficulty === 'aprendiz') {
      revealedEnemyCard = enemyDeck.shift();
    } else if (difficulty === 'combatiente') {
      revealedEnemyCard = combatienteAiSelectCard([...playerHand]);
    } else if (difficulty === 'sensei') {
      revealedEnemyCard = senseiAiSelectCard([...playerHand]);
    }

    if (!revealedEnemyCard) {
      endGame('player');
      return;
    }

    battleAnimation.enemyCard = revealedEnemyCard;

    setTimeout(() => {
      const result = determineWinner(playerCard, revealedEnemyCard);
      if (result === 'player') {
        enemyHealth--;
      } else if (result === 'enemy') {
        playerHealth--;
      }

      playerHand[selectedCard] = 'used';
      battleAnimation.active = false;

      setTimeout(() => {
        if (playerHealth <= 0 || enemyHealth <= 0) {
          endGame(playerHealth > 0 ? 'player' : 'enemy');
          return;
        }

        turn = 'enemy';
        setTimeout(() => {
          autoEnemyPlay(enemyIndex, revealedEnemyCard);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

function autoEnemyPlay(enemyIndex, revealedEnemyCard) {
  enemyHand[enemyIndex] = 'used';

  setTimeout(() => {
    enemyHand[enemyIndex] = 'back';
    turn = 'player';
    startTurnTimer();
  }, 1000);
}

function combatienteAiSelectCard(visibleHand) {
  const visibleCards = visibleHand.filter(c => c && c !== 'used');
  const known = [...new Set(visibleCards.slice(0, Math.min(3, visibleCards.length))];
  const counterMap = { fire: 'snow', snow: 'water', water: 'fire' };
  const possibleCounters = known.map(c => counterMap[c]);

  const match = possibleCounters.find(c => enemyDeck.includes(c));
  return match || enemyDeck.shift();
}

function senseiAiSelectCard(visibleHand) {
  const visibleCards = visibleHand.filter(c => c && c !== 'used');
  const known = [...new Set(visibleCards.slice(0, Math.min(4, visibleCards.length))];
  const counterMap = { fire: 'snow', snow: 'water', water: 'fire' };
  const possibleCounters = known.map(c => counterMap[c]);

  if (Math.random() < 0.3 && selectedCard !== null && playerHand[selectedCard]) {
    const predicted = counterMap[playerHand[selectedCard]];
    if (predicted && enemyDeck.includes(predicted)) return predicted;
  }

  const match = possibleCounters.find(c => enemyDeck.includes(c));
  return match || enemyDeck.shift();
}

function cardColor(type) {
  switch (type) {
    case 'fire': return 'orange';
    case 'water': return 'lightblue';
    case 'snow': return 'white';
    default: return '#ddd';
  }
}

function drawBackground() {
  ctx.fillStyle = "#b2ebf2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Barra de vida
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, playerHealth * 10, 20);
  ctx.fillStyle = "blue";
  ctx.fillRect(700, 20, enemyHealth * 10, 20);

  // Cronómetro
  ctx.fillStyle = "#004d40";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Tiempo restante: ${formatTime(totalTime)}`, canvas.width / 2, 30);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function drawCards(hand, startY, isPlayer) {
  let visibleCount = 0;

  for (let index = 0; index < hand.length; index++) {
    const card = hand[index];
    if (!card || card === 'used') continue;

    let x = 100 + visibleCount * (CARD_WIDTH + 10);
    let y = startY;

    ctx.strokeStyle = selectedCard === index && isPlayer ? 'black' : 'gray';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, CARD_WIDTH, CARD_HEIGHT);

    if (card === 'back') {
      ctx.fillStyle = '#555';
      ctx.fillRect(x + 5, y + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText("?", x + 35, y + 60);
    } else {
      ctx.fillStyle = cardColor(card);
      ctx.fillRect(x + 5, y + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(card[0].toUpperCase(), x + 30, y + 60);
    }

    visibleCount++;
  }
}

function cardColor(type) {
  switch (type) {
    case 'fire': return 'orange';
    case 'water': return 'lightblue';
    case 'snow': return 'white';
    default: return '#ddd';
  }
}

function endGame(winner = null) {
  gameRunning = false;
  document.getElementById("gameCanvas").style.display = "none";
  document.getElementById("endScreen").classList.remove("hidden");

  const endMessage = document.getElementById("endMessage");
  if (winner === 'player') {
    endMessage.textContent = "Victoria";
    endMessage.style.color = "#388e3c";
  } else if (winner === 'enemy') {
    endMessage.textContent = "Derrota";
    endMessage.style.color = "#c62828";
  } else {
    endMessage.textContent = "Empate";
    endMessage.style.color = "#000";
  }

  setTimeout(() => {
    goToMenu();
  }, 5000);
}

function startTurnTimer() {
  clearInterval(turnInterval);
  turnTimer = 20;

  const emptySlot = playerHand.findIndex(c => c === undefined || c === 'used');
  if (emptySlot !== -1 && playerDeck.length > 0) {
    const newCard = playerDeck.shift();
    animateNewCard(newCard, emptySlot);
  }

  turnInterval = setInterval(() => {
    turnTimer--;
    if (turnTimer <= 0) {
      clearInterval(turnInterval);
      autoPlayCard();
    }
  }, 1000);
}

function autoPlayCard() {
  const available = playerHand
    .map((_, i) => i)
    .filter(i => playerHand[i] && playerHand[i] !== 'used');

  if (available.length === 0) {
    endGame('enemy');
    return;
  }

  const randomIndex = available[Math.floor(Math.random() * available.length)];
  selectedCard = randomIndex;
  playTurn(playerHand[randomIndex]);
}

function animateNewCard(card, index) {
  if (!card || index < 0 || index >= playerHand.length) return;
  playerHand[index] = card;
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawCards(playerHand, PLAYER_Y, true);
  drawCards(enemyHand, ENEMY_Y, false);
  requestAnimationFrame(gameLoop);
}

function updateTimer() {
  if (totalTime <= 0) {
    clearInterval(timerInterval);
    endGame();
    return;
  }
  totalTime--;
}

function autoEnemyPlay(enemyIndex, revealedEnemyCard) {
  enemyHand[enemyIndex] = 'used';

  setTimeout(() => {
    enemyHand[enemyIndex] = 'back';
    turn = 'player';
    startTurnTimer();
  }, 1000);
}

function resetGame() {
  const count = Math.floor(30 / 3);
  function generateBalancedDeck(size) {
    let deck = [];
    for (let i = 0; i < count; i++) {
      deck.push('fire', 'water', 'snow');
    }
    while (deck.length < size) {
      deck.push(cardTypes[Math.floor(Math.random() * cardTypes.length)]);
    }
    return shuffle(deck);
  }

  playerDeck = generateBalancedDeck(30);
  enemyDeck = generateBalancedDeck(30);

  playerHand = drawInitialCards(6);
  enemyHand = Array(6).fill('back');

  playerHealth = 10;
  enemyHealth = 10;
  turn = 'player';
  selectedCard = null;
  totalTime = 10 * 60;
}

function drawBackground() {
  ctx.fillStyle = "#b2ebf2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Barra de vida
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, playerHealth * 10, 20);
  ctx.fillStyle = "blue";
  ctx.fillRect(700, 20, enemyHealth * 10, 20);

  // Cronómetro
  ctx.fillStyle = "#004d40";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Tiempo restante: ${formatTime(totalTime)}`, canvas.width / 2, 30);
}

function drawCards(hand, startY, isPlayer) {
  let visibleCount = 0;

  for (let index = 0; index < hand.length; index++) {
    const card = hand[index];
    if (!card || card === 'used') continue;

    let x = 100 + visibleCount * (CARD_WIDTH + 10);
    let y = startY;

    ctx.strokeStyle = selectedCard === index && isPlayer ? 'black' : 'gray';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, CARD_WIDTH, CARD_HEIGHT);

    if (card === 'back') {
      ctx.fillStyle = '#555';
      ctx.fillRect(x + 5, y + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText("?", x + 35, y + 60);
    } else {
      ctx.fillStyle = cardColor(card);
      ctx.fillRect(x + 5, y + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(card[0].toUpperCase(), x + 30, y + 60);
    }

    visibleCount++;
  }
}

function startGame(selectedDifficulty) {
  difficulty = selectedDifficulty;
  document.getElementById("difficultyScreen").classList.add("hidden");
  document.getElementById("gameCanvas").style.display = "block";
  resetGame();
  gameRunning = true;
  startTurnTimer();
  requestAnimationFrame(gameLoop);
}

function startTurnTimer() {
  clearInterval(turnInterval);
  turnTimer = 20;

  const emptySlot = playerHand.findIndex(c => c === undefined || c === 'used');
  if (emptySlot !== -1 && playerDeck.length > 0) {
    const newCard = playerDeck.shift();
    animateNewCard(newCard, emptySlot);
  }

  turnInterval = setInterval(() => {
    turnTimer--;
    if (turnTimer <= 0) {
      clearInterval(turnInterval);
      autoPlayCard();
    }
  }, 1000);
}

canvas.addEventListener('click', function(event) {
  if (!gameRunning || turn !== 'player') return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  let visibleCount = 0;
  for (let index = 0; index < playerHand.length; index++) {
    const card = playerHand[index];
    if (!card || card === 'used') continue;

    let x = 100 + visibleCount * (CARD_WIDTH + 10);
    let y = PLAYER_Y;

    if (
      mouseX >= x &&
      mouseX <= x + CARD_WIDTH &&
      mouseY >= y &&
      mouseY <= y + CARD_HEIGHT
    ) {
      selectedCard = index;
      clearInterval(turnInterval);
      playTurn(playerHand[index]);
      return;
    }

    visibleCount++;
  }
});

function playTurn(playerCard) {
  if (!playerCard || !gameRunning || turn !== 'player') return;

  battleAnimation = {
    active: true,
    playerCard: playerCard,
    enemyCard: null
  };

  setTimeout(() => {
    const enemyIndex = enemyHand.indexOf('back');
    if (enemyIndex === -1 || enemyDeck.length === 0) {
      endGame('player');
      return;
    }

    let revealedEnemyCard;
    if (difficulty === 'aprendiz') {
      revealedEnemyCard = enemyDeck.shift();
    } else if (difficulty === 'combatiente') {
      revealedEnemyCard = combatienteAiSelectCard([...playerHand]);
    } else if (difficulty === 'sensei') {
      revealedEnemyCard = senseiAiSelectCard([...playerHand]);
    }

    if (!revealedEnemyCard) {
      endGame('player');
      return;
    }

    battleAnimation.enemyCard = revealedEnemyCard;

    setTimeout(() => {
      const result = determineWinner(playerCard, revealedEnemyCard);
      if (result === 'player') enemyHealth--;
      else if (result === 'enemy') playerHealth--;

      playerHand[selectedCard] = 'used';
      battleAnimation.active = false;

      setTimeout(() => {
        if (playerHealth <= 0 || enemyHealth <= 0) {
          endGame(playerHealth > 0 ? 'player' : 'enemy');
          return;
        }

        turn = 'enemy';
        setTimeout(() => {
          autoEnemyPlay(enemyIndex, revealedEnemyCard);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

function autoEnemyPlay(enemyIndex, revealedEnemyCard) {
  enemyHand[enemyIndex] = 'used';

  setTimeout(() => {
    enemyHand[enemyIndex] = 'back';
    turn = 'player';
    startTurnTimer();
  }, 1000);
}

function combatienteAiSelectCard(visibleHand) {
  const visibleCards = visibleHand.filter(c => c && c !== 'used');
  const known = [...new Set(visibleCards.slice(0, Math.min(3, visibleCards.length))];
  const counterMap = { fire: 'snow', snow: 'water', water: 'fire' };
  const possibleCounters = known.map(c => counterMap[c]);

  const match = possibleCounters.find(c => enemyDeck.includes(c));
  return match || enemyDeck.shift();
}

function senseiAiSelectCard(visibleHand) {
  const visibleCards = visibleHand.filter(c => c && c !== 'used');
  const known = [...new Set(visibleCards.slice(0, Math.min(4, visibleCards.length))];
  const counterMap = { fire: 'snow', snow: 'water', water: 'fire' };
  const possibleCounters = known.map(c => counterMap[c]);

  if (Math.random() < 0.3 && selectedCard !== null && playerHand[selectedCard]) {
    const predicted = counterMap[playerHand[selectedCard]];
    if (predicted && enemyDeck.includes(predicted)) return predicted;
  }

  const match = possibleCounters.find(c => enemyDeck.includes(c));
  return match || enemyDeck.shift();
}

function endGame(winner = null) {
  gameRunning = false;
  document.getElementById("gameCanvas").style.display = "none";
  document.getElementById("endScreen").classList.remove("hidden");

  const endMessage = document.getElementById("endMessage");
  if (winner === 'player') {
    endMessage.textContent = "Victoria";
    endMessage.style.color = "#388e3c";
  } else if (winner === 'enemy') {
    endMessage.textContent = "Derrota";
    endMessage.style.color = "#c62828";
  } else {
    endMessage.textContent = "Empate";
    endMessage.style.color = "#000";
  }

  setTimeout(() => {
    goToMenu();
  }, 5000);
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawCards(playerHand, PLAYER_Y, true);
  drawCards(enemyHand, ENEMY_Y, false);
  requestAnimationFrame(gameLoop);
}

function drawBackground() {
  ctx.fillStyle = "#b2ebf2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Vida
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, playerHealth * 10, 20);
  ctx.fillStyle = "blue";
  ctx.fillRect(700, 20, enemyHealth * 10, 20);
}

function drawCards(hand, startY, isPlayer) {
  let visibleCount = 0;

  for (let index = 0; index < hand.length; index++) {
    const card = hand[index];
    if (!card || card === 'used') continue;

    let x = 100 + visibleCount * (CARD_WIDTH + 10);
    let y = startY;

    ctx.strokeStyle = selectedCard === index && isPlayer ? 'black' : 'gray';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, CARD_WIDTH, CARD_HEIGHT);

    if (card === 'back') {
      ctx.fillStyle = '#555';
      ctx.fillRect(x + 5, y + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText("?", x + 35, y + 60);
    } else {
      ctx.fillStyle = cardColor(card);
      ctx.fillRect(x + 5, y + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(card[0].toUpperCase(), x + 30, y + 60);
    }

    visibleCount++;
  }
}

function resetGame() {
  const count = Math.floor(30 / 3);
  function generateBalancedDeck(size) {
    let deck = [];
    for (let i = 0; i < count; i++) {
      deck.push('fire', 'water', 'snow');
    }
    while (deck.length < size) {
      deck.push(cardTypes[Math.floor(Math.random() * cardTypes.length]);
    }
    return shuffle(deck);
  }

  playerDeck = generateBalancedDeck(30);
  enemyDeck = generateBalancedDeck(30);

  playerHand = drawInitialCards(6);
  enemyHand = Array(6).fill('back');

  playerHealth = 10;
  enemyHealth = 10;
  turn = 'player';
  selectedCard = null;
  totalTime = 10 * 60;
}

function drawInitialCards(count) {
  const hand = [];
  for (let i = 0; i < count && playerDeck.length > 0; i++) {
    hand.push(playerDeck.shift());
  }
  return hand;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function updateTimer() {
  if (totalTime <= 0) {
    clearInterval(timerInterval);
    endGame();
    return;
  }
  totalTime--;
}

function startTurnTimer() {
  clearInterval(turnInterval);
  turnTimer = 20;

  const emptySlot = playerHand.findIndex(c => c === undefined || c === 'used');
  if (emptySlot !== -1 && playerDeck.length > 0) {
    const newCard = playerDeck.shift();
    animateNewCard(newCard, emptySlot);
  }

  turnInterval = setInterval(() => {
    turnTimer--;
    if (turnTimer <= 0) {
      clearInterval(turnInterval);
      autoPlayCard();
    }
  }, 1000);
}

function autoPlayCard() {
  const available = playerHand
    .map((_, i) => i)
    .filter(i => playerHand[i] && playerHand[i] !== 'used');

  if (available.length === 0) {
    endGame('enemy');
    return;
  }

  const randomIndex = available[Math.floor(Math.random() * available.length)];
  selectedCard = randomIndex;
  playTurn(playerHand[randomIndex]);
}

function animateNewCard(card, index) {
  if (!card || index < 0 || index >= playerHand.length) return;
  playerHand[index] = card;
}

function playTurn(playerCard) {
  if (!playerCard || !gameRunning || turn !== 'player') return;

  const enemyIndex = enemyHand.indexOf('back');
  if (enemyIndex === -1 || enemyDeck.length === 0) {
    endGame('player');
    return;
  }

  let revealedEnemyCard;
  if (difficulty === 'aprendiz') {
    revealedEnemyCard = enemyDeck.shift();
  } else if (difficulty === 'combatiente') {
    revealedEnemyCard = combatienteAiSelectCard([...playerHand]);
  } else if (difficulty === 'sensei') {
    revealedEnemyCard = senseiAiSelectCard([...playerHand]);
  }

  if (!revealedEnemyCard) {
    endGame('player');
    return;
  }

  const result = determineWinner(playerCard, revealedEnemyCard);
  if (result === 'player') enemyHealth--;
  else if (result === 'enemy') playerHealth--;

  playerHand[selectedCard] = 'used';

  setTimeout(() => {
    if (playerHealth <= 0 || enemyHealth <= 0) {
      endGame(playerHealth > 0 ? 'player' : 'enemy');
      return;
    }

    turn = 'enemy';
    setTimeout(() => {
      enemyHand[enemyIndex] = 'back';
      turn = 'player';
      startTurnTimer();
    }, 1000);
  }, 1000);
}

function determineWinner(playerCard, enemyCard) {
  if (!playerCard || !enemyCard) return 'draw';
  if (playerCard === enemyCard) return 'draw';
  if ((playerCard === 'fire' && enemyCard === 'snow') ||
      (playerCard === 'snow' && enemyCard === 'water') ||
      (playerCard === 'water' && enemyCard === 'fire')) {
    return 'player';
  } else {
    return 'enemy';
  }
}

window.onload = () => {
  document.getElementById("difficultyScreen").classList.add("hidden");
  document.getElementById("gameCanvas").style.display = "none";
  document.getElementById("endScreen").classList.add("hidden");
};

let turnInterval = null;
let timerInterval = setInterval(updateTimer, 1000);
requestAnimationFrame(gameLoop);