const colors = require("../config/colors");
const logger = require("../config/logger");
const displayBanner = require("../config/banner");

async function showMenu(rl) {
  displayBanner();
  console.log(`${colors.menuOption}1. Auto Claim Daily${colors.reset}`);
  console.log(`${colors.menuOption}2. Start Heartbeat${colors.reset}`);
  console.log(`${colors.menuOption}3. Exit${colors.reset}`);

  return new Promise((resolve) => {
    rl.question(
      `${colors.menuTitle}Choose option (1-3): ${colors.reset}`,
      (answer) => {
        resolve(answer.trim());
      }
    );
  });
}

module.exports = {
  showMenu,
};
