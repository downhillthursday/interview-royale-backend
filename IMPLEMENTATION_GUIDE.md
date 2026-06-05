# Interview Session Persistence - Implementation Guide

## ✅ PHASE 1: BACKEND - COMPLETED

### Overview
Successfully implemented MongoDB-based interview session persistence with end-to-end integration. The system now stores interview sessions, questions, answers, and generates feedback/scores.

---

## 📋 Database Schema: InterviewSession

### MongoDB Collection: `interview_sessions`

```typescript
interface IInterviewSession {
  _id: ObjectId;
  sessionId: string;           // UUID (indexed)
  userId: string;              // User ID or guest-UUID (indexed)
  role: string;                // Job role (e.g., "Backend Engineer")
  difficulty: string;          // Beginner, Intermediate, Advanced
  keyFocusArea: string;        // Focus topic (e.g., "TypeScript")
  status: 'active' | 'completed';
  
  startedAt: Date;
  completedAt?: Date;
  
  // Feedback and scoring (populated on completion)
  overallScore?: number;       // 0-100
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  
  // Interview content
  questionsAnswers: [{
    question: string;
    answer: string;
    feedback?: string;
    score?: number;
  }];
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔌 API Endpoints

### 1. Create Interview Session
```http
POST /api/interview-sessions
Content-Type: application/json

{
  "role": "Backend Engineer",
  "keyFocusArea": "TypeScript",
  "difficulty": "Intermediate",
  "userId": "user123"  // Optional - defaults to guest-UUID
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Interview session created"
}
```

**Status:** `201 Created`

---

### 2. Get Single Session Details
```http
GET /api/interview-sessions/:sessionId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "sessionId": "550e8400-...",
    "userId": "user123",
    "role": "Backend Engineer",
    "difficulty": "Intermediate",
    "keyFocusArea": "TypeScript",
    "status": "completed",
    "startedAt": "2026-06-03T10:00:00Z",
    "completedAt": "2026-06-03T10:15:00Z",
    "overallScore": 82,
    "summary": "Good understanding of async patterns...",
    "strengths": ["Excellent explanation of promises", "Clear code examples"],
    "weaknesses": ["Could improve error handling discussion"],
    "questionsAnswers": [
      {
        "question": "Explain the difference between promises and async/await",
        "answer": "Promises are...",
        "feedback": "Good explanation",
        "score": 85
      }
    ],
    "createdAt": "2026-06-03T10:00:00Z",
    "updatedAt": "2026-06-03T10:15:00Z"
  }
}
```

**Status:** `200 OK` or `404 Not Found`

---

### 3. Get User Interview History
```http
GET /api/interview-sessions/user/:userId
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "550e8400-...",
      "role": "Backend Engineer",
      "difficulty": "Intermediate",
      "status": "completed",
      "overallScore": 82,
      "startedAt": "2026-06-03T10:00:00Z",
      "completedAt": "2026-06-03T10:15:00Z"
    },
    {
      "sessionId": "660f9501-...",
      "role": "Frontend Engineer",
      "difficulty": "Advanced",
      "status": "active",
      "startedAt": "2026-06-03T11:00:00Z"
    }
  ]
}
```

**Status:** `200 OK`

---

### 4. Complete Interview Session
```http
PATCH /api/interview-sessions/:sessionId/complete
Content-Type: application/json

