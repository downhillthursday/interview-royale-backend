# Mock Interview AI Backend

## Overview
This project is a backend application for a mock interview platform built using Express.js and TypeScript. It provides endpoints for managing interviews and results.

## Directory Structure
```
mock-interview-ai-backend
├── src
│   ├── app.ts
│   ├── server.ts
│   ├── controllers
│   │   ├── interviewController.ts
│   │   └── resultsController.ts
│   ├── routes
│   │   ├── interviewRoutes.ts
│   │   └── resultsRoutes.ts
│   ├── middleware
│   │   └── errorHandler.ts
│   ├── types
│   │   └── index.ts
│   └── utils
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd mock-interview-ai-backend
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Start the server:
   ```
   npm run start
   ```
2. The server will run on `http://localhost:3000` (or the port specified in `app.ts`).

## API Endpoints
- **Interviews**
  - `GET /interview`: Retrieve a list of interviews.
  - `POST /interview`: Create a new interview.

- **Results**
  - `GET /results`: Retrieve results for interviews.
  - `POST /results`: Submit results for an interview.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.