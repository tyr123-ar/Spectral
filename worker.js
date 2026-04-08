const { Worker } = require("bullmq");
const { executeCpp } = require("./executeCpp");
const { generateFile } = require("./generateFile");
const { generateInputFile } = require("./generateInputFile");
const fs = require("fs");
const { Submission } = require("./db");

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";

const worker = new Worker(
    "python-codes",
    async (job) => {
        console.log(`Processing job ${job.id}...`);
        const { code, input, submissionId } = job.data;
        let filepath, inputPath;

        try {
            filepath = await generateFile("cpp", code);
            inputPath = input ? await generateInputFile(input) : null;

            const output = await executeCpp(filepath, inputPath);

            await Submission.update(
                { status: "Accepted", output: output.trim() },
                { where: { id: submissionId } }
            );

            return output.trim();

        } catch (err) {
            console.error(`FAILED for Job ${job.id}:`, err.message);
            await Submission.update(
                { status: "Error", error: err.message },
                { where: { id: submissionId } }
            );
            throw err; 
        } finally {
            if (filepath && fs.existsSync(filepath)) fs.unlinkSync(filepath);
            if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        }
    },
    {
        connection: { host: REDIS_HOST, port: 6379 },
        concurrency: 2,
    }
);

console.log("Worker is running...");