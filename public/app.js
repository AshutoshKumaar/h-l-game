const BASE_URL = 'https://beautyglamours-f0ec7.web.app';

const el = {
  status: document.getElementById('status'),
  btnNew: document.getElementById('btnNewRound'),
  btnHigher: document.getElementById('btnHigher'),
  btnLower: document.getElementById('btnLower'),
  leftImage: document.getElementById('leftImage'),
  rightImage: document.getElementById('rightImage'),
  leftName: document.getElementById('leftName'),
  rightName: document.getElementById('rightName'),
  leftMetric: document.getElementById('leftMetric'),
  rightMetric: document.getElementById('rightMetric'),
  result: document.getElementById('result')
};

let currentRound = null;

async function checkApi() {
  try {
    const r = await fetch(BASE_URL + '/health');
    const j = await r.json();
    if (j && j.ok) {
      el.status.textContent = `API: ${j.service} — ${j.storage}`;
    } else {
      el.status.textContent = 'API reachable, unexpected response';
    }
  } catch (err) {
    el.status.textContent = 'API unreachable';
  }
}

function renderCard(side, card, showMetric = false) {
  const imageEl = side === 'left' ? el.leftImage : el.rightImage;
  const nameEl = side === 'left' ? el.leftName : el.rightName;
  const metricEl = side === 'left' ? el.leftMetric : el.rightMetric;

  imageEl.src = card.image || '';
  nameEl.textContent = card.name || 'Unknown';
  metricEl.textContent = showMetric ? (card.metricDisplay || card.metricValue || '—') : (side === 'right' ? 'Hidden' : (card.metricDisplay || '—'));
}

async function newRound() {
  el.result.textContent = '';
  setButtonsDisabled(true);
  try {
    const resp = await fetch(BASE_URL + '/api/game/round', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({metric: 'subscribers'})
    });

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({error:'Unknown error'}));
      el.result.textContent = `Error creating round: ${err.error||resp.status}`;
      setButtonsDisabled(false);
      return;
    }

    const data = await resp.json();
    currentRound = data;
    renderCard('left', data.left, true);
    renderCard('right', data.right, false);
    el.result.textContent = 'Pick Higher or Lower for the right card.';
    setButtonsDisabled(false);
  } catch (e) {
    el.result.textContent = 'Network error creating round.';
    setButtonsDisabled(false);
  }
}

async function submitGuess(guess) {
  if (!currentRound || !currentRound.roundId) return;
  setButtonsDisabled(true);
  el.result.textContent = 'Submitting guess…';
  try {
    const resp = await fetch(BASE_URL + '/api/game/guess', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({roundId: currentRound.roundId, guess})
    });

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({error:'Unknown error'}));
      el.result.textContent = `Error: ${err.error || resp.status}`;
      setButtonsDisabled(false);
      return;
    }

    const result = await resp.json();
    // show both metrics
    renderCard('left', result.left, true);
    renderCard('right', result.right, true);
    el.result.textContent = result.ok ? (result.correct ? `Correct — answer: ${result.answer}` : `Wrong — answer: ${result.answer}`) : 'Unexpected response';
    // clear currentRound to prevent reusing
    currentRound = null;
  } catch (e) {
    el.result.textContent = 'Network error submitting guess.';
  }
}

function setButtonsDisabled(disabled) {
  el.btnHigher.disabled = disabled;
  el.btnLower.disabled = disabled;
}

function attach() {
  el.btnNew.addEventListener('click', newRound);
  el.btnHigher.addEventListener('click', () => submitGuess('higher'));
  el.btnLower.addEventListener('click', () => submitGuess('lower'));
}

window.addEventListener('load', () => { attach(); checkApi(); });
