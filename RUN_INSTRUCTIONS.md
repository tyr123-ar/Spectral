# Running the Backend Locally

1. Copy `.env.example` to `.env` and fill in any secrets if needed.
2. Run:

   ```sh
   docker-compose up --build
   ```

This will start Postgres, Redis, the Express API, and the Worker. No need to install anything else locally!
