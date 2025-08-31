// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ITicket_NFT.sol";
import "./Ticket_NFT.sol";
import "./libaries/Errors.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract EventTicketing is Ownable(msg.sender), ReentrancyGuard {
    using Strings for uint256;

    enum PaidTicketCategory { NONE, REGULAR, VIP }

    struct Ticket {
        address nft;
        uint256 price;
    }

    struct Event {
        uint256 id;
        string title;
        string description;
        string location;
        uint256 startDate;
        uint256 endDate;
        uint256 expectedAttendees;
        bool isPaid;
        address organizer;
        uint256 userRegCount;
        uint256 verifiedAttendeesCount;
        bool revenueReleased;
    }

    uint256 public constant MINIMUM_ATTENDANCE_RATE = 60;

    mapping(uint256 => Event) public events;
    uint256 public totalEventsOrganized;
    mapping(uint256 => mapping(PaidTicketCategory => Ticket)) public eventTickets;
    uint256 public totalTicketsCreated;
    uint256 public totalPurchasedTickets;
    mapping(uint256 => mapping(address => bool)) public isVerified;
    mapping(address => mapping(uint256 => uint256)) public organiserRevBal;

    event EventOrganized(uint256 indexed eventId, address indexed organizer);
    event EventUpdated(uint256 indexed eventId, string field);
    event TicketCreated(uint256 indexed eventId, PaidTicketCategory category, address nftContract);
    event TicketPurchased(uint256 indexed eventId, address buyer, address recipient, PaidTicketCategory category);
    event AttendeeVerified(uint256 indexed eventId, address indexed attendee);
    event RevenueReleased(address indexed organizer, uint256 indexed eventId, uint256 amount);
    event EtherReceived(address sender, uint256 amount);

    function createEvent(
        string memory _title,
        string memory _description,
        string memory _location,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _expectedAttendees,
        bool _isPaid
    ) external returns (uint256) {
        if (bytes(_title).length == 0) revert Errors.EmptyTitle();
        if (bytes(_description).length == 0) revert Errors.EmptyDescription();
        if (bytes(_location).length == 0) revert Errors.EmptyLocation();
        if (_startDate >= _endDate || _startDate <= block.timestamp) revert Errors.InvalidEventDates(_startDate, _endDate);
        if (_expectedAttendees == 0) revert Errors.InvalidExpectedAttendees(_expectedAttendees);

        totalEventsOrganized++;
        uint256 eventId = totalEventsOrganized;
        events[eventId] = Event({
            id: eventId,
            title: _title,
            description: _description,
            location: _location,
            startDate: _startDate,
            endDate: _endDate,
            expectedAttendees: _expectedAttendees,
            isPaid: _isPaid,
            organizer: msg.sender,
            userRegCount: 0,
            verifiedAttendeesCount: 0,
            revenueReleased: false
        });

        emit EventOrganized(eventId, msg.sender);
        return eventId;
    }

    function updateEventTitle(uint256 eventId, string memory newTitle) external {
        Event storage e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (msg.sender != e.organizer) revert Errors.NotAuthorized();
        if (block.timestamp >= e.startDate) revert Errors.UpdateNotAllowedAfterStart();
        if (bytes(newTitle).length == 0) revert Errors.EmptyTitle();

        e.title = newTitle;
        emit EventUpdated(eventId, "title");
    }

    function updateEventDescription(uint256 eventId, string memory newDescription) external {
        Event storage e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (msg.sender != e.organizer) revert Errors.NotAuthorized();
        if (block.timestamp >= e.startDate) revert Errors.UpdateNotAllowedAfterStart();
        if (bytes(newDescription).length == 0) revert Errors.EmptyDescription();

        e.description = newDescription;
        emit EventUpdated(eventId, "description");
    }

    function updateEventLocation(uint256 eventId, string memory newLocation) external {
        Event storage e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (msg.sender != e.organizer) revert Errors.NotAuthorized();
        if (block.timestamp >= e.startDate) revert Errors.UpdateNotAllowedAfterStart();
        if (bytes(newLocation).length == 0) revert Errors.EmptyLocation();

        e.location = newLocation;
        emit EventUpdated(eventId, "location");
    }

    function updateEventStartDate(uint256 eventId, uint256 newStartDate) external {
        Event storage e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (msg.sender != e.organizer) revert Errors.NotAuthorized();
        if (block.timestamp >= e.startDate) revert Errors.UpdateNotAllowedAfterStart();
        if (newStartDate <= block.timestamp || newStartDate >= e.endDate) revert Errors.InvalidEventDates(newStartDate, e.endDate);

        e.startDate = newStartDate;
        emit EventUpdated(eventId, "startDate");
    }

    function updateEventEndDate(uint256 eventId, uint256 newEndDate) external {
        Event storage e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (msg.sender != e.organizer) revert Errors.NotAuthorized();
        if (block.timestamp >= e.startDate) revert Errors.UpdateNotAllowedAfterStart();
        if (newEndDate <= e.startDate) revert Errors.InvalidEventDates(e.startDate, newEndDate);

        e.endDate = newEndDate;
        emit EventUpdated(eventId, "endDate");
    }

    function updateEventExpectedAttendees(uint256 eventId, uint256 newExpectedAttendees) external {
        Event storage e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (msg.sender != e.organizer) revert Errors.NotAuthorized();
        if (block.timestamp >= e.startDate) revert Errors.UpdateNotAllowedAfterStart();
        if (newExpectedAttendees == 0) revert Errors.InvalidExpectedAttendees(newExpectedAttendees);
        if (newExpectedAttendees < e.userRegCount) revert Errors.CannotReduceAttendeesBelowCurrent();

        e.expectedAttendees = newExpectedAttendees;
        emit EventUpdated(eventId, "expectedAttendees");
    }

    function getEvent(uint256 eventId) external view returns (Event memory) {
        if (events[eventId].id == 0) revert Errors.EventDoesNotExist(eventId);
        return events[eventId];
    }

    function getAllEvents() external view returns (Event[] memory) {
        Event[] memory all = new Event[](totalEventsOrganized);
        for (uint256 i = 1; i <= totalEventsOrganized; i++) {
            all[i - 1] = events[i];
        }
        return all;
    }

    function createTicket(uint256 eventId, PaidTicketCategory category, uint256 fee) external {
        Event memory e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (msg.sender != e.organizer) revert Errors.NotAuthorized();
        if (block.timestamp > e.endDate) revert Errors.EventHasEnded();
        if (eventTickets[eventId][category].nft != address(0)) revert Errors.TicketCategoryAlreadyExists();

        if (!e.isPaid) {
            if (category != PaidTicketCategory.NONE || fee != 0) revert Errors.InvalidTicketCategory();
        } else {
            if (category == PaidTicketCategory.NONE || fee == 0) revert Errors.InvalidTicketFee();
        }

        if (category == PaidTicketCategory.REGULAR) {
            Ticket memory vip = eventTickets[eventId][PaidTicketCategory.VIP];
            if (vip.nft != address(0) && fee >= vip.price) revert Errors.InvalidTicketFee();
        } else if (category == PaidTicketCategory.VIP) {
            Ticket memory reg = eventTickets[eventId][PaidTicketCategory.REGULAR];
            if (reg.nft != address(0) && fee <= reg.price) revert Errors.InvalidTicketFee();
        }

        string memory catStr = category == PaidTicketCategory.NONE ? "Free" : category == PaidTicketCategory.REGULAR ? "Regular" : "VIP";
        string memory name = string(abi.encodePacked("Event ", eventId.toString(), " ", catStr, " Ticket"));
        string memory symbol = string(abi.encodePacked("EVT", eventId.toString(), catStr));

        Ticket_NFT nft = new Ticket_NFT(name, symbol);
        eventTickets[eventId][category] = Ticket({nft: address(nft), price: fee});
        totalTicketsCreated++;
        emit TicketCreated(eventId, category, address(nft));
    }

    function purchaseTicket(uint256 eventId, PaidTicketCategory category) external payable {
        Event storage e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (block.timestamp >= e.endDate) revert Errors.EventEnded();
        if (e.userRegCount >= e.expectedAttendees) revert Errors.NoSlotsAvailable();

        Ticket memory t = eventTickets[eventId][category];
        if (t.nft == address(0)) revert Errors.InvalidTicketCategory();
        if (e.isPaid != (t.price > 0)) revert Errors.InvalidTicketCategory();
        if (msg.value != t.price) revert Errors.InsufficientPayment();

        ITicket_NFT(t.nft).safeMint(msg.sender);
        e.userRegCount++;
        totalPurchasedTickets++;
        organiserRevBal[e.organizer][eventId] += msg.value;
        emit TicketPurchased(eventId, msg.sender, msg.sender, category);
    }

    function purchaseTickets(uint256 eventId, PaidTicketCategory category, uint256 quantity) external payable {
        if (quantity == 0) revert Errors.InvalidQuantity();
        Event storage e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (block.timestamp >= e.endDate) revert Errors.EventEnded();
        if (e.userRegCount + quantity > e.expectedAttendees) revert Errors.NoSlotsAvailable();

        Ticket memory t = eventTickets[eventId][category];
        if (t.nft == address(0)) revert Errors.InvalidTicketCategory();
        if (e.isPaid != (t.price > 0)) revert Errors.InvalidTicketCategory();
        if (msg.value != t.price * quantity) revert Errors.InsufficientPayment();

        ITicket_NFT(t.nft).batchMint(msg.sender, quantity);
        e.userRegCount += quantity;
        totalPurchasedTickets += quantity;
        organiserRevBal[e.organizer][eventId] += msg.value;
        emit TicketPurchased(eventId, msg.sender, msg.sender, category); // Emitting single event for batch; could loop if needed
    }

    function purchaseMultipleTickets(uint256 eventId, PaidTicketCategory category, address[] calldata recipients) external payable {
        Event storage e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (block.timestamp >= e.endDate) revert Errors.EventEnded();

        Ticket memory t = eventTickets[eventId][category];
        if (t.nft == address(0)) revert Errors.InvalidTicketCategory();
        if (e.isPaid != (t.price > 0)) revert Errors.InvalidTicketCategory();

        uint256 num = recipients.length;
        if (num == 0) return;

        uint256 successful = 0;
        for (uint256 i = 0; i < num; i++) {
            address recipient = recipients[i];
            if (recipient == address(0)) continue;
            if (e.userRegCount >= e.expectedAttendees) break;

            ITicket_NFT(t.nft).safeMint(recipient);
            e.userRegCount++;
            totalPurchasedTickets++;
            emit TicketPurchased(eventId, msg.sender, recipient, category);
            successful++;
        }

        uint256 totalRequired = successful * t.price;
        if (msg.value < totalRequired) revert Errors.InsufficientPayment();
        organiserRevBal[e.organizer][eventId] += totalRequired;
        if (msg.value > totalRequired) {
            payable(msg.sender).transfer(msg.value - totalRequired);
        }
    }

    function verifyAttendance(uint256 eventId) external {
        if (!tryVerifyAttendance(eventId, msg.sender)) revert Errors.DoesNotOwnNFT();
    }

    function verifyGroupAttendance(uint256 eventId, address[] calldata attendees) external {
        uint256 num = attendees.length;
        for (uint256 i = 0; i < num; i++) {
            tryVerifyAttendance(eventId, attendees[i]);
        }
    }

    function tryVerifyAttendance(uint256 eventId, address attendee) internal returns (bool) {
        if (attendee == address(0)) return false;

        Event storage e = events[eventId];
        if (e.id == 0) return false;
        if (block.timestamp < e.startDate) return false;
        if (block.timestamp > e.endDate) return false;
        if (isVerified[eventId][attendee]) return false;

        uint256 totalBalance = 0;
        for (uint256 i = 0; i < 3; i++) {
            PaidTicketCategory cat = PaidTicketCategory(i);
            Ticket memory tk = eventTickets[eventId][cat];
            if (tk.nft == address(0)) continue;
            try ITicket_NFT(tk.nft).balanceOf(attendee) returns (uint256 bal) {
                totalBalance += bal;
            } catch {}
        }
        if (totalBalance == 0) return false;

        isVerified[eventId][attendee] = true;
        e.verifiedAttendeesCount += 1; // Still increment by 1 for unique attendee, even with multiple tickets
        emit AttendeeVerified(eventId, attendee);
        return true;
    }

    function releaseRevenue(uint256 eventId) external nonReentrant {
        Event storage e = events[eventId];
        if (e.id == 0) revert Errors.EventDoesNotExist(eventId);
        if (block.timestamp <= e.endDate) revert Errors.EventHasEnded();
        if (e.revenueReleased) revert Errors.RevenueAlreadyReleased();

        uint256 bal = organiserRevBal[e.organizer][eventId];
        if (bal == 0) revert Errors.NoRevenueToRelease();

        uint256 rate = e.userRegCount > 0 ? (e.verifiedAttendeesCount * 100) / e.userRegCount : 0;
        bool authorized = (msg.sender == e.organizer && rate >= MINIMUM_ATTENDANCE_RATE) || msg.sender == owner();
        if (!authorized) revert Errors.NotAuthorized();

        e.revenueReleased = true;
        organiserRevBal[e.organizer][eventId] = 0;
        (bool success, ) = payable(e.organizer).call{value: bal}("");
        if (!success) revert Errors.TransferFailed();
        emit RevenueReleased(e.organizer, eventId, bal);
    }

    function canReleaseRevenue(uint256 eventId) external view returns (bool canRelease, uint256 attendanceRate, uint256 revenueAmount) {
        Event memory e = events[eventId];
        if (e.id == 0) return (false, 0, 0);

        revenueAmount = organiserRevBal[e.organizer][eventId];
        if (revenueAmount == 0 || e.revenueReleased || block.timestamp <= e.endDate) {
            return (false, 0, revenueAmount);
        }

        attendanceRate = e.userRegCount > 0 ? (e.verifiedAttendeesCount * 100) / e.userRegCount : 0;
        canRelease = (msg.sender == e.organizer && attendanceRate >= MINIMUM_ATTENDANCE_RATE) || msg.sender == owner();
    }

    function getEventsRequiringManualRelease() external view onlyOwner returns (uint256[] memory) {
        uint256[] memory temp = new uint256[](totalEventsOrganized);
        uint256 cnt = 0;
        for (uint256 i = 1; i <= totalEventsOrganized; i++) {
            Event memory e = events[i];
            uint256 bal = organiserRevBal[e.organizer][e.id];
            if (bal > 0 && !e.revenueReleased && block.timestamp > e.endDate) {
                uint256 rate = e.userRegCount > 0 ? (e.verifiedAttendeesCount * 100) / e.userRegCount : 0;
                if (rate < MINIMUM_ATTENDANCE_RATE) {
                    temp[cnt++] = e.id;
                }
            }
        }
        uint256[] memory result = new uint256[](cnt);
        for (uint256 j = 0; j < cnt; j++) {
            result[j] = temp[j];
        }
        return result;
    }

    function multicall(bytes[] calldata data) external returns (bytes[] memory results) {
        results = new bytes[](data.length);
        for (uint256 i = 0; i < data.length; i++) {
            (bool success, bytes memory ret) = address(this).delegatecall(data[i]);
            if (!success) revert("Multicall failed");
            results[i] = ret;
        }
        return results;
    }

    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }
}