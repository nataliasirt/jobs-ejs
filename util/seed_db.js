// util/seed_db.js
import Job from "../models/Job.js";
import User from "../models/User.js";
import { faker } from "@faker-js/faker";
import factoryBot from "factory-bot"; // Default import
import "dotenv/config.js";

const { factory, MongooseAdapter } = factoryBot; // Destructure from default export
const testUserPassword = faker.internet.password();
const factoryAdapter = new MongooseAdapter();
factory.setAdapter(factoryAdapter);

factory.define("job", Job, {
  company: () => faker.company.name(),
  position: () => faker.person.jobTitle(),
  status: () => ["previous", "current", "future", "pending"][Math.floor(Math.random() * 4)],
  createdBy: null,
});

factory.define("user", User, {
  name: () => faker.person.fullName(),
  email: () => faker.internet.email(),
  password: () => faker.internet.password(),
});

const seed_db = async () => {
  let testUser = null;
  try {
    const mongoURL = process.env.MONGO_URI_TEST;
    await Job.deleteMany({});
    await User.deleteMany({});
    testUser = await factory.create("user", { password: testUserPassword });
    await factory.createMany("job", 20, { createdBy: testUser._id });
  } catch (e) {
    console.log("Database error:", e.message);
    throw e;
  }
  return testUser;
};

export { testUserPassword, factory, seed_db };