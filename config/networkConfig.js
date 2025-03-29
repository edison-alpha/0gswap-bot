export const NETWORK_CONFIG = {
  rpc: "https://evmrpc-testnet.0g.ai",
  chainId: 16600,
  name: "0G-Newton-Testnet",
  symbol: "A0GI",
  tokens: {
    USDT: "0x9A87C2412d500343c073E5Ae5394E3bE3874F76b",
    BTC: "0x1e0d871472973c562650e991ed8006549f8cbefc",
    ETH: "0xce830D0905e0f7A9b300401729761579c5FB6bd6",
    A0GI: "0x493eA9950586033eA8894B5E684bb4DF6979A0D3",
  },
  uniswap: {
    router: "0xD86b764618c6E3C078845BE3c3fCe50CE9535Da7",
    factory: "0xe1aAD0bac492F6F46BFE1992080949401e1E90aD",
    quoter: "0x8B4f88a752Fd407ec911A716075Ca7809ADdBadd",
  },
  feeTiers: [500, 3000, 10000], // 0.05%, 0.3%, 1%
};

export const TRADING_PARAMS = {
  swapDelay: process.env.SWAP_DELAY || 60,
  minBalanceForSwap: process.env.MIN_BALANCE_FOR_SWAP || "0.1",
  minDelay: 30,
  maxDelay: 300,
};

export const TOKEN_CONFIG = {
  decimals: {
    USDT: 18,
    BTC: 18,
    ETH: 18,
    A0GI: 18,
  },
  availablePairs: [
    ["USDT", "BTC"],
    ["USDT", "ETH"],
    ["BTC", "USDT"],
    ["ETH", "USDT"],
  ],
};

export const GAS_CONFIG = {
  baseFee: 100000000,     // 0.1 gwei
  maxFee: 500000000,      // 0.5 gwei
  priorityFee: 100000000, // 0.1 gwei
  defaultGasLimit: 300000,
};

export const ABIS = {
  router: [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
    "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
    "function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)",
  ],
  quoter: [
    "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
  ],
  erc20: [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
  ],
  factory: [
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
  ],
};