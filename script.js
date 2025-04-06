let players = [];
let currentRound = 0;
let gameIsOver = false;
let playerCount = 2;

// DOM Elements
const playerSetupDiv = document.getElementById('playerSetup');
const gameAreaDiv = document.getElementById('gameArea');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const playerInputsContainer = document.getElementById('playerInputsContainer');
const startGameBtn = document.getElementById('startGameBtn');
const setupError = document.getElementById('setupError');

const addRoundBtn = document.getElementById('addRoundBtn');
const scoreTable = document.getElementById('scoreTable');
const tableHeaderRow = document.getElementById('tableHeaderRow');
const scoreTableBody = document.getElementById('scoreTableBody');
// Removed tableFooterRow reference
const standingsList = document.getElementById('standingsList');
const gameOverMessage = document.getElementById('gameOverMessage');

const scoreModal = document.getElementById('scoreModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const scoreForm = document.getElementById('scoreForm');
const scoreInputsDiv = document.getElementById('scoreInputs');
const modalTitle = document.getElementById('modalTitle');
const modalError = document.getElementById('modalError');
const submitScoresBtn = document.getElementById('submitScoresBtn');

const revealerSelectContainer = document.getElementById('revealerSelectContainer');
const revealerSelect = document.getElementById('revealerSelect');

// --- Setup Phase ---

addPlayerBtn.addEventListener('click', () => {
    playerCount++;
    const newInputDiv = document.createElement('div');
    newInputDiv.innerHTML = `
        <label for="player${playerCount}">Player ${playerCount} Name:</label>
        <input type="text" id="player${playerCount}" name="playerName[]" required>
    `;
    playerInputsContainer.appendChild(newInputDiv);
});

startGameBtn.addEventListener('click', () => {
    players = [];
    const nameInputs = document.querySelectorAll('#playerInputsContainer input[name="playerName[]"]');
    let allNamesValid = true;
    setupError.classList.add('hidden');
    setupError.textContent = '';

    nameInputs.forEach((input, index) => {
        const name = input.value.trim();
        if (name === '') {
            allNamesValid = false;
        } else {
            const safeId = name.replace(/[^a-zA-Z0-9-_]/g, '-') + '-' + index;
            players.push({ name: name, id: safeId, scores: [], total: 0, tableRow: null, totalCell: null }); // Added tableRow and totalCell references
        }
    });

    if (!allNamesValid) {
         setupError.textContent = 'All player names must be filled.';
         setupError.classList.remove('hidden');
         return;
    }
     if (players.length < 2) {
         setupError.textContent = 'You need at least 2 players to start.';
         setupError.classList.remove('hidden');
        return;
    }

    playerSetupDiv.classList.add('hidden');
    gameAreaDiv.classList.remove('hidden');
    initializeGameUI();
});

// --- Game Initialization ---

function initializeGameUI() {
    // Clear previous game state
    tableHeaderRow.innerHTML = ''; // Clear header
    scoreTableBody.innerHTML = ''; // Clear body
    standingsList.innerHTML = '';
    gameOverMessage.classList.add('hidden');
    gameOverMessage.textContent = '';
    gameOverMessage.className = 'hidden';
    gameIsOver = false;
    addRoundBtn.disabled = false;
    currentRound = 0;

    // Build Initial Table Header
    const playerTh = document.createElement('th');
    playerTh.textContent = 'Player';
    tableHeaderRow.appendChild(playerTh);

    const totalTh = document.createElement('th');
    totalTh.textContent = 'Total';
    tableHeaderRow.appendChild(totalTh);

    // Build Table Body Rows (one per player)
    players.forEach(player => {
        const playerRow = scoreTableBody.insertRow();
        player.tableRow = playerRow; // Store row reference

        const nameCell = playerRow.insertCell();
        nameCell.textContent = player.name;

        const totalCell = playerRow.insertCell();
        totalCell.textContent = '0';
        totalCell.id = `total-${player.id}`; // Assign ID for easy access
        player.totalCell = totalCell; // Store cell reference

    });

    updateStandings();
}


// --- Modal Handling ---

addRoundBtn.addEventListener('click', () => {
    if (gameIsOver) return;
    // currentRound will be incremented just before adding the column header
    modalTitle.textContent = `Enter Scores for Round ${currentRound + 1}`; // Show upcoming round
    scoreInputsDiv.innerHTML = '';
    revealerSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "-- Select Player --";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    revealerSelect.appendChild(defaultOption);

    players.forEach((player, index) => {
        const inputGroup = document.createElement('div');
        inputGroup.innerHTML = `
            <label for="score-player-${index}">${player.name}:</label>
            <input type="number" id="score-player-${index}" required placeholder="Enter score">
        `;
        scoreInputsDiv.appendChild(inputGroup);

        const option = document.createElement('option');
        option.value = index;
        option.textContent = player.name;
        revealerSelect.appendChild(option);
    });

    revealerSelect.value = "";
    modalError.classList.add('hidden');
    modalError.textContent = '';
    scoreModal.style.display = 'block';

    if (scoreInputsDiv.querySelector('input')) {
        scoreInputsDiv.querySelector('input').focus();
    }
});

closeModalBtn.addEventListener('click', () => {
    scoreModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == scoreModal) {
        scoreModal.style.display = 'none';
    }
});


