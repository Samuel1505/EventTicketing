const hre = require("hardhat");

async function main() {
  const EventTicketing = await hre.ethers.getContractFactory("EventTicketing");
  const eventTicketing = await EventTicketing.deploy(); 
  
  await eventTicketing.waitForDeployment();
  
  console.log(`EventTicketing contract deployed to: ${eventTicketing.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});