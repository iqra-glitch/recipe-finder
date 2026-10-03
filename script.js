// ==========================================================
// Recipe Finder — uses the free TheMealDB API
// Docs: https://www.themealdb.com/api.php
// ==========================================================

const API_BASE = "https://www.themealdb.com/api/json/v1/1";

// Grab the page elements we need
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

// ==========================================================
// FEATURE 1: Search bar (button click or Enter key)
// ==========================================================
searchForm.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading

  const query = searchInput.value.trim();
  if (!query) return; // ignore empty searches

  searchRecipes(query);
});

// ==========================================================
// FEATURE 2: Fetch recipes from the API
// ==========================================================
async function searchRecipes(query) {
  showStatus("Searching for recipes...");
  resultsEl.innerHTML = ""; // clear old results

  try {
    // 1) Try searching by recipe name first
    let meals = await fetchMeals(`${API_BASE}/search.php?s=${encodeURIComponent(query)}`);

    // 2) If nothing found, try searching by ingredient instead
    if (!meals) {
      meals = await fetchMeals(`${API_BASE}/filter.php?i=${encodeURIComponent(query)}`);
    }

    // 3) Still nothing? Show the "no results" message
    if (!meals) {
      showStatus(`No recipes found for "${query}". Try another word.`);
      return;
    }

    showStatus(`Found ${meals.length} recipe${meals.length > 1 ? "s" : ""} for "${query}"`);
    displayRecipes(meals);
  } catch (error) {
    // FEATURE 3: network or API failure
    console.error(error);
    showStatus("Something went wrong. Please check your internet connection and try again.", true);
  }
}

// Small helper: fetch a URL and return the "meals" array (or null if none)
async function fetchMeals(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.meals; // TheMealDB returns null when there are no results
}

// Build one card per recipe and add them to the page
function displayRecipes(meals) {
  resultsEl.innerHTML = meals
    .map(
      (meal) => `
      <article class="card" tabindex="0" data-id="${meal.idMeal}">
        <img src="${meal.strMealThumb}/medium" alt="${meal.strMeal}" loading="lazy" />
        <div class="card-body">
          <h3 class="card-title">${meal.strMeal}</h3>
          ${meal.strCategory ? `<span class="tag">${meal.strCategory}</span>` : ""}
          ${meal.strArea ? `<span class="tag">${meal.strArea}</span>` : ""}
        </div>
      </article>`
    )
    .join("");
}

// ==========================================================
// FEATURE 3: Status messages (loading / empty / error)
// ==========================================================
function showStatus(message, isError = false) {
  statusEl.textContent = message; // textContent is safe for user-typed text
  statusEl.classList.toggle("error", isError);
}

// ==========================================================
// FEATURE 4: Recipe details popup
// ==========================================================

// One listener on the results area handles clicks on any card
resultsEl.addEventListener("click", (event) => {
  const card = event.target.closest(".card");
  if (card) showRecipeDetails(card.dataset.id);
});

// Let keyboard users open a card with Enter
resultsEl.addEventListener("keydown", (event) => {
  const card = event.target.closest(".card");
  if (card && event.key === "Enter") showRecipeDetails(card.dataset.id);
});

// Fetch the full recipe by ID and show it in the popup
async function showRecipeDetails(id) {
  openModal();
  modalBody.innerHTML = `<p class="status" style="padding:40px 0">Loading recipe...</p>`;

  try {
    const meals = await fetchMeals(`${API_BASE}/lookup.php?i=${id}`);
    if (!meals) throw new Error("Recipe not found");
    renderRecipe(meals[0]);
  } catch (error) {
    console.error(error);
    modalBody.innerHTML = `<p class="status error" style="padding:40px 0">Could not load this recipe. Please try again.</p>`;
  }
}

// Build the popup content for one recipe
function renderRecipe(meal) {
  // Ingredients are stored as strIngredient1..20 and strMeasure1..20
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push(`<li>${name} <span class="measure">— ${measure || ""}</span></li>`);
    }
  }

  // Split the instructions into steps (one per line), skipping empty lines and "STEP 1" style labels
  const steps = (meal.strInstructions || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^step\s*\d+:?$/i.test(line))
    .map((line) => `<li>${line}</li>`);

  modalBody.innerHTML = `
    <img class="modal-img" src="${meal.strMealThumb}" alt="${meal.strMeal}" />
    <div class="modal-info">
      <h2 id="modal-title">${meal.strMeal}</h2>
      ${meal.strCategory ? `<span class="tag">${meal.strCategory}</span>` : ""}
      ${meal.strArea ? `<span class="tag">${meal.strArea}</span>` : ""}

      <h3>Ingredients</h3>
      <ul class="ingredients">${ingredients.join("")}</ul>

      <h3>Steps</h3>
      <ol class="steps">${steps.join("")}</ol>

      ${meal.strYoutube
        ? `<a class="video-link" href="${meal.strYoutube}" target="_blank" rel="noopener">▶ Watch on YouTube</a>`
        : ""}
    </div>
  `;
}

// Show / hide the popup
function openModal() {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // stop the page behind from scrolling
}

function closeModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Close with the × button
modalClose.addEventListener("click", closeModal);

// Close when clicking the dark area outside the popup
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

// Close with the Esc key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
});

// ==========================================================
// FEATURE 6: Category filter buttons
// ==========================================================
const categoriesEl = document.getElementById("categories");

// One listener on the container handles clicks on every category button
categoriesEl.addEventListener("click", (event) => {
  const button = event.target.closest(".category-btn");
  if (!button) return;

  setActiveCategory(button);
  filterByCategory(button.dataset.category);
});

