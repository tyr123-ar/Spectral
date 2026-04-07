# API Contract

## POST /submit
- **Description:** Submit a new code execution job.
- **Request Body (application/json):**
```
{
  "language": "cpp", // or "python", "java", etc.
  "source": "#include <iostream>...", // code as string
  "input": "1 2 3" // (optional) input for the program
}
```
- **Response (application/json):**
```
{
  "id": "job_12345", // unique job ID
  "status": "queued" // or "running", "completed", "failed"
}
```

## GET /status/:id
- **Description:** Get the status and result of a submitted job.
- **Response (application/json):**
```
{
  "id": "job_12345",
  "status": "completed", // or "queued", "running", "failed"
  "output": "Hello, world!", // (if completed)
  "error": null // (if failed, error message)
}
```
