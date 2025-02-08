from openai import OpenAI
from .utils import remove_emojis

OPENAI_KEY = "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"

client = OpenAI(api_key=OPENAI_KEY)


def process_user_speech(text: str, status):
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a fun, girly bestie. Decide if you need the user's location to answer. "
            "If you DO need location data, respond ONLY with 'LOCATION' (no other text). "
            "If you do NOT need location data, just provide a fun, casual answer."},
            {
                "role": "user",
                "content": text,
            },
        ],
    )

    response_text = completion.choices[0].message


    if response_text == "LOCATION":
        # ---- A) Example: do your distance/time/landmarks logic here ----
        # 
        # Let's say you have functions like these:
        #
        #   - get_updated_distance_time(status: TripStatus) -> (str, str)
        #       returns updated_distance, updated_duration
        #
        #   - get_landmarks(status: TripStatus) -> List[Location]
        #       returns a list of interesting landmarks
        #
        # Replace these with your real code:

        updated_distance, updated_duration = get_updated_distance_time(status)
        found_landmarks = get_landmarks(status)

        # Update your TripStatus object (so your app can store it if needed)
        status.distance = updated_distance
        status.duration = updated_duration
        status.landmarks = found_landmarks

        # ---- B) Now, craft a second GPT call to produce a final "girly bestie" style response ----
        # We'll feed in the new distance, duration, and landmarks as part of the user prompt.

        location_info_prompt = (
            f"I have just updated your trip. The distance is now {updated_distance}, "
            f"and the duration is about {updated_duration}. "
            f"I also discovered these landmarks along your route:\n"
        )
        if found_landmarks:
            for landmark in found_landmarks:
                location_info_prompt += f"- {landmark.name or 'Unknown Landmark'}\n"
        else:
            location_info_prompt += "No significant landmarks found.\n"

        location_info_prompt += (
            "\nPlease respond in a fun, girly bestie style, letting the user know about these updates!"
        )

        second_completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a fun, girly bestie. The user wants an update that includes "
                        "their distance, duration, and new landmarks. Respond in a playful way."
                    ),
                },
                {
                    "role": "user",
                    "content": location_info_prompt,
                },
            ],
        )

        final_text = second_completion.choices[0].message.content
        return remove_emojis(final_text)

    # 3) Otherwise, the model gave a normal answer, so just return it.
    return remove_emojis(response_text)


# -----------------------
# Placeholder example funcs:
# In your real code, replace these with real logic to calculate distance,
# time, and find interesting landmarks.
def get_updated_distance_time(status: TripStatus) -> (str, str):
    """
    Example placeholder: Return some updated distance/time for the trip.
    In reality, you might use an API like Google Maps, or do your own calculations.
    """
    # For demonstration, let's pretend we just add "some" updated values:
    new_dist = "15.4 km"
    new_duration = "23 minutes"
    return (new_dist, new_duration)

def get_landmarks(status: TripStatus) -> list[Location]:
    """
    Example placeholder: Return a list of landmarks for the current route.
    """
    # Again, pretend we fetched from some "FindLandmarks" API or database:
    example_landmarks = [
        Location(lat=status.cur.lat + 0.01, lng=status.cur.lng - 0.01, name="Cute Coffee Shop"),
        Location(lat=status.cur.lat + 0.02, lng=status.cur.lng - 0.02, name="Vintage Thrift Store"),
    ]
    return example_landmarks