const fs = require("fs");
const colors = require("../config/colors");
const logger = require("../config/logger");

const getTokens = () => {
  try {
    const tokens = fs
      .readFileSync("data.txt", "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (tokens.length === 0) {
      logger.error(`${colors.error}No tokens found in data.txt${colors.reset}`);
      process.exit(1);
    }
    return tokens.map((token, index) => ({
      token,
      index: index + 1,
    }));
  } catch (error) {
    logger.error(
      `${colors.error}Error reading tokens: ${error.message}${colors.reset}`
    );
    process.exit(1);
  }
};

const getAddresses = () => {
  try {
    const addresses = fs
      .readFileSync("address.txt", "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (addresses.length === 0) {
      logger.error(
        `${colors.error}No addresses found in address.txt${colors.reset}`
      );
      process.exit(1);
    }
    return addresses.map((address, index) => ({
      address,
      index: index + 1,
    }));
  } catch (error) {
    logger.error(
      `${colors.error}Error reading addresses: ${error.message}${colors.reset}`
    );
    process.exit(1);
  }
};

const generateRandomCapacity = () => {
  function getRandomFloat(min, max, decimals = 2) {
    return (Math.random() * (max - min) + min).toFixed(decimals);
  }

  return {
    AvailableMemory: parseFloat(getRandomFloat(16, 64)),
    AvailableStorage: getRandomFloat(500, 1000),
    AvailableGPU: "",
    AvailableModels: [],
  };
};

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
  getTokens,
  getAddresses,
  generateRandomCapacity,
  formatTime,
  printDivider,
};
