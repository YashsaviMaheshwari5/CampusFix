import { useState } from "react";

function KnowledgeBase() {
  const articles = [
    { id: 1, title: "Report a maintenance issue", category: "Maintenance", icon: "🔧", description: "Give the campus team enough information to find and repair the issue.", tips: ["Include the building and room number.", "Describe what is broken and when it started.", "Attach a clear photo when useful."] },
    { id: 2, title: "Troubleshoot campus Wi-Fi", category: "Internet", icon: "📶", description: "Try basic network checks before reporting a campus connectivity problem.", tips: ["Confirm Wi-Fi is enabled on your device.", "Reconnect to the official campus network.", "Include your building and approximate time in your report."] },
    { id: 3, title: "Keep shared spaces clean", category: "Cleanliness", icon: "🧹", description: "Report cleanliness issues with a precise location so facilities staff can respond.", tips: ["Choose the correct building or common area.", "Describe the type of cleanup needed.", "Use High priority only for urgent health concerns."] },
    { id: 4, title: "Report a power issue", category: "Electricity", icon: "⚡", description: "Electrical faults can be hazardous. Keep a safe distance and report them promptly.", tips: ["Do not touch exposed wiring.", "State whether power is out for one room or a wider area.", "Mention visible sparks, smoke, or burning smells as urgent."] },
    { id: 5, title: "CampusFix complaint tips", category: "CampusFix", icon: "📋", description: "A clear complaint helps the right campus team understand and resolve the issue.", tips: ["Use a short, specific title.", "Select the closest matching category.", "Track progress from your dashboard."] },
  ];
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const loading = false;
  const error = "";
  // ==========================================\r
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

        CampusFix help articles

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
