import { ethers } from "ethers";
import fetch from "node-fetch";
import {
  NETWORK_CONFIG,
  TRADING_PARAMS,
  TOKEN_CONFIG,
  GAS_CONFIG,
  ABIS,
} from "../config/networkConfig.js";
import "colors";

class AutoSwapBot {
  #provider;
  #wallet;
  #contracts = {};

  constructor() {
    this.setup = this.setup.bind(this);
    this.executeRandomSwaps = this.executeRandomSwaps.bind(this);
    this.getTokenBalance = this.getTokenBalance.bind(this);
    this.getAllBalances = this.getAllBalances.bind(this);
    this.executeSwap = this.executeSwap.bind(this);
  }

  async setup() {
    try {
      const privateKey = this.#validatePrivateKey();
      this.#provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpc);
      this.#wallet = new ethers.Wallet(privateKey, this.#provider);

      this.#contracts.router = new ethers.Contract(
        NETWORK_CONFIG.uniswap.router,
        ABIS.router,
        this.#wallet
      );

      this.#contracts.factory = new ethers.Contract(
        NETWORK_CONFIG.uniswap.factory,
        ABIS.factory,
        this.#provider
      );

      console.log(`?? Wallet initialized: ${this.#wallet.address}`.green.bold);
      return true;
    } catch (error) {
      console.error("? Setup failed:".red.bold, error.message.red);
      throw error;
    }
  }

  #validatePrivateKey() {
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    console.log("DEBUG: Checking private key...".cyan); // Debug line
    if (!privateKey || privateKey === "your_private_key_here") {
      throw new Error("Invalid private key in .env file");
    }
    return privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  }

  async getTokenBalance(symbol) {
    const tokenAddress = NETWORK_CONFIG.tokens[symbol];
    if (!tokenAddress) {
      throw new Error(`Invalid token symbol: ${symbol}`.red);
    }

    const tokenContract = new ethers.Contract(tokenAddress, ABIS.erc20, this.#wallet);
    const balance = await tokenContract.balanceOf(this.#wallet.address);
    const decimals = await this.#getTokenDecimals(tokenContract, symbol);

    console.log(`${symbol} Balance: ${ethers.formatUnits(balance, decimals)}`.yellow);
    return balance;
  }

  async #getTokenDecimals(contract, symbol) {
    try {
      return await contract.decimals();
    } catch (error) {
      return TOKEN_CONFIG.decimals[symbol];
    }
  }

  async getAllBalances() {
    const balances = {};
    console.log("+--------- BALANCES ---------+".cyan);
    for (const [symbol, address] of Object.entries(NETWORK_CONFIG.tokens)) {
      try {
        const contract = new ethers.Contract(address, ABIS.erc20, this.#wallet);
        const balance = await contract.balanceOf(this.#wallet.address);
        const decimals = await this.#getTokenDecimals(contract, symbol);

        balances[symbol] = {
          raw: balance,
          formatted: ethers.formatUnits(balance, decimals),
        };
        console.log(`¦ ${symbol.padEnd(4)}: ${balances[symbol].formatted.padStart(10)} ¦`.yellow);
      } catch (error) {
        console.error(`? Error getting ${symbol} balance:`.red, error.message);
        balances[symbol] = { raw: BigInt(0), formatted: "0.0" };
      }
    }
    console.log("+----------------------------+".cyan);
    return balances;
  }

  findSwappableToken(balances) {
    const swappableTokens = Object.entries(balances)
      .filter(
        ([symbol, balance]) =>
          symbol !== "A0GI" &&
          parseFloat(balance.formatted) >= parseFloat(TRADING_PARAMS.minBalanceForSwap)
      )
      .map(([symbol]) => symbol);

    if (swappableTokens.length === 0) {
      throw new Error("No tokens with sufficient balance for swap".red);
    }

    console.log("\n?? Swappable tokens:".cyan, swappableTokens.join(", ").yellow);
    return swappableTokens[Math.floor(Math.random() * swappableTokens.length)];
  }

  getRandomDestinationToken(fromToken) {
    const availableTokens = TOKEN_CONFIG.availablePairs
      .filter((pair) => pair[0] === fromToken)
      .map((pair) => pair[1]);

    if (availableTokens.length === 0) {
      throw new Error(`No available trading pairs for ${fromToken}`.red);
    }

    console.log("?? Available destination tokens:".cyan, availableTokens.join(", ").yellow);
    return availableTokens[Math.floor(Math.random() * availableTokens.length)];
  }

  calculateRandomAmount(balance, symbol) {
    const balanceFloat = parseFloat(balance);
    const percentage = Math.random() * 0.9 + 0.1;
    let amount = balanceFloat * percentage;

    switch (symbol) {
      case "BTC":
        amount = parseFloat(amount.toFixed(8));
        break;
      case "ETH":
        amount = parseFloat(amount.toFixed(6));
        break;
      default:
        amount = parseFloat(amount.toFixed(2));
    }
    return amount.toString();
  }

  async executeRandomSwaps(txCount, delayInSeconds) {
    this.#displayInitialStatus(txCount, delayInSeconds);
    const balances = await this.getAllBalances();
    let completedTx = 0;

    while (completedTx < txCount) {
      let swapSuccess = false;

      while (!swapSuccess) {
        try {
          const fromToken = await this.findSwappableToken(balances);
          const toToken = this.getRandomDestinationToken(fromToken);
          const amount = this.calculateRandomAmount(balances[fromToken].formatted, fromToken);

          console.log(`\n?? Swap ${completedTx + 1}/${txCount}:`.magenta.bold);
          console.log(`?? From: ${fromToken} (${amount})`.yellow);
          console.log(`?? To: ${toToken}`.yellow);

          await this.executeSwap(fromToken, toToken, amount);

          const newBalances = await this.getAllBalances();
          Object.assign(balances, newBalances);

          swapSuccess = true;
          completedTx++;

          if (completedTx < txCount) {
            const nextDelay = this.#calculateNextDelay(delayInSeconds);
            console.log(`\n? Progress: ${completedTx}/${txCount} swaps`.cyan);
            console.log(`?? Waiting ${nextDelay.toFixed(1)}s for next swap...`.blue);
            await new Promise((resolve) => setTimeout(resolve, nextDelay * 1000));
          }
        } catch (error) {
          console.error("? Swap failed:".red.bold, error.message.red);
          console.log("\n?? Retrying immediately with different tokens...".yellow);
        }
      }
    }

    console.log("\n? All scheduled swaps completed!".green.bold);
    console.log(`?? Final Balances:`.cyan);
    await this.getAllBalances();
  }

  #displayInitialStatus(txCount, delayInSeconds) {
    console.log("\n?? Bot Status:".cyan.bold);
    console.log(`?? Target: ${txCount} transactions`.yellow);
    if (delayInSeconds === "random") {
      console.log(`? Delay: Random (${TRADING_PARAMS.minDelay}-${TRADING_PARAMS.maxDelay} seconds)`.blue);
    } else {
      console.log(`? Delay: ~${delayInSeconds.toFixed(1)} seconds`.blue);
    }
    console.log(`?? Min Balance: ${TRADING_PARAMS.minBalanceForSwap}`.yellow);
    console.log("\n?? Initial Balances:".cyan);
  }

  #calculateNextDelay(delayInSeconds) {
    if (delayInSeconds === "random") {
      return Math.floor(
        Math.random() * (TRADING_PARAMS.maxDelay - TRADING_PARAMS.minDelay + 1) +
        TRADING_PARAMS.minDelay
      );
    } else {
      return delayInSeconds * (0.9 + Math.random() * 0.2);
    }
  }

  async executeSwap(fromToken, toToken, amount) {
    try {
      this.#validateSwapPair(fromToken, toToken);
      const tokenIn = NETWORK_CONFIG.tokens[fromToken];
      const tokenOut = NETWORK_CONFIG.tokens[toToken];
      const tokenInContract = new ethers.Contract(tokenIn, ABIS.erc20, this.#wallet);
      const amountIn = ethers.parseUnits(amount.toString(), 18);

      await this.#validateTokenBalance(tokenInContract, amountIn, fromToken, amount);
      console.log("\n?? Swap Progress:".magenta);

      const gasPrice = await this.fetchGasPrice();
      const optimalFeeTier = await this.detectOptimalFeeTier(tokenIn, tokenOut);
      console.log(`?? Using gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`.blue);
      console.log(`?? Using fee tier: ${optimalFeeTier / 10000}%`.blue);

      await this.#approveTokensIfNeeded(tokenInContract, amountIn);
      const usableFeeTier = await this.#findUsablePool(tokenIn, tokenOut);
      const receipt = await this.#performSwap(tokenIn, tokenOut, amountIn, usableFeeTier, gasPrice);

      console.log(`\n? Swap Success:`.green.bold);
      console.log(`?? ${amount} ${fromToken} ? ${toToken}`.yellow);
      console.log(`?? Hash: ${receipt.hash}`.cyan);
      console.log(`? Gas Used: ${receipt.gasUsed} @ ${ethers.formatUnits(gasPrice, "gwei")} gwei`.blue);
      return receipt;
    } catch (error) {
      console.error("? Swap failed:".red.bold, error.message.red);
      throw error;
    }
  }

  #validateSwapPair(fromToken, toToken) {
    const isPairAvailable = TOKEN_CONFIG.availablePairs.some(
      ([from, to]) => from === fromToken && to === toToken
    );
    if (!isPairAvailable) {
      throw new Error(`No liquidity pool exists for ${fromToken}-${toToken} pair`.red);
    }
    if (fromToken === "A0GI" || toToken === "A0GI") {
      throw new Error("A0GI swaps are not supported".red);
    }
  }

  async #validateTokenBalance(contract, amountIn, symbol, amount) {
    const balance = await contract.balanceOf(this.#wallet.address);
    if (balance < amountIn) {
      throw new Error(
        `Insufficient ${symbol} balance. Required: ${amount}, Available: ${ethers.formatUnits(balance, 18)}`.red
      );
    }
  }

  async #approveTokensIfNeeded(contract, amountIn) {
    const allowance = await contract.allowance(this.#wallet.address, NETWORK_CONFIG.uniswap.router);
    if (allowance < amountIn) {
      console.log("?? Approving tokens...".yellow);
      const approveTx = await contract.approve(NETWORK_CONFIG.uniswap.router, ethers.MaxUint256);
      await approveTx.wait();
      console.log("? Tokens approved".green);
    }
  }

  async #findUsablePool(tokenIn, tokenOut) {
    for (const feeTier of NETWORK_CONFIG.feeTiers) {
      const poolAddress = await this.#contracts.factory.getPool(tokenIn, tokenOut, feeTier);
      if (poolAddress && poolAddress !== ethers.ZeroAddress) {
        return feeTier;
      }
    }
    throw new Error("No liquidity pool exists for this token pair".red);
  }

  async #performSwap(tokenIn, tokenOut, amountIn, feeTier, gasPrice) {
    const params = {
      tokenIn,
      tokenOut,
      fee: feeTier,
      recipient: this.#wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    };

    const tx = await this.#contracts.router.exactInputSingle(params, {
      gasLimit: GAS_CONFIG.defaultGasLimit,
      gasPrice: gasPrice,
      nonce: await this.#wallet.getNonce(),
    });

    console.log(`?? Transaction sent: ${tx.hash}`.cyan);
    return tx.wait();
  }

  async detectOptimalFeeTier(tokenIn, tokenOut) {
    try {
      for (const fee of NETWORK_CONFIG.feeTiers) {
        const poolAddress = await this.#contracts.factory.getPool(tokenIn, tokenOut, fee);
        if (poolAddress && poolAddress !== ethers.ZeroAddress) {
          return fee;
        }
      }
      return NETWORK_CONFIG.feeTiers[1];
    } catch (error) {
      console.warn("?? Fee detection failed, using default fee tier:".yellow, error.message.yellow);
      return NETWORK_CONFIG.feeTiers[1];
    }
  }

  async fetchGasPrice() {
    try {
      const response = await fetch("https://chainscan-newton.0g.ai/stat/gasprice/tracker", {
        headers: {
          Accept: "*/*",
          "User-Agent": "Mozilla/5.0",
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Dest": "empty",
        },
        timeout: 5000,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`.red);
      }

      const data = await response.json();
      if (data.result?.gasPriceMarket?.tp50) {
        const gasPrice = BigInt(data.result.gasPriceMarket.tp50);
        console.log(`?? Fetched gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`.blue);
        return gasPrice;
      }
      throw new Error("Invalid gas price data structure".red);
    } catch (error) {
      console.warn("?? Failed to fetch gas price, using fallback:".yellow, error.message.yellow);
      const fallbackPrice = BigInt(3000000000);
      console.log(`?? Using fallback gas price: ${ethers.formatUnits(fallbackPrice, "gwei")} gwei`.blue);
      return fallbackPrice;
    }
  }
}

export default AutoSwapBot;