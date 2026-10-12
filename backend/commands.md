`PORT=9001 PM2_NAME=voice-tts ./deploy.sh`

# Recommended folder structure
backend/books/
  class6/
    english/
      chapter-1.pdf
  class7/
    science/
      ch-01.pdf

# Ingestion command

`node src/modules/rag/ingestBooks.js ./books`
This creates/updates: backend/rag_data/chroma with collection cbse_books.



# .env backend
`CHROMA_URL=http://localhost:8000`


# install python 
`pip install chromadb`
`chroma run --path ./rag_data/chroma --host 0.0.0.0 --port 8001`


delete rag-data folder for rebuild from scratch

# Voice service (local)

1) Start the Python TTS server

# cd voice_service
`py -3.11 -m venv .venv`
`.venv\Scripts\Activate.bat`
`python -m pip install -U pip`
`pip install -r requirements.txt`

# Only if voices/ref.pt is missing or you changed voices/ref.wav
`python encode_voice.py`

`uvicorn app:app --host 0.0.0.0 --port 8001`


2) Set backend env

`TTS_SERVICE_URL=http://127.0.0.1:8001`


3) Quick test (optional)

Invoke-WebRequest `
  -Uri "http://127.0.0.1:8001/tts" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"text":"hello"}' `
  -OutFile "test.wav"

# activate venv once (or use full python path below)
. .venv\Scripts\Activate.ps1

# start with pm2 using venv python
pm2 start .venv\Scripts\python.exe --name voice-tts -- `
  -m uvicorn app:app --host 0.0.0.0 --port 8001