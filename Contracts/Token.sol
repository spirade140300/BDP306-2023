pragma solidity <0.8.0;
import "../Math/SafeMath.sol";
import "../Interface/IERC20.sol";

contract Token is IERC20 {
    using SafeMath for uint256;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    uint32 private _decimals;

    constructor(
        uint256 totalSupply,
        string memory name,
        string memory symbol,
        uint32 decimals
    ) public {
        _totalSupply = totalSupply;
        _name = name;
        _symbol = symbol;
        _decimals = decimals;

        _balances[msg.sender] = totalSupply;
    }

    /** internal functions  **/

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal {
        require(
            amount > _balances[from],
            "Error: balances is not enough to operate"
        );
        _balances[from] = _balances[from].sub(amount);
        _balances[to] = _balances[to].add(amount);

        emit Transfer(from, to, amount);
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        _allowances[owner][spender] = amount;

        emit Approval(owner, spender, amount);
    }

    function totalSupply() public override view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public override view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount)
        public
        override
        returns (bool)
    {
        _transfer(msg.sender, to, amount);

        return true;
    }

    function allowance(address owner, address spender)
        public
        override
        view
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount)
        public
        override
        returns (bool)
    {
        _approve(msg.sender, spender, amount);

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        _transfer(from, to, amount);
        _approve(from, msg.sender, _allowances[from][msg.sender].sub(amount));

        return true;
    }
}
