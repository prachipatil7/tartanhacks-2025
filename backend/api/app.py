from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .models import TripStatus

from llm.process import process_user_speech
from .models import TripStatus
from .t2v import synthesize_text

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
    # Extract the data from the request body
    start = data.start
    dest = data.dest
    duration = data.duration
    distance = data.distance

    # You can print this or save it to a database
    print("Start:", start)
    print("Destination:", dest)
    print("Duration:", duration)
    print("Distance:", distance)

    # Respond with a success message
    return JSONResponse(
        content={"status": "success", "message": "Data received successfully!"},
        status_code=200,
    )


# Run the application with: uvicorn app:app --reload
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        response = process_user_speech(data)
        await websocket.send_text(response)


@app.websocket("/navigation")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        # response = update_status(data, current_trip)
        # if response
        await websocket.send_text(data)
