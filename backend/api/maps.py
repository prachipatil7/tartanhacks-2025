import googlemaps
import requests
import math
from pydantic import BaseModel
from typing import Optional
import os


class Location(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None
    address: Optional[str] = None

    def __eq__(self, other):
        if not isinstance(other, Location):
            return NotImplemented
        return round(self.lat, 5) == round(other.lat, 5) and round(
            self.lng, 5
        ) == round(other.lng, 5)

    def __hash__(self):
        return hash((round(self.lat, 5), round(self.lng, 5)))


class Step(BaseModel):
    start_location: Location
    end_location: Location
    distance: str
    instructions: str
    action: Optional[str] = None


ORIGIN = "1322 S Prairie Ave"
DESTINATION = "65 E Scott St"


# enter API key
gmap = googlemaps.Client(key=os.environ.get("GMAPS_API_KEY"))


import requests


def create_route_with_stop(start, end, keyword, location_type):
    start_str = f"{start.lat},{start.lng}"
    end_str = f"{end.lat},{end.lng}"
    # Calculate initial route
    initial_route = gmap.directions(
        origin=start_str, destination=end_str, mode="driving"
    )
    route_polyline = initial_route[0]["overview_polyline"]["points"]

    # coffee_shops = gmap.places_nearby(
    #     route=route_polyline,
    #     query=keyword,
    #     type=location_type,
    #     max_detour_duration=600,
    # )

    import requests
    import json

    url = "https://places.googleapis.com/v1/places:searchText"
    api_key = os.environ.get("GMAPS_API_KEY")

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.priceLevel,routingSummaries",
    }

    data = {
        "textQuery": keyword,
        # "type": location_type,
        "searchAlongRouteParameters": {"polyline": {"encodedPolyline": route_polyline}},
    }

    response = requests.post(url, headers=headers, json=data)
    print(response.content)
    data = response.json()

    # Choose the best coffee shop
    sorted_places = [
        place
        for _, place in sorted(
            zip(
                [
                    summary["legs"][0]["distanceMeters"]
                    for summary in data["routingSummaries"]
                ],
                data["places"],
            ),
            key=lambda x: x[0],
        )
    ]
    best_stop = sorted_places[0]
    print(best_stop)

    # Create the final route
    final_route = gmap.directions(
        origin=start_str,
        destination=end_str,
        waypoints=[best_stop["formattedAddress"]],
        optimize_waypoints=True,
        mode="driving",
    )

    return final_route[0], best_stop["displayName"]["text"]


# get route dict, set alternatives = True to get alt routes
def get_directions(start: Location, end: Location, waypoints: list = []):
    start_coords = (start.lat, start.lng)
    end_coords = (end.lat, end.lng)
    directions = gmap.directions(
        origin=start_coords,
        destination=end_coords,
        mode="driving",
        alternatives=False,
        waypoints=waypoints,
    )

    return directions[0]


# get steps of one leg of trip
def get_leg_steps(leg):
    steps = []
    for step in leg["steps"]:
        new_step = Step(
            start_location=Location(
                lat=step["start_location"]["lat"], lng=step["start_location"]["lng"]
            ),
            end_location=Location(
                lat=step["end_location"]["lat"], lng=step["end_location"]["lng"]
            ),
            distance=step["distance"]["text"],
            instructions=step["html_instructions"],
        )
        if "maneuver" in step:
            new_step.action = step["maneuver"]
        steps.append(new_step)
    return steps


# returns dictionary of Step objects by leg index
def get_route_steps_by_leg(route):
    leg_steps = {}
    for i, leg in enumerate(route["legs"]):
        leg_steps[i] = get_leg_steps(leg)
    return leg_steps


# gets all steps in a route (ignoring leg)
def get_all_route_steps(route):
    return sum(get_route_steps_by_leg(route).values(), [])


# calculate turn bearing (angle)
def calculate_bearing(start_location, end_location):
    d_lon = end_location.lng - start_location.lng
    y = math.sin(d_lon) * math.cos(start_location.lat)
    x = math.cos(start_location.lat) * math.sin(end_location.lat) - math.sin(
        start_location.lat
    ) * math.cos(end_location.lat) * math.cos(d_lon)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


# get action locations (ie. not going straight)
def get_action_locations(route_steps):
    action_locations = []
    for i, step in enumerate(route_steps):
        if step.maneuver != "":
            location = step.start_location
            action_locations.append(
                {"step_index": i, "action": step.action, "location": location}
            )
    return action_locations


# get nearby landmarks for turns (returns list of name/location dicts), radius units is in meters
def get_nearby_landmarks(location, radius=20):
    places = gmap.places_nearby(
        (location.lat, location.lng), radius=radius, keyword="building"
    )
    points_of_interest = []

    for place in places["results"]:
        name = place["name"]
        lat = place["geometry"]["location"]["lat"]
        lng = place["geometry"]["location"]["lng"]
        points_of_interest.append({"name": name, "location": Location(lat, lng)})
    return points_of_interest


##COMING SOON:
##TO DO: FILTER LANDMARKS BASED ON BEARING FOR STEPS WITH ACTIONS (TURNS)
