#!/bin/sh

# Start backend API
cd server
node src/index.js &
BACKEND_PID=$!

# Start frontend static server
cd ..
serve -s public -l 3000 &
FRONTEND_PID=$!

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID

