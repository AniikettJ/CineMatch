import streamlit as st
from recommender import recommend, catalogue_df
import pandas as pd


# ============================================================
# PAGE CONFIG
# ============================================================

st.set_page_config(
    page_title="CineMatch",
    page_icon="🎬",
    layout="wide"
)


# ============================================================
# CUSTOM CSS
# ============================================================

st.markdown(
    """
    <style>

    .main-title {
        font-size: 48px;
        font-weight: 800;
        margin-bottom: 5px;
    }

    .subtitle {
        font-size: 18px;
        color: #9ca3af;
        margin-bottom: 35px;
    }

    .movie-title {
        font-size: 18px;
        font-weight: 700;
        margin-top: 8px;
        min-height: 45px;
    }

    .movie-meta {
        color: #9ca3af;
        font-size: 13px;
    }

    .rating {
        font-size: 15px;
        margin-top: 8px;
    }

    .match-score {
        font-size: 15px;
        font-weight: 700;
        margin-top: 5px;
    }

    </style>
    """,
    unsafe_allow_html=True
)


# ============================================================
# HEADER
# ============================================================

st.markdown(
    '<div class="main-title">🎬 CineMatch</div>',
    unsafe_allow_html=True
)

st.markdown(
    """
    <div class="subtitle">
    A hybrid movie recommendation system powered by
    TF-IDF, semantic embeddings and movie ratings.
    </div>
    """,
    unsafe_allow_html=True
)


# ============================================================
# MOVIE SELECTION
# ============================================================

st.subheader("🎯 Tell us what you like")

movie_titles = sorted(
    catalogue_df["title"]
    .dropna()
    .unique()
    .tolist()
)

liked_movies = st.multiselect(
    "Select movies you enjoy",
    options=movie_titles,
    placeholder="Search and select movies..."
)


# ============================================================
# CONTROLS
# ============================================================

col1, col2 = st.columns([2, 1])

with col1:

    top_n = st.slider(
        "Number of recommendations",
        min_value=5,
        max_value=20,
        value=10
    )

with col2:

    st.write("")

    recommend_button = st.button(
        "🎯 Recommend Movies",
        type="primary",
        use_container_width=True
    )


# ============================================================
# RECOMMENDATION
# ============================================================

if recommend_button:

    if not liked_movies:

        st.warning(
            "Please select at least one movie first."
        )

    else:

        with st.spinner("Finding movies for you..."):

            results = recommend(
                liked_movies,
                top_n=top_n
            )


        if results.empty:

            st.error(
                "No recommendations found."
            )

        else:

            st.subheader("🍿 Recommended For You")


            # =================================================
            # DISPLAY MOVIES
            # =================================================

            columns = st.columns(4)

            for index, (_, movie) in enumerate(
                results.iterrows()
            ):

                with columns[index % 4]:

                    title = str(
                        movie.get(
                            "title",
                            "Unknown"
                        )
                    )

                    media_type = str(
                        movie.get(
                            "media_type",
                            "movie"
                        )
                    )

                    poster_path = movie.get(
                        "poster_path",
                        ""
                    )

                    vote_average = movie.get(
                        "vote_average",
                        0
                    )

                    final_score = movie.get(
                        "final_score",
                        0
                    )


                    # -----------------------------------------
                    # POSTER
                    # -----------------------------------------

                    if (
                        pd.notna(poster_path)
                        and str(poster_path).strip() != ""
                        and str(poster_path).lower() != "nan"
                    ):

                        poster_url = (
                            "https://image.tmdb.org/t/p/w500"
                            + "/"
                            + str(poster_path).lstrip("/")
                        )

                        try:

                            st.image(
                                poster_url,
                                use_container_width=True
                            )

                        except Exception:

                            st.info(
                                "🎬 Poster unavailable"
                            )

                    else:

                        st.info(
                            "🎬 Poster unavailable"
                        )


                    # -----------------------------------------
                    # TITLE
                    # -----------------------------------------

                    st.markdown(
                        f"""
                        <div class="movie-title">
                            {title}
                        </div>
                        """,
                        unsafe_allow_html=True
                    )


                    # -----------------------------------------
                    # MEDIA TYPE
                    # -----------------------------------------

                    st.markdown(
                        f"""
                        <div class="movie-meta">
                            {media_type.upper()}
                        </div>
                        """,
                        unsafe_allow_html=True
                    )


                    # -----------------------------------------
                    # RATING
                    # -----------------------------------------

                    try:
                        vote_average = float(
                            vote_average
                        )
                    except:
                        vote_average = 0.0


                    st.markdown(
                        f"""
                        <div class="rating">
                            ⭐ {vote_average:.1f}/10
                        </div>
                        """,
                        unsafe_allow_html=True
                    )


                    # -----------------------------------------
                    # MATCH SCORE
                    # -----------------------------------------

                    try:
                        final_score = float(
                            final_score
                        )
                    except:
                        final_score = 0.0


                    st.markdown(
                        f"""
                        <div class="match-score">
                            🎯 Match: {final_score:.1f}%
                        </div>
                        """,
                        unsafe_allow_html=True
                    )


                    st.write("")