const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function initDatabase() {
  const dbPath = path.join(__dirname, 'climate_dashboard.db');
  const db = new sqlite3.Database(dbPath);

  // Create tables
  db.serialize(() => {
    // Scenarios table
    db.run(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_input TEXT NOT NULL,
        theme TEXT NOT NULL,
        alt_forecasts TEXT NOT NULL,
        narrative TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert seed scenario
    const seedScenario = {
      user_input: "What if we master fusion energy before 2025?",
      theme: "A fusion-powered renaissance reshaping civilization's energy landscape",
      alt_forecasts: JSON.stringify({
        global_temp_2100: 1.8,
        death_toll_annual: 180000,
        refugees: 12000000,
        arable_land_loss_percent: 8,
        population: 9.8e9,
        biodiversity_loss_percent: 22,
        gdp_loss_percent: 3
      }),
      narrative: `In 2025, humanity achieved what seemed impossible: commercial fusion energy became a reality. The breakthrough came not from massive government programs, but from a convergence of AI-assisted plasma physics, advanced materials science, and a desperate race against climate catastrophe.

The immediate effects were transformative. Within five years, fusion plants began replacing coal and gas facilities worldwide. Carbon emissions plummeted by 40% by 2030, buying humanity precious time to implement other climate solutions. The energy abundance sparked a new industrial revolution, with desalination plants proliferating along coastlines, turning arid regions into agricultural breadbaskets.

Yet the transition wasn't without its challenges. The fossil fuel industry's collapse created economic upheaval, while energy abundance led to new forms of consumption and waste. By 2100, global temperatures stabilized at 1.8°C above pre-industrial levels—still dangerous, but manageable. The fusion revolution had given humanity a fighting chance, though the deeper lesson was clear: technological breakthroughs alone couldn't solve the complex web of social, economic, and environmental challenges that climate change had woven.`
    };

    // Check if seed data already exists
    db.get("SELECT COUNT(*) as count FROM scenarios WHERE user_input = ?", [seedScenario.user_input], (err, row) => {
      if (err) {
        console.error('Error checking seed data:', err);
        return;
      }
      
      if (row.count === 0) {
        // Insert seed scenario
        const stmt = db.prepare(`
          INSERT INTO scenarios (user_input, theme, alt_forecasts, narrative)
          VALUES (?, ?, ?, ?)
        `);
        
        stmt.run(
          seedScenario.user_input,
          seedScenario.theme,
          seedScenario.alt_forecasts,
          seedScenario.narrative
        );
        
        stmt.finalize();
        console.log('Seed scenario inserted successfully');
      } else {
        console.log('Seed scenario already exists');
      }
    });
  });

  return db;
}

module.exports = initDatabase;
