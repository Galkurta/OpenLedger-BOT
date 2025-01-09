# OpenLedger Auto Claim Bot

An automated bot for claiming daily rewards on OpenLedger Testnet.

## Features

- Automatic daily reward claiming
- User information display
- Streak tracking
- Countdown timer for next claim
- Colorful console output
- Error handling

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone this repository

```bash
git clone https://github.com/Galkurta/OpenLedger-BOT.git
cd OpenLedger-BOT
```

2. Install dependencies

```bash
npm install
```

## Getting Started

1. Register on [OpenLedger Testnet](https://testnet.openledger.xyz/?referral_code=2du2b3wjeu)

2. Get your JWT Token

- Login to your OpenLedger Testnet account
- Go to Dashboard
- Press F12 or right-click and select 'Inspect' to open Developer Tools
- Go to Network tab
- Look for any request and find the 'Authorization' header value
- Copy the token (it starts with "Bearer ")

3. Create edit data.txt file in the project root`

4. Run the bot

```bash
node main.js
```

## Features Explanation

- **User Info**: Displays your address, ID, and referral code
- **Claim Details**: Shows your tier, daily point allocation, and claim status
- **Streak Info**: Tracks your consecutive daily claims
- **Auto Claim**: Automatically claims rewards when available
- **Countdown Timer**: Shows time remaining until next claim

## Configuration Files

The bot uses several configuration files located in the `config` folder:

- `banner.js`: ASCII art banner display
- `colors.js`: Console color configurations
- `countdown.js`: Countdown timer implementation
- `logger.js`: Winston logger configuration

## Error Handling

The bot includes comprehensive error handling:

- Token reading errors
- API request failures
- Network issues
- Invalid responses

If any error occurs, the bot will:

1. Log the error with details
2. Wait for 1 hour
3. Attempt to retry the operation

## Automatic Retries

The bot will automatically retry in case of:

- Failed claims
- Network errors
- API issues
- Authentication problems

## Contributing

Feel free to fork this repository and submit pull requests for any improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This bot is for educational purposes only. Use it at your own risk. The developer is not responsible for any account-related issues or potential losses.
