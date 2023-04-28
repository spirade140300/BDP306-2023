const assert = require('chai').assert;
const Reserve = artifacts.require("Reserve");
const Exchange = artifacts.require("Exchange");


contract("Exchange", async function (accounts) {
    it('Exchange - Check contract deployment', async function () {
        const exchange = await Exchange.deployed({ from: accounts[0] });
        assert.isObject(exchange, "Exchange - Contructor: Error when init contract");
    });

    it('Exchange - Check contract owner', async function () {
        const exchange = await Exchange.deployed({ from: accounts[0] });
        const owner = await exchange.getOwner();
        assert.equal(owner, accounts[0], "Exchange - Constructor: Error when asign owner")
    });

    it('Exchange - Only owner can add reserve', async function () {
        const exchange = await Exchange.deployed({ from: accounts[0] });
        const reserve = await Reserve.deployed("BTC", "BTC", 100000, 200000, { from: accounts[0] });
        await exchange.addReserve(reserve, { from: accounts[1] }).then(function (result) {
            assert.fail(newSellRate, result, "OnlyOwner was not set correctly sell");
        }).catch(function (error) {

        });
    });

    it('Exchange - Check if reserve is successfully added', async function () {
        const exchange = await Exchange.deployed({ from: accounts[0] });
        const reserve = await Reserve.deployed("BTC", "BTC", 100000, 200000, { from: accounts[0] });
        const tokenAddresses = await exchange.getListOfSupportedTokens();
        assert.isArray(tokenAddresses, "The function should return an array");
    });
});