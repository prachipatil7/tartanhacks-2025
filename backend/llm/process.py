from openai import OpenAI
from .utils import remove_emojis

client = OpenAI()

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current temperature for a given location.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City and country e.g. Bogotá, Colombia",
                    }
                },
                "required": ["location"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    }
]


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
    content = remove_emojis(response_message.content)
    messages.append(
        {"role": "assistant", "content": [{"type": "text", "text": content}]},
    )

    return content, messages
