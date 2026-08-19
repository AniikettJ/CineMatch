# 🎬 CineMatch — Hybrid Movie & TV Show Recommendation System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask-000000.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF.svg)](https://vitejs.dev/)
[![Machine Learning](https://img.shields.io/badge/ML-Scikit--Learn%20%7C%20NLP-orange.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**CineMatch** is an intelligent, full-stack hybrid recommendation platform for movies and TV shows. By combining **TF-IDF content filtering**, **semantic NLP embeddings**, and **rating score normalization**, CineMatch delivers tailored media recommendations based on user preferences.

---

## ✨ Features

- 🤖 **Hybrid Recommendation Engine**: 
  - **TF-IDF Content Similarity (35%)**: Analyzes genres, cast, crew, keywords, and plot overviews.
  - **Semantic Embeddings (50%)**: Captures deep contextual and thematic relationships using vector embeddings.
  - **Rating Normalization (15%)**: Integrates audience vote scores to prioritize high-quality recommendations.
- 📺 **Multi-Media Support**: Recommendations across both movies and TV shows.
- ⚡ **Interactive Modern UI**: Built with React 19, Vite, Framer Motion animations, GSAP, and OGL graphics.
- 🌐 **Live TMDB Integration**: Fetch trending content and real-time movie/show details using the TMDB API.
- 🔌 **RESTful Flask Backend**: Fast and structured API endpoints for recommendation processing and catalogue querying.

---

## 🛠️ Tech Stack

### Backend & Machine Learning
- **Language**: Python 3.10+
- **Framework**: Flask, Flask-CORS
- **Machine Learning & NLP**: Scikit-Learn (TF-IDF Vectorization, Cosine Similarity), NumPy, Pandas
- **Data Processing**: Pickle, Jupyter Notebooks

### Frontend
- **Framework**: React 19, Vite
- **UI & Animations**: Framer Motion, GSAP, OGL, Lucide React
- **Styling**: Modern CSS / Flexbox & Grid

### External APIs
- **TMDB (The Movie Database) API**: Live search & trending titles

---

## 📁 Repository Structure

```
CineMatch/
├── backend/
│   ├── app.py                 # Flask REST API routes & server setup
│   ├── recommender.py         # Recommendation algorithm logic & similarity scoring
│   ├── Procfile               # Production deployment configuration
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/                   # React components, pages, and styles
│   ├── index.html             # HTML entry point
│   ├── package.json           # Node.js dependencies & scripts
│   └── vite.config.js         # Vite configuration
├── data/
│   ├── processed/             # Preprocessed catalogue CSV, TF-IDF matrix & semantic embeddings
│   └── raw/                   # Raw movie/TV dataset files
└── Notebooks/                 # Data collection, scraping, and NLP modeling notebooks
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed:
- [Python 3.10+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/) & `npm`
- Git

---

### 1. Clone the Repository
```bash
git clone https://github.com/AniikettJ/CineMatch.git
cd CineMatch
```

---

### 2. Backend Setup

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows**:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration (Optional)**:
   Create a `.env` file in the root or `backend/` directory:
   ```env
   TMDB_API_KEY=your_tmdb_api_key_here
   PORT=5000
   ```

5. **Start the Flask server**:
   ```bash
   python app.py
   ```
   The backend server will run on `http://localhost:5000`.

---

### 3. Frontend Setup

1. **Open a new terminal and navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API status & list of active endpoints |
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/movies` | Get available movie & TV show catalogue |
| `POST` | `/api/recommend` | Generate top recommendations based on liked titles |
| `GET` | `/api/tmdb/trending` | Fetch current trending titles from TMDB |
| `GET` | `/api/tmdb/search?query={q}` | Search for movies/shows via TMDB API |

### Recommendation Request Payload Example
`POST /api/recommend`
```json
{
  "liked_movies": [
    "Spider-Man: No Way Home",
    "Avengers: Endgame"
  ],
  "top_n": 10
}
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve CineMatch, feel free to fork the repository, make changes, and open a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
