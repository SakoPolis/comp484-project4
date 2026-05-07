let testWrapper;
let testArea;
let originTextParagraph;
let resetButton;
let theTimer;
let wpmDisplay;
let errorDisplay;
let topScoresList;

const borderColors = {
	default: "grey",
	matching: "#1e88e5",
	error: "#e95d0f",
	complete: "#2e7d32"
};

const themePassages = {
	gruvbox: [
		"In the low light of the workshop, the wooden desk held tools worn smooth by patient hands.",
		"A warm cup on a cold evening and the soft glow of the lamp make steady work feel timeless.",
		"Simple routines, practiced quietly, build the strong habits that steady a busy life.",
		"Old vinyl records crackle as the kettle whistles, and the house settles into familiar rhythms.",
		"Careful steps through a well-known path bring comfort more than haste ever could."
	],
	evangelion: [
		"This is the impenetrable Wall of Jericho. Take one step over this wall and you're a dead man.",
		"Never underestimate the ability of the human animal to adapt to its environment.",
		"Correct. An object tens of millimeters in diameter crashed into Antarctica at more than ten percent of the speed of light!",
		"God's in his heaven. All's right with the world.",
		"Is it okay to see these? What a surprise! This is INT-C! With these, we can program much faster than we thought, right, Ma'am?"
	],
	cyberpunk: [
		"Wake the fuck up, Samurai. We have a city to burn.",
		"I saw corps strip farmers of water... and eventually of land.",
		"It's a war against the fuckin' forces of entropy, understand?!",
		"First, bullet to the brain would've ended you on the spot. Second, woulda never survived the rest 'thout my expert advice.",
		"Whatever, choom. Like I give a shit.",
		"Huh, you just discovered what it takes to become a legend... Grab your iron - let's mobilize."
	]
};

const scoreStorageKey = "typingTopScores";

let timer = [0, 0, 0, 0];
let interval;
let timerRunning = false;
let errors = 0;
let mismatchActive = false;
let currentOriginText = "";


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
	// Determine active theme by checking the select in DOM, then localStorage, then default
	const themeSelectEl = document.querySelector('#theme-select');
	const activeTheme = (themeSelectEl && themeSelectEl.value) || localStorage.getItem('typingTestTheme') || 'gruvbox';
	const pool = themePassages[activeTheme] || themePassages['gruvbox'];
	const randomIndex = Math.floor(Math.random() * pool.length);
	currentOriginText = pool[randomIndex];
	if (originTextParagraph) originTextParagraph.textContent = currentOriginText;
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
function init() {
	// Query DOM elements now that DOM is ready
	testWrapper = document.querySelector(".test-wrapper");
	testArea = document.querySelector("#test-area");
	originTextParagraph = document.querySelector("#origin-text p");
	resetButton = document.querySelector("#reset");
	theTimer = document.querySelector(".timer");
	wpmDisplay = document.querySelector("#wpm");
	errorDisplay = document.querySelector("#errors");
	topScoresList = document.querySelector("#top-scores");

	// Attach event listeners
	testArea.addEventListener("input", start, false);
	testArea.addEventListener("input", spellCheck, false);
	resetButton.addEventListener("click", reset, false);

	// Prevent pasting to ensure user types the text manually
	testArea.addEventListener('paste', function (e) {
		e.preventDefault();
		if (testWrapper) testWrapper.style.borderColor = borderColors.error;
		if (!mismatchActive) {
			errors++;
			if (errorDisplay) errorDisplay.textContent = errors;
			mismatchActive = true;
		}
	});

	// Block Ctrl+V / Cmd+V
	testArea.addEventListener('keydown', function (e) {
		if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
			e.preventDefault();
			if (testWrapper) testWrapper.style.borderColor = borderColors.error;
			if (!mismatchActive) {
				errors++;
				if (errorDisplay) errorDisplay.textContent = errors;
				mismatchActive = true;
			}
		}
	});

	// Prevent dropping text into the textarea
	testArea.addEventListener('drop', function (e) {
		e.preventDefault();
		if (testWrapper) testWrapper.style.borderColor = borderColors.error;
	});

	// Theme switching: swap body classes and persist selection
	const themeSelectLocal = document.querySelector('#theme-select');
	const themeStorageKey = 'typingTestTheme';

	function applyTheme(name) {
		document.body.classList.remove('theme-gruvbox', 'theme-evangelion', 'theme-cyberpunk');
		if (name === 'gruvbox') document.body.classList.add('theme-gruvbox');
		if (name === 'evangelion') document.body.classList.add('theme-evangelion');
		if (name === 'cyberpunk') document.body.classList.add('theme-cyberpunk');
	}

	function saveTheme(name) {
		try { localStorage.setItem(themeStorageKey, name); } catch (e) {}
	}

	if (themeSelectLocal) {
		themeSelectLocal.addEventListener('change', function (e) {
			applyTheme(e.target.value);
			saveTheme(e.target.value);
			// refresh passage when theme changes
			setRandomPassage();
		});
	}

	// Initialize theme from storage (or default to gruvbox)
	try {
		const stored = localStorage.getItem(themeStorageKey) || 'gruvbox';
		if (themeSelectLocal) themeSelectLocal.value = stored;
		applyTheme(stored);
	} catch (e) {
		if (themeSelectLocal) themeSelectLocal.value = 'gruvbox';
		applyTheme('gruvbox');
	}

	// set initial passage and scores
	setRandomPassage();
	renderTopScores();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
