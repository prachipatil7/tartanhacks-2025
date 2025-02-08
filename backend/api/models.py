from pydantic import BaseModel
from typing import List, Optional


class Location(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None
    address: Optional[str] = None


class Direction(BaseModel):
    start_location: Location
    end_location: Location
    distance: str
    instructions: str


class TripStatus(BaseModel):
    start: Location
    dest: Location
    duration: str
    cur: Location
    distance: str
    route: Optional[List[Direction]] = []
    landmarks: Optional[List[Location]] = []
