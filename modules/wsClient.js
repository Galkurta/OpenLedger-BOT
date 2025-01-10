const WebSocket = require("ws");
const crypto = require("crypto");
const colors = require("../config/colors");
const logger = require("../config/logger");
const { WS_URL, WS_HEADERS } = require("./constants");
const { generateRandomCapacity, printDivider } = require("./utils");

class WebSocketClient {
  constructor(authToken, address) {
    this.url = `${WS_URL}?authToken=${authToken}`;
    this.ws = null;
    this.reconnect = true;
    this.intervalId = null;
    this.registered = false;
    this.address = address;
    this.identity = Buffer.from(address).toString("base64");
    this.capacity = generateRandomCapacity();
    this.id = crypto.randomUUID();

    this.heartbeat = {
      message: {
        Worker: {
          Identity: this.identity,
          ownerAddress: this.address,
          type: "LWEXT",
          Host: "chrome-extension://ekbbplmjjgoobhdlffmgeokalelnmjjc",
        },
        Capacity: this.capacity,
      },
      msgType: "HEARTBEAT",
      workerType: "LWEXT",
      workerID: this.identity,
    };

    this.regWorkerID = {
      workerID: this.identity,
      msgType: "REGISTER",
      workerType: "LWEXT",
      message: {
        id: this.id,
        type: "REGISTER",
        worker: {
          host: "chrome-extension://ekbbplmjjgoobhdlffmgeokalelnmjjc",
          identity: this.identity,
          ownerAddress: this.address,
          type: "LWEXT",
        },
      },
    };
  }

  loadJobData = async (message) => {
    if (message?.MsgType === "JOB") {
      this.sendMessage({
        workerID: this.identity,
        msgType: "JOB_ASSIGNED",
        workerType: "LWEXT",
        message: {
          Status: true,
          Ref: message?.UUID,
        },
      });
    }
  };

  connect() {
    this.ws = new WebSocket(this.url, {
      headers: WS_HEADERS,
    });

    this.ws.on("open", () => {
      logger.success(
        `${colors.success}[WEBSOCKET] Connected successfully${colors.reset}`
      );
      printDivider();

      if (!this.registered) {
        logger.info(
          `${colors.info}Trying to register worker ID...${colors.reset}`
        );
        this.sendMessage(this.regWorkerID);
        this.registered = true;
      }

      this.intervalId = setInterval(() => {
        logger.info(`${colors.info}Sending heartbeat...${colors.reset}`);
        this.sendMessage(this.heartbeat);
      }, 30 * 1000);
    });

    this.ws.on("message", (data) => {
      try {
        const message = JSON.parse(data);

        if (message?.MsgType === "JOB") {
          this.loadJobData(message);
        } else if (message && message.data) {
          logger.info(
            `${colors.info}[WEBSOCKET] Message received: ${JSON.stringify(
              message.data
            )}${colors.reset}`
          );
        }

        if (message.workerId && message.msgType === "REGISTER") {
          const worker = message.worker;
          logger.info(`${colors.info}[WORKER REGISTRATION]${colors.reset}`);
          logger.info(
            `${colors.info}▸ ID         : ${colors.accountName}${message.workerId}${colors.reset}`
          );
          logger.info(
            `${colors.info}▸ Type       : ${colors.accountName}${worker.type}${colors.reset}`
          );
          logger.info(
            `${colors.info}▸ Host       : ${colors.accountName}${worker.host}${colors.reset}`
          );
          printDivider();
        }
      } catch (error) {
        logger.error(
          `${colors.error}Failed to parse message: ${error.message}${colors.reset}`
        );
      }
    });

    this.ws.on("error", (error) => {
      logger.error(
        `${colors.error}[WEBSOCKET] Error: ${error.message}${colors.reset}`
      );
      printDivider();
    });

    this.ws.on("close", (code, reason) => {
      logger.warn(
        `${colors.warning}[WEBSOCKET] Connection closed (${code}): ${reason}${colors.reset}`
      );
      printDivider();
      clearInterval(this.intervalId);

      if (this.reconnect) {
        logger.info(
          `${colors.info}Reconnecting in 5 seconds...${colors.reset}`
        );
        setTimeout(() => this.connect(), 5000);
      }
    });

    return this;
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.error(
        `${colors.error}WebSocket connection is not open, cannot send message${colors.reset}`
      );
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.reconnect = false;
    }
  }
}

module.exports = WebSocketClient;
