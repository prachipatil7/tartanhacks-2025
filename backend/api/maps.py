import googlemaps
import requests
import math
from pydantic import BaseModel
from typing import Optional
import os
import re


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

    return final_route[0]


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


#calculate turn bearing (difference in direction)
def calculate_relative_bearing(old_bearing, new_bearing):
    return (old_bearing - new_bearing + 360) % 360

# def check_in_range(loc_rel_bearing, turn_direction, turn_bearing):
    #  if turn_direction == "right":
    #     if  > 180:
    #         return initturn_directionial_relative_bearing
    #     else:
    #         return initial_relative_bearing
    # elif turn_direction == "left":
    #     if initial_relative_bearing < 180:
    #         return -initial_relative_bearing
    #     else:
    #         return -(360 - initial_relative_bearing)
    # else:
    #     return initial_relative_bearing
        
#get action locations (ie. not going straight) + collect bearing change for turns
#input: Step List
def get_action_locations(route_steps):
    action_locations = []
    for i, step in enumerate(route_steps):
        if (step.action != "") & (i > 0):
            # initial_bearing = calculate_bearing(route_steps[i-1].bearing)
            # new_bearing = calculate_bearing(step.bearing)
            turn_bearing = calculate_relative_bearing(route_steps[i-1].bearing, step.bearing)
            location = step.start_location
            action_locations.append({
                'step_index': i,
                'step' : step,
                'instructions': step.instructions,
                'action': step.action,
                'prior_bearing': route_steps[i-1].bearing,
                'bearing_change': turn_bearing,
                'location': location
            })
    return action_locations

#distance between two locations in meters
def distance(loc1, loc2):
    lat1, lon1 = loc1.lat, loc1.lng
    lat2, lon2 = loc2.lat, loc2.lng
    R = 6371  # Earth's radius in kilometers

    # Convert latitude and longitude to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    distance = R * c * 1000

    return distance

def get_nearby_landmarks(location, radius=75):
    landmark_types = ['establishment', 'building']
    points_of_interest = set()
    for place_type in landmark_types:
        places = gmap.places_nearby((location.lat, location.lng), keyword=place_type, radius=radius)  #building
        # print(places)
        # print(place_type)
        for place in places['results']:
            # print(place['name'])
            landmark_location = Location(lat = place['geometry']['location']['lat'], lng = place['geometry']['location']['lng'])
            distance_to_landmark = distance(location, landmark_location)
            # print(distance_to_landmark)
            if distance_to_landmark <= radius:
                # print(place['name'])
                landmark = Place(name = place['name'], 
                                 location = landmark_location, 
                                 distance = distance_to_landmark)
                points_of_interest.add(landmark)
    return sorted(list(points_of_interest), key=lambda place: place.distance)

def get_turn_direction(instruction):
    if re.search(r'right', instruction, re.IGNORECASE):
        return "Right"
    else:
        return "Left"


def landmark_range_check(x, step, turn_bearing, prior_bearing):
    
    location_bearing = calculate_bearing(step.start_location, x.location)
    loc_rel_bearing = calculate_relative_bearing(prior_bearing, location_bearing)
    
    dir = get_turn_direction(step.action)

    if dir == "Right":
        if (turn_bearing - 25 <= loc_rel_bearing < 270):
            return (True, loc_rel_bearing)
    elif dir == "Left":
        if (180 <= loc_rel_bearing <= turn_bearing + 25):
                return (True, loc_rel_bearing)
    
    return (False, loc_rel_bearing)
    
   
def get_inrange_landmarks(location, step, turn_bearing, prior_bearing):
    landmarks = get_nearby_landmarks(location)
    inrange_landmarks = []
    if landmarks: 
        for x in landmarks:
            check, bearing = landmark_range_check(x, step, turn_bearing, prior_bearing)
            if check:
                x.bearing = bearing
                inrange_landmarks.append(x)
        return inrange_landmarks
    
    return None


def extract_turn_landmarks(route_steps):
    actions = get_action_locations(route_steps)
    for i, step in enumerate(route_steps):
        if (step.instructions in [a['instructions'] for a in actions]):
            turn_bearing, prior_bearing = [(a['bearing_change'], a['prior_bearing']) for a in actions if a['instructions'] == step.instructions][0]
            # print(turn_bearing)
            # print(prior_bearing)
            landmarks = get_inrange_landmarks(step.start_location, step, turn_bearing, prior_bearing)
            # print(landmarks)
            if landmarks:
                landmark = landmarks[0]
                step.landmark_name = landmark.name
                step.landmark_clockwise_bearing = landmark.bearing
    return route_steps         
