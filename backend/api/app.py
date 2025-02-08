from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .models import TripStatus

from llm.process import process_user_speech
from .models import TripStatus
from .t2v import synthesize_text
import json

app = FastAPI()
current_status = None

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
    current_status = data
    print('data')
    return JSONResponse(
        content={"status": "success", "message": "Data received successfully!"},
        status_code=200,
    )


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        response = process_user_speech(data, current_status)
        sound_bytes = synthesize_text(response)
        await websocket.send_bytes(sound_bytes)


@app.websocket("/navigation")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        message = await websocket.recv()
        try:
            data = json.loads(message)
            if isinstance(data, dict):
                print("Received dictionary:", data)
        except json.JSONDecodeError:
            print("Received message is not valid JSON")

        response = update_status(data, current_status)
        # if response == True:
        # response = process_navigation_prompt(data, current_status)
        # sound_bytes = synthesize_text(response)
        # await websocket.send_bytes(sound_bytes)
        await websocket.send_text(data)


def update_status(new, curr):
    pass
