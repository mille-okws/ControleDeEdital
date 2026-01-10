// hoje.js — CONTROLE DIÁRIO COM TIMER REAL (BACKGROUND SAFE)

document.addEventListener("DOMContentLoaded", () => {
  /* ================== CHAVES ================== */
  const CONFIG_KEY = "cycle-config";
  const DIST_KEY = "cycle-distribution";
  const PROGRESS_KEY = "daily-progress";
  const ACTIVE_TIMER_KEY = "active-timer";

  const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const todayIndex = new Date().getDay();

  /* ================== DOM ================== */
  const dailyTargetEl = document.getElementById("daily-target");
  const dailyDoneEl = document.getElementById("daily-done");
  const dailyRemainingEl = document.getElementById("daily-remaining");
  const progressBarEl = document.getElementById("daily-progress-bar");
  const dateDisplayEl = document.getElementById("current-date-display");

  const subjectsListEl = document.getElementById("today-subjects-list");
  const activeSubjectTitleEl = document.getElementById("active-subject-title");
  const mainTimerEl = document.getElementById("main-timer");

  const btnStart = document.getElementById("btn-start");
  const btnPause = document.getElementById("btn-pause");
  const btnStop = document.getElementById("btn-stop");
  const btnClear = document.getElementById("btn-clear-logs");
  const logListEl = document.getElementById("session-log-list");

  /* ================== ESTADO ================== */
  let config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || { dailyHours: 0, activeDays: [] };
  let distribution = JSON.parse(localStorage.getItem(DIST_KEY)) || {};
  let dailyProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};

  let activeSubjectId = null;
  let timerInterval = null;

  let timerState = {
    running: false,
    startTime: null,
    accumulated: 0
  };

  /* ================== INIT ================== */
  function init() {
    const dateStr = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    dateDisplayEl.textContent = dateStr;

    if (!config.activeDays.includes(todayIndex)) {
      subjectsListEl.innerHTML = "<p>Hoje é dia de descanso.</p>";
      return;
    }

    restoreActiveTimer();
    renderTodaySubjects();
    updateGlobalStats();
    updateTimerDisplay();
  }

  /* ================== TEMPO REAL ================== */
  function getElapsedSeconds() {
    if (!timerState.running || !timerState.startTime) {
      return timerState.accumulated;
    }
    const now = Date.now();
    return timerState.accumulated + Math.floor((now - timerState.startTime) / 1000);
  }

  function updateTimerDisplay() {
    const total = getElapsedSeconds();
    const h = Math.floor(total / 3600).toString().padStart(2, "0");
    const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    mainTimerEl.textContent = `${h}:${m}:${s}`;
  }

  /* ================== STATS ================== */
  function updateGlobalStats() {
    const targetSeconds = config.dailyHours * 3600;
    const doneSeconds = Object.values(dailyProgress).reduce((a, b) => a + b, 0);

    const h = Math.floor(doneSeconds / 3600);
    const m = Math.floor((doneSeconds % 3600) / 60);

    dailyTargetEl.textContent = `${config.dailyHours}h`;
    dailyDoneEl.textContent = `${h}h ${m}m`;

    const remaining = Math.max(0, config.dailyHours - doneSeconds / 3600);
    dailyRemainingEl.textContent = `${remaining.toFixed(1)}h`;

    const percent = targetSeconds > 0 ? Math.min(100, (doneSeconds / targetSeconds) * 100) : 0;
    progressBarEl.style.width = `${percent}%`;
  }

  /* ================== MATÉRIAS ================== */
  function renderTodaySubjects() {
    subjectsListEl.innerHTML = "";

    Object.keys(distribution).forEach(id => {
      const percent = distribution[id];
      const target = config.dailyHours * 3600 * (percent / 100);
      const done = dailyProgress[id] || 0;
      const progress = target > 0 ? Math.min(100, (done / target) * 100) : 0;

      const name = id.replace(/-/g, " ").toUpperCase();

      const card = document.createElement("div");
      card.className = `subject-card ${activeSubjectId === id ? "active" : ""} ${progress >= 100 ? "completed" : ""}`;

      card.innerHTML = `
        <div class="subject-info">
          <strong>${name}</strong>
          <div class="progress-mini">
            <div class="progress-mini-fill" style="width:${progress}%"></div>
          </div>
          <small>${Math.floor(done / 60)}m de ${Math.round(target / 60)}m</small>
        </div>
        <button class="btn-focus">Focar</button>
      `;

      card.querySelector(".btn-focus").onclick = () => selectSubject(id, name);
      subjectsListEl.appendChild(card);
    });
  }

  /* ================== SELEÇÃO ================== */
  function selectSubject(id, name) {
    if (timerState.running) stopTimer();

    activeSubjectId = id;
    activeSubjectTitleEl.textContent = `A estudar: ${name}`;

    timerState = { running: false, startTime: null, accumulated: 0 };
    updateTimerDisplay();
    renderTodaySubjects();

    btnStart.style.display = "inline-block";
    btnPause.style.display = "none";
    btnStop.style.display = "none";
  }

  /* ================== CONTROLES ================== */
  btnStart.onclick = () => {
    if (!activeSubjectId) return alert("Seleciona uma matéria");

    timerState.running = true;
    timerState.startTime = Date.now();

    btnStart.style.display = "none";
    btnPause.style.display = "inline-block";
    btnStop.style.display = "inline-block";

    if (!timerInterval) {
      timerInterval = setInterval(updateTimerDisplay, 1000);
    }
  };

  btnPause.onclick = () => {
    if (!timerState.running) return;

    timerState.accumulated = getElapsedSeconds();
    timerState.running = false;
    timerState.startTime = null;

    btnStart.style.display = "inline-block";
    btnPause.style.display = "none";
  };

  btnStop.onclick = stopTimer;

  function stopTimer() {
    if (timerState.running) {
      timerState.accumulated = getElapsedSeconds();
    }

    clearInterval(timerInterval);
    timerInterval = null;

    if (activeSubjectId && timerState.accumulated > 0) {
      dailyProgress[activeSubjectId] =
        (dailyProgress[activeSubjectId] || 0) + timerState.accumulated;

      localStorage.setItem(PROGRESS_KEY, JSON.stringify(dailyProgress));
      addLog(activeSubjectId, timerState.accumulated);
    }

    localStorage.removeItem(ACTIVE_TIMER_KEY);

    timerState = { running: false, startTime: null, accumulated: 0 };
    updateTimerDisplay();
    updateGlobalStats();
    renderTodaySubjects();

    btnStart.style.display = "inline-block";
    btnPause.style.display = "none";
    btnStop.style.display = "none";
  }

  /* ================== LOG ================== */
  function addLog(id, seconds) {
    if (seconds < 30) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const item = document.createElement("div");
    item.className = "log-item";
    item.innerHTML = `
      <span>${id.replace(/-/g, " ")}</span>
      <strong>+${Math.floor(seconds / 60)} min <small>${now}</small></strong>
    `;
    logListEl.prepend(item);
  }

  btnClear.onclick = () => {
    if (!confirm("Apagar todo o progresso de hoje?")) return;
    dailyProgress = {};
    localStorage.removeItem(PROGRESS_KEY);
    location.reload();
  };

  /* ================== PERSISTÊNCIA ================== */
  function restoreActiveTimer() {
    const saved = JSON.parse(localStorage.getItem(ACTIVE_TIMER_KEY));
    if (!saved) return;

    activeSubjectId = saved.subject;
    timerState.running = true;
    timerState.startTime = saved.startTime;
    timerState.accumulated = saved.accumulated || 0;

    btnStart.style.display = "none";
    btnPause.style.display = "inline-block";
    btnStop.style.display = "inline-block";

    timerInterval = setInterval(updateTimerDisplay, 1000);
  }

  window.addEventListener("beforeunload", () => {
    if (timerState.running) {
      localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify({
        subject: activeSubjectId,
        startTime: timerState.startTime,
        accumulated: timerState.accumulated
      }));
    }
  });

  init();
});
