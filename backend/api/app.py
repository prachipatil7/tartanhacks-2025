from fastapi import FastAPI
from db_utils.db import SQLiteDB

app = FastAPI()
db = SQLiteDB()


@app.get("/")
def root():
    return {"message": "hello world"}


@app.get("/users/{user_id}")
def get_user_name(user_id):
    user = db.get_user_name(user_id)
    return user
