import puppeteer from "puppeteer";
import "../app.js";
import { seed_db, testUserPassword } from "../util/seed_db.js";
import Job from "../models/Job.js";

let page = null;
let browser = null;

describe("Job Operations with Puppeteer", function () {
  before(async function () {
    this.timeout(10000);
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    this.test_user = await seed_db();
    await page.goto("http://localhost:3000");
  });

  after(async function () {
    this.timeout(5000);
    await browser.close();
  });

  describe("Login and Job Operations", function () {
    it("should login successfully", async function () {
      this.timeout(10000);
      await page.goto("http://localhost:3000/session/logon");
      await page.waitForSelector('input[name="email"]');

      await page.type('input[name="email"]', this.test_user.email);
      await page.type('input[name="password"]', testUserPassword);
      await page.click("button ::-p-text(Logon)");
      await page.waitForNavigation();

      await page.waitForSelector(`p ::-p-text(${this.test_user.name})`);
    });

    it("should show job list with 20 entries", async function () {
      this.timeout(10000);
      await page.click('a[href="/jobs"]');
      await page.waitForNavigation();

      const content = await page.content();
      const rowCount = content.split("<tr>").length - 1; // Subtract 1 for header
      const { expect } = await import("chai");
      expect(rowCount).to.equal(20);
    });

    it("should navigate to add job form", async function () {
      this.timeout(10000);
      await page.click("a ::-p-text(Add A Job)");
      await page.waitForNavigation();

      await page.waitForSelector('input[name="company"]');
      await page.waitForSelector('input[name="position"]');
      await page.waitForSelector('select[name="status"]'); // Assuming a dropdown for status
      await page.waitForSelector("button ::-p-text(Add)");
    });

    it("should add a new job", async function () {
      this.timeout(10000);
      const newJob = {
        company: "Test Corp",
        position: "Developer",
        status: "future", // Using one of your validStatuses
      };

      await page.type('input[name="company"]', newJob.company);
      await page.type('input[name="position"]', newJob.position);
      await page.select('select[name="status"]', newJob.status); // Select status from dropdown
      await page.click("button ::-p-text(Add)");
      await page.waitForNavigation();

      const content = await page.content();
      const { expect } = await import("chai");
      expect(content).to.include("Job listing has been added");

      const jobs = await Job.find({ createdBy: this.test_user._id });
      expect(jobs.length).to.equal(21);
      expect(jobs[jobs.length - 1].company).to.equal(newJob.company);
      expect(jobs[jobs.length - 1].position).to.equal(newJob.position);
      expect(jobs[jobs.length - 1].status).to.equal(newJob.status);
    });
  });
});