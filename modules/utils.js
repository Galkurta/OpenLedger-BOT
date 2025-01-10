const fs = require("fs");
const colors = require("../config/colors");
const logger = require("../config/logger");

const getToken = () => {
  try {
    return fs.readFileSync("data.txt", "utf8").trim();
  } catch (error) {
    logger.error(
      `${colors.error}Error reading token: ${error.message}${colors.reset}`
    );
    process.exit(1);
  }
};

const getAddress = () => {
  try {
    return fs.readFileSync("address.txt", "utf8").trim();
  } catch (error) {
    logger.error(
      `${colors.error}Error reading address: ${error.message}${colors.reset}`
    );
    process.exit(1);
  }
};

function generateRandomCapacity() {
  function getRandomFloat(min, max, decimals = 2) {
    return (Math.random() * (max - min) + min).toFixed(decimals);
  }

  return {
    AvailableMemory: parseFloat(getRandomFloat(16, 64)),
    AvailableStorage: getRandomFloat(500, 1000),
    AvailableGPU: "",
    AvailableModels: [],
  };
}

const formatTime = (date) => {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "long",
  });
};

const printDivider = () => {
  logger.info(
    `${colors.bannerBorder}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
  );
};

module.exports = {
  getToken,
  getAddress,
  generateRandomCapacity,
  formatTime,
  printDivider,
};
