// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


library Errors {
    error EventDoesNotExist(uint256 eventId);
    error InvalidEventDates(uint256 start, uint256 end);
    error InvalidExpectedAttendees(uint256 attendees);
    error EmptyTitle();
    error EmptyDescription();
    error InvalidTicketCategory();
    error TicketCategoryAlreadyExists();
    error InvalidTicketFee();
    error EventEnded();
    error InsufficientPayment();
    error AlreadyRegistered();
    error NoSlotsAvailable();
    error EventNotStarted();
    error EventHasEnded();
    error AlreadyVerified();
    error DoesNotOwnNFT();
    error NoRevenueToRelease();
    error RevenueAlreadyReleased();
    error LowAttendanceRate();
    error NotAuthorized();
    error TransferFailed();
}