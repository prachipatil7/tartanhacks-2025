from pydantic import BaseModel
from typing import List, Optional
from .maps import get_directions, get_all_route_steps, Location, Step
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
        self.route = get_all_route_steps(directions).reverse()

    def check_route_instruction(self):
        print(self.curr.lat, self.route[-1].start_location.lat)
        if self.curr == self.route[-1].start_location:
            step = self.route.pop()
            return synthesize_text(step.instructions)
        else:
            return None
