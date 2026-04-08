const express = require("express");
const { Queue } = require("bullmq");
const { v4: uuidv4 } = require("uuid");
const { Submission } = require("./db");

const app = express();
app.use(express.json());

// Connect using environment variables for Docker networking
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const submissionQueue = new Queue("python-codes", {
    connection: { host: REDIS_HOST, port: 6379 },
});

app.post("/submit", async (req, res) => {
    const { code, input, language } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Code is required" });
    }

    try {
        const submissionId = uuidv4();

        await Submission.create({
            id: submissionId,
            code: code,
            language: language || "cpp",
            input: input || "",
            status: "Pending"
        });

        await submissionQueue.add("execute-cpp", {
            submissionId,
            code,
            input,
        });

        res.status(202).json({
            message: "Submission queued successfully",
            submissionId: submissionId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to queue submission" });
    }
});

app.get("/status/:id", async (req, res) => {
    const submission = await Submission.findByPk(req.params.id);
    if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
    }
    res.json(submission);
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
});