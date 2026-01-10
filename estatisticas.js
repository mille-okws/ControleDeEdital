document.addEventListener("DOMContentLoaded", () => {
    const CONFIG_KEY = "cycle-config";
    const DIST_KEY = "cycle-distribution";
    const PROGRESS_KEY = "daily-progress";

    const config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || { dailyHours: 0, activeDays: [] };
    const distribution = JSON.parse(localStorage.getItem(DIST_KEY)) || {};
    const dailyProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};

    const subjectIds = Object.keys(distribution);
    const subjectNames = subjectIds.map(id => id.replace(/-/g, ' ').toUpperCase());

    // --- CÁLCULOS TÉCNICOS ---
    const weeklyGoal = config.dailyHours * config.activeDays.length;
    const todayTargetMins = subjectIds.map(id => Math.round((config.dailyHours * 60) * (distribution[id] / 100)));
    const todayDoneMins = subjectIds.map(id => Math.floor((dailyProgress[id] || 0) / 60));
    
    // Total estudado hoje em horas
    const totalMinsToday = todayDoneMins.reduce((a, b) => a + b, 0);
    document.getElementById("total-today").textContent = (totalMinsToday / 60).toFixed(1) + "h";
    document.getElementById("weekly-goal-hrs").textContent = weeklyGoal + "h";
    
    const globalTargetMins = config.dailyHours * 60;
    const efficiency = globalTargetMins > 0 ? Math.min(100, (totalMinsToday / globalTargetMins) * 100) : 0;
    document.getElementById("efficiency-pc").textContent = Math.round(efficiency) + "%";

    /* ================== GRÁFICO DIÁRIO (BARRAS) ================== */
    
    new Chart(document.getElementById('chart-daily'), {
        type: 'bar',
        data: {
            labels: subjectNames,
            datasets: [
                { label: 'Meta', data: todayTargetMins, backgroundColor: '#333' },
                { label: 'Realizado', data: todayDoneMins, backgroundColor: '#2ecc71' }
            ]
        },
        options: {
            indexAxis: 'y', // Barras horizontais para facilitar leitura de nomes longos
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: { 
                x: { grid: { color: '#222' }, ticks: { color: '#888' } },
                y: { ticks: { color: '#888' } }
            }
        }
    });

    /* ================== GRÁFICO SEMANAL (RADAR) ================== */
    // O gráfico de radar mostra a % de conclusão. Se estiver tudo em 100%, o círculo é perfeito.
    
    const radarData = todayDoneMins.map((done, i) => {
        const target = todayTargetMins[i];
        return target > 0 ? Math.min(120, (done / target) * 100) : 0;
    });

    new Chart(document.getElementById('chart-radar'), {
        type: 'radar',
        data: {
            labels: subjectNames,
            datasets: [{
                label: '% de Batimento da Meta',
                data: radarData,
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: '#3498db',
                pointBackgroundColor: '#3498db'
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: '#333' },
                    grid: { color: '#333' },
                    pointLabels: { color: '#aaa', font: { size: 10 } },
                    ticks: { display: false, max: 100 }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    /* ================== TABELA DE MÉTRICAS DETALHADAS ================== */
    const tableContainer = document.getElementById("table-stats-detailed");
    let tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
                <tr style="text-align: left; border-bottom: 2px solid #333; color: var(--primary);">
                    <th style="padding: 10px;">Matéria</th>
                    <th>Peso no Ciclo</th>
                    <th>Meta (Semanal)</th>
                    <th>Progresso Hoje</th>
                    <th>Déficit/Superávit</th>
                </tr>
            </thead>
            <tbody>
    `;

    subjectIds.forEach((id, i) => {
        const weight = distribution[id];
        const weekHours = (weeklyGoal * (weight / 100)).toFixed(1);
        const diff = todayDoneMins[i] - todayTargetMins[i];
        const diffColor = diff >= 0 ? '#2ecc71' : '#e74c3c';

        tableHtml += `
            <tr style="border-bottom: 1px solid #2d2d2d;">
                <td style="padding: 12px;">${subjectNames[i]}</td>
                <td>${weight}%</td>
                <td>${weekHours}h</td>
                <td>${todayDoneMins[i]} min</td>
                <td style="color: ${diffColor}">${diff > 0 ? '+' : ''}${diff} min</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    tableContainer.innerHTML = tableHtml;
});