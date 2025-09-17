import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Creating event...");

  // Get the contract
  const EventTicketing = await ethers.getContractFactory("EventTicketing");
  const contractAddress = "0x2791BcB4AE3c5b425630C74164de6aC150454e97"; // Sepolia address
  const eventTicketing = EventTicketing.attach(contractAddress);

  // Event parameters
  const eventParams = {
    title: "Web3 Conference 2024",
    description:
      "A comprehensive conference covering the latest in Web3 technology, DeFi, NFTs, and blockchain innovation.",
    location: "San Francisco Convention Center",
    startDate: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    endDate: Math.floor(Date.now() / 1000) + 8 * 24 * 60 * 60, // 8 days from now
    expectedAttendees: 500,
    isPaid: true,
    bannerCID: "QmYourBannerCIDHere",
  };

  try {
    console.log("📝 Creating event:", eventParams.title);

    const tx = await eventTicketing.createEvent(
      eventParams.title,
      eventParams.description,
      eventParams.location,
      eventParams.startDate,
      eventParams.endDate,
      eventParams.expectedAttendees,
      eventParams.isPaid,
      eventParams.bannerCID
    );

    console.log("📤 Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Event created successfully!");
    console.log("📦 Block:", receipt?.blockNumber);

    // Get event ID from logs
    const eventOrganizedEvent = receipt?.logs.find((log) => {
      try {
        const parsed = eventTicketing.interface.parseLog(log);
        return parsed?.name === "EventOrganized";
      } catch {
        return false;
      }
    });

    if (eventOrganizedEvent) {
      const parsedEvent =
        eventTicketing.interface.parseLog(eventOrganizedEvent);
      console.log("🆔 Event ID:", parsedEvent?.args.eventId.toString());
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
