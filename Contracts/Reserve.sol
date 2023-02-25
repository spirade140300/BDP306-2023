pragma solidity <0.8.0;
import "./Token.sol";

contract Reserve {
    address _owner;
    Token public _token;
    uint256 _buyRate;
    uint256 _sellRate;
    bool _tradeEnabled;


    event Exchanged(address sender, uint256 amount);

    constructor(
        uint256 buyRate,
        uint256 sellRate,
        uint256 totalSupply,
        string memory name,
        string memory symbol,
        uint32 decimals
    ) public {
        _owner = msg.sender;
        _token = new Token(totalSupply, name, symbol, decimals);
        _buyRate = buyRate;
        _sellRate = sellRate;
        _tradeEnabled = true;
    }

    modifier onlyOwner {
        require(msg.sender == _owner);
        _;
    }

    function convertEthToTokenByRate(uint256 amount, uint256 buyRate) public pure returns (uint256) {
        return amount * buyRate / 1e18;

    }

    // convert from token to eth by sell rate
    // amount * ether / sell rate
    function convertTokenToEthByRate(uint256 amount, uint256 sellRate) public pure returns (uint256) {
        return amount * 1e18 / sellRate;
    }

    // withdraw
    function withdraw(bool isEth, uint256 amount) public payable onlyOwner {
        if (isEth) {
            require(amount <= address(this).balance);
            msg.sender.transfer(amount);
        } else {
            require(amount <= _token.balanceOf(msg.sender));
            _token.transfer(_owner, amount);
        }
    }

    // get exchange rate
    function getExchangeRate(bool isBuying) public view returns (uint) {
        return isBuying ? _buyRate : _sellRate;
    }

    // get balance of owner
    function getTokenBalance() public view returns (uint256) {

        return _token.balanceOf(address(this));
    }


    function exchange(bool isBuying, uint256 srcAmount) public payable {
        if (isBuying) {
            uint256 ownerBalance = getTokenBalance();
            uint256 actualAmount = convertEthToTokenByRate(srcAmount, _buyRate);
            require(srcAmount > 0, "Need to send some ether");
            require(actualAmount < ownerBalance, "Not enough tokens in reserve");
            _token.transfer(msg.sender, actualAmount);

            emit Exchanged(msg.sender, srcAmount);
        } else {
            require (srcAmount > 0, "Need to sell some tokens");
            uint256 actualAmount = convertTokenToEthByRate(srcAmount, _sellRate);
            uint256 allowance = _token.allowance(msg.sender, address(this));
            require(allowance >= actualAmount, "Check the token allowance");
            _token.transferFrom(msg.sender, address(this), srcAmount);
            msg.sender.transfer(actualAmount);

            emit Exchanged(msg.sender, srcAmount);
        }
    }
}
