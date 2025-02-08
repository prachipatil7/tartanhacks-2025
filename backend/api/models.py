from pydantic import BaseModel


class Location(BaseModel):
    lat: float
    lng: float


class Trip(BaseModel):
    start: Location
    dest: Location
    duration: str  # TODO
    route: str  # TODO
