const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("sushiBar", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
  
    // Contracts are deployed using the first signer/account by default
    const [owner, acc1] = await ethers.getSigners();

    const sToken = await ethers.getContractFactory("SushiToken");
    const sushiToken = await sToken.deploy();
    await sushiToken.deployed();

    const rPool = await ethers.getContractFactory("RewardPool");
    const rewardPool = await rPool.deploy(sushiToken.address);
    await rewardPool.deployed();

    const sBar = await ethers.getContractFactory("Sushibar");
    const sushiBar = await sBar.deploy(sushiToken.address,rewardPool.address);
    await sushiBar.deployed();

    await sushiToken.mint(acc1.address,"2000000000000000000000");
    return { sushiToken,rewardPool,sushiBar,acc1,owner};
  }

  describe("Deployment", function () {
    it("Should set the right sushi token", async function () {
      const {sushiToken,sushiBar} = await loadFixture(deployFixture);

      expect(await sushiBar.sushi()).to.equal(sushiToken.address);
    });

    it("Should set the right pool", async function () {
      const { sushiBar, rewardPool } = await loadFixture(deployFixture);

      expect(await sushiBar.pool()).to.equal(rewardPool.address);
    });
  });

  describe("enter", function () {
    it("Should mint correct amount of xSushi and sushi token should transfer to sushiBar", async function () {
      const {sushiToken,sushiBar,acc1} = await loadFixture(deployFixture);
      await sushiToken.connect(acc1).approve(sushiBar.address,"2000000000000000000000");
      await sushiBar.connect(acc1).enter("2000000000000000000000");
      expect(await sushiBar.balanceOf(acc1.address)).to.equal("2000000000000000000000");
      expect(await sushiToken.balanceOf(sushiBar.address)).to.equal("2000000000000000000000");
    });

    it("Should store the right data", async function () {
      const {sushiToken,sushiBar,acc1} = await loadFixture(deployFixture);
      await sushiToken.connect(acc1).approve(sushiBar.address,"2000000000000000000000");
      await sushiBar.connect(acc1).enter("2000000000000000000000");
      const atEnter = (await time.latest());
      const d = await sushiBar.deposits(0);
      expect(acc1.address).to.equal(d[0]);
      expect(atEnter).to.equal(d[1]);
      expect("2000000000000000000000").to.equal(d[2]);
    });
    it("Should return right depositID",async function (){
      const {sushiToken,sushiBar,acc1} = await loadFixture(deployFixture);
      await sushiToken.connect(acc1).approve(sushiBar.address,"2000000000000000000000");
      await sushiBar.connect(acc1).enter("1000000000000000000000");
      const e = await sushiBar.connect(acc1).enter("1000000000000000000000");
      const eWait = await e.wait();
      const depositId= eWait.events[3].args[0];
      expect(depositId).to.equal("1");
    });

    it("Should mint correct amount of xSushi in different scenario", async function () {
      const {sushiToken,sushiBar,acc1,owner} = await loadFixture(deployFixture);

      await sushiToken.connect(acc1).approve(sushiBar.address,"2000000000000000000000");
      await sushiBar.connect(acc1).enter("2000000000000000000000");

      await sushiToken.approve(sushiBar.address,"1000000000000000000000");
      await sushiBar.enter("1000000000000000000000");

      expect(await sushiBar.balanceOf(owner.address)).to.equal("1000000000000000000000");
    });
  });


  describe("Leave", function () {
    it("after 8 days 0% tax should deduct", async function () {
      const {sushiToken,sushiBar,acc1,rewardPool} = await loadFixture(deployFixture);

      await sushiToken.connect(acc1).approve(sushiBar.address,"2000000000000000000000");
      await sushiBar.connect(acc1).enter("2000000000000000000000");

      const EightDaysInSec = 8 * 24 * 60 * 60;
      const unlockTime = (await time.latest()) + EightDaysInSec;

      await time.increaseTo(unlockTime);
      await sushiBar.connect(acc1).leave("2000000000000000000000","0");
      expect(await sushiToken.balanceOf(acc1.address)).to.equal("2000000000000000000000");
      expect(await sushiToken.balanceOf(rewardPool.address)).to.equal("0");
      expect(await sushiBar.balanceOf(acc1.address)).to.equal("0");
    });

    it("after 6 days 25% tax should deduct", async function () {
      const {sushiToken,sushiBar,acc1,rewardPool} = await loadFixture(deployFixture);

      await sushiToken.connect(acc1).approve(sushiBar.address,"2000000000000000000000");
      await sushiBar.connect(acc1).enter("2000000000000000000000");

      const SevenDaysInSec = 7 * 24 * 60 * 60;
      const unlockTime = (await time.latest()) + SevenDaysInSec;

      await time.increaseTo(unlockTime);
      await sushiBar.connect(acc1).leave("2000000000000000000000","0");
      expect(await sushiToken.balanceOf(acc1.address)).to.equal("1500000000000000000000");
      expect(await sushiToken.balanceOf(rewardPool.address)).to.equal("500000000000000000000");
      expect(await sushiBar.balanceOf(acc1.address)).to.equal("0");
    });

    it("after 4days 50% tax should deduct", async function () {
      const {sushiToken,sushiBar,acc1,rewardPool} = await loadFixture(deployFixture);

      await sushiToken.connect(acc1).approve(sushiBar.address,"2000000000000000000000");
      await sushiBar.connect(acc1).enter("2000000000000000000000");

      const FiveDaysInSec = 5* 24 * 60 * 60;
      const unlockTime = (await time.latest()) + FiveDaysInSec;

      await time.increaseTo(unlockTime);
      await sushiBar.connect(acc1).leave("2000000000000000000000","0");
      expect(await sushiToken.balanceOf(acc1.address)).to.equal("1000000000000000000000");
      expect(await sushiToken.balanceOf(rewardPool.address)).to.equal("1000000000000000000000");
      expect(await sushiBar.balanceOf(acc1.address)).to.equal("0");
    });

    it("after 2days 75% tax should deduct", async function () {
      const {sushiToken,sushiBar,acc1,rewardPool} = await loadFixture(deployFixture);

      await sushiToken.connect(acc1).approve(sushiBar.address,"2000000000000000000000");
      await sushiBar.connect(acc1).enter("2000000000000000000000");

      const ThreeDaysInSec = 3* 24 * 60 * 60;
      const unlockTime = (await time.latest()) + ThreeDaysInSec;

      await time.increaseTo(unlockTime);
      await sushiBar.connect(acc1).leave("2000000000000000000000","0");
      expect(await sushiToken.balanceOf(acc1.address)).to.equal("500000000000000000000");
      expect(await sushiToken.balanceOf(rewardPool.address)).to.equal("1500000000000000000000");
      expect(await sushiBar.balanceOf(acc1.address)).to.equal("0");
    });

    it("amount should lock if try to leave before 2 days", async function () {
      const {sushiToken,sushiBar,acc1,rewardPool} = await loadFixture(deployFixture);

      await sushiToken.connect(acc1).approve(sushiBar.address,"2000000000000000000000");
      await sushiBar.connect(acc1).enter("2000000000000000000000");

      const EightDaysInSec = 1* 24 * 60 * 60;
      const unlockTime = (await time.latest()) + EightDaysInSec;

      await time.increaseTo(unlockTime);
      await sushiBar.connect(acc1).leave("2000000000000000000000","0");
      expect(await sushiToken.balanceOf(acc1.address)).to.equal("0");
      expect(await sushiToken.balanceOf(rewardPool.address)).to.equal("2000000000000000000000");
      expect(await sushiBar.balanceOf(acc1.address)).to.equal("0");
    });

  });
  
});
