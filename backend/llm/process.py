from openai import OpenAI
from .utils import remove_emojis
import json

client = OpenAI()

tools = [
    {
        "type": "function",
        "function": {
            "name": "add_stop",
            "description": "Add a stop to the route based on the user's ask.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "Keyword phrase to describe the stop",
                    },
                    "location_type": {
                        "type": "string",
                        "enum": [
                            "accounting",
                            "airport",
                            "amusement_park",
                            "aquarium",
                            "art_gallery",
                            "atm",
                            "bakery",
                            "bank",
                            "bar",
                            "beauty_salon",
                            "bicycle_store",
                            "book_store",
                            "bowling_alley",
                            "bus_station",
                            "cafe",
                            "campground",
                            "car_dealer",
                            "car_rental",
                            "car_repair",
                            "car_wash",
                            "casino",
                            "cemetery",
                            "church",
                            "city_hall",
                            "clothing_store",
                            "convenience_store",
                            "courthouse",
                            "dentist",
                            "department_store",
                            "doctor",
                            "drugstore",
                            "electrician",
                            "electronics_store",
                            "embassy",
                            "fire_station",
                            "florist",
                            "funeral_home",
                            "furniture_store",
                            "gas_station",
                            "gym",
                            "hair_care",
                            "hardware_store",
                            "hindu_temple",
                            "home_goods_store",
                            "hospital",
                            "insurance_agency",
                            "jewelry_store",
                            "laundry",
                            "lawyer",
                            "library",
                            "light_rail_station",
                            "liquor_store",
                            "local_government_office",
                            "locksmith",
                            "lodging",
                            "meal_delivery",
                            "meal_takeaway",
                            "mosque",
                            "movie_rental",
                            "movie_theater",
                            "moving_company",
                            "museum",
                            "night_club",
                            "painter",
                            "park",
                            "parking",
                            "pet_store",
                            "pharmacy",
                            "physiotherapist",
                            "plumber",
                            "police",
                            "post_office",
                            "primary_school",
                            "real_estate_agency",
                            "restaurant",
                            "roofing_contractor",
                            "rv_park",
                            "school",
                            "secondary_school",
                            "shoe_store",
                            "shopping_mall",
                            "spa",
                            "stadium",
                            "storage",
                            "store",
                            "subway_station",
                            "supermarket",
                            "synagogue",
                            "taxi_stand",
                            "tourist_attraction",
                            "train_station",
                            "transit_station",
                            "travel_agency",
                            "university",
                            "veterinary_care",
                            "zoo",
                        ],
                        "description": "Type of location",
                    },
                },
                "required": ["keyword", "location_type"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    }
]


def add_stop(keyword=None, location_type=None, status=None):
    name = status.add_stop(keyword, location_type)
    return "added the following stop to route: " + name


tool_dict = {"add_stop": add_stop}


def process_user_speech(text: str, status, messages=list):
    content = None
    while not content:
        messages.append(
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Trip Status: {status.dict()}\n User: {text}",
                    }
                ],
            }
        )

        completion = client.chat.completions.create(
            model="gpt-4o-mini", messages=messages, tools=tools
        )
        response_message = completion.choices[0].message
        content = response_message.content
        tool_call = response_message.tool_calls
        print(content, tool_call)
        if tool_call:
            messages.append(
                {
                    "role": "assistant",
                    "tool_calls": tool_call,
                }
            )
            print(tool_call)
            resp = tool_dict[tool_call[0].function.name](
                **json.loads(tool_call[0].function.arguments), status=status
            )
            print(resp)
            print(messages)
            messages.append(
                {
                    "role": "tool",
                    "content": resp,
                    "tool_call_id": tool_call[0].id,
                }
            )
            print(messages)
    content = remove_emojis(response_message.content)
    messages.append(
        {
            "role": "assistant",
            "content": [{"type": "text", "text": content}],
        },
    )

    return content, messages, status
