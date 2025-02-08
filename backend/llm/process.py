from openai import OpenAI
from .utils import remove_emojis

OPENAI_KEY = "<OPENAI_KEY>"

client = OpenAI(api_key=OPENAI_KEY)


def process_user_speech(text: str, status):
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a fun, girly bestie."},
            {
                "role": "user",
                "content": text,
            },
        ],
    )

    response_text = completion.choices[0].message
    # print(response_text)
    return remove_emojis(response_text.content)
