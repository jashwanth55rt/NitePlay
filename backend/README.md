# NitePlay Backend & Setup Guide (Termux & Ubuntu)

NitePlay is a modern adult video streaming platform with responsive HTML5 playback, adaptive HLS.js streaming, and privacy-first local storage.

## 🚀 Ubuntu / Linux Setup

### Prerequisites
- Python 3.10+
- `pip` and `venv`

```bash
# 1. Clone or navigate to the backend folder
cd backend

# 2. Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
`http://localhost:8000/docs` (Interactive Swagger API documentation)

---

## 📱 Android (Termux) Setup

### Prerequisites
Install Termux from F-Droid (preferred) or GitHub releases.

```bash
# 1. Update Termux packages
pkg update && pkg upgrade -y

# 2. Install Python, Git, and Build Tools
pkg install python git clang libxml2 libxslt -y

# 3. Navigate to repository backend
cd niteplay/backend

# 4. Install wheel and dependencies
pip install --upgrade pip wheel
pip install -r requirements.txt

# 5. Launch NitePlay FastAPI Backend
python main:app --host 127.0.0.1 --port 8000
```

---

## 🌐 Next.js Frontend Integration

The Next.js frontend runs out-of-the-box on port 3000 with integrated server-side proxy routes (`/api/videos`, `/api/videos/[id]`, `/api/search`, `/api/categories`).

To run the Next.js frontend:
```bash
npm install
npm run dev
```

Visit `http://localhost:3000` in any browser or mobile device.
