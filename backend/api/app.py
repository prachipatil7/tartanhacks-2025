# # from fastapi import FastAPI, WebSocket
# # from db_utils.db import SQLiteDB
# # from fastapi.middleware.cors import CORSMiddleware


# # app = FastAPI()
# # db = SQLiteDB()

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["*"],  # Change this to your frontend URL in production
# #     allow_credentials=True,
# #     allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
# #     allow_headers=["*"],  # Allow all headers
# # )


# # @app.get("/")
# # def root():
# #     return {"message": "hello world"}


# # @app.websocket("/ws")
# # async def websocket_endpoint(websocket: WebSocket):
# #     await websocket.accept()
# #     while True:
# #         data = await websocket.receive_text()
# #         await websocket.send_text(data)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse

from llm.process import process_user_speech
from .models import TripStatus
from .t2v import synthesize_text
app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (you can specify specific origins if needed)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Define the schema for the data expected from the frontend
class StartLocation(BaseModel):
    lat: float
    long: float

class Destination(BaseModel):
    lat: float
    long: float
    address: str
    name: str

class NavigationData(BaseModel):
    start: StartLocation
    dest: Destination
    duration: str
    distance: str

# Create an endpoint to handle POST requests at /destination
@app.post("/destination")
async def handle_destination(data: NavigationData):
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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        response = process_user_speech(data)
        sound_bytes = synthesize_text(response)
        # print(sound_bytes)
        
        await websocket.send_bytes(sound_bytes)
