pragma solidity ^0.8.0;

import "./BasicToken.sol";

contract Reserve {
    modifier onlyOwner() {
        require(msg.sender == _owner);
        _;
    }
    // store owner address
    address private _owner;
    // store token info after create
    BasicToken private _token;
    // store sell rate
    uint private _sellRate = 1;
    // store buy rate
    uint private _buyRate = 1;
    // store supported token name
    string private _supportedToken = "";

    constructor(
        string memory name,
        string memory symbol,
        uint256 sellRate,
        uint buyRate
    ) payable {
        _owner = msg.sender;
        _token = new BasicToken(name, symbol);
        _supportedToken = name;
        _buyRate = 10 ** 18 / buyRate;
        _sellRate = 10 ** 18 / sellRate;
    }

    // FUNCTION
    // Set Rate
    function setExchangeRates(
        uint256 buyRate,
        uint256 sellRate
    ) public onlyOwner {
        require(buyRate >= 0, "Reserve: Rate must be greater than 0");
        require(sellRate >= 0, "Reserve: Rate must be greater than 0");
        _buyRate = 10 ** 18 / buyRate;
        _sellRate = 10 ** 18 / sellRate;
    }

    // Get buy / sell rate
    function getExchangeRate(
        bool isBuy,
        uint256 srcAmount
    ) public view returns (uint256) {
        require(srcAmount > 0, "Reserve: Amount have to be > 0");
        if (isBuy) {
            return srcAmount * _buyRate ;
        } else if (!isBuy) {
            return srcAmount * _sellRate;
        } else{
            revert();
        }
    }

    function exchange(
        bool isBuy,
        uint256 amount
    ) public payable returns (bool) {
        require(amount > 0, "Reserve: Amount has the be greater than 0");
        if (isBuy) {
            // buying
            uint256 ethToBuy = getExchangeRate(isBuy, amount); // get ammount of ETH required to buy "amount" of token
            
            require(
                msg.value >= ethToBuy,
                "Reserve - exchange: ETH received did not meet the required amount!"
            ); // check if the deposited ETH is enough to buy token
            if (msg.value > ethToBuy) {
                // refund
                uint256 ethToRefund = msg.value - ethToBuy; // get refund amount
                address payable addressToRefund = payable(msg.sender); // convert address to payable address
                transfer(addressToRefund, ethToRefund); // refund excess ETH for user
            }
            return _token.transferFromTo(address(this), msg.sender, amount);
        } else if (!isBuy) { // selling
            require(getBalanceOf(msg.sender) >= amount, "Reserve - exchange: Check if seller have enough tokens!");
            uint256 ethToSell = getExchangeRate(isBuy, amount);
            require(getContractBalance(address(this)) > ethToSell, "Reserve - exchange: Check if reserve have enough ETH to buy!");
            address payable sellerAddress = payable(msg.sender);
            transfer(sellerAddress, ethToSell);
            _token.transferFromTo(msg.sender, address(this), amount);
            return true;
        } else {
            revert();
        }
    }

    function deposit() public payable {}

    function withdraw() public {
        // get the amount of Ether stored in this contract
        uint amount = address(this).balance;
        // send all Ether to owner
        // Owner can receive Ether since the address of owner is payable
        (bool success, ) = _owner.call{value: amount}("");
        require(success, "Reserve: Failed to send Ether");
    }

    function transfer(address payable _to, uint _amount) public {
        // Note that "to" is declared as payable
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Reserve: Failed to send Ether");
    }

    receive() payable external {
        
    }

    // FUNCTION

    // GET DATA
    // Get token address
    function getTokenAddress() public view returns (address) {
        return address(_token);
    }

    // Get supported token name
    function getSupportedToken() public view returns (string memory) {
        return _supportedToken;
    }

    // Get balances of user
    function getBalanceOf(address account) public view returns (uint) {
        return _token.balanceOf(account);
    }

    function getToken() public view returns (BasicToken) {
        return _token;
    }

    function getSellRate() public view returns (uint) {
        return _sellRate;
    }

    function getBuyRate() public view returns (uint) {
        return _buyRate;
    }

    function getContractBalance(address) public view returns (uint) {
        return address(this).balance;
    }
    // GET DATA

    function viewAllowance(address owner, address spender) public view returns(uint){
        _token.allowance(owner, spender);
    }
}
