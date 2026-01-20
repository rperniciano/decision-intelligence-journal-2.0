#!/bin/bash
# Find and kill process on port 4017
PORT=4017
PID=$(lsof -ti:$PORT)
if [ -n "$PID" ]; then
  kill -9 $PID
  echo "Killed process $PID on port $PORT"
else
  echo "No process found on port $PORT"
fi
