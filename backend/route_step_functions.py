import googlemaps
import requests
import math


ORIGIN = "1322 S Prairie Ave"
DESTINATION = "65 E Scott St"

class Location:
    def __init__(self, lat = 0.0, lng = 0.0):
        self.lat = lat
        self.lng = lng
        
class Step:
    def __init__(self, start_location = Location(), end_location = Location(), distance = "", instructions = "", action = ""):
        self.start_location = start_location
        self.end_location = end_location
        self.distance = distance
        self.instructions = instructions
        self.action = action


#enter API key
gmap = googlemaps.Client(key="")


def get_current_location():
    response = requests.get('https://ipinfo.io/json')
    if response.status_code == 200:
        data = response.json()
        lat, lng = data['loc'].split(',')
        current_location = Location(lat, lng)
        return current_location
    else:
        return Location()
    
## coordinate tuple -> location object
# def create_location(coordinate):
#     return Location(coordinate[0], coordinate[1])

#get route dict, set alternatives = True to get alt routes
def get_directions(start, end):
    directions = gmap.directions(
    origin=start,
    destination= end,
    mode="driving",
    alternatives = False)
    
    return directions[0]


#get steps of one leg of trip
def get_leg_steps(leg):
    steps = []
    for step in leg['steps']:
        new_step = Step(Location(step['start_location']['lat'], step['start_location']['lng']),
                        Location(step['end_location']['lat'], step['end_location']['lng']),
                        step['distance']['text'],
                        step['html_instructions'])
        if 'maneuver' in step:
            new_step.action = step['maneuver']
        steps.append(new_step)
    return steps

#returns dictionary of Step objects by leg index
def get_route_steps_by_leg(route):
    leg_steps = {}
    for i, leg in enumerate(route['legs']):
        leg_steps[i] = get_leg_steps(leg)
    return leg_steps

#gets all steps in a route (ignoring leg)
def get_all_route_steps(route):
    return sum(get_route_steps_by_leg(route).values(), [])


#calculate turn bearing (angle)
def calculate_bearing(start_location, end_location):
    d_lon = end_location.lng - start_location.lng
    y = math.sin(d_lon) * math.cos(start_location.lat)
    x = math.cos(start_location.lat) * math.sin(end_location.lat) - math.sin(start_location.lat) * math.cos(end_location.lat) * math.cos(d_lon)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


#get action locations (ie. not going straight)
def get_action_locations(route_steps):
    action_locations = []
    for i, step in enumerate(route_steps):
        if step.maneuver != "":
            location = step.start_location
            action_locations.append({
                'step_index': i,
                'action': step.action,
                'location': location
            })
    return action_locations

#get nearby landmarks for turns (returns list of name/location dicts), radius units is in meters
def get_nearby_landmarks(location, radius=20):
    places = gmap.places_nearby((location.lat, location.lng), radius=radius, keyword="building")  
    points_of_interest = []
    
    for place in places['results']:
        name = place['name']
        lat = place['geometry']['location']['lat']
        lng = place['geometry']['location']['lng']
        points_of_interest.append({
            'name': name,
            'location': Location(lat, lng)
        })
    return points_of_interest



##COMING SOON:
##TO DO: FILTER LANDMARKS BASED ON BEARING FOR STEPS WITH ACTIONS (TURNS)


