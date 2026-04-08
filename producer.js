const { Queue } = require("bullmq");
const { v4: uuidv4 } = require("uuid");
const { Submission } = require("./db");

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const submissionQueue = new Queue("python-codes", {
    connection: { host: REDIS_HOST, port: 6379 },
});

async function addSubmissionToQueue(userCode, userInput) {
    console.log("Adding job to queue...");
    const submissionId = uuidv4();

    await Submission.create({
        id: submissionId,
        code: userCode,
        language: "cpp",
        input: userInput,
        status: "Pending"
    });

    const job = await submissionQueue.add("execute-cpp", {
        submissionId: submissionId,
        code: userCode,
        input: userInput,
    });

    console.log(`Job added! Submission ID: ${submissionId}`);
}

const exampleCode = `#include <iostream>\nint main() { int a; std::cin >> a; std::cout << a * 2; return 0; }`;
addSubmissionToQueue(exampleCode, "50");