// --- Score Submission ---

scoreForm.addEventListener('submit', (event) => {
    event.preventDefault();
    modalError.classList.add('hidden');
    modalError.textContent = '';

    const roundScores = [];
    let allScoresValid = true;
    const scoreInputs = scoreInputsDiv.querySelectorAll('input[type="number"]');

    scoreInputs.forEach((input, index) => {
        if (input.value === '' || isNaN(parseInt(input.value))) {
            allScoresValid = false;
        }
        roundScores[index] = input.value === '' ? NaN : parseInt(input.value);
    });

    if (!allScoresValid) {
         modalError.textContent = 'Please enter a valid number score for each player.';
         modalError.classList.remove('hidden');
         return;
    }

    const revealerIndex = parseInt(revealerSelect.value);

    if (revealerSelect.value === "" || isNaN(revealerIndex)) {
         modalError.textContent = 'Please select the player who revealed all cards.';
         modalError.classList.remove('hidden');
         return;
    }

    // Apply Skyjo doubling rule
    let finalRoundScores = [...roundScores];
    let lowestScore = Math.min(...roundScores.filter(score => !isNaN(score))); // Find min ignoring NaN potential

    if (roundScores[revealerIndex] > lowestScore) {
        finalRoundScores[revealerIndex] = roundScores[revealerIndex] * 2;
        console.log(`Player ${players[revealerIndex].name}'s score doubled for round ${currentRound + 1}.`);
    }

    // Increment round *before* adding header/cells
    currentRound++;

    // Add New Round Header Column
    const roundTh = document.createElement('th');
    roundTh.textContent = `Round ${currentRound}`;
    tableHeaderRow.appendChild(roundTh);

    // Update player data, add score cells to rows, update total cells
    players.forEach((player, index) => {
        const score = finalRoundScores[index];
        player.scores.push(score);
        player.total = player.scores.reduce((sum, s) => sum + s, 0);

        // Update the total cell (using stored reference)
        if (player.totalCell) {
             player.totalCell.textContent = player.total;
        }

        // Add the score cell for this round to the player's row (using stored reference)
        if (player.tableRow) {
            const scoreCell = player.tableRow.insertCell();
            scoreCell.textContent = score;
        }
    });


    updateStandings(); // Update separate standings list
    checkGameOver();   // Check win condition

    scoreModal.style.display = 'none'; // Close modal
});


// --- UI Updates ---
// updateScoreTable function is removed, logic moved to scoreForm submit handler

function updateStandings() {
    // Sort players by total score, LOWEST score first for display list (matches winning condition)
    const sortedPlayers = [...players].sort((a, b) => a.total - b.total);

    standingsList.innerHTML = ''; // Clear current standings

    if (sortedPlayers.length > 0) {
         sortedPlayers.forEach((player, index) => {
            const standingP = document.createElement('p');
            // Rank calculation needs care for ties, simple index+1 used here
            // With lowest score first, rank 1 is the best current position
            standingP.innerHTML = `${index + 1}. <span>${player.name}:</span> ${player.total}`;
            standingsList.appendChild(standingP);
         });
     } else {
         standingsList.innerHTML = '<p>No scores entered yet.</p>';
     }
}

// --- Game Logic ---

function checkGameOver() {
    let playerReached100 = players.some(player => player.total >= 100);

    if (playerReached100) {
        gameIsOver = true;
        addRoundBtn.disabled = true;

        let lowestScore = Infinity;
        players.forEach(player => {
            if (player.total < lowestScore) {
                lowestScore = player.total;
            }
        });

        const winners = players.filter(p => p.total === lowestScore);

         gameOverMessage.classList.remove('hidden');
         gameOverMessage.classList.add('winner');
         if (winners.length > 1) {
            gameOverMessage.textContent = `Game Over! It's a tie between ${winners.map(w => w.name).join(' and ')} with ${lowestScore} points!`;
            console.log(`Game Over! Tie between: ${winners.map(w => w.name).join(', ')} Score: ${lowestScore}`);
         } else {
            gameOverMessage.textContent = `Game Over! ${winners[0].name} wins with the lowest score of ${lowestScore}!`;
            console.log("Game Over! Winner:", winners[0].name, "Score:", lowestScore);
         }
    }
}