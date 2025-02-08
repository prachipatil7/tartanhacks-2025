# tartanhacks-2025

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