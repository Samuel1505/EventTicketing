import { expect } from "chai";
import { ethers } from "hardhat";
import {
  loadFixture,
  time,
  setBalance,
  mine,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

enum PaidTicketCategory {
  NONE = 0,
  REGULAR = 1,
  VIP = 2,
}

describe("EventTicketing", function () {
  async function deployFixture() {
    const [owner, organizer, buyer, buyer2, r1, r2, r3, stranger] =
      await ethers.getSigners();

    // Deploy EventTicketing
    const EventTicketing = await ethers.getContractFactory("EventTicketing");
    const ticketing = await EventTicketing.deploy();
    await ticketing.waitForDeployment();

    // Base timestamps
    const now = await time.latest();
    const start = now + 7 * 60; // start in 7 minutes
    const end = start + 3600; // 1 hour duration

    return {
      ticketing,
      owner,
      organizer,
      buyer,
      buyer2,
      r1,
      r2,
      r3,
      stranger,
      now,
      start,
      end,
    };
  }

  async function createEvent(
    ticketing: any,
    organizer: any,
    {
      title = "DevCon",
      description = "Great conf",
      location = "Lagos",
      startDate,
      endDate,
      expectedAttendees = 5,
      isPaid = true,
    }: {
      title?: string;
      description?: string;
      location?: string;
      startDate: number;
      endDate: number;
      expectedAttendees?: number;
      isPaid?: boolean;
    }
  ) {
    const tx = await ticketing
      .connect(organizer)
      .createEvent(
        title,
        description,
        location,
        startDate,
        endDate,
        expectedAttendees,
        isPaid
      );
    const rc = await tx.wait();
    // eventId increments from 1
    const eventId = await ticketing.totalEventsOrganized();
    return eventId;
  }

  async function getTicket(
    ticketing: any,
    eventId: number,
    cat: PaidTicketCategory
  ) {
    const t = await ticketing.eventTickets(eventId, cat);
    return { nft: t.nft as string, price: t.price as bigint };
  }

  it("createEvent: validates inputs and emits EventOrganized", async () => {
    const { ticketing, organizer, now } = await loadFixture(deployFixture);

    await expect(
      ticketing
        .connect(organizer)
        .createEvent("", "d", "l", now + 100, now + 200, 10, true)
    ).to.be.revertedWithCustomError(ticketing, "EmptyTitle");

    await expect(
      ticketing
        .connect(organizer)
        .createEvent("t", "", "l", now + 100, now + 200, 10, true)
    ).to.be.revertedWithCustomError(ticketing, "EmptyDescription");

    await expect(
      ticketing
        .connect(organizer)
        .createEvent("t", "d", "", now + 100, now + 200, 10, true)
    ).to.be.revertedWithCustomError(ticketing, "EmptyLocation");

    await expect(
      ticketing
        .connect(organizer)
        .createEvent("t", "d", "l", now + 200, now + 100, 10, true)
    ).to.be.revertedWithCustomError(ticketing, "InvalidEventDates");

    await expect(
      ticketing
        .connect(organizer)
        .createEvent("t", "d", "l", now + 100, now + 200, 0, true)
    ).to.be.revertedWithCustomError(ticketing, "InvalidExpectedAttendees");

    const tx = ticketing
      .connect(organizer)
      .createEvent("t", "d", "l", now + 100, now + 200, 10, true);
    await expect(tx)
      .to.emit(ticketing, "EventOrganized")
      .withArgs(1, organizer.address);
  });

  it("getEvent / getAllEvents work", async () => {
    const { ticketing, organizer, start, end } = await loadFixture(
      deployFixture
    );
    const id1 = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 3,
      isPaid: false,
    });
    const id2 = await createEvent(ticketing, organizer, {
      title: "Another",
      startDate: start + 1000,
      endDate: end + 1000,
      expectedAttendees: 2,
      isPaid: true,
    });

    const data1 = ticketing.interface.encodeFunctionData("getEvent", [id1]);
    const tx1 = { to: await ticketing.getAddress(), data: data1 };
    const raw1 = await ethers.provider.call(tx1);
    const e1 = ticketing.interface.decodeFunctionResult("getEvent", raw1)[0];
    expect(e1.id).to.equal(id1);

    await expect(ticketing.getEvent(999)).to.be.revertedWithCustomError(
      ticketing,
      "EventDoesNotExist"
    );

    const all = await ticketing.getAllEvents();
    expect(all.length).to.eq(2);
    expect(all[0].id).to.equal(id1);
    expect(all[1].id).to.equal(id2);
  });

  it("updateEvent* succeed before start and revert after start / on invalids / by non-organizer", async () => {
    const { ticketing, organizer, stranger, start, end } = await loadFixture(
      deployFixture
    );
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 5,
      isPaid: false,
    });

    await expect(
      ticketing.connect(stranger).updateEventTitle(id, "x")
    ).to.be.revertedWithCustomError(ticketing, "NotAuthorized");

    await expect(
      ticketing.connect(organizer).updateEventTitle(id, "")
    ).to.be.revertedWithCustomError(ticketing, "EmptyTitle");

    await expect(
      ticketing.connect(organizer).updateEventDescription(id, "")
    ).to.be.revertedWithCustomError(ticketing, "EmptyDescription");

    await expect(
      ticketing.connect(organizer).updateEventLocation(id, "")
    ).to.be.revertedWithCustomError(ticketing, "EmptyLocation");

    await expect(
      ticketing.connect(organizer).updateEventStartDate(id, end + 1)
    ).to.be.revertedWithCustomError(ticketing, "InvalidEventDates");

    await expect(
      ticketing.connect(organizer).updateEventEndDate(id, start - 1)
    ).to.be.revertedWithCustomError(ticketing, "InvalidEventDates");

    await expect(
      ticketing.connect(organizer).updateEventExpectedAttendees(id, 0)
    ).to.be.revertedWithCustomError(ticketing, "InvalidExpectedAttendees");

    // valid updates before start
    await expect(
      ticketing.connect(organizer).updateEventTitle(id, "NewTitle")
    )
      .to.emit(ticketing, "EventUpdated")
      .withArgs(id, "title");

    await expect(
      ticketing.connect(organizer).updateEventDescription(id, "NewDesc")
    )
      .to.emit(ticketing, "EventUpdated")
      .withArgs(id, "description");

    await expect(
      ticketing.connect(organizer).updateEventLocation(id, "Abuja")
    )
      .to.emit(ticketing, "EventUpdated")
      .withArgs(id, "location");

    await expect(
      ticketing.connect(organizer).updateEventStartDate(id, start + 60)
    )
      .to.emit(ticketing, "EventUpdated")
      .withArgs(id, "startDate");

    await expect(ticketing.connect(organizer).updateEventEndDate(id, end + 60))
      .to.emit(ticketing, "EventUpdated")
      .withArgs(id, "endDate");

    await expect(
      ticketing.connect(organizer).updateEventExpectedAttendees(id, 10)
    )
      .to.emit(ticketing, "EventUpdated")
      .withArgs(id, "expectedAttendees");

    // After start, updates disallowed
    await time.setNextBlockTimestamp(end + 10);
    await expect(
      ticketing.connect(organizer).updateEventTitle(id, "Late")
    ).to.be.revertedWithCustomError(ticketing, "UpdateNotAllowedAfterStart");
  });

  it("cannot reduce expected attendees below current registrations", async () => {
    const { ticketing, organizer, buyer, buyer2, start, end } = await loadFixture(
      deployFixture
    );
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 2,
      isPaid: true,
    });

    // Create paid tickets
    await ticketing
      .connect(organizer)
      .createTicket(id, PaidTicketCategory.REGULAR, ethers.parseEther("1"));

    await ticketing
      .connect(organizer)
      .createTicket(id, PaidTicketCategory.VIP, ethers.parseEther("2"));

    // One registration
    await ticketing
      .connect(buyer)
      .purchaseTicket(id, PaidTicketCategory.REGULAR, {
        value: ethers.parseEther("1"),
      });

    await ticketing
      .connect(buyer2)
      .purchaseTicket(id, PaidTicketCategory.REGULAR, {
        value: ethers.parseEther("1"),
      });

    await expect(
      ticketing.connect(organizer).updateEventExpectedAttendees(id, 0)
    ).to.be.revertedWithCustomError(ticketing, "InvalidExpectedAttendees");

    await expect(
      ticketing.connect(organizer).updateEventExpectedAttendees(id, 1)
    ).to.be.revertedWithCustomError(
      ticketing,
      "CannotReduceAttendeesBelowCurrent"
    );
  });

  it("createTicket rules (free vs paid, VIP/REGULAR price ordering, uniqueness, only organizer)", async () => {
    const { ticketing, organizer, stranger, start, end } = await loadFixture(
      deployFixture
    );
    // FREE event
    const freeId = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      isPaid: false,
    });

    await expect(
      ticketing
        .connect(organizer)
        .createTicket(freeId, PaidTicketCategory.REGULAR, 0)
    ).to.be.revertedWithCustomError(ticketing, "InvalidTicketCategory");
    await expect(
      ticketing
        .connect(organizer)
        .createTicket(freeId, PaidTicketCategory.NONE, ethers.parseEther("1"))
    ).to.be.revertedWithCustomError(ticketing, "InvalidTicketCategory");

    await expect(
      ticketing.connect(stranger).createTicket(freeId, PaidTicketCategory.NONE, 0)
    ).to.be.revertedWithCustomError(ticketing, "NotAuthorized");

    await expect(
      ticketing.connect(organizer).createTicket(freeId, PaidTicketCategory.NONE, 0)
    )
      .to.emit(ticketing, "TicketCreated")
      .withArgs(freeId, PaidTicketCategory.NONE, anyAddress());

    // PAID event
    const paidId = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      isPaid: true,
    });

    await expect(
      ticketing
        .connect(organizer)
        .createTicket(paidId, PaidTicketCategory.NONE, 0)
    ).to.be.revertedWithCustomError(ticketing, "InvalidTicketFee");

    // Must set REGULAR < VIP
    await ticketing
      .connect(organizer)
      .createTicket(paidId, PaidTicketCategory.REGULAR, ethers.parseEther("1"));

    await expect(
      ticketing
        .connect(organizer)
        .createTicket(paidId, PaidTicketCategory.VIP, ethers.parseEther("1")) // not > regular
    ).to.be.revertedWithCustomError(ticketing, "InvalidTicketFee");

    await ticketing
      .connect(organizer)
      .createTicket(paidId, PaidTicketCategory.VIP, ethers.parseEther("2"));

    // Cannot duplicate category
    await expect(
      ticketing
        .connect(organizer)
        .createTicket(paidId, PaidTicketCategory.REGULAR, ethers.parseEther("1"))
    ).to.be.revertedWithCustomError(ticketing, "TicketCategoryAlreadyExists");
  });

  it("purchaseTicket (single): validates category, price, caps, and updates counters/revenue", async () => {
    const { ticketing, organizer, buyer, start, end } = await loadFixture(
      deployFixture
    );
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 1,
      isPaid: true,
    });

    await expect(
      ticketing.connect(buyer).purchaseTicket(id, PaidTicketCategory.REGULAR)
    ).to.be.revertedWithCustomError(ticketing, "InvalidTicketCategory"); // no tickets yet

    await ticketing
      .connect(organizer)
      .createTicket(id, PaidTicketCategory.REGULAR, ethers.parseEther("1"));

    await expect(
      ticketing
        .connect(buyer)
        .purchaseTicket(id, PaidTicketCategory.REGULAR, { value: 0 })
    ).to.be.revertedWithCustomError(ticketing, "InsufficientPayment");

    await expect(
      ticketing
        .connect(buyer)
        .purchaseTicket(id, PaidTicketCategory.VIP, {
          value: ethers.parseEther("2"),
        })
    ).to.be.revertedWithCustomError(ticketing, "InvalidTicketCategory");

    await expect(
      ticketing
        .connect(buyer)
        .purchaseTicket(id, PaidTicketCategory.REGULAR, {
          value: ethers.parseEther("1"),
        })
    )
      .to.emit(ticketing, "TicketPurchased")
      .withArgs(id, buyer.address, buyer.address, PaidTicketCategory.REGULAR);

    expect(await ticketing.totalPurchasedTickets()).to.eq(1);
    expect(await ticketing.organiserRevBal(organizer.address, id)).to.eq(
      ethers.parseEther("1")
    );

    // Cap reached
    await expect(
      ticketing
        .connect(buyer)
        .purchaseTicket(id, PaidTicketCategory.REGULAR, {
          value: ethers.parseEther("1"),
        })
    ).to.be.revertedWithCustomError(ticketing, "NoSlotsAvailable");
  });

  it("purchaseTickets (batch): correct value, quantity>0, capacity check, counters & revenue", async () => {
    const { ticketing, organizer, buyer, start, end } = await loadFixture(
      deployFixture
    );
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 3,
      isPaid: true,
    });

    await ticketing
      .connect(organizer)
      .createTicket(id, PaidTicketCategory.REGULAR, ethers.parseEther("1"));

    await expect(
      ticketing
        .connect(buyer)
        .purchaseTickets(id, PaidTicketCategory.REGULAR, 0, {
          value: 0,
        })
    ).to.be.revertedWithCustomError(ticketing, "InvalidQuantity");

    await expect(
      ticketing
        .connect(buyer)
        .purchaseTickets(id, PaidTicketCategory.REGULAR, 2, {
          value: ethers.parseEther("1"),
        })
    ).to.be.revertedWithCustomError(ticketing, "InsufficientPayment");

    await expect(
      ticketing
        .connect(buyer)
        .purchaseTickets(id, PaidTicketCategory.REGULAR, 4, {
          value: ethers.parseEther("4"),
        })
    ).to.be.revertedWithCustomError(ticketing, "NoSlotsAvailable");

    await ticketing
      .connect(buyer)
      .purchaseTickets(id, PaidTicketCategory.REGULAR, 2, {
        value: ethers.parseEther("2"),
      });

    expect(await ticketing.totalPurchasedTickets()).to.eq(2);
    expect(await ticketing.organiserRevBal(organizer.address, id)).to.eq(
      ethers.parseEther("2")
    );
  });

  it("purchaseMultipleTickets: mints for valid recipients, handles capacity, charges exact used amount, and refunds excess", async () => {
    const { ticketing, organizer, buyer, r1, r2, r3, start, end } =
      await loadFixture(deployFixture);
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 2,
      isPaid: true,
    });

    await ticketing
      .connect(organizer)
      .createTicket(id, PaidTicketCategory.VIP, ethers.parseEther("2"));

    // Send value equal to 3 VIPs but capacity is 2; expect refund of 1 * price
    const recipients = [r1.address, ethers.ZeroAddress, r2.address, r3.address];

    const buyerBalBefore = await ethers.provider.getBalance(buyer.address);

    const tx = await ticketing
      .connect(buyer)
      .purchaseMultipleTickets(id, PaidTicketCategory.VIP, recipients, {
        value: ethers.parseEther("6"), // more than needed
      });
    const receipt = await tx.wait();
    const gas = receipt!.fee!; // Ethers v6

    // Only 2 possible (capacity=2, one zero-address ignored)
    const rev = await ticketing.organiserRevBal(organizer.address, id);
    expect(rev).to.eq(ethers.parseEther("4"));
    expect(await ticketing.totalPurchasedTickets()).to.eq(2);

    // Buyer balance changed by exactly 4 ETH (paid) + gas (ignoring minor deltas)
    const buyerBalAfter = await ethers.provider.getBalance(buyer.address);
    const spent = buyerBalBefore - buyerBalAfter - gas;
    // Should be close to 4 ETH (no dust)
    expect(spent).to.eq(ethers.parseEther("4"));
  });

  it("verifyAttendance + verifyGroupAttendance count unique attendees within time window only", async () => {
    const { ticketing, organizer, buyer, buyer2, start, end } =
      await loadFixture(deployFixture);
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 3,
      isPaid: true,
    });

    await ticketing
      .connect(organizer)
      .createTicket(id, PaidTicketCategory.REGULAR, ethers.parseEther("1"));

    // Buy 2 different users
    await ticketing
      .connect(buyer)
      .purchaseTicket(id, PaidTicketCategory.REGULAR, {
        value: ethers.parseEther("1"),
      });
    await ticketing
      .connect(buyer2)
      .purchaseTicket(id, PaidTicketCategory.REGULAR, {
        value: ethers.parseEther("1"),
      });

    // Too early
    await expect(
      ticketing.connect(buyer).verifyAttendance(id)
    ).to.be.revertedWithCustomError(ticketing, "DoesNotOwnNFT"); // because tryVerify returns false when before start

    // Move into the event window
    await time.setNextBlockTimestamp(start + 10);
    await mine();

    await expect(ticketing.connect(buyer).verifyAttendance(id))
      .to.emit(ticketing, "AttendeeVerified")
      .withArgs(id, buyer.address);

    // Duplicate verification ignored
    await ticketing.connect(buyer).verifyAttendance(id);
    const e = await ticketing.getEvent(id);
    expect(e.verifiedAttendeesCount).to.eq(1);

    // Group verify (includes an already-verified and a fresh one)
    await ticketing
      .connect(buyer)
      .verifyGroupAttendance(id, [buyer.address, buyer2.address]);
    const e2 = await ticketing.getEvent(id);
    expect(e2.verifiedAttendeesCount).to.eq(2);
  });

  it("releaseRevenue: only after end; organizer needs >=60% verified rate; owner can override; transfers & emits", async () => {
    const { ticketing, organizer, owner, buyer, buyer2, start, end } =
      await loadFixture(deployFixture);
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 3,
      isPaid: true,
    });

    await ticketing
      .connect(organizer)
      .createTicket(id, PaidTicketCategory.REGULAR, ethers.parseEther("1"));

    // 3 purchases
    await ticketing
      .connect(buyer)
      .purchaseTicket(id, PaidTicketCategory.REGULAR, {
        value: ethers.parseEther("1"),
      });
    await ticketing
      .connect(buyer2)
      .purchaseTicket(id, PaidTicketCategory.REGULAR, {
        value: ethers.parseEther("1"),
      });
    await ticketing
      .connect(organizer)
      .purchaseTicket(id, PaidTicketCategory.REGULAR, {
        value: ethers.parseEther("1"),
      });

    // Before end
    await expect(
      ticketing.connect(organizer).releaseRevenue(id)
    ).to.be.revertedWithCustomError(ticketing, "EventHasEnded");

    // Move into window and verify 2/3 (>= 66%)
    await time.setNextBlockTimestamp(start + 5);
    await ticketing.connect(buyer).verifyAttendance(id);
    await ticketing.connect(buyer2).verifyAttendance(id);

    // After end
    await time.setNextBlockTimestamp(end + 1);

    const balBefore = await ethers.provider.getBalance(organizer.address);
    const tx = await ticketing.connect(organizer).releaseRevenue(id);
    const receipt = await tx.wait();
    const gas = receipt!.fee!;

    const balAfter = await ethers.provider.getBalance(organizer.address);
    // Received 3 ETH total revenue
    expect(balAfter - balBefore + gas).to.eq(ethers.parseEther("3"));

    await expect(
      ticketing.connect(organizer).releaseRevenue(id)
    ).to.be.revertedWithCustomError(ticketing, "RevenueAlreadyReleased");
  });

  it("owner can release even if rate < 60%, but not before end; handles NoRevenueToRelease & TransferFailed guards", async () => {
    const { ticketing, organizer, owner, buyer, start, end } =
      await loadFixture(deployFixture);
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 2,
      isPaid: true,
    });

    await ticketing
      .connect(organizer)
      .createTicket(id, PaidTicketCategory.VIP, ethers.parseEther("2"));

    await ticketing
      .connect(buyer)
      .purchaseTicket(id, PaidTicketCategory.VIP, {
        value: ethers.parseEther("2"),
      });

    // No verification -> 0% rate
    await time.setNextBlockTimestamp(end + 2);

    // Owner override allowed
    await expect(ticketing.connect(owner).releaseRevenue(id))
      .to.emit(ticketing, "RevenueReleased")
      .withArgs(organizer.address, id, ethers.parseEther("2"));

    // No revenue left
    await expect(
      ticketing.connect(owner).releaseRevenue(id)
    ).to.be.revertedWithCustomError(ticketing, "RevenueAlreadyReleased");
  });

  it("canReleaseRevenue returns accurate tuple", async () => {
    const { ticketing, organizer, owner, buyer, start, end } =
      await loadFixture(deployFixture);
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 2,
      isPaid: true,
    });

    await ticketing
      .connect(organizer)
      .createTicket(id, PaidTicketCategory.REGULAR, ethers.parseEther("1"));

    await ticketing
      .connect(buyer)
      .purchaseTicket(id, PaidTicketCategory.REGULAR, {
        value: ethers.parseEther("1"),
      });

    // Before end
    let r = await ticketing.connect(organizer).canReleaseRevenue(id);
    expect(r.canRelease).to.eq(false);
    expect(r.revenueAmount).to.eq(ethers.parseEther("1"));

    await time.setNextBlockTimestamp(start + 10);
    await ticketing.connect(buyer).verifyAttendance(id);
    await time.setNextBlockTimestamp(end + 1);
    await mine();

    r = await ticketing.connect(organizer).canReleaseRevenue(id);
    expect(r.attendanceRate).to.eq(100);
    expect(r.canRelease).to.eq(true);

    // Owner also can
    r = await ticketing.connect(owner).canReleaseRevenue(id);
    expect(r.canRelease).to.eq(true);
  });

  it("getEventsRequiringManualRelease lists events below threshold after end with revenue", async () => {
    const { ticketing, organizer, owner, buyer, buyer2, start, end } =
      await loadFixture(deployFixture);

    // Event A: 2 buyers, only 0 verified -> should appear
    const a = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 2,
      isPaid: true,
    });
    await ticketing
      .connect(organizer)
      .createTicket(a, PaidTicketCategory.REGULAR, ethers.parseEther("1"));
    await ticketing
      .connect(buyer)
      .purchaseTicket(a, PaidTicketCategory.REGULAR, { value: ethers.parseEther("1") });
    await ticketing
      .connect(buyer2)
      .purchaseTicket(a, PaidTicketCategory.REGULAR, { value: ethers.parseEther("1") });

    // Event B: 1/1 verified -> should NOT appear
    const b = await createEvent(ticketing, organizer, {
      startDate: start + 5,
      endDate: end + 5,
      expectedAttendees: 1,
      isPaid: true,
    });
    await ticketing
      .connect(organizer)
      .createTicket(b, PaidTicketCategory.VIP, ethers.parseEther("2"));
    await ticketing
      .connect(buyer)
      .purchaseTicket(b, PaidTicketCategory.VIP, { value: ethers.parseEther("2") });

    await time.setNextBlockTimestamp(start + 10);
    await ticketing.connect(buyer).verifyAttendance(b);

    await time.setNextBlockTimestamp(end + 10);
    await mine();

    const list = await ticketing.connect(owner).getEventsRequiringManualRelease();
    expect(list).to.include(a).and.not.include(b);
  });

  it("multicall delegates multiple updates in one tx", async () => {
    const { ticketing, organizer, start, end } = await loadFixture(
      deployFixture
    );
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      isPaid: false,
    });

    const iface = ticketing.interface;
    const calls = [
      iface.encodeFunctionData("updateEventTitle", [id, "BatchTitle"]),
      iface.encodeFunctionData("updateEventDescription", [id, "BatchDesc"]),
    ];

    await ticketing.connect(organizer).multicall(calls);

    const data = ticketing.interface.encodeFunctionData("getEvent", [id]);
    const tx = { to: await ticketing.getAddress(), data };
    const raw = await ethers.provider.call(tx);
    const e = ticketing.interface.decodeFunctionResult("getEvent", raw)[0];
    expect(e.title).to.eq("BatchTitle");
    expect(e.description).to.eq("BatchDesc");
  });

  it("receive(): emits EtherReceived", async () => {
    const { ticketing, organizer } = await loadFixture(deployFixture);

    await expect(
      organizer.sendTransaction({
        to: await ticketing.getAddress(),
        value: ethers.parseEther("0.5"),
      })
    )
      .to.emit(ticketing, "EtherReceived")
      .withArgs(organizer.address, ethers.parseEther("0.5"));
  });

  it("purchaseTicket / purchaseTickets / purchaseMultipleTickets revert if event ended", async () => {
    const { ticketing, organizer, buyer, start, end } = await loadFixture(
      deployFixture
    );
    const id = await createEvent(ticketing, organizer, {
      startDate: start,
      endDate: end,
      expectedAttendees: 10,
      isPaid: true,
    });
    await ticketing
      .connect(organizer)
      .createTicket(id, PaidTicketCategory.REGULAR, ethers.parseEther("1"));

    await time.setNextBlockTimestamp(end + 5);

    await expect(
      ticketing
        .connect(buyer)
        .purchaseTicket(id, PaidTicketCategory.REGULAR, {
          value: ethers.parseEther("1"),
        })
    ).to.be.revertedWithCustomError(ticketing, "EventEnded");

    await expect(
      ticketing
        .connect(buyer)
        .purchaseTickets(id, PaidTicketCategory.REGULAR, 2, {
          value: ethers.parseEther("2"),
        })
    ).to.be.revertedWithCustomError(ticketing, "EventEnded");

    await expect(
      ticketing
        .connect(buyer)
        .purchaseMultipleTickets(id, PaidTicketCategory.REGULAR, [buyer.address], {
          value: ethers.parseEther("1"),
        })
    ).to.be.revertedWithCustomError(ticketing, "EventEnded");
  });
});

// Small helper for flexible address matching
function anyAddress() {
  return (v: string) => ethers.isAddress(v);
}