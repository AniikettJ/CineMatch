import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  X,
  Star,
  Play,
  Film,
  Tv,
  Loader2,
  Plus,
  ArrowRight,
} from "lucide-react";

import SoftAurora from "./components/SoftAurora/SoftAurora.jsx";
import "./App.css";

const API_URL = "http://127.0.0.1:5000";

// ============================================================
// IMAGE HELPERS
// ============================================================

function poster(path) {
  if (!path) {
    return "https://via.placeholder.com/500x750/151821/ffffff?text=No+Poster";
  }

  if (path.startsWith("http")) {
    return path;
  }

  return `https://image.tmdb.org/t/p/w500${path}`;
}

function backdrop(path, posterPath) {
  if (path) {
    if (path.startsWith("http")) {
      return path;
    }

    return `https://image.tmdb.org/t/p/w1280${path}`;
  }

  return poster(posterPath);
}

function matchPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  // Supports both 0–1 similarity scores and 0–100 percentage scores.
  return number <= 1 ? number * 100 : number;
}

function getGenres(movie) {
  if (!movie?.genres) return [];

  if (Array.isArray(movie.genres)) {
    return movie.genres
      .map((genre) =>
        typeof genre === "string"
          ? genre.trim()
          : genre?.name?.trim()
      )
      .filter(Boolean);
  }

  return String(movie.genres)
    .split(",")
    .map((genre) => genre.trim())
    .filter(Boolean);
}


function getCast(movie) {
  const cast = movie?.cast || movie?.actors || movie?.actor;

  if (Array.isArray(cast)) {
    return cast
      .map((person) =>
        typeof person === "string"
          ? person.trim()
          : person?.name?.trim()
      )
      .filter(Boolean);
  }

  if (movie?.credits?.cast && Array.isArray(movie.credits.cast)) {
    return movie.credits.cast
      .map((person) => person?.name?.trim())
      .filter(Boolean);
  }

  if (typeof cast === "string") {
    return cast
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
  }

  return [];
}

function getYear(movie) {
  const date = movie?.release_date || movie?.first_air_date;
  if (date) return String(date).slice(0, 4);
  if (movie?.year) return String(movie.year);
  return "";
}

