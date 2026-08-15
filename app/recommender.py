import pickle
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.metrics.pairwise import cosine_similarity


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "processed"


# --------------------------------------------------
# LOAD SAVED ML COMPONENTS
# --------------------------------------------------

with open(DATA_DIR / "tfidf_vectorizer.pkl", "rb") as f:
    tfidf = pickle.load(f)

with open(DATA_DIR / "tfidf_matrix.pkl", "rb") as f:
    tfidf_matrix = pickle.load(f)

with open(DATA_DIR / "semantic_embeddings.pkl", "rb") as f:
    semantic_embeddings = pickle.load(f)

catalogue_df = pd.read_csv(
    DATA_DIR / "movie_tv_catalogue.csv"
)

print("Catalogue loaded:", catalogue_df.shape)


# --------------------------------------------------
# CREATE COMBINED TEXT
# --------------------------------------------------

text_columns = [
    "overview",
    "genres",
    "keywords",
    "cast",
    "director"
]

for col in text_columns:
    catalogue_df[col] = (
        catalogue_df[col]
        .fillna("")
        .astype(str)
    )

catalogue_df["combined_text"] = (
    catalogue_df["title"].fillna("").astype(str) + " " +
    catalogue_df["overview"] + " " +
    catalogue_df["genres"] + " " +
    catalogue_df["keywords"] + " " +
    catalogue_df["cast"] + " " +
    catalogue_df["director"]
)

print("Combined text created.")

print("TF-IDF shape:", tfidf_matrix.shape)
print("Semantic shape:", semantic_embeddings.shape)
print("Catalogue shape:", catalogue_df.shape)
# --------------------------------------------------
# RECOMMENDER
# --------------------------------------------------

def recommend(liked_titles, top_n=10):

    liked_indices = []

    for title in liked_titles:

        matches = catalogue_df.index[
            catalogue_df["title"].str.lower() == title.lower()
        ].tolist()

        if matches:
            liked_indices.append(matches[0])

    if not liked_indices:
        return pd.DataFrame()

    # TF-IDF
    liked_tfidf = tfidf_matrix[liked_indices]

    user_tfidf = np.asarray(
        liked_tfidf.mean(axis=0)
    )

    content_scores = cosine_similarity(
        user_tfidf,
        tfidf_matrix
    ).flatten()

    # Semantic
    liked_semantic = semantic_embeddings[liked_indices]

    user_semantic = (
        liked_semantic
        .mean(axis=0)
        .reshape(1, -1)
    )

    semantic_scores = cosine_similarity(
        user_semantic,
        semantic_embeddings
    ).flatten()

    # Normalize
    content_scores /= content_scores.max()
    semantic_scores /= semantic_scores.max()

    # Rating
    rating_scores = (
        catalogue_df["vote_average"]
        .fillna(0)
        .values / 10
    )

    # Hybrid score
    final_scores = (
        0.35 * content_scores +
        0.50 * semantic_scores +
        0.15 * rating_scores
    )

    # Remove already liked
    final_scores[liked_indices] = -1

    # Top results
    top_indices = np.argsort(
        final_scores
    )[::-1][:top_n]

    results = catalogue_df.iloc[
        top_indices
    ].copy()

    results["final_score"] = (
        final_scores[top_indices] * 100
    ).round(2)

    return results


if __name__ == "__main__":

    result = recommend(
        [
            "Spider-Man: Brand New Day",
            "Spider-Man: No Way Home",
            "Spider-Man: Homecoming"
        ],
        top_n=5
    )

    print(
        result[
            ["title", "media_type", "vote_average", "final_score"]
        ]
    )