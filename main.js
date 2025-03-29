import "dotenv/config";
import { createInterface } from "readline";
import AutoSwapBot from "./bot/AutoSwapBot.js";
import displayHeader from "./utils/displayHeader.js";
import "colors"; // Add colors module

async function getUserInput() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query.bold.yellow, resolve));

  try {
    displayHeader();

    const txCount = await question("Enter number of transactions to perform: ");
    const hours = await question("Enter time period in hours (optional, press Enter to skip): ");

    if (isNaN(txCount) || parseInt(txCount) <= 0) {
      throw new Error("Please enter a valid number of transactions".red);
    }

    rl.close();

    let delayInSeconds;
    if (hours && hours.trim() !== "") {
      if (isNaN(hours) || parseFloat(hours) <= 0) {
        throw new Error("Please enter a valid number of hours".red);
      }
      delayInSeconds = (parseFloat(hours) * 3600) / parseInt(txCount);
    } else {
      delayInSeconds = "random";
    }

    return {
      txCount: parseInt(txCount),
      delayInSeconds,
    };
  } catch (error) {
    rl.close();
    throw error;
  }
}

async function main() {
  try {
    console.log("\nInitializing 0G SWAP BOT...".cyan.bold);
    console.log("+--------------------+".green);
    console.log("¦   0G SWAP BOT      ¦".green);
    console.log("+--------------------+".green);

    const { txCount, delayInSeconds } = await getUserInput();

    const bot = new AutoSwapBot();
    await bot.setup();
    await bot.executeRandomSwaps(txCount, delayInSeconds);

    console.log("\n?? Bot execution completed successfully!".green.bold);
    console.log("+--------------------+".green);
    console.log("¦     GOODBYE!       ¦".green);
    console.log("+--------------------+".green);
    process.exit(0);
  } catch (error) {
    console.error("? Bot execution failed:".red.bold, error.message.red);
    process.exit(1);
  }
}

main();