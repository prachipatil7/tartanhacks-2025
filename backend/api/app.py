from fastapi import FastAPI, WebSocket
from db_utils.db import SQLiteDB
from fastapi.middleware.cors import CORSMiddleware
from llm.process import process_user_speech
from .models import TripStatus

app = FastAPI()
db = SQLiteDB()
current_trip = None


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


@app.get("/")
def root():
    return {"message": "hello world"}


@app.post("/destination")
def start_trip(new_destination: TripStatus):
    current_trip = new_destination


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        response = process_user_speech(data)
        await websocket.send_text(response)
