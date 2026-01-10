document.addEventListener("DOMContentLoaded", () => {

  const main = document.querySelector("main[data-materia]");
  if (!main) return;

  const materia = main.dataset.materia;

  const checkboxes = main.querySelectorAll("input[type='checkbox']");
  const circle = document.querySelector(".progress-circle .progress");
  const text = document.querySelector(".progress-text");

  if (!checkboxes.length) return;

  const checksKey = `materia-${materia}-checks`;
  const percentKey = `materia-${materia}-percent`;

  // ---- carregar estado salvo ----
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem(checksKey)) || [];
  } catch {
    saved = [];
  }

  checkboxes.forEach((cb, i) => {
    cb.checked = saved[i] === true;
  });

  // ---- atualizar progresso ----
  function updateProgress() {
    const total = checkboxes.length;
    const done = [...checkboxes].filter(cb => cb.checked).length;
    const percent = Math.round((done / total) * 100);

    if (circle) {
      circle.setAttribute("stroke-dasharray", `${percent},100`);
    }
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
