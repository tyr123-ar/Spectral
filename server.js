const express = require("express");
const { Queue } = require("bullmq");
const { v4: uuidv4 } = require("uuid");
const { Submission } = require("./db");

const app = express();
app.use(express.json()); // Allows the server to read JSON bodies

// same queue connection worker uses. Use REDIS env vars so docker-compose can wire services.
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
const submissionQueue = new Queue("python-codes", {
    connection: { host: REDIS_HOST, port: REDIS_PORT },
});

//post endpoint where users send their code
app.post("/submit", async (req, res) => {
    const { code, input, language } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Code is required" });
    }

    try {
        const submissionId = uuidv4();

        //create the db record (Pending)
        await Submission.create({
            id: submissionId,
            code: code,
            language: language || "cpp",
            input: input || "",
            status: "Pending"
        });

        //add to the BullMQ Queue
        await submissionQueue.add("execute-cpp", {
            submissionId,
            code,
            input,
        });

        //respond to the user with the ID
        res.status(202).json({
            message: "Submission queued successfully",
            submissionId: submissionId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to queue submission" });
    }
});

//new endpoint to check the status of a submission
app.get("/status/:id", async (req, res) => {
    const submission = await Submission.findByPk(req.params.id);
    if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
    }
    res.json(submission);
});

const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 5000;
app.listen(PORT, () => {
    console.log(`API Server running on http://0.0.0.0:${PORT}`);
});
