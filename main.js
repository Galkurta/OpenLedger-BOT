const readline = require("readline");
const CountdownTimer = require("./config/countdown");
const colors = require("./config/colors");
const logger = require("./config/logger");
const WebSocketClient = require("./modules/wsClient");
const { showMenu } = require("./modules/menu");
const {
  getTokens,
  getAddresses,
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

async function startCountdown(nextClaimTime, accountIndex) {
  try {
    const now = new Date().getTime();
    const nextClaim = new Date(nextClaimTime).getTime();
    const timeLeft = Math.floor((nextClaim - now) / 1000);

    if (timeLeft > 0) {
      printDivider();
      logger.info(
        `${colors.info}[Account #${accountIndex}] [COUNTDOWN]${colors.reset}`
      );
      const timer = new CountdownTimer({
        showCursor: false,
        message: `${colors.timerCount}▸ Next claim in: ${colors.reset}`,
        format: "HH:mm:ss",
        clearOnComplete: true,
      });
      await timer.start(timeLeft);
      return timeLeft * 1000;
    }
    return 0;
  } catch (error) {
    logger.error(
      `${colors.error}[Account #${accountIndex}] Countdown error: ${error.message}${colors.reset}`
    );
    return 60 * 60 * 1000;
  }
}

async function startHeartbeat() {
  const addresses = getAddresses();
  const wsClients = [];

  // Check app version first for one account
  const testToken = await generateToken(addresses[0].address);
  if (!testToken?.token) {
    logger.error(
      `${colors.error}Failed to generate test token. Aborting...${colors.reset}`
    );
    return;
  }

  const versionInfo = await checkAppVersion(testToken.token);
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

  // Start WebSocket clients for all addresses
  for (const account of addresses) {
    logger.info(
      `${colors.info}Starting heartbeat for Account #${account.index}...${colors.reset}`
    );

    let tokenResponse = await generateToken(account.address);
    while (!tokenResponse?.token) {
      logger.warn(
        `${colors.warning}Failed to generate token for Account #${account.index}, retrying in 3s...${colors.reset}`
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      tokenResponse = await generateToken(account.address);
    }

    const wsClient = new WebSocketClient(tokenResponse.token, account.address);
    wsClient.connect();
    wsClients.push(wsClient);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  process.on("SIGINT", () => {
    wsClients.forEach((client) => client.close());
    process.exit(0);
  });
}

async function runAutoClaim(accountData) {
  logger.info(
    `${colors.menuOption}[Account #${accountData.index}] Time: ${
      colors.info
    }${formatTime(new Date())}${colors.reset}`
  );

  try {
    const userInfo = await getUserInfo(accountData.token);
    if (!userInfo) {
      logger.error(
        `${colors.error}[Account #${accountData.index}] Failed to get user info. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    const claimDetails = await getClaimDetails(accountData.token);
    if (!claimDetails) {
      logger.error(
        `${colors.error}[Account #${accountData.index}] Failed to get claim details. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    const streakInfo = await getStreakInfo(accountData.token);
    if (!streakInfo) {
      logger.error(
        `${colors.error}[Account #${accountData.index}] Failed to get streak info. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    if (!claimDetails.data.claimed) {
      const claimResult = await claimReward(accountData.token);
      if (claimResult?.status === "SUCCESS") {
        return startCountdown(claimResult.data.nextClaim, accountData.index);
      }
      return 60 * 60 * 1000;
    } else {
      printDivider();
      logger.warn(
        `${colors.faucetWait}[Account #${accountData.index}] [CLAIM STATUS]${colors.reset}`
      );
      logger.info(
        `${colors.faucetInfo}▸ Status     : ${colors.faucetWait}Already claimed today${colors.reset}`
      );
      logger.info(
        `${colors.faucetInfo}▸ Next Claim : ${colors.faucetWait}${formatTime(
          claimDetails.data.nextClaim
        )}${colors.reset}`
      );
      return startCountdown(claimDetails.data.nextClaim, accountData.index);
    }
  } catch (error) {
    logger.error(
      `${colors.error}[Account #${accountData.index}] Auto claim process failed: ${error.message}${colors.reset}`
    );
    return 60 * 60 * 1000;
  }
}

async function startAutoClaimLoop() {
  const accounts = getTokens();

  while (true) {
    const delays = await Promise.all(
      accounts.map(async (account, index) => {
        await new Promise((resolve) => setTimeout(resolve, index * 2000));
        return runAutoClaim(account);
      })
    );

    const minDelay = Math.min(...delays);
    await new Promise((resolve) => setTimeout(resolve, minDelay));
  }
}

async function main() {
  while (true) {
    const choice = await showMenu(rl);

    switch (choice) {
      case "1":
        logger.info(
          `${colors.info}Starting Auto Claim for multiple accounts...${colors.reset}`
        );
        await startAutoClaimLoop();
        break;

      case "2":
        logger.info(
          `${colors.info}Starting Heartbeat for multiple accounts...${colors.reset}`
        );
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
      break;
    }
  }
}

main().catch((error) => {
  logger.error(
    `${colors.error}Program failed: ${error.message}${colors.reset}`
  );
  process.exit(1);
});
