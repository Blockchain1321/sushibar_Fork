// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  [owner] = await hre.ethers.getSigners();
  sushi = await hre.ethers.getContractFactory("SushiToken");
  const sushiToken = await sushi.deploy();
  await sushiToken.deployed();
  console.log("sushiToken Address :",sushiToken.address);

  const rPool = await ethers.getContractFactory("RewardPool");
  const rewardPool = await rPool.deploy(sushiToken.address);
  await rewardPool.deployed();  
  console.log("RewardPool Address :",rewardPool.address);

  const sBar = await ethers.getContractFactory("Sushibar");
  const sushiBar = await sBar.deploy(sushiToken.address,rewardPool.address);
  await sushiBar.deployed();
  console.log("SushiBar Address :",sushiBar.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
