# tartanhacks-2025

**Passenger Princess**

Conversational, LLM-based navigational tool prototype for dynamic route navigations and customized personality navigational support.

![alt text](image.png)

After set-up below, enter location and click start route. The AI assistant will provide driving instructions with navigational landmarks if needed. While navigating, verbally request AI assistant for remaining duration or dynamic route changes, like adding stops.

## backend setup (from root)

package manager - uv (`pip install uv`) -- https://github.com/astral-sh/uv 
python version - 3.11.11
```
cd backend

uv venv --python 3.11.11

source .venv/bin/activate (Mac)
.venv/Scripts/activate (Windows)

uv pip install -r requirements.txt
```

## frontend setup (from root)
```
cd frontend
npm install
npm start
```
