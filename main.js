const readline = require("readline");
const colors = require("./config/colors");
const logger = require("./config/logger");
const CountdownTimer = require("./config/countdown");
const WebSocketClient = require("./modules/wsClient");
const { showMenu } = require("./modules/menu");
const {
  getToken,
  getAddress,
  printDivider,
  formatTime,
} = require("./modules/utils");
const {
  generateToken,
  checkAppVersion,
  getUserInfo,
  getClaimDetails,
  getStreakInfo,
  claimReward,
} = require("./modules/api");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function startCountdown(nextClaimTime) {
  try {
    const now = new Date().getTime();
    const nextClaim = new Date(nextClaimTime).getTime();
    const timeLeft = Math.floor((nextClaim - now) / 1000);

    if (timeLeft > 0) {
      const timer = new CountdownTimer({
        message: "Next claim in: ",
        format: "HH:mm:ss",
      });
      await timer.start(timeLeft);
    }
    return timeLeft > 0 ? timeLeft * 1000 : 0;
  } catch (error) {
    logger.error(
      `${colors.error}Countdown error: ${error.message}${colors.reset}`
    );
    return 60 * 60 * 1000; // Default to 1 hour if error
  }
}

async function startHeartbeat() {
  // Check app version first
  const authToken = getToken();
  const versionInfo = await checkAppVersion(authToken);
  if (!versionInfo) {
    logger.error(
      `${colors.error}Failed to get app version info. Aborting...${colors.reset}`
    );
    return;
  }

  if (versionInfo.under_maintenance) {
    logger.error(
      `${colors.error}App is under maintenance. Please try again later.${colors.reset}`
    );
    return;
  }

  // Get address and generate token
  const address = getAddress();
  let tokenResponse = await generateToken(address);
  while (!tokenResponse?.token) {
    logger.warn(
      `${colors.warning}Failed to generate token, retrying in 3s...${colors.reset}`
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));
    tokenResponse = await generateToken(address);
  }

  logger.success(
    `${colors.success}Token generated successfully${colors.reset}`
  );

  // Create and connect WebSocket client
  const wsClient = new WebSocketClient(tokenResponse.token, address);
  wsClient.connect();

  // Handle process termination
  process.on("SIGINT", () => {
    wsClient.close();
    process.exit(0);
  });
}

async function runAutoClaim() {
  const token = getToken();
  logger.info(
    `${colors.menuOption}▸ Time       : ${colors.info}${formatTime(
      new Date()
    )}${colors.reset}`
  );

  try {
    const userInfo = await getUserInfo(token);
    if (!userInfo) {
      logger.error(
        `${colors.error}Failed to get user info. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    const claimDetails = await getClaimDetails(token);
    if (!claimDetails) {
      logger.error(
        `${colors.error}Failed to get claim details. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    const streakInfo = await getStreakInfo(token);
    if (!streakInfo) {
      logger.error(
        `${colors.error}Failed to get streak info. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    if (!claimDetails.data.claimed) {
      const claimResult = await claimReward(token);
      if (claimResult?.status === "SUCCESS") {
        return startCountdown(claimResult.data.nextClaim);
      }
      return 60 * 60 * 1000;
    } else {
      printDivider();
      logger.warn(`${colors.faucetWait}[CLAIM STATUS]${colors.reset}`);
      logger.info(
        `${colors.faucetInfo}▸ Status     : ${colors.faucetWait}Already claimed today${colors.reset}`
      );
      logger.info(
        `${colors.faucetInfo}▸ Next Claim : ${colors.faucetWait}${formatTime(
          claimDetails.data.nextClaim
        )}${colors.reset}`
      );
      return startCountdown(claimDetails.data.nextClaim);
    }
  } catch (error) {
    logger.error(
      `${colors.error}Auto claim process failed: ${error.message}${colors.reset}`
    );
    return 60 * 60 * 1000;
  }
}

async function startAutoClaimLoop() {
  while (true) {
    const delay = await runAutoClaim();
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

async function main() {
  while (true) {
    const choice = await showMenu(rl);

    switch (choice) {
      case "1":
        logger.info(`${colors.info}Starting Auto Claim...${colors.reset}`);
        await startAutoClaimLoop();
        break;

      case "2":
        logger.info(`${colors.info}Starting Heartbeat...${colors.reset}`);
        await startHeartbeat();
        break;

      case "3":
        logger.info(`${colors.info}Exiting...${colors.reset}`);
        rl.close();
        process.exit(0);
        break;

      default:
        logger.error(
          `${colors.error}Invalid option. Please try again.${colors.reset}`
        );
        break;
    }

    if (choice === "1" || choice === "2") {
      break; // Exit the menu loop if a valid service is started
    }
  }
}

// Start the program
main().catch((error) => {
  logger.error(
    `${colors.error}Program failed: ${error.message}${colors.reset}`
  );
  process.exit(1);
});
