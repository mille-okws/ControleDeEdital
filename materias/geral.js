document.addEventListener("DOMContentLoaded", () => {

  const main = document.querySelector("main[data-materia]");
  if (!main) return;

  const materia = main.dataset.materia;
  const checkboxes = main.querySelectorAll("input[type='checkbox']");
  const text = document.querySelector(".progress-text");
  const header = document.querySelector(".top-bar");

  if (!checkboxes.length || !header) return;

  // ---------- cria barra de progresso dinamicamente ----------
  let barContainer = document.createElement("div");
  barContainer.className = "progress-bar";

  let barFill = document.createElement("div");
  barFill.className = "progress-fill";

  barContainer.appendChild(barFill);
  header.appendChild(barContainer);

  // ---------- chaves de storage ----------
  const checksKey = `materia-${materia}-checks`;
  const percentKey = `materia-${materia}-percent`;

  // ---------- carrega estado salvo ----------
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem(checksKey)) || [];
  } catch {
    saved = [];
  }

  checkboxes.forEach((cb, i) => {
    cb.checked = saved[i] === true;
  });

  // ---------- atualiza progresso ----------
  function updateProgress() {
    const total = checkboxes.length;
    const done = [...checkboxes].filter(cb => cb.checked).length;
    const percent = Math.round((done / total) * 100);

    barFill.style.width = `${percent}%`;

    if (text) {
      text.textContent = `${percent}%`;
    }

    localStorage.setItem(
      checksKey,
      JSON.stringify([...checkboxes].map(cb => cb.checked))
    );
    localStorage.setItem(percentKey, percent);
  }

  checkboxes.forEach(cb =>
    cb.addEventListener("change", updateProgress)
  );

  updateProgress();
});
