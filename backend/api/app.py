from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .models import TripStatus

from llm.process import process_user_speech
from .models import TripStatus
from .t2v import synthesize_text
import asyncio
from .maps import Location
import json

app = FastAPI()


class GlobalState:
    def __init__(self):
        self.current_status = None
        self.lock = asyncio.Lock()  # To prevent race conditions

    async def set_status(self, status: TripStatus):
        async with self.lock:
            self.current_status = status

    async def get_status(self):
        async with self.lock:
            return self.current_status


state = GlobalState()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # Allow all origins (you can specify specific origins if needed)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


# Create an endpoint to handle POST requests at /destination
@app.post("/destination")
async def handle_destination(data: TripStatus):
    await state.set_status(data)

    return JSONResponse(
        content={"status": "success", "message": "Data received successfully!"},
        status_code=200,
    )


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        current_status = state.get_status()
        response = process_user_speech(data, current_status)
        sound_bytes = synthesize_text(response)
        await websocket.send_bytes(sound_bytes)


@app.websocket("/navigation")
async def websocket_endpoint(websocket: WebSocket):
    global current_status
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        data = json.loads(data)
        current_status = await state.get_status()
        if current_status is None:
            continue
        current_status.curr = Location(**data)
        response = current_status.check_route_instruction()
        state.set_status(current_status)
        if response:
            await websocket.send_bytes(response)
