// Check reserve
const ReserveBTC = artifacts.require("Reserve");
const ReserveSWA = artifacts.require("Reserve");
const Exchange = artifacts.require("Exchange");

// Check exchange


module.exports = function(deployer) {
  // Deploy the SolidityContract contract as our only task

  // Deploy Reserve 2: Name - BTC, Symbol - BTC, Rate - 3
  var reserveNameBTC = 'BTC';
  var reserveSymbolBTC = 'BTC';
  var reserveSellRateBTC = 1000;
  var reserveBuyRateBTC = 2000;
  deployer.deploy(ReserveBTC, reserveNameBTC, reserveSymbolBTC, reserveSellRateBTC, reserveBuyRateBTC);

  // Deploy Reserve 3: Name - SWA, Symbol - SWA, Rate - 4
  var reserveNameSWA = 'SWA';
  var reserveSymbolSWA = 'SWA';
  var reserveSellRateSWA = 4000;
  var reserveBuyRateSWA = 5000;
  deployer.deploy(ReserveSWA, reserveNameSWA, reserveSymbolSWA, reserveSellRateSWA, reserveBuyRateSWA);

  deployer.deploy(Exchange);
};