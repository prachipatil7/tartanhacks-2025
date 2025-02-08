from fastapi import FastAPI
from db_utils.db import SQLiteDB
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
db = SQLiteDB()

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


@app.get("/users/{user_id}")
def get_user_name(user_id):
    user = db.get_user_name(user_id)
    return user
