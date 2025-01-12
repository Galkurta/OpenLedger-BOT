const axios = require("axios");
const colors = require("../config/colors");
const logger = require("../config/logger");
const { printDivider, formatTime } = require("./utils");
const { BASE_URL, REWARDS_URL, HEADERS } = require("./constants");

async function generateToken(address) {
  try {
    logger.info(
      `${colors.info}Generating token for address: ${address}${colors.reset}`
    );

    const response = await axios.post(
      `${BASE_URL}/api/v1/auth/generate_token`,
      { address },
      {
        headers: {
          ...HEADERS,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.data?.token) {
      logger.success(
        `${colors.success}Token generated successfully${colors.reset}`
      );
      return response.data.data;
    }

    logger.error(
      `${colors.error}Invalid response format from generate token API${colors.reset}`
    );
    return null;
  } catch (error) {
    if (error.response) {
      logger.error(
        `${colors.error}Failed to generate token (${error.response.status}): ${
          error.response?.data?.message || JSON.stringify(error.response?.data)
        }${colors.reset}`
      );
    } else if (error.request) {
      logger.error(
        `${colors.error}No response received from server: ${error.message}${colors.reset}`
      );
    } else {
      logger.error(
        `${colors.error}Error setting up request: ${error.message}${colors.reset}`
      );
    }
    return null;
  }
}

async function checkAppVersion(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/auth/app_version`, {
      params: { platform: "extension" },
      headers: {
        ...HEADERS,
        Authorization: token,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "none",
      },
    });

    logger.info(`${colors.info}[VERSION CHECK]${colors.reset}`);
    logger.info(
      `${colors.info}▸ Platform   : ${colors.accountName}${response.data.platform}${colors.reset}`
    );
    logger.info(
      `${colors.info}▸ Version    : ${colors.accountName}${response.data.version}${colors.reset}`
    );
    logger.info(
      `${colors.info}▸ Status     : ${colors.accountName}${
        response.data.under_maintenance ? "Under Maintenance" : "Online"
      }${colors.reset}`
    );
    printDivider();

    return response.data;
  } catch (error) {
    logger.error(
      `${colors.error}Failed to check app version: ${
        error.response?.data || error.message
      }${colors.reset}`
    );
    return null;
  }
}

async function getUserInfo(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/users/me`, {
      headers: {
        ...HEADERS,
        Authorization: token,
      },
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

async function getClaimDetails(token) {
  try {
    const response = await axios.get(`${REWARDS_URL}/api/v1/claim_details`, {
      headers: {
        ...HEADERS,
        Authorization: `Bearer ${token}`,
      },
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

async function getStreakInfo(token) {
  try {
    const response = await axios.get(`${REWARDS_URL}/api/v1/streak`, {
      headers: {
        ...HEADERS,
        Authorization: `Bearer ${token}`,
      },
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

async function claimReward(token) {
  try {
    const response = await axios.get(`${REWARDS_URL}/api/v1/claim_reward`, {
      headers: {
        ...HEADERS,
        Authorization: `Bearer ${token}`,
      },
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

module.exports = {
  generateToken,
  checkAppVersion,
  getUserInfo,
  getClaimDetails,
  getStreakInfo,
  claimReward,
};
