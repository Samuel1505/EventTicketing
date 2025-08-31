import { expect } from "chai";
import { ethers } from "hardhat";
import { Ticket_NFT } from "../typechain-types";

describe("Ticket_NFT", function () {
  let TicketNFT: Ticket_NFT;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const TicketNFTFactory = await ethers.getContractFactory("Ticket_NFT");
    TicketNFT = (await TicketNFTFactory.deploy("EventTicket", "ETK")) as Ticket_NFT;
    await TicketNFT.waitForDeployment();
  });

  it("should deploy with correct name and symbol", async function () {
    expect(await TicketNFT.name()).to.equal("EventTicket");
    expect(await TicketNFT.symbol()).to.equal("ETK");
  });

  describe("safeMint", function () {
    it("should mint a new token to the given address", async function () {
      const tx = await TicketNFT.safeMint(addr1.address);
      const receipt = await tx.wait();
      // Find the Transfer event and decode it to get the tokenId
      const transferEvent = receipt?.logs
        .map(log => {
          try {
            return TicketNFT.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(event => event && event.name === "Transfer");
      const tokenId = transferEvent?.args?.tokenId;

      expect(await TicketNFT.ownerOf(tokenId)).to.equal(addr1.address);
    });

    it("should only allow the owner to mint", async function () {
      // Use revertedWithCustomError for OpenZeppelin's Ownable custom errors
      await expect(TicketNFT.connect(addr1).safeMint(addr1.address))
        .to.be.revertedWithCustomError(TicketNFT, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });
  });

  describe("batchMint", function () {
    it("should mint multiple tokens to the given address", async function () {
      const quantity = 3;
      
      // Use staticCall BEFORE executing the transaction to get the token IDs
      const tokenIds = await TicketNFT.batchMint.staticCall(addr1.address, quantity);
      expect(tokenIds.length).to.equal(quantity);

      // Now execute the actual transaction
      const tx = await TicketNFT.batchMint(addr1.address, quantity);
      await tx.wait();

      // Verify ownership of each token
      for (let i = 0; i < quantity; i++) {
        expect(await TicketNFT.ownerOf(tokenIds[i])).to.equal(addr1.address);
      }
    });

    it("should revert when quantity is zero", async function () {
      await expect(TicketNFT.batchMint(addr1.address, 0)).to.be.revertedWithCustomError(
        TicketNFT,
        "InvalidQuantity"
      );
    });

    it("should only allow the owner to batch mint", async function () {
      // Use revertedWithCustomError for OpenZeppelin's Ownable custom errors
      await expect(TicketNFT.connect(addr1).batchMint(addr1.address, 2))
        .to.be.revertedWithCustomError(TicketNFT, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });
  });

  describe("Token IDs", function () {
    it("should increment token IDs correctly", async function () {
      await TicketNFT.safeMint(addr1.address);
      await TicketNFT.safeMint(addr1.address);

      const quantity = 2;
      const tokenIds = await TicketNFT.batchMint.staticCall(addr1.address, quantity);

      // Expected next IDs = 2, 3 (assuming token IDs start from 0)
      expect(tokenIds[0]).to.equal(2);
      expect(tokenIds[1]).to.equal(3);
    });
  });
});