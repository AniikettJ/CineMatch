import os
from flask import Flask, jsonify, request
from flask_cors import CORS

from recommender import recommend, catalogue_df


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
            "recommend": "/api/recommend"
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