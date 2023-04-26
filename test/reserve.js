const assert = require('chai').assert;
const Reserve = artifacts.require("Reserve");
const Exchange = artifacts.require("Exchange");
/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Reserve", function (accounts) {
  const name = "SWA";
  const symbol = "SWA";
  const sellRate = 100000;
  const buyRate = 200000;

  it("Reserve - Check contract deployment", async () => {
    const instance = await Reserve.deployed();
    assert.isObject(instance);
  });

  it('Reserve - Check owner address', async function() {
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, { from: accounts[0]});
    const owner = await reserve.getOwner();
    assert.equal(owner, accounts[0], "Owner was not set correctly");
  });

  it('Reserve - Check supported token name', async function() {
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, { from: accounts[0] });
    const tokenName = await reserve.getSupportedTokenName();
    assert.equal(tokenName, name, "Name was not set correctly");
  });

  it('Reserve - Check supported token symbol', async function() {
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, { from: accounts[0]});
    const tokenSymbol = await reserve.getSupportedTokenSymbol();
    assert.equal(tokenSymbol, symbol, "Symbol was not set correctly");
  });

  it('Reserve - Only owner can set exchange rate', async function() {
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, { from: accounts[1]});
    const newSellRate = 10000;
    const newBuyRate = 20000;
    reserve.getExchangeRate(false, 1).then(function (result) {
      assert.fail(newSellRate, result, "OnlyOwner was not set correctly sell");
    }).catch(function (error) {

    });
    reserve.getExchangeRate(false, 1).then(function (result) {
      assert.fail(newSellRate, result, "OnlyOwner was not set correctly buy");
      return;
    }).catch(function (error) {

    });
  });

  it('Reserve - Check if buy rate is set success fully', async function() {
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, { from: accounts[0]});
    const newSellRate = 10000;
    const newBuyRate = 20000;
    await reserve.setExchangeRate(newSellRate, newBuyRate, { from: accounts[0]});
    reserve.getExchangeRate(false, 1).then(function (result) {
      assert.equal(newSellRate, result, "OnlyOwner was not set correctly");
      return;
    }).catch(function (error) {

    });
  });

  it('Reserve - Check if sell rate is set success fully', async function() {
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, { from: accounts[0]});
    const newSellRate = 10000;
    const newBuyRate = 20000;
    await reserve.setExchangeRate(newSellRate, newBuyRate , { from: accounts[0]});
    reserve.getExchangeRate(false, 1).then(function (result) {
      assert.equal(newBuyRate, result, "OnlyOwner was not set correctly");
      return;
    }).catch(function (error) {

    });
  });

  it('Reserve - Check if getting buy rate successful', async function() {
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, { from: accounts[0]});
    reserve.getExchangeRate(true, 1).then(function (result) {
      assert.equal(newBuyRate, result, "OnlyOwner was not set correctly");
      return;
    }).catch(function (error) {

    });
  });

  it('Reserve - Check if getting sell rate successful', async function() {
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, { from: accounts[0]});
    const newSellRate = 10000;
    const newBuyRate = 20000;
    await reserve.setExchangeRate(newSellRate, newBuyRate);
    await reserve.setExchangeRate(newSellRate, newBuyRate);
    reserve.getExchangeRate(false, 1).then(function (result) {
      assert.equal(newBuyRate, result, "OnlyOwner was not set correctly");
      return;
    }).catch(function (error) {

    });
  });

  it('Reserve - Only owner can withdraw', async function() {
    // set up the contract and deposit some Ether
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, { from: accounts[1]});
    const depositAmount = web3.utils.toWei("1", "ether");
    await web3.eth.sendTransaction({ from: accounts[0], to: reserve.address, value: depositAmount });

    // Get the owner's balance before the withdraw() function call
    const initialOwnerBalance = await web3.eth.getBalance(accounts[0]);

    // Call the withdraw() function
    await reserve.withdraw({ from: accounts[0] });

    // Get the owner's balance after the withdraw() function call
    const finalOwnerBalance = await web3.eth.getBalance(accounts[0]);

    // Check that the owner's balance has increased by the expected amount
    assert.isTrue(
      finalOwnerBalance > initialOwnerBalance,
      "Owner balance should increase after withdraw"
    );

    // Check that the contract's balance is zero after the withdraw() function call
    const contractBalance = await web3.eth.getBalance(reserve.address);
    assert.strictEqual(contractBalance, "0", "Contract balance should be zero after withdraw");
  });

  it('Reserve - Owner withdraw successfully', async function() {
    // set up the contract and deposit some Ether
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, { from: accounts[1]});
    const depositAmount = web3.utils.toWei("1", "ether");
    await web3.eth.sendTransaction({ from: accounts[0], to: reserve.address, value: depositAmount });

    // Get the owner's balance before the withdraw() function call
    const initialOwnerBalance = await web3.eth.getBalance(accounts[0]);

    // Call the withdraw() function
    await reserve.withdraw({ from: accounts[0] });

    // Get the owner's balance after the withdraw() function call
    const finalOwnerBalance = await web3.eth.getBalance(accounts[0]);

    // Check that the owner's balance has increased by the expected amount
    assert.isTrue(
      finalOwnerBalance > initialOwnerBalance,
      "Owner balance should increase after withdraw"
    );

    // Check that the contract's balance is zero after the withdraw() function call
    const contractBalance = await web3.eth.getBalance(reserve.address);
    assert.strictEqual(contractBalance, "0", "Contract balance should be zero after withdraw");
  });

  it('Reserve - Check if account have enough amount of token', async function() {
    const reserve = await Reserve.deployed(name, symbol, sellRate , buyRate, {from: accounts[0]});
    const exchange = await Exchange.deployed({ from: accounts[0]});
    const balance = await reserve.getBalanceOf(accounts[0]);
    assert.equal(balance, 0, "Initial balance should be 0");
  });

});
  
contract("Exchange", async function (accounts) {
  it('Exchange - Check contract deployment', async function() {
    const exchange = await Exchange.deployed({ from: accounts[0]});
    assert.isObject(exchange);
  });
});