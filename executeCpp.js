const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const DOCKER_IMAGE = "spectral-runner";
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB

/**
 * Compiles and executes a C++ file inside a sandboxed Docker container.
 */
const executeCpp = (filepath, inputPath) => {
    const jobId = path.basename(filepath).split(".")[0];
    const filename = path.basename(filepath);
    const inputFilename = inputPath ? path.basename(inputPath) : null;
    
    // Use the absolute path provided by the docker-compose environment variable
    // This ensures the host Docker daemon knows exactly where the files are on your laptop
    const hostPath = process.env.HOST_PWD || __dirname;

    return new Promise((resolve, reject) => {
        // 1. Setup Volumes
        const volumes = [
            "-v", `${hostPath}/codes:/sandbox/codes:ro`,
        ];
        
        if (inputPath) {
            volumes.push("-v", `${hostPath}/inputs:/sandbox/inputs:ro`);
        }

        // 2. Setup the Inner Shell Command
        // We compile the output binary to /tmp because the /sandbox/codes folder is read-only (:ro)
        let innerCmd = `g++ /sandbox/codes/${filename} -o /tmp/${jobId}.out && /tmp/${jobId}.out`;

        // If an input file is provided, pipe it into stdin
        if (inputPath) {
            innerCmd += ` < /sandbox/inputs/${inputFilename}`;
        }

        // 3. Setup Docker Arguments
        const args = [
            "run", "--rm",
            "--network=none",
            "--memory=128m",
            "--cpus=0.5",
            ...volumes,
            DOCKER_IMAGE,
            "sh", "-c", innerCmd
        ];

        let outputData = "";
        let errorData = "";
        let outputSize = 0;
        let killed = false;

        // IMPORTANT: Do not name this 'process', it overwrites Node's global process object
        const childProcess = spawn("docker", args);

        // Timer for Time Limit Exceeded (TLE)
        const timeoutId = setTimeout(() => {
            killed = true;
            childProcess.kill("SIGKILL");
            reject({ type: "Runtime Error", message: "TLE (Time Limit Exceeded)" });
        }, 15000);

        const handleData = (data, isErrorStream) => {
            if (killed) return;

            outputSize += data.length;
            if (outputSize > MAX_OUTPUT_SIZE) {
                killed = true;
                childProcess.kill("SIGKILL");
                clearTimeout(timeoutId);
                return reject({ type: "Runtime Error", message: "Output Limit Exceeded (1MB cap)" });
            }

            if (isErrorStream) {
                errorData += data.toString();
            } else {
                outputData += data.toString();
            }
        };

        childProcess.stdout.on("data", (data) => handleData(data, false));
        childProcess.stderr.on("data", (data) => handleData(data, true));

        childProcess.on("close", (code) => {
            clearTimeout(timeoutId);
            if (killed) return; // Promise already rejected by timeout or size limit

            if (code !== 0) {
                // Compilation errors usually go to stderr and contain "error:"
                if (errorData.includes("error:")) {
                    return reject({ type: "Compilation Error", message: errorData });
                }
                return reject({ type: "Runtime Error", message: errorData || `Process exited with code ${code}` });
            }

            resolve(outputData);
        });
    });
};

module.exports = {
    executeCpp,
};