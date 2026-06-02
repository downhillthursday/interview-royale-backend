#!/bin/bash

# Start interview
echo "1. Starting interview..."
START_RESPONSE=$(curl -s -X POST http://localhost:5000/api/interviews/start \
  -H "Content-Type: application/json" \
  -d '{"role": "Frontend Developer", "keyFocusArea": "React", "difficulty": "Intermediate"}')

echo "Start response:"
echo $START_RESPONSE | jq .

# Extract interviewId
INTERVIEW_ID=$(echo $START_RESPONSE | jq -r .interviewId)

if [ "$INTERVIEW_ID" == "null" ] || [ -z "$INTERVIEW_ID" ]; then
    echo "Failed to get interviewId."
    exit 1
fi

echo -e "\n2. Sending first answer..."
curl -s -X POST http://localhost:5000/api/interviews/respond \
  -H "Content-Type: application/json" \
  -d '{"interviewId": "'"$INTERVIEW_ID"'", "answer": "I am a React developer."}' | jq .

echo -e "\n3. Sending second answer..."
curl -s -X POST http://localhost:5000/api/interviews/respond \
  -H "Content-Type: application/json" \
  -d '{"interviewId": "'"$INTERVIEW_ID"'", "answer": "I built a dashboard."}' | jq .

echo -e "\n4. Sending third answer..."
curl -s -X POST http://localhost:5000/api/interviews/respond \
  -H "Content-Type: application/json" \
  -d '{"interviewId": "'"$INTERVIEW_ID"'", "answer": "They manage state."}' | jq .

echo -e "\n5. Sending fourth answer..."
curl -s -X POST http://localhost:5000/api/interviews/respond \
  -H "Content-Type: application/json" \
  -d '{"interviewId": "'"$INTERVIEW_ID"'", "answer": "With Redux or Context."}' | jq .

echo -e "\n6. Sending fifth answer..."
curl -s -X POST http://localhost:5000/api/interviews/respond \
  -H "Content-Type: application/json" \
  -d '{"interviewId": "'"$INTERVIEW_ID"'", "answer": "No questions."}' | jq .

echo -e "\n7. Trying to answer after completed..."
curl -s -X POST http://localhost:5000/api/interviews/respond \
  -H "Content-Type: application/json" \
  -d '{"interviewId": "'"$INTERVIEW_ID"'", "answer": "Wait I have one."}' | jq .
