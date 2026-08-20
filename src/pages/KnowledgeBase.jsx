import { useState, useEffect } from "react";

function KnowledgeBase() {

  // ==========================================
  // STATE
  // ==========================================

  const [articles, setArticles] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ==========================================
  // FETCH DATA FROM API
  // ==========================================

  useEffect(() => {

    const fetchArticles = async () => {

      try {

        setLoading(true);

        setError("");

        // API request
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/posts"
        );


        // Check if API request was successful
        if (!response.ok) {
          throw new Error("Failed to fetch articles.");
        }


        // Convert response into JSON
        const data = await response.json();


        // Convert API data into CampusFix articles
        const campusArticles = data
          .slice(0, 6)
          .map((article, index) => ({

            id: article.id,

            title: article.title
              .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
              ),

            category: [
              "Hostel",
              "Internet",
              "Cleanliness",
              "Maintenance",
              "Electricity",
              "CampusFix"
            ][index],

            icon: [
              "❄️",
              "📶",
              "🧹",
              "🔧",
              "⚡",
              "📋"
            ][index],

            description:
              article.body
                .replace(/\n/g, " ")
                .slice(0, 150) + "...",

            tips: [
              "Check the issue carefully.",
              "Mention the exact location.",
              "Report the problem through CampusFix."
            ]

          }));


        // Store API data
        setArticles(campusArticles);

      } catch (err) {

        console.error(err);

        setError(
          "Unable to load knowledge articles."
        );

      } finally {

        setLoading(false);

      }

    };


    fetchArticles();

  }, []);


  // ==========================================
  // FILTER ARTICLES
  // ==========================================

  const filteredArticles = articles.filter(
    (article) => {

      const matchesSearch =
        article.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||

        article.description
          .toLowerCase()
          .includes(search.toLowerCase());


      const matchesCategory =
        selectedCategory === "All" ||
        article.category === selectedCategory;


      return matchesSearch && matchesCategory;
    }
  );


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (
      <div className="knowledge-page">

        <div className="page-header">

          <div>
            <h1>Knowledge Base 📚</h1>

            <p>
              Loading helpful campus information...
            </p>
          </div>

        </div>

        <div className="knowledge-empty">

          <h2>
            Loading... ⏳
          </h2>

          <p>
            Please wait while we fetch the articles.
          </p>

        </div>

      </div>
    );

  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error) {

    return (
      <div className="knowledge-page">

        <div className="page-header">

          <div>
            <h1>Knowledge Base 📚</h1>

            <p>
              Find quick solutions to common campus problems.
            </p>
          </div>

        </div>

        <div className="knowledge-empty">

          <h2>
            Something went wrong ❌
          </h2>

          <p>
            {error}
          </p>

          <button
            className="submit-btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>

        </div>

      </div>
    );

  }


  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="knowledge-page">

      {/* Header */}

      <div className="page-header">

        <div>

          <h1>
            Knowledge Base 📚
          </h1>

          <p>
            Find quick solutions to common campus problems.
          </p>

        </div>

      </div>


      {/* API Status */}

      <div className="api-status">

        🟢 Knowledge Base connected to API

      </div>


      {/* Search */}

      <div className="knowledge-search">

        <input
          type="text"
          placeholder="Search for a problem..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>


      {/* Categories */}

      <div className="knowledge-categories">

        <button
          className={
            selectedCategory === "All"
              ? "active-category"
              : ""
          }
          onClick={() =>
            setSelectedCategory("All")
          }
        >
          All
        </button>


        <button
          className={
            selectedCategory === "Hostel"
              ? "active-category"
              : ""
          }
          onClick={() =>
            setSelectedCategory("Hostel")
          }
        >
          🏠 Hostel
        </button>


        <button
          className={
            selectedCategory === "Internet"
              ? "active-category"
              : ""
          }
          onClick={() =>
            setSelectedCategory("Internet")
          }
        >
          📶 Internet
        </button>


        <button
          className={
            selectedCategory === "Cleanliness"
              ? "active-category"
              : ""
          }
          onClick={() =>
            setSelectedCategory("Cleanliness")
          }
        >
          🧹 Cleanliness
        </button>


        <button
          className={
            selectedCategory === "Maintenance"
              ? "active-category"
              : ""
          }
          onClick={() =>
            setSelectedCategory("Maintenance")
          }
        >
          🔧 Maintenance
        </button>


        <button
          className={
            selectedCategory === "Electricity"
              ? "active-category"
              : ""
          }
          onClick={() =>
            setSelectedCategory("Electricity")
          }
        >
          ⚡ Electricity
        </button>


        <button
          className={
            selectedCategory === "CampusFix"
              ? "active-category"
              : ""
          }
          onClick={() =>
            setSelectedCategory("CampusFix")
          }
        >
          📋 CampusFix
        </button>

      </div>


      {/* Articles */}

      <div className="knowledge-grid">

        {filteredArticles.length === 0 ? (

          <div className="knowledge-empty">

            <h2>
              No articles found 🔍
            </h2>

            <p>
              Try searching for another problem.
            </p>

          </div>

        ) : (

          filteredArticles.map((article) => (

            <div
              className="knowledge-card"
              key={article.id}
            >

              {/* Icon */}

              <div className="knowledge-icon">

                {article.icon}

              </div>


              {/* Content */}

              <div className="knowledge-content">

                <span className="article-category">

                  {article.category}

                </span>


                <h2>

                  {article.title}

                </h2>


                <p>

                  {article.description}

                </p>


                {/* Tips */}

                <div className="article-tips">

                  <h3>
                    Quick Tips
                  </h3>

                  <ul>

                    {article.tips.map(
                      (tip, index) => (

                        <li key={index}>
                          {tip}
                        </li>

                      )
                    )}

                  </ul>

                </div>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default KnowledgeBase;