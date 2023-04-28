pragma solidity ^0.8.0;

import "./Reserve.sol";
import "./BasicToken.sol";


contract Exchange {
    mapping(address => address) token_reserve_map;
    address[] tokenAddresses;
    string[] tokenSymbols;
    string[] tokenNames;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Exchange: Sender is not owner");
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    receive() external payable {}

    function checkEthBalance() public view returns (uint256) {
        return (payable(address(this))).balance;
    }

    function getListOfSupportedTokens() public view returns (address[] memory) {
        return tokenAddresses;
    }

    function getExchangeRate(
        // token to sell
        address srcToken,
        // token to buy
        address destToken,
        uint256 srcAmount
    ) public view returns (uint256) {
        require(
            token_reserve_map[payable(srcToken)] != address(0x0),
            "Exchange - getExchangeRate: Token from does not supported"
        );
        require(
            token_reserve_map[destToken] != address(0x0),
            "Exchange - getExchangeRate: Token destined does not supported"
        );
        require(
            srcAmount > 0,
            "Exchange - getExchangeRate: Token amounts to trade has to be larger than 0"
        );
        uint256 rate = ((Reserve(payable(token_reserve_map[payable(srcToken)])).getExchangeRate(false, srcAmount) * 10**9) /Reserve(payable(token_reserve_map[payable(destToken)])).getExchangeRate(true, 1)) * 10**9;
        return rate;
    }

    function exchange(
        address srcToken,
        address destToken,
        uint256 srcAmount
    ) public payable returns (uint256) {
        require(
            token_reserve_map[payable(srcToken)] != address(0x0),
            "Exchange - getExchangeRate: Token from does not supported"
        );
        require(
            token_reserve_map[destToken] != address(0x0),
            "Exchange - getExchangeRate: Token destined does not supported"
        );
        require(
            srcAmount > 0,
            "Exchange - getExchangeRate: Token amounts to trade has to be larger than 0"
        );
        Reserve srcReserve = Reserve(payable(token_reserve_map[srcToken]));
        Reserve destReserve = Reserve(payable(token_reserve_map[destToken]));

        uint256 destAmount = getExchangeRate(srcToken, destToken, srcAmount) / 10 ** 18;
        uint256 weiToBuy = destReserve.getExchangeRate(true, destAmount) ;
        require(
            destReserve.getBalanceOf(address(destReserve)) >= destAmount,
            "Exchange: currently this Reserve doesnt have enough destination Token"
        );

        // Step 1: Transfer amount token original to exchange contract
        srcReserve.getToken().transferFromTo(tx.origin, address(this) , srcAmount);
        require(
            srcReserve.getBalanceOf(address(this)) >= srcAmount,
            "Exchange: sender doesn't have enough Tokens"
        );
        // Step 2: Sell token to original reserve to get ETH
        srcReserve.exchange(false, srcAmount);
        // Step 3: Use receive ETH to buy Tokens from dest Reserve
        destReserve.exchange{value: weiToBuy}(true, destAmount);
        // Step 4: Send received token from contract to user
        destReserve.getToken().transfer(msg.sender, destAmount);
        return weiToBuy;
    }

    function deposit() public payable {}

    function getAllowance(address srcToken) public view returns (uint256) {
        Reserve srcReserve = Reserve(payable(token_reserve_map[srcToken]));

        return srcReserve.getToken().allowance(msg.sender, address(this));
    }

    function buyToken(address srcToken, uint256 srcAmount)
        public
        payable
        returns (bool)
    {
        require(
            token_reserve_map[payable(srcToken)] != address(0x0),
            "Exchange - buyToken: Token from does not supported"
        );
        Reserve srcReserve = Reserve(payable(token_reserve_map[srcToken]));
        uint256 destAmount = 10**18 / srcReserve.getExchangeRate(true, 1);
        uint256 ethToBuy = srcReserve.getExchangeRate(true, destAmount); // get ammount of ETH required to buy "amount" of token
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
        if(srcReserve.exchange{value: ethToBuy}(true, destAmount)){
            srcReserve.getToken().transfer(tx.origin, destAmount);
        } 
    }

    function sellToken(address srcToken, uint256 srcAmount)
        public
        payable
        returns (bool)
    {
        require(
            token_reserve_map[payable(srcToken)] != address(0x0),
            "Exchange - sellToken: Token from does not supported"
        );
        Reserve srcReserve = Reserve(payable(token_reserve_map[srcToken]));
        srcReserve.getToken().transferFromTo(tx.origin, address(this), srcAmount);
        uint256 ethToRecieve = srcReserve.getExchangeRate(false, srcAmount);
        if(srcReserve.exchange(false, srcAmount)){
            transfer(payable(msg.sender), ethToRecieve);
            return true;
        }
    }

    function transferToken(address token, address from, address to, uint256 srcAmount) public returns (bool) {
        require(
            token_reserve_map[payable(token)] != address(0x0),
            "Exchange - sellToken: Token from does not supported"
        );
        Reserve srcReserve = Reserve(payable(token_reserve_map[token]));
        return srcReserve.getToken().transferFromTo(from, to, srcAmount);
    }

    function transfer(address payable _to, uint _amount) public {
        // Note that "to" is declared as payable
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Reserve: Failed to send Ether");
    }

    function getOwner() public view returns (address){
        return owner;
    }

    function checkIfTokenIsSupported(address tokenAddress) public view returns (bool){
        if(token_reserve_map[payable(tokenAddress)] != address(0x0)){
            return true;
        }else{
            return false;
        }
    }


    function addReserve(Reserve newReserve) public onlyOwner returns (bool) {
        // get token
        BasicToken token = newReserve.getToken();
        address tokenAddress = address(token);
        string memory symbol = token.getSymbol();
        string memory name = token.getName();

        // Validate new token: new token must not exist in tokenAddresses
        for (uint8 index = 0; index < tokenAddresses.length; index++) {
            require(tokenAddress != tokenAddresses[index]);
            require(!equal(token.getSymbol(), tokenSymbols[index]));
            require(!equal(name, tokenNames[index]));
        }

        // mapping token to reserve
        token_reserve_map[tokenAddress] = address(newReserve);
        // add token to list of tokens (Using in getting list of supported token)
        tokenAddresses.push(tokenAddress);
        tokenSymbols.push(symbol);
        tokenNames.push(name);
        return true;
    }

    // // Remove reserve
    function removeReserve(address tokenAddress) public onlyOwner {
        for (uint8 index = 0; index < tokenAddresses.length; index++) {
            if (tokenAddress == tokenAddresses[index]) {
                removeReserveData(index);
                break;
            }
        }
        delete token_reserve_map[tokenAddress];
    }

    function removeReserveData(uint256 index) private {
        // Đẩy các phần tử phía sau lên phía trước 1 đơn vị
        for (uint256 i = index; i < tokenAddresses.length - 1; i++) {
            tokenAddresses[i] = tokenAddresses[i + 1];
            tokenSymbols[i] = tokenSymbols[i + 1];
            tokenNames[i] = tokenNames[i + 1];
        }
        // Xóa bỏ phần tử cuối cùng
        tokenAddresses.pop();
        tokenSymbols.pop();
        tokenNames.pop();
    }

    function compare(string memory _a, string memory _b)
        private
        pure
        returns (int256)
    {
        bytes memory a = bytes(_a);
        bytes memory b = bytes(_b);
        uint256 minLength = a.length;
        if (b.length < minLength) minLength = b.length;
        //@todo unroll the loop into increments of 32 and do full 32 byte comparisons
        for (uint256 i = 0; i < minLength; i++)
            if (a[i] < b[i]) return -1;
            else if (a[i] > b[i]) return 1;
        if (a.length < b.length) return -1;
        else if (a.length > b.length) return 1;
        else return 0;
    }

    /// @dev Compares two strings and returns true iff they are equal.
    function equal(string memory _a, string memory _b)
        private
        pure
        returns (bool)
    {
        return compare(_a, _b) == 0;
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "ds-math-mul-overflow");
    }
}
