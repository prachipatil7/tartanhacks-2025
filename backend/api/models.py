from pydantic import BaseModel
from typing import List, Optional
from .maps import (
    get_directions,
    get_all_route_steps,
    create_route_with_stop,
    Location,
    Step,
)
from .t2v import synthesize_text


class TripStatus(BaseModel):
    start: Location
    dest: Location
    curr: Location
    duration: str
    distance: str
    route: Optional[List[Step]] = []
    landmarks: Optional[List[Location]] = []

    def model_post_init(self, _):
        directions = get_directions(self.start, self.dest)
        # print(directions)
        self.route = get_all_route_steps(directions)
        self.route.reverse()

    def check_route_instruction(self):
        if self.curr == self.route[0].start_location:
            step = self.route.pop(0)
            print(step)
            return synthesize_text(step.instructions)
        else:
            return None

    def update_status(self):
        directions = get_directions(self.curr, self.dest)
        route = directions["legs"][0]
        self.duration = route["duration"]["text"]
        self.distance = route["distance"]["text"]
        self.route = get_all_route_steps(directions)

    def add_stop(self, keyword, location_type):
        directions, stop_name = create_route_with_stop(
            self.curr, self.dest, keyword, location_type
        )
        route = directions["legs"][0]
        self.duration = route["duration"]["text"]
        self.distance = route["distance"]["text"]
        self.route = get_all_route_steps(directions)
        return stop_name
