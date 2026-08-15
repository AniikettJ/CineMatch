import os
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from recommender import recommend, catalogue_df

TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "d0e3f1843f2726ff6b1da8b6fd4eaa52")

app = Flask(__name__)

CORS(app)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "success",
        "message": "CineMatch API is live",
        "endpoints": {
            "health": "/api/health",
            "movies": "/api/movies",
            "recommend": "/api/recommend",
            "tmdb_trending": "/api/tmdb/trending",
            "tmdb_search": "/api/tmdb/search?query=spiderman"
        }
    })


@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "success",
        "message": "CineMatch API is running"
    })


# ============================================================
# MOVIE LIST
# ============================================================

@app.route("/api/movies", methods=["GET"])
def get_movies():

    columns = [
        "id",
        "title",
        "media_type",
        "poster_path",
        "backdrop_path",
        "overview",
        "genres",
        "cast",
        "director",
        "release_date",
        "vote_average"
    ]

    available_columns = [
        column
        for column in columns
        if column in catalogue_df.columns
    ]

    movies = (
        catalogue_df[available_columns]
        .dropna(subset=["title"])
        .drop_duplicates(subset=["title"])
        .sort_values("title")
    )

    movies = movies.where(
        movies.notna(),
        None
    )

    return jsonify(
        movies.to_dict(
            orient="records"
        )
    )


# ============================================================
# RECOMMENDATIONS
# ============================================================

@app.route("/api/recommend", methods=["POST"])
def get_recommendations():

    data = request.get_json(silent=True)


    if not data:

        return jsonify({
            "error": "Request body is missing"
        }), 400


    liked_movies = data.get(
        "liked_movies",
        []
    )


    top_n = data.get(
        "top_n",
        10
    )


    # --------------------------------------------------------
    # VALIDATE MOVIES
    # --------------------------------------------------------

    if not isinstance(
        liked_movies,
        list
    ):

        return jsonify({
            "error": "liked_movies must be a list"
        }), 400


    liked_movies = [

        str(movie).strip()

        for movie in liked_movies

        if str(movie).strip()

    ]


    if not liked_movies:

        return jsonify({
            "error": "Please select at least one movie"
        }), 400


    # --------------------------------------------------------
    # VALIDATE TOP N
    # --------------------------------------------------------

    try:

        top_n = int(top_n)

    except (
        TypeError,
        ValueError
    ):

        top_n = 10


    top_n = max(
        5,
        min(top_n, 20)
    )


    # --------------------------------------------------------
    # RUN RECOMMENDER
    # --------------------------------------------------------

    try:

        results = recommend(
            liked_movies,
            top_n=top_n
        )

    except Exception as e:

        print(
            "Recommendation error:",
            e
        )

        return jsonify({
            "error": "Recommendation engine failed",
            "details": str(e)
        }), 500


    if results.empty:

        return jsonify({
            "recommendations": []
        })


    # --------------------------------------------------------
    # CLEAN NaN VALUES
    # --------------------------------------------------------

    results = results.copy()

    results = results.where(
        results.notna(),
        None
    )


    # --------------------------------------------------------
    # FRONTEND FIELDS
    # --------------------------------------------------------

    output_columns = [

        "id",
        "title",
        "media_type",
        "overview",
        "genres",
        "cast",
        "director",
        "release_date",
        "vote_average",
        "poster_path",
        "backdrop_path",
        "final_score"

    ]


    available_columns = [

        column

        for column in output_columns

        if column in results.columns

    ]


    results = results[
        available_columns
    ]


    recommendations = results.to_dict(
        orient="records"
    )


    return jsonify({

        "recommendations":
            recommendations

    })


# ============================================================
# LIVE TMDB API ENDPOINTS
# ============================================================

@app.route("/api/tmdb/trending", methods=["GET"])
def tmdb_trending():
    """Fetch live trending movies/shows from TMDB."""
    try:
        url = f"https://api.themoviedb.org/3/trending/movie/day?api_key={TMDB_API_KEY}"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            return jsonify(resp.json())
        return jsonify({"error": "Failed to fetch from TMDB", "status_code": resp.status_code}), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/tmdb/search", methods=["GET"])
def tmdb_search():
    """Live search TMDB API."""
    query = request.args.get("query", "")
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400
    try:
        url = f"https://api.themoviedb.org/3/search/multi?api_key={TMDB_API_KEY}&query={query}"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            return jsonify(resp.json())
        return jsonify({"error": "Failed to fetch search from TMDB"}), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print()
    print("=" * 55)
    print("CineMatch API")
    print("=" * 55)
    print(f"Server: http://0.0.0.0:{port}")
    print("=" * 55)
    print()

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )