
import "./EntryExit.sol";
import "./GUACToken.sol";

import "./SystemConsumer.sol";
import "./System.sol";

/*is ERC721*/
contract MemberNFT is
    SystemConsumer,
    EntryExit
{
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);

    mapping(address => mapping(uint => bool)) public _approved;

    struct Member {
        string username;
    }

    mapping(uint => Member) public members;
    mapping(string => uint) public usernames;
    mapping(uint => address) public owners;
    uint public initialReputation = 100;
    uint public memberCounter = 1;

    constructor(
        System _System
    )
        public
        SystemConsumer(_System)
        EntryExit()
    {
    }

    function getInitialReputation() public view returns (uint) {
        return initialReputation;
    }

    function join(string calldata _username) external payable returns (uint) {
        require(enter(), "EntryExit failed");
        require(usernames[_username] == 0, "already registered username");

        uint id = memberCounter;
        MemberNFT.Member memory member = Member({
            username: _username
        });
        owners[id] = msg.sender;
        members[id] = member;
        usernames[_username] = id;
        
        GUACToken(getGUACToken()).mint(memberAddress(id), initialReputation);

        memberCounter += 1;

        emit Transfer(address(0), msg.sender, id);
        
        return id;
    }

    function leave(uint id) external {
        require(isOwner(msg.sender, id) || isApproved(msg.sender, id), "unauthorised");
        Member memory member = getMember(id);
        
        GUACToken guac = GUACToken(getGUACToken());

        uint rep = guac.balanceOf(memberAddress(id));
        uint share = rep.div(guac.totalSupply());
        require(exit(msg.sender, share));

        guac.burn(memberAddress(id), rep);
    }

    function approve(address account, uint id) public {
        require(isOwner(msg.sender, id), "unauthorised");
        _approved[account][id] = true;
    }

    function isApproved(address account, uint id) public returns (bool) {
        return _approved[account][id];
    }

    function isOwner(address account, uint id) public returns (bool) {
        return account == owners[id];
    }

    function ownerOf(uint id) public returns (address) {
        return owners[id];
    }

    function getMember(uint id) internal returns (Member memory) {
        return members[id];
    }

    function getData(uint id) public view returns (string memory, uint) {
        MemberNFT.Member storage member = members[id];
        return (member.username, GUACToken(getGUACToken()).balanceOf(memberAddress(id)));
    }

    function memberAddress(uint id) public pure returns (address) {
        return address(id);
    }
}