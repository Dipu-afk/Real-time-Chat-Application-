from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Dict
import json
from datetime import datetime
import google.generativeai as genai
import asyncio

# Configure Gemini API
GOOGLE_API_KEY = "AIzaSyBGuvXzPRTE9YfrmYepxTrbho5zerE5NFg"
genai.configure(api_key=GOOGLE_API_KEY)

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.online_users: List[str] = []
        self.model = None
        self.initialize_model()

    def initialize_model(self):
        try:
            # Use the text model
            self.model = genai.GenerativeModel('gemini-pro')
            # Test the model with a simple prompt
            response = self.model.generate_content("Test")
            print("Model initialized successfully")
        except Exception as e:
            print(f"Error initializing model: {str(e)}")
            self.model = None

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[username] = websocket
        self.online_users.append(username)
        await self.broadcast_user_list()
        await self.broadcast(json.dumps({
            "type": "system",
            "message": f"{username} has joined the chat"
        }))

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
        if username in self.online_users:
            self.online_users.remove(username)

    async def broadcast_user_list(self):
        message = json.dumps({
            "type": "users",
            "users": self.online_users + ["AI Assistant"]
        })
        await self.broadcast(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

    async def handle_ai_response(self, message: str) -> str:
        try:
            if self.model is None:
                return "I apologize, but the AI assistant is currently unavailable. Please try again later."
            
            response = self.model.generate_content(message)
            return response.text if response else "I couldn't process that request. Please try again."
        except Exception as e:
            print(f"Error generating AI response: {str(e)}")
            return "I apologize, but I encountered an error processing your request. Please try again later."

    async def handle_message(self, websocket: WebSocket, username: str, data: dict):
        if data.get("type") == "chat":
            message = data.get("message", "")
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Store and broadcast user message
            chat_message = {
                "type": "chat",
                "username": username,
                "message": message,
                "timestamp": timestamp
            }
            await self.broadcast(json.dumps(chat_message))
            
            # Generate and broadcast AI response
            ai_response = await self.handle_ai_response(message)
            ai_message = {
                "type": "chat",
                "username": "AI Assistant",
                "message": ai_response,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            await self.broadcast(json.dumps(ai_message))

manager = ConnectionManager()

@app.get("/")
async def get():
    return FileResponse("static/index.html")

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await manager.connect(websocket, username)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            await manager.handle_message(websocket, username, message_data)
            
    except WebSocketDisconnect:
        manager.disconnect(username)
        await manager.broadcast(json.dumps({
            "type": "system",
            "message": f"{username} has left the chat"
        }))