// Fetch all recipes in a category and show them as cards
async function filterByCategory(category) {
  showStatus(`Loading ${category} recipes...`);
  resultsEl.innerHTML = ""; // clear old results

  try {
    const meals = await fetchMeals(`${API_BASE}/filter.php?c=${encodeURIComponent(category)}`);

    if (!meals) {
      showStatus(`No recipes found in "${category}".`);
      return;
    }

    // This endpoint doesn't return the category name, so add it back for the card tag
    const mealsWithCategory = meals.map((meal) => ({ ...meal, strCategory: category }));

    showStatus(`Found ${meals.length} ${category} recipe${meals.length > 1 ? "s" : ""}`);
    displayRecipes(mealsWithCategory); // reuse the same cards as search results
  } catch (error) {
    console.error(error);
    showStatus("Something went wrong. Please check your internet connection and try again.", true);
  }
}

// Highlight the clicked button (pass null to clear the highlight)
function setActiveCategory(activeButton) {
  categoriesEl.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.toggle("active", btn === activeButton);
  });
}

// When the user searches instead, remove the category highlight
searchForm.addEventListener("submit", () => setActiveCategory(null));

// ==========================================================
// FEATURE 7: Area (country) filter dropdown
// ==========================================================
const areaSelect = document.getElementById("area-select");

// Fill the dropdown with the area list from the API (runs once on page load)
async function loadAreas() {
  try {
    const areas = await fetchMeals(`${API_BASE}/list.php?a=list`);
    if (!areas) throw new Error("No areas returned");

    // Each item looks like { strArea: "Indian", strCountry: "India" }.
    // We use the country name because the API finds recipes with it reliably
    // (e.g. "India" works but "Indian" returns nothing).
    const options = areas
      .map((area) => `<option value="${area.strCountry}">${area.strCountry}</option>`)
      .join("");

    areaSelect.innerHTML = `<option value="">🌍 Filter by country</option>${options}`;
  } catch (error) {
    // If the list fails, keep the rest of the page working
    console.error(error);
    areaSelect.innerHTML = `<option value="">Couldn't load countries</option>`;
    areaSelect.disabled = true;
  }
}

// When a country is selected, show its recipes
areaSelect.addEventListener("change", () => {
  const country = areaSelect.value;
  if (!country) return; // placeholder option selected

  setActiveCategory(null); // clear any highlighted category button
  filterByArea(country);
});

// Fetch all recipes for one country and show them as cards
async function filterByArea(country) {
  showStatus(`Loading recipes from ${country}...`);
  resultsEl.innerHTML = ""; // clear old results

  try {
    const meals = await fetchMeals(`${API_BASE}/filter.php?a=${encodeURIComponent(country)}`);

    // Many countries in the list don't have any recipes yet
    if (!meals) {
      showStatus(`No recipes found for ${country} yet — TheMealDB doesn't have recipes for every country.`);
      return;
    }

    // Add the country name so each card shows it as a tag
    const mealsWithArea = meals.map((meal) => ({ ...meal, strArea: country }));

    showStatus(`Found ${meals.length} recipe${meals.length > 1 ? "s" : ""} from ${country}`);
    displayRecipes(mealsWithArea); // reuse the same cards as search results
  } catch (error) {
    console.error(error);
    showStatus("Something went wrong. Please check your internet connection and try again.", true);
  }
}

// Reset the dropdown when the user picks a category or searches instead
categoriesEl.addEventListener("click", (event) => {
  if (event.target.closest(".category-btn")) areaSelect.value = "";
});
searchForm.addEventListener("submit", () => (areaSelect.value = ""));

// Load the countries as soon as the page opens
loadAreas();

// ==========================================================
// FEATURE 8: Random recipes on page load
// ==========================================================
const RANDOM_COUNT = 12; // 12 fills 1, 2, 3 or 4 grid columns evenly
let userHasChosen = false; // becomes true once the user searches or picks a filter

// If the user searches or filters before the random recipes arrive,
// remember it so the late random results don't replace their results
searchForm.addEventListener("submit", () => (userHasChosen = true));
categoriesEl.addEventListener("click", (event) => {
  if (event.target.closest(".category-btn")) userHasChosen = true;
});
areaSelect.addEventListener("change", () => {
  if (areaSelect.value) userHasChosen = true;
});

// Fetch several random recipes and show them as cards
async function loadRandomRecipes() {
  showStatus("Loading some recipe ideas...");

  // random.php returns only ONE recipe per call, so make several calls at the same time.
  // allSettled waits for all of them, even if a few fail.
  const requests = [];
  for (let i = 0; i < RANDOM_COUNT; i++) {
    requests.push(fetchMeals(`${API_BASE}/random.php`));
  }
  const results = await Promise.allSettled(requests);

  if (userHasChosen) return; // the user already moved on, so keep their results

  // Keep the recipes that loaded, skipping duplicates (the same recipe can come back twice)
  const meals = [];
  results.forEach((result) => {
    const meal = result.status === "fulfilled" && result.value ? result.value[0] : null;
    if (meal && !meals.some((m) => m.idMeal === meal.idMeal)) meals.push(meal);
  });

  // Every request failed (for example, no internet)
  if (meals.length === 0) {
    showStatus("Something went wrong. Please check your internet connection and try again.", true);
    return;
  }

  showStatus("✨ Try something new — here are some random recipes");
  displayRecipes(meals); // reuse the same cards as search results
}

// Show random recipes as soon as the page opens
loadRandomRecipes();
