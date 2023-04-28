pragma solidity ^0.8.0;
import "./IERC20.sol";

contract BasicToken is IERC20 {
    string private name;
    string private symbol;
    uint8 public constant decimals = 18;

    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowed;

    uint256 _totalSupply = 1000000 * 10 ** decimals ;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        _balances[msg.sender] = _totalSupply;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address sender) public view override returns (uint256) {
        return _balances[sender];
    }

    function allowance(
        address owner,
        address spender
    ) public view override returns (uint) {
        return _allowed[owner][spender];
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }

    function transferFromTo(address from, address to, uint256 amount) public returns (bool) {
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) private {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
            // Overflow not possible: the sum of all balances is capped by totalSupply, and the sum is preserved by
            // decrementing then incrementing.
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function approve(
        address spender,
        uint256 amount
    ) public override returns (bool) {
        _approve(tx.origin, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        address spender  = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function _spendAllowance(address owner, address spender, uint256 amount) private {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }

    function _approve(address owner, address spender, uint256 amount) private {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowed[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function getName() public view returns (string memory){
        return name;
    }

    function getSymbol() public view returns (string memory){
        return symbol;
    }
}
