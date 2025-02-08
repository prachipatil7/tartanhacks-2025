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

    # Respond with a success message
    return JSONResponse(content={"status": "success", "message": "Data received successfully!"}, status_code=200)

# Run the application with: uvicorn app:app --reload