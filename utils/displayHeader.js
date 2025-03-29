import "colors";

function displayHeader() {
  process.stdout.write("\x1Bc");

  console.log(`
    ${"+------------------------------------+".cyan}
    ${"¦".cyan} ${"¦¦¦¦¦¦+  ¦¦¦¦¦+ ¦¦+   ¦¦+".rainbow} ${"       ¦".cyan}
    ${"¦".cyan} ${"¦¦+--¦¦+¦¦+--¦¦++¦¦+ ¦¦++".cyan} ${"       ¦".cyan}
    ${"¦".cyan} ${"¦¦¦¦¦¦++¦¦¦¦¦¦¦¦ +¦¦¦¦++ ".green} ${"       ¦".cyan}
    ${"¦".cyan} ${"¦¦+--¦¦+¦¦+--¦¦¦  +¦¦++  ".yellow} ${"       ¦".cyan}
    ${"¦".cyan} ${"¦¦¦¦¦¦++¦¦¦  ¦¦¦   ¦¦¦   ".blue} ${"       ¦".cyan}
    ${"¦".cyan} ${"+-----++-+  +-+   +-+   ".red} ${"       ¦".cyan}
    ${"+------------------------------------+".cyan}

    ${"?? Join grup TG:".bold.red} ${"@ngadukbang".underline.brightCyan}

    ${"? Prepare faucet MON".green.bold}
    ${"? 1 IP 1 wallet".green.bold}
    ${"? No multi address".red.bold}

    ${"?? Available Trading Pairs:".cyan.bold}
    ${"  USDT-BTC".yellow}
    ${"  USDT-ETH".yellow}
    ${"  BTC-USDT".yellow}
    ${"  ETH-USDT".yellow}

    ${"?? Safety Features:".cyan.bold}
    ${"  Minimum balance checks".green}
    ${"  Maximum gas price limits".green}
    ${"  Transaction timeout protection".green}
    ${"  Automatic retry mechanism".green}
    ${"  Slippage protection".green}
  `.split("\n").join("\n"));
}

export default displayHeader;