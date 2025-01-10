const BASE_URL = "https://apitn.openledger.xyz";
const REWARDS_URL = "https://rewardstn.openledger.xyz";
const WS_URL = "wss://apitn.openledger.xyz/ws/v1/orch";

const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Ch-Ua":
    '"Google Chrome";v="131", "Chromium";v="131", "Not_A_Brand";v="24"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

const WS_HEADERS = {
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Websocket-Extensions": "permessage-deflate; client_max_window_bits",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Host: "apitn.openledger.xyz",
  Origin: "chrome-extension://ekbbplmjjgoobhdlffmgeokalelnmjjc",
};

module.exports = {
  BASE_URL,
  REWARDS_URL,
  WS_URL,
  HEADERS,
  WS_HEADERS,
};
