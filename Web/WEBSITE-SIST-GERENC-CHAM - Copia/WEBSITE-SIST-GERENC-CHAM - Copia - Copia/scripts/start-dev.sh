#!/bin/bash
# Start both backend and frontend for development
# Usage: bash start-dev.sh

echo "🚀 Starting HelpDesk Development Environment"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start backend
echo "📦 Starting Backend (.NET)..."
cd "$SCRIPT_DIR/BackendHelpDesk"
dotnet run &
BACKEND_PID=$!
echo "   Backend started (PID: $BACKEND_PID). It will listen on http://localhost:5000"
sleep 3

# Start frontend
echo "⚛️  Starting Frontend (React/Vite)..."
cd "$SCRIPT_DIR"
npm run dev &
FRONTEND_PID=$!
echo "   Frontend started (PID: $FRONTEND_PID). It will be available at http://localhost:8080"

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "Endpoints:"
echo "  - Frontend:  http://localhost:8080"
echo "  - Backend:   http://localhost:5000"
echo "  - Swagger:   http://localhost:5000/swagger"
echo ""
echo "Test Credentials:"
echo "  - Email: admin | Password: admin123"
echo "  - Email: colab | Password: colab123"
echo ""
echo "To stop the servers, press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Wait for both processes
wait
