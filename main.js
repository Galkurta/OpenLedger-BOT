const fs = require("fs");
const axios = require("axios");
const displayBanner = require("./config/banner");
const colors = require("./config/colors");
const CountdownTimer = require("./config/countdown");
const logger = require("./config/logger");

const BASE_URL = "https://apitn.openledger.xyz";
const REWARDS_URL = "https://rewardstn.openledger.xyz";

const printDivider = () => {
  logger.info(
    `${colors.bannerBorder}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`
  );
};

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

const api = axios.create({
  headers: {
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Ch-Ua":
      '"Google Chrome";v="131", "Chromium";v="131", "Not_A_Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  },
});

const formatTime = (date) => {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "long",
  });
};

async function getUserInfo() {
  try {
    const token = getToken();
    const response = await api.get(`${BASE_URL}/api/v1/users/me`, {
      headers: { Authorization: token },
    });
    printDivider();
    logger.info(`${colors.accountInfo}[USER INFO]${colors.reset}`);
    logger.info(
      `${colors.accountInfo}▸ Address    : ${colors.accountName}${response.data.data.address}${colors.reset}`
    );
    logger.info(
      `${colors.accountInfo}▸ ID         : ${colors.accountName}${response.data.data.id}${colors.reset}`
    );
    logger.info(
      `${colors.accountInfo}▸ Referral   : ${colors.accountName}${response.data.data.referral_code}${colors.reset}`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `${colors.accountWarning}Failed to get user info: ${
        error.response?.data || error.message
      }${colors.reset}`
    );
    return null;
  }
}

async function getClaimDetails() {
  try {
    const token = getToken();
    const response = await api.get(`${REWARDS_URL}/api/v1/claim_details`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    printDivider();
    logger.info(`${colors.faucetInfo}[CLAIM DETAILS]${colors.reset}`);
    logger.info(
      `${colors.faucetInfo}▸ Tier       : ${colors.accountName}${response.data.data.tier}${colors.reset}`
    );
    logger.info(
      `${colors.faucetInfo}▸ Daily Point : ${colors.accountName}${response.data.data.dailyPoint}${colors.reset}`
    );
    const status = response.data.data.claimed
      ? `${colors.faucetWait}Claimed${colors.reset}`
      : `${colors.faucetSuccess}Available${colors.reset}`;
    logger.info(`${colors.faucetInfo}▸ Status     : ${status}`);
    return response.data;
  } catch (error) {
    logger.error(
      `${colors.faucetError}Failed to get claim details: ${
        error.response?.data || error.message
      }${colors.reset}`
    );
    return null;
  }
}

async function getStreakInfo() {
  try {
    const token = getToken();
    const response = await api.get(`${REWARDS_URL}/api/v1/streak`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    printDivider();
    logger.info(`${colors.taskInProgress}[STREAK INFO]${colors.reset}`);
    const claimedDays = response.data.data.filter(
      (day) => day.isClaimed
    ).length;
    logger.info(
      `${colors.taskInProgress}▸ Current    : ${colors.taskComplete}${claimedDays} days${colors.reset}`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `${colors.taskFailed}Failed to get streak info: ${
        error.response?.data || error.message
      }${colors.reset}`
    );
    return null;
  }
}

async function claimReward() {
  try {
    const token = getToken();
    const response = await api.get(`${REWARDS_URL}/api/v1/claim_reward`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.status === "SUCCESS") {
      printDivider();
      logger.success(`${colors.faucetSuccess}[CLAIM SUCCESS]${colors.reset}`);
      logger.info(
        `${colors.faucetInfo}▸ Message    : ${colors.faucetSuccess}Daily reward claimed successfully!${colors.reset}`
      );
      logger.info(
        `${colors.faucetInfo}▸ Next Claim : ${colors.faucetSuccess}${formatTime(
          response.data.data.nextClaim
        )}${colors.reset}`
      );
    }
    return response.data;
  } catch (error) {
    logger.error(
      `${colors.faucetError}Failed to claim reward: ${
        error.response?.data || error.message
      }${colors.reset}`
    );
    return null;
  }
}

async function startCountdown(nextClaimTime) {
  const nextClaim = new Date(nextClaimTime);
  const now = new Date();
  const delayInSeconds = Math.max(0, Math.floor((nextClaim - now) / 1000));

  if (delayInSeconds <= 0) {
    return 0;
  }

  printDivider();
  logger.warn(`${colors.timerWarn}[NEXT CLAIM]${colors.reset}`);

  const countdownTimer = new CountdownTimer({
    message: "▸ Waiting    : ",
    colors: {
      message: colors.timerCount,
      timer: colors.timerWarn,
      reset: colors.reset,
    },
  });

  await countdownTimer.start(delayInSeconds);
  return delayInSeconds * 1000;
}

async function runAutoClaim() {
  displayBanner();
  logger.info(
    `${colors.menuOption}▸ Time       : ${colors.info}${formatTime(
      new Date()
    )}${colors.reset}`
  );

  try {
    const userInfo = await getUserInfo();
    if (!userInfo) {
      logger.error(
        `${colors.error}Failed to get user info. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    const claimDetails = await getClaimDetails();
    if (!claimDetails) {
      logger.error(
        `${colors.error}Failed to get claim details. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    const streakInfo = await getStreakInfo();
    if (!streakInfo) {
      logger.error(
        `${colors.error}Failed to get streak info. Retrying in 1 hour...${colors.reset}`
      );
      return 60 * 60 * 1000;
    }

    if (!claimDetails.data.claimed) {
      const claimResult = await claimReward();
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

startAutoClaimLoop().catch((error) =>
  logger.error(
    `${colors.error}Auto claim loop failed: ${error.message}${colors.reset}`
  )
);
