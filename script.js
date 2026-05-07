const testWrapper = document.querySelector(".test-wrapper");
const testArea = document.querySelector("#test-area");
const originTextParagraph = document.querySelector("#origin-text p");
const resetButton = document.querySelector("#reset");
const theTimer = document.querySelector(".timer");
const wpmDisplay = document.querySelector("#wpm");
const errorDisplay = document.querySelector("#errors");
const topScoresList = document.querySelector("#top-scores");

const borderColors = {
	default: "grey",
	matching: "#1e88e5",
	error: "#e95d0f",
	complete: "#2e7d32"
};

const passages = [
	"The quick brown fox jumps over the lazy dog near the quiet village pond at sunset.",
	"Practice does not make perfect by itself, but steady focused practice makes strong progress every day.",
	"A calm morning routine can improve your concentration, energy, and mood for the rest of the day.",
	"When building software, small readable functions often prevent bugs and make future updates easier.",
	"Typing with accuracy first and speed second usually leads to better long term performance and confidence.",
	"Great developers test edge cases early so unexpected behavior is discovered before it reaches production."
];

const scoreStorageKey = "typingTopScores";

let timer = [0, 0, 0, 0];
let interval;
let timerRunning = false;
let errors = 0;
let mismatchActive = false;
let currentOriginText = originTextParagraph.textContent;


// Add leading zero to numbers 9 or below (purely for aesthetics):
function leadingZero(time) {
	if (time <= 9) {
		time = "0" + time;
	}

	return time;
}


// Run a standard minute/second/hundredths timer:
function runTimer() {
	let currentTime = leadingZero(timer[0]) + ":" + leadingZero(timer[1]) + ":" + leadingZero(timer[2]);
	theTimer.textContent = currentTime;

	timer[3]++;
	timer[0] = Math.floor((timer[3] / 100) / 60);
	timer[1] = Math.floor((timer[3] / 100) - (timer[0] * 60));
	timer[2] = Math.floor(timer[3] - (timer[1] * 100) - (timer[0] * 6000));
	updateWPM();
}


// Match the text entered with the provided text on the page:
function spellCheck() {
	const textEntered = testArea.value;
	const originTextMatch = currentOriginText.substring(0, textEntered.length);

	if (textEntered.length === 0) {
		testWrapper.style.borderColor = borderColors.default;
		mismatchActive = false;
		return;
	}

	if (textEntered === currentOriginText) {
		clearInterval(interval);
		timerRunning = false;
		testWrapper.style.borderColor = borderColors.complete;
		updateWPM();
		saveScore();
	} else if (textEntered === originTextMatch) {
		testWrapper.style.borderColor = borderColors.matching;
		mismatchActive = false;
	} else {
		testWrapper.style.borderColor = borderColors.error;
		if (!mismatchActive) {
			errors++;
			errorDisplay.textContent = errors;
			mismatchActive = true;
		}
	}

	updateWPM();
}


// Start the timer:
function start() {
	const textEnteredLength = testArea.value.length;

	if (textEnteredLength > 0 && !timerRunning) {
		timerRunning = true;
		interval = setInterval(runTimer, 10);
	}
}


function updateWPM() {
	const totalSeconds = timer[3] / 100;
	const totalCharacters = testArea.value.length;

	if (totalSeconds <= 0) {
		wpmDisplay.textContent = "0";
		return;
	}

	const wpm = ((totalCharacters / 5) / (totalSeconds / 60));
	wpmDisplay.textContent = Math.max(0, Math.round(wpm)).toString();
}


function getTopScores() {
	const storedScores = localStorage.getItem(scoreStorageKey);

	if (!storedScores) {
		return [];
	}

	try {
		const parsedScores = JSON.parse(storedScores);
		return Array.isArray(parsedScores) ? parsedScores : [];
	} catch (error) {
		return [];
	}
}


function renderTopScores() {
	const scores = getTopScores();
	topScoresList.innerHTML = "";

	if (scores.length === 0) {
		for (let i = 0; i < 3; i++) {
			const listItem = document.createElement("li");
			listItem.textContent = "--:--:--";
			topScoresList.appendChild(listItem);
		}
		return;
	}

	scores.forEach((score) => {
		const listItem = document.createElement("li");
		listItem.textContent = `${formatTime(score.timeHundredths)} (${score.wpm} WPM)`;
		topScoresList.appendChild(listItem);
	});

	for (let i = scores.length; i < 3; i++) {
		const listItem = document.createElement("li");
		listItem.textContent = "--:--:--";
		topScoresList.appendChild(listItem);
	}
}


function saveScore() {
	const completedHundredths = timer[3];
	const wpm = Number(wpmDisplay.textContent);
	const scores = getTopScores();

	scores.push({
		timeHundredths: completedHundredths,
		wpm
	});

	scores.sort((a, b) => a.timeHundredths - b.timeHundredths);
	const topThree = scores.slice(0, 3);
	localStorage.setItem(scoreStorageKey, JSON.stringify(topThree));
	renderTopScores();
}


function formatTime(totalHundredths) {
	const minutes = Math.floor((totalHundredths / 100) / 60);
	const seconds = Math.floor((totalHundredths / 100) - (minutes * 60));
	const hundredths = Math.floor(totalHundredths - (seconds * 100) - (minutes * 6000));

	return `${leadingZero(minutes)}:${leadingZero(seconds)}:${leadingZero(hundredths)}`;
}


function setRandomPassage() {
	const randomIndex = Math.floor(Math.random() * passages.length);
	currentOriginText = passages[randomIndex];
	originTextParagraph.textContent = currentOriginText;
}


// Reset everything:
function reset() {
	clearInterval(interval);
	interval = null;
	timer = [0, 0, 0, 0];
	timerRunning = false;
	errors = 0;
	mismatchActive = false;

	testArea.value = "";
	theTimer.textContent = "00:00:00";
	testWrapper.style.borderColor = borderColors.default;
	wpmDisplay.textContent = "0";
	errorDisplay.textContent = "0";
	setRandomPassage();
}


// Event listeners for keyboard input and the reset button:
testArea.addEventListener("input", start, false);
testArea.addEventListener("input", spellCheck, false);
resetButton.addEventListener("click", reset, false);

setRandomPassage();
renderTopScores();
