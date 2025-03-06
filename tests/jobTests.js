import { app } from "../app.js";
import { factory, seed_db, testUserPassword } from "../util/seed_db.js";
import Job from "../models/Job.js";
import get_chai from "../util/get_chai.js";

describe("Job CRUD Operations", function () {
  before(async function () {
    this.timeout(10000);
    const { expect, request } = await get_chai();
    this.test_user = await seed_db();

    // Get CSRF token and cookie from login page
    let req = request.execute(app).get("/session/logon").send();
    let res = await req;
    const textNoLineEnd = res.text.replaceAll("\n", "");
    this.csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];
    let cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) =>
      element.startsWith("csrfToken")
    );

    // Perform login
    const loginData = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };
    req = request
      .execute(app)
      .post("/session/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(loginData);
    res = await req;
    cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid")
    );

    expect(this.csrfToken).to.not.be.undefined;
    expect(this.sessionCookie).to.not.be.undefined;
    expect(this.csrfCookie).to.not.be.undefined;
  });

  it("should retrieve all jobs for the user", async function () {
    this.timeout(5000);
    const { expect, request } = await get_chai();
    const req = request
      .execute(app)
      .get("/jobs") // Adjust this endpoint based on your actual routes
      .set("Cookie", this.sessionCookie)
      .send();
    const res = await req;

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    const pageParts = res.text.split("<tr>");
    expect(pageParts.length - 1).to.equal(20); // 20 jobs from seed
  });

  it("should create a new job with valid status", async function () {
    this.timeout(5000);
    const { expect, request } = await get_chai();
    const newJob = await factory.build("job", { 
      createdBy: this.test_user._id,
      status: "current" // Using one of your validStatuses
    });

    const jobData = {
      company: newJob.company,
      position: newJob.position,
      status: newJob.status,
      _csrf: this.csrfToken,
    };

    const req = request
      .execute(app)
      .post("/jobs") // Adjust this endpoint based on your actual routes
      .set("Cookie", `${this.csrfCookie};${this.sessionCookie}`)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(jobData);

    const res = await req;
    expect(res).to.have.status(200);
    expect(res.text).to.include("Job listing has been added"); // Adjust based on your success message

    const jobs = await Job.find({ createdBy: this.test_user._id });
    expect(jobs.length).to.equal(21); // 20 from seed + 1 new
    expect(jobs[jobs.length - 1].status).to.be.oneOf(['previous', 'current', 'future', 'pending']);
  });
});