from pydantic import BaseModel
from typing import List


class Location(BaseModel):
    lat: float
    lng: float


class Landmark(BaseModel):
    location: Location
    name: str


class Direction(BaseModel):
    start_location: Location
    end_location: Location
    distance: str
    instructions: str


class TripStatus(BaseModel):
    start: Location
    dest: Location
    duration: str
    route: List[Direction]
    landmarks: List[Landmark]