{
  "questionsAnswers": [
    {
      "question": "Explain async/await",
      "answer": "Async/await is syntactic sugar over promises..."
    },
    {
      "question": "What is a closure?",
      "answer": "A closure is a function that has access to..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interview completed successfully",
  "sessionId": "550e8400-...",
  "score": 82
}
```

**Status:** `200 OK`

**Backend Actions:**
- Receives questionsAnswers array
- Generates AI feedback using Groq:
  - Overall score (0-100)
  - Interview summary
  - Strengths (array)
  - Weaknesses (array)
- Sets status to "completed"
- Records completedAt timestamp
- Returns score to client

---

## 🔄 Integration with Existing Interview Flow

### Current Architecture (Unchanged)
```
POST /api/interviews/start
  ↓ Creates session
  ↓ Generates first question via Groq
  → Returns interviewId + firstQuestion

POST /api/interviews/respond
  ↓ Saves answer to conversation
  ↓ Generates next question
  → Returns nextQuestion or status: 'completed'
```

### New Flow: Session Persistence
1. **Start Interview**
   - `/api/interviews/start` still works (unchanged API)
   - Now also creates MongoDB session
   - Response includes `sessionId` (same as `interviewId`)

2. **Answer Question**
   - `/api/interviews/respond` still works (unchanged API)
   - Automatically saves Q&A to memory
   - Response includes `sessionId`

3. **Interview Complete**
   - When interview ends after 5 questions
   - Frontend calls `PATCH /api/interview-sessions/:sessionId/complete`
   - Sends all questions + answers collected during interview
   - Backend generates feedback and saves

4. **View Results/History**
   - `GET /api/interview-sessions/user/:userId` - See all past interviews
   - `GET /api/interview-sessions/:sessionId` - Get detailed results

---

## 📁 Files Created

### 1. [src/models/InterviewSessionModel.ts]
- Mongoose schema for InterviewSession
- Interfaces: `IInterviewSession`, `IQuestionAnswer`
- Model export: `InterviewSessionModel`

### 2. [src/controllers/sessionController.ts]
- `createSession()` - Create new session
- `getSession()` - Retrieve single session
- `getUserSessions()` - Get user's history
- `completeSession()` - Mark complete, generate feedback
- Helper methods for Groq integration

### 3. [src/routes/sessionRoutes.ts]
- Registers all session endpoints
- Routes mapped to sessionController methods

---

## 📝 Files Modified

### 1. [src/controllers/interviewController.ts]
**Changes:**
- Import `InterviewSessionModel`
- `startInterview()`: Now creates MongoDB session after generating first question
- `respondInterview()`: 
  - Extracts Q&As from message history
  - Saves progress to MongoDB on interview completion
  - Response includes `sessionId`
- Added `extractQuestionsAnswers()` helper method

### 2. [src/app.ts]
**Changes:**
- Import `setSessionRoutes`
- Register session routes: `setSessionRoutes(apiRouter)`
- Routes now available at `/api/interview-sessions/*`

---

## 🚀 Testing the Backend

### 1. Start Interview
```bash
curl -X POST http://localhost:5000/api/interviews/start \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Backend Engineer",
    "keyFocusArea": "TypeScript",
    "difficulty": "Intermediate"
  }'
```

**Save the `sessionId` from response**

### 2. Answer Questions
```bash
curl -X POST http://localhost:5000/api/interviews/respond \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "SAVED_SESSION_ID",
    "answer": "Your answer to the question..."
  }'
```

**Repeat 5 times (5 questions total)**

### 3. Check Session in MongoDB
```bash
# In MongoDB CLI:
db.interviewsessions.findOne({ sessionId: "SAVED_SESSION_ID" })
```

### 4. Complete Interview
```bash
curl -X PATCH http://localhost:5000/api/interview-sessions/SAVED_SESSION_ID/complete \
  -H "Content-Type: application/json" \
  -d '{
    "questionsAnswers": [
      {
        "question": "Question 1",
        "answer": "My answer 1"
      },
      {
        "question": "Question 2",
        "answer": "My answer 2"
      }
    ]
  }'
```

### 5. View Session Details
```bash
curl http://localhost:5000/api/interview-sessions/SAVED_SESSION_ID
```

### 6. View User History
```bash
curl http://localhost:5000/api/interview-sessions/user/guest-USER-ID
```

---

## 🔐 Authentication Note

Currently, `userId` is optional and defaults to `guest-{UUID}` if not provided.

**When user authentication is implemented:**
1. Extract userId from JWT token in middleware
2. Pass userId in request body or header
3. Associate all sessions with authenticated userId
4. Restrict `/api/interview-sessions/user/:userId` to authenticated users

---

## 📊 Score Calculation

### Primary Method (Groq AI-Powered)
- Analyzes each question-answer pair
- Considers answer depth, clarity, correctness
- Returns score 0-100 with summary and feedback

### Fallback Method (If Groq fails)
- Calculates basic score based on answer length
- Rough heuristic: (answerWords / 20) * 100
- Ensures responses are at least 40 points

---

## ⚠️ Known Limitations (Phase 1)

1. **No User Authentication**: Sessions use guest IDs by default
2. **No Answer Feedback**: Individual question feedback not yet generated
3. **In-Memory Session State**: Session tracking still uses in-memory storage during interview
4. **No Session Recovery**: If server crashes during interview, in-memory data is lost (though questions/answers can be reconstructed)
5. **Basic Score if AI Fails**: If Groq API fails, uses length-based scoring

---

## 🛠️ Troubleshooting

### Issue: "Interview session not found"
- **Cause**: sessionId mismatch or not yet saved
- **Fix**: Ensure sessionId from `/api/interviews/start` is used correctly

### Issue: "Failed to create interview session"
- **Cause**: MongoDB connection issue or missing fields
- **Fix**: Check MongoDB URI in .env, verify required fields: `role`, `keyFocusArea`

### Issue: "Failed to generate feedback"
- **Cause**: Groq API error or invalid API key
- **Fix**: Check GROQ_API_KEY in .env, verify API rate limits

### Issue: Duplicate MongoDB entries
- **Cause**: `sessionId` not unique (unlikely with UUID)
- **Fix**: Clear test data from MongoDB, verify schema has `unique: true`

---

## 📚 Environment Variables Required

```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
GROQ_API_KEY=gsk_...
PORT=5000
```

---

## ✅ Implementation Checklist

- ✅ MongoDB model created with proper schema
- ✅ Session CRUD endpoints implemented
- ✅ Integration with existing interview flow
- ✅ Feedback generation (Groq-powered)
- ✅ Score calculation
- ✅ User history endpoint
- ✅ TypeScript compilation successful
- ✅ No runtime errors in code
- 🔲 Frontend integration (separate repository)
- 🔲 User authentication (planned future phase)
- 🔲 Individual question feedback (planned future phase)

---

## Next Steps

### Phase 2: Frontend
**Files to modify in frontend repository:**
1. Interview start flow - capture sessionId
2. Session storage - persist to sessionStorage
3. Interview completion - call PATCH endpoint
4. History page - display sessions

### Phase 3: Authentication
Integrate user authentication to replace guest IDs.

### Phase 4: Enhanced Feedback
Generate feedback for individual questions, not just overall score.