// ============================================================
// APP
// ============================================================

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [resultMode, setResultMode] = useState("recommendations");
  const [resultSource, setResultSource] = useState("");

  const [search, setSearch] = useState("");
  const [topN, setTopN] = useState(10);

  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] =
    useState(false);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD MOVIE CATALOGUE
  // ==========================================================

  useEffect(() => {
    async function loadMovies() {
      try {
        setLoadingMovies(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/movies`
        );

        if (!response.ok) {
          throw new Error("Failed to load movie catalogue");
        }

        const data = await response.json();

        setMovies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Catalogue error:", err);

        setError(
          "Unable to connect to CineMatch backend."
        );
      } finally {
        setLoadingMovies(false);
      }
    }

    loadMovies();
  }, []);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return movies
      .filter((movie) =>
        movie.title?.toLowerCase().includes(query)
      )
      .filter(
        (movie) =>
          !selectedMovies.some(
            (selected) =>
              selected.title?.toLowerCase() ===
              movie.title?.toLowerCase()
          )
      )
      .slice(0, 8);
  }, [search, movies, selectedMovies]);

  // ==========================================================
  // SELECT MOVIE FROM SEARCH
  // ==========================================================

  function selectMovie(movie) {
    setSelectedMovies((previous) => {
      const alreadySelected = previous.some(
        (item) =>
          item.title?.toLowerCase() ===
          movie.title?.toLowerCase()
      );

      if (alreadySelected) {
        return previous;
      }

      return [...previous, movie];
    });

    setSearch("");
    setError("");

    // Search results ONLY add the movie to Your Picks.
    // Do NOT open the movie details popup here.
  }

  // ==========================================================
  // REMOVE SELECTED MOVIE
  // ==========================================================

  function removeMovie(title) {
    setSelectedMovies((previous) =>
      previous.filter(
        (movie) => movie.title !== title
      )
    );
  }

  // ==========================================================
  // CLEAR SELECTIONS
  // ==========================================================

  function clearSelections() {
    setSelectedMovies([]);
    setError("");
  }

  // ==========================================================
  // RECOMMENDATIONS
  // ==========================================================

  async function getRecommendations(
    customMovies = selectedMovies,
    mode = "recommendations",
    sourceTitle = ""
  ) {
    if (!customMovies.length) {
      setError(
        "Please select at least one movie first."
      );

      return;
    }

    try {
      setError("");
      setLoadingRecommendations(true);
      setResultMode(mode);
      setResultSource(sourceTitle);

      const response = await fetch(
        `${API_URL}/api/recommend`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            liked_movies: customMovies.map(
              (movie) => movie.title
            ),

            top_n: topN,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Recommendation request failed."
        );
      }

      const newRecommendations =
        Array.isArray(data.recommendations)
          ? data.recommendations
          : [];

      setRecommendations(newRecommendations);

      // Scroll to results
      setTimeout(() => {
        document
          .getElementById("results")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 200);
    } catch (err) {
      console.error(
        "Recommendation error:",
        err
      );

      setError(
        err.message ||
        "Something went wrong while generating recommendations."
      );
    } finally {
      setLoadingRecommendations(false);
    }
  }

  // ==========================================================
  // FIND SIMILAR MOVIES
  // ==========================================================

  async function findSimilar(movie) {
    if (!movie?.title) return;

    // If related results are already loaded for this movie,
    // show them on the main page immediately.
    if (relatedMovies.length > 0) {
      setSelectedMovie(null);
      setSelectedMovies([movie]);
      setResultMode("similar");
      setResultSource(movie.title);
      setRecommendations(relatedMovies);

      setTimeout(() => {
        document
          .getElementById("results")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);

      return;
    }

    // Fallback: ask the backend if the modal has no related results yet.
    await getRecommendations(
      [movie],
      "similar",
      movie.title
    );

    setSelectedMovie(null);
  }

  // ==========================================================
  // SHOW RELATED MOVIES ON MAIN PAGE
  // ==========================================================

  function showRelatedOnMain(movie) {
    if (!movie?.title) return;

    setSelectedMovie(null);
    setSelectedMovies([movie]);
    setResultMode("similar");
    setResultSource(movie.title);

    // The modal already loaded these results for its parent movie.
    setRecommendations(relatedMovies);

    setTimeout(() => {
      document
        .getElementById("results")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 120);
  }

  // ==========================================================
  // OPEN MOVIE DETAILS
  // ==========================================================

  async function openMovie(movie) {
    if (!movie?.title) return;

    // Open the popup FIRST. Related movies stay inside the popup
    // until the user explicitly clicks "More Like This".
    setSelectedMovie(movie);
    setRelatedMovies([]);
    setError("");

    try {
      setLoadingRecommendations(true);

      const response = await fetch(
        `${API_URL}/api/recommend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            liked_movies: [movie.title],
            top_n: topN,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to find related movies."
        );
      }

      const related =
        Array.isArray(data.recommendations)
          ? data.recommendations
          : [];

      const filteredMovies = related.filter(
        (item) =>
          item.title?.toLowerCase() !==
          movie.title?.toLowerCase()
      );

      setRelatedMovies(filteredMovies);
    } catch (err) {
      console.error("Related movies error:", err);

      setRelatedMovies([]);
      setError(
        err.message ||
        "Unable to find related movies."
      );
    } finally {
      setLoadingRecommendations(false);
    }
  }

  // ==========================================================
  // QUICK PICKS
  // ==========================================================

  const quickPicks = movies
    .filter((movie) => movie.poster_path)
    .slice(0, 6);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="cinematch">

      {/* ====================================================
          AURORA BACKGROUND
      ==================================================== */}

      <div className="aurora-background">

        <SoftAurora
          speed={0.35}
          scale={1.4}
          brightness={0.8}
          color1="#ff4757"
          color2="#7c3aed"
          noiseFrequency={2}
          noiseAmplitude={0.8}
          bandHeight={0.5}
          bandSpread={1}
          octaveDecay={0.1}
          layerOffset={0}
          colorSpeed={0.7}
          enableMouseInteraction
          mouseInfluence={0.18}
        />

      </div>

      {/* ====================================================
          NAVBAR
      ==================================================== */}

      <header className="navbar">

        <div className="navbar-inner">

          <div className="brand">

            <div className="brand-icon">
              🎬
            </div>

            <div>
              Cine<span>Match</span>
            </div>

          </div>

          <nav>

            <a href="#discover">
              Discover
            </a>

            <a href="#results">
              Recommendations
            </a>

            <a href="#how-it-works">
              How It Works
            </a>

          </nav>

          <button
            className="nav-icon"
            onClick={() =>
              document
                .getElementById("discover")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <Search size={18} />
          </button>

        </div>

      </header>

      {/* ====================================================
          HERO
      ==================================================== */}

      <section className="hero-new">

        <div className="hero-grid"></div>

        <div className="hero-orb orb-red"></div>

        <div className="hero-orb orb-purple"></div>

        <div className="hero-inner">

          <motion.div
            className="hero-copy"
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
            }}
          >

            <div className="eyebrow">

              <Sparkles size={14} />

              PERSONALIZED MOVIE DISCOVERY

            </div>

            <h1>
              Your taste.
              <br />

              <span>Our algorithm.</span>
              <br />

              Infinite stories.
            </h1>

            <p className="hero-description">
              Tell CineMatch what you enjoy and
              discover movies and TV shows that
              match your taste.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                document
                  .getElementById("discover")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Start Discovering

              <ArrowRight size={18} />

            </button>

          </motion.div>

          {/* HERO POSTERS */}

          <motion.div
            className="hero-visual"
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.8,
            }}
          >

            {quickPicks[2] && (
              <div className="floating-card card-back">

                <img
                  src={poster(
                    quickPicks[2].poster_path
                  )}
                  alt=""
                />

              </div>
            )}

            {quickPicks[1] && (
              <div className="floating-card card-left">

                <img
                  src={poster(
                    quickPicks[1].poster_path
                  )}
                  alt=""
                />

              </div>
            )}

            <div className="floating-card card-main">

              {quickPicks[0] ? (

                <img
                  src={poster(
                    quickPicks[0].poster_path
                  )}
                  alt=""
                />

              ) : (

                <div className="fake-poster">
                  🎬
                </div>

              )}

              <div className="visual-label">

                <Sparkles size={13} />

                AI MATCH

              </div>

            </div>

          </motion.div>

        </div>

      </section>

      {/* ====================================================
          MAIN
      ==================================================== */}

      <main>

        {/* ==================================================
            DISCOVER
        ================================================== */}

        <section
          className="discover-new"
          id="discover"
        >

          <div className="discover-header">

            <div>

              <div className="section-number">
                01 / DISCOVER
              </div>

              <h2>
                What are you
                <span> into?</span>
              </h2>

              <p>
                Pick movies or TV shows that
                represent your taste.
              </p>

            </div>

            <div className="algorithm-pill">

              <span></span>

              Hybrid AI Engine

            </div>

          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div
            className="search-box-wrapper"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "100%",
              zIndex: 50,
            }}
          >

            <div className="search-container">

              <Search
                size={21}
                className="big-search-icon"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search movies and TV shows..."
                autoComplete="off"
                aria-label="Search movies and TV shows"
              />

              {search && (
                <button
                  className="search-close"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  <X size={18} />
                </button>
              )}

            </div>

            {/* =================================================
              SEARCH DROPDOWN
          ================================================= */}

            <AnimatePresence>

              {search.trim() && (

                <motion.div
                  className="search-dropdown"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    maxHeight: "520px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    zIndex: 9999,
                  }}
                  initial={{
                    opacity: 0,
                    y: -8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                >

                  {loadingMovies ? (

                    <div className="dropdown-empty">

                      <Loader2
                        size={18}
                        className="spin"
                      />

                      Loading catalogue...

                    </div>

                  ) : searchResults.length === 0 ? (

                    <div className="dropdown-empty">

                      No matching titles found.

                    </div>

                  ) : (

                    <div
                      className="search-results-wrap"
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                      }}
                    >

                      <div
                        className="search-results-count"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px 14px",
                          fontSize: "11px",
                          lineHeight: "1",
                        }}
                      >
                        {searchResults.length} matching title{searchResults.length !== 1 ? "s" : ""}
                      </div>

                      <div
                        className="search-results-grid"
                        style={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          boxSizing: "border-box",
                        }}
                      >

                        {searchResults.map(
                          (movie) => (

                            <button
                              className="search-movie"
                              key={`${movie.id || movie.title}-${movie.media_type}`}
                              type="button"
                              style={{
                                width: "100%",
                                minWidth: 0,
                                height: "76px",
                                minHeight: "76px",
                                maxHeight: "76px",
                                flex: "0 0 76px",
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                boxSizing: "border-box",
                                overflow: "hidden",
                                padding: "8px 14px",
                                gap: "12px",
                                textAlign: "left",
                              }}
                              onClick={() =>
                                selectMovie(movie)
                              }
                            >

                              {/* POSTER */}

                              <div
                                className="search-poster"
                                style={{
                                  width: "44px",
                                  minWidth: "44px",
                                  height: "60px",
                                  minHeight: "60px",
                                  flex: "0 0 44px",
                                  overflow: "hidden",
                                  borderRadius: "5px",
                                }}
                              >

                                <img
                                  style={{
                                    width: "44px",
                                    height: "60px",
                                    minWidth: "44px",
                                    minHeight: "60px",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                  src={poster(
                                    movie.poster_path
                                  )}
                                  alt={
                                    movie.title
                                  }
                                />

                              </div>

                              {/* INFO */}

                              <div
                                className="search-movie-text"
                                style={{
                                  minWidth: 0,
                                  flex: "1 1 auto",
                                  overflow: "hidden",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  gap: "5px",
                                }}
                              >

                                <strong
                                  style={{
                                    display: "block",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {movie.title}
                                </strong>

                                <span>

                                  {movie.media_type ===
                                    "tv" ? (
                                    <>
                                      <Tv
                                        size={12}
                                      />
                                      TV SERIES
                                    </>
                                  ) : (
                                    <>
                                      <Film
                                        size={12}
                                      />
                                      MOVIE
                                    </>
                                  )}

                                </span>

                              </div>

                              <div
                                className="add-icon"
                                style={{
                                  flex: "0 0 36px",
                                  width: "36px",
                                  height: "36px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >

                                <Plus size={17} />

                              </div>

                            </button>

                          )
                        )}

                      </div>
                    </div>

                  )}

                </motion.div>

              )}

            </AnimatePresence>

          </div>

          {/* =================================================
              SELECTED MOVIES
          ================================================= */}

          <div className="selection-area">

            <div className="selection-top">

              <span>
                YOUR PICKS
              </span>

              <strong>
                {selectedMovies.length}
              </strong>

              {selectedMovies.length > 0 && (

                <button
                  onClick={
                    clearSelections
                  }
                >
                  Clear all
                </button>

              )}

            </div>

            {selectedMovies.length === 0 ? (

              <div className="selection-empty">

                <div className="empty-icon">
                  +
                </div>

                <div>

                  <strong>
                    Start building your
                    taste profile
                  </strong>

                  <p>
                    Search above and select
                    movies you enjoy.
                  </p>

                </div>

              </div>

            ) : (

              <div className="selected-movies">

                {selectedMovies.map(
                  (movie, index) => (

                    <motion.div
                      className="selected-movie"
                      key={`${movie.title}-${index}`}
                      initial={{
                        opacity: 0,
                        scale: 0.8,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                    >

                      <img
                        src={poster(
                          movie.poster_path
                        )}
                        alt=""
                      />

                      <div>

                        <strong>
                          {movie.title}
                        </strong>

                        <span>

                          {movie.media_type ===
                            "tv"
                            ? "TV"
                            : "MOVIE"}

                        </span>

                      </div>

                      <button
                        onClick={() =>
                          removeMovie(
                            movie.title
                          )
                        }
                      >
                        <X size={15} />
                      </button>

                    </motion.div>

                  )
                )}

              </div>

            )}

          </div>

          {/* =================================================
              NUMBER OF RESULTS
          ================================================= */}

          <div className="controls">

            <div className="control-header">

              <div>

                <span>
                  02 / PERSONALIZE
                </span>

                <strong>
                  How many matches?
                </strong>

              </div>

              <div className="number">
                {topN}
              </div>

            </div>

            <input
              className="custom-range"
              type="range"
              min="5"
              max="20"
              value={topN}
              onChange={(event) =>
                setTopN(
                  Number(
                    event.target.value
                  )
                )
              }
            />

            <div className="range-values">

              <span>5</span>
              <span>20</span>

            </div>

          </div>

          {/* ERROR */}

          {error && (

            <div className="error-box">
              {error}
            </div>

          )}

          {/* =================================================
              ACTION
          ================================================= */}

          <div className="action-row">

            <button
              className="generate-button"
              disabled={
                selectedMovies.length ===
                0 ||
                loadingRecommendations
              }
              onClick={() =>
                getRecommendations()
              }
            >

              {loadingRecommendations ? (
                <>
                  <Loader2
                    size={18}
                    className="spin"
                  />

                  Finding matches...
                </>
              ) : (
                <>
                  <Sparkles size={18} />

                  Find My Matches
                </>
              )}

            </button>

            <span>
              Powered by hybrid recommendation
            </span>

          </div>

        </section>

        {/* ==================================================
            RESULTS
        ================================================== */}

        <section
          className="results-new"
          id="results"
        >

          <div className="results-heading">

            <div>

              <div className="section-number">
                03 / FOR YOU
              </div>

              <h2>
                {resultMode === "similar" ? (
                  <>
                    Similar to
                    <span> {resultSource}.</span>
                  </>
                ) : (
                  <>
                    Your next
                    <span> favorites.</span>
                  </>
                )}
              </h2>

            </div>

            {recommendations.length > 0 && (

              <div className="result-counter">

                {recommendations.length}

                <span>
                  {" "}
                  {resultMode === "similar" ? "SIMILAR" : "MATCHES"}
                </span>

              </div>

            )}

          </div>

          {recommendations.length === 0 ? (

            <div className="results-empty">

              <div className="results-empty-symbol">
                ✦
              </div>

              <h3>
                {resultMode === "similar"
                  ? "Similar movies will appear here."
                  : "Your recommendations will appear here."}
              </h3>

              <p>
                {resultMode === "similar"
                  ? "Choose a title and explore movies with a similar taste profile."
                  : "Select a few titles above and let the algorithm work."}
              </p>

            </div>

          ) : (

            <motion.div
              className="new-movie-grid"
              initial="hidden"
              animate="show"
              variants={{
                show: {
                  transition: {
                    staggerChildren: 0.06,
                  },
                },
              }}
            >

              {recommendations.map(
                (movie, index) => (

                  <motion.article
                    className="new-movie-card"
                    key={`${movie.id || movie.title}-${index}`}
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 25,
                      },

                      show: {
                        opacity: 1,
                        y: 0,
                      },
                    }}
                    whileHover={{
                      y: -8,
                    }}
                    onClick={() =>
                      openMovie(movie)
                    }
                  >

                    <div className="new-poster">

                      <img
                        src={poster(
                          movie.poster_path
                        )}
                        alt={movie.title}
                      />

                      <div className="match-score">

                        <Sparkles size={11} />

                        {matchPercent(
                          movie.final_score
                        ).toFixed(0)}

                        %

                      </div>

                      <div className="card-hover">

                        <div className="play-circle">

                          <Play
                            size={19}
                            fill="white"
                          />

                        </div>

                        <span>
                          View Details
                        </span>

                      </div>

                    </div>

                    <div className="new-card-info">

                      <h3>
                        {movie.title}
                      </h3>

                      <div className="card-details">

                        <span>

                          {movie.media_type ===
                            "tv" ? (
                            <>
                              <Tv size={12} />
                              TV
                            </>
                          ) : (
                            <>
                              <Film size={12} />
                              MOVIE
                            </>
                          )}

                        </span>

                        {movie.vote_average && (

                          <span className="rating">

                            <Star
                              size={12}
                              fill="currentColor"
                            />

                            {Number(
                              movie.vote_average
                            ).toFixed(1)}

                          </span>

                        )}

                      </div>

                    </div>

                  </motion.article>

                )
              )}

            </motion.div>

          )}

        </section>

        {/* ==================================================
            HOW IT WORKS
        ================================================== */}

        <section
          className="how-section"
          id="how-it-works"
        >

          <div className="section-number">
            HOW IT WORKS
          </div>

          <h2>
            Three signals.
            <br />

            <span>
              One smart recommendation.
            </span>

          </h2>

          <div className="algorithm-grid">

            <div className="algorithm-card">

              <div className="algorithm-number">
                01
              </div>

              <h3>
                Content Similarity
              </h3>

              <p>
                TF-IDF compares genres,
                keywords, cast, directors
                and descriptions.
              </p>

              <strong>
                35%
              </strong>

            </div>

            <div className="algorithm-card active">

              <div className="algorithm-number">
                02
              </div>

              <h3>
                Semantic Understanding
              </h3>

              <p>
                Sentence embeddings understand
                deeper meaning and context
                behind each movie.
              </p>

              <strong>
                50%
              </strong>

            </div>

            <div className="algorithm-card">

              <div className="algorithm-number">
                03
              </div>

              <h3>
                Community Rating
              </h3>

              <p>
                Movie ratings help improve
                ranking and surface stronger
                recommendations.
              </p>

              <strong>
                15%
              </strong>

            </div>

          </div>

        </section>

      </main>

      {/* ====================================================
          MOVIE DETAILS MODAL
      ==================================================== */}

      <AnimatePresence>
        {selectedMovie && (
          <motion.div
            className="movie-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMovie(null)}
          >
            <motion.div
              className="movie-modal-new"
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.22 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="modal-close-new"
                onClick={() => setSelectedMovie(null)}
                aria-label="Close movie details"
              >
                <X size={20} />
              </button>

              <div
                className="modal-hero"
                style={{
                  backgroundImage: `
                    linear-gradient(
                      to bottom,
                      rgba(8,10,15,0.05),
                      #080a0f
                    ),
                    url(${backdrop(
                    selectedMovie.backdrop_path,
                    selectedMovie.poster_path
                  )})
                  `,
                }}
              />

              <div className="modal-body">
                <img
                  className="modal-poster-new"
                  src={poster(selectedMovie.poster_path)}
                  alt={selectedMovie.title}
                />

                <div className="modal-details">
                  <div className="section-number">
                    {selectedMovie.media_type === "tv"
                      ? "TV SERIES"
                      : "MOVIE"}
                  </div>

                  <h2>{selectedMovie.title}</h2>

                  <div className="modal-rating">
                    {getYear(selectedMovie) && (
                      <span>{getYear(selectedMovie)}</span>
                    )}

                    {selectedMovie.vote_average && (
                      <span>
                        <Star size={15} fill="currentColor" />
                        {Number(selectedMovie.vote_average).toFixed(1)}
                        /10
                      </span>
                    )}

                    {selectedMovie.final_score && (
                      <span className="modal-match">
                        <Sparkles size={14} />
                        {matchPercent(selectedMovie.final_score).toFixed(1)}
                        % Match
                      </span>
                    )}
                  </div>

                  {getCast(selectedMovie).length > 0 && (
                    <div className="modal-cast">
                      <strong>Cast</strong>
                      <span>
                        {getCast(selectedMovie).slice(0, 5).join(" · ")}
                      </span>
                    </div>
                  )}

                  <p className="modal-overview">
                    {selectedMovie.overview ||
                      "No overview available."}
                  </p>

                  {getGenres(selectedMovie).length > 0 && (
                    <div className="genre-list">
                      {getGenres(selectedMovie)
                        .slice(0, 5)
                        .map((genre) => (
                          <span key={genre}>{genre}</span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* =================================================
                  MORE LIKE THIS — INSIDE MODAL
              ================================================= */}

              <div className="modal-related-section">
                <div className="modal-related-header">
                  <div>
                    <div className="section-number">
                      RECOMMENDED
                    </div>
                    <h3>More like this</h3>
                  </div>

                  {relatedMovies.length > 0 && (
                    <span className="modal-related-count">
                      {relatedMovies.length} titles
                    </span>
                  )}
                </div>

                {loadingRecommendations ? (
                  <div className="modal-related-loading">
                    <Loader2 size={20} className="spin" />
                    Finding movies like {selectedMovie.title}...
                  </div>
                ) : relatedMovies.length === 0 ? (
                  <div className="modal-related-empty">
                    No related movies found.
                  </div>
                ) : (
                  <div className="modal-related-grid">
                    {relatedMovies.slice(0, 6).map((movie, index) => (
                      <button
                        type="button"
                        className="modal-related-card"
                        key={`${movie.id || movie.title}-${index}`}
                        onClick={() => showRelatedOnMain(movie)}
                      >
                        <div className="modal-related-poster">
                          <img
                            src={poster(movie.poster_path)}
                            alt={movie.title}
                          />

                          {movie.vote_average && (
                            <span className="modal-related-rating">
                              <Star size={10} fill="currentColor" />
                              {Number(movie.vote_average).toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="modal-related-info">
                          <strong>{movie.title}</strong>

                          <span>
                            {movie.media_type === "tv"
                              ? "TV SERIES"
                              : "MOVIE"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {relatedMovies.length > 0 && (
                  <p className="modal-related-hint">
                    Click a title to close this popup and show its recommendations on the main page.
                  </p>
                )}
              </div>

              <div className="modal-footer-action">
                <button
                  className="modal-action"
                  onClick={() => findSimilar(selectedMovie)}
                  disabled={loadingRecommendations}
                >
                  <Sparkles size={17} />
                  More Like This
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer className="new-footer">

        <div className="footer-brand">

          🎬 Cine<span>Match</span>

        </div>

        <p>
          Discover something worth watching.
        </p>

        <div className="footer-line">
          TF-IDF · Semantic Embeddings · Hybrid Ranking
        </div>

      </footer>

    </div>
  );
}

export default App;