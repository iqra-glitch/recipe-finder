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
        ${favButtonHTML(meal)} <!-- FEATURE 8: heart button -->
        <img src="${recipeImage(meal, "medium")}" alt="${meal.strMeal}" loading="lazy" />
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
    // FEATURE 11: Pakistani recipes ("pk-" ids) come from the local file, all others from the API
    const meals = isLocalRecipe(id) ? await findLocalRecipe(id) : await fetchMeals(`${API_BASE}/lookup.php?i=${id}`);
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
    <img class="modal-img" src="${recipeImage(meal)}" alt="${meal.strMeal}" />
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
  // FEATURE 11: Pakistan uses the local recipe file instead of the API
  if (isPakistan(country)) return showLocalAreaRecipes(country);

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
// FEATURE 8: Favorites (saved in localStorage)
// ==========================================================
const FAVORITES_KEY = "recipeFinderFavorites";
const favoritesBtn = document.getElementById("favorites-btn");
const favoritesCountEl = document.getElementById("favorites-count");

let favorites = loadFavorites(); // list of saved recipes, kept in memory
let showingFavorites = false;    // true while the Favorites view is on screen

// Read saved favorites from localStorage (empty list if none or if storage is blocked)
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Save favorites to localStorage and update the count on the button
function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error(error); // storage blocked: favorites still work until the page reloads
  }
  favoritesCountEl.textContent = favorites.length;
}

function isFavorite(id) {
  return favorites.some((fav) => fav.idMeal === id);
}

// HTML for the heart button on a card (used by displayRecipes)
function favButtonHTML(meal) {
  const saved = isFavorite(meal.idMeal);
  return `<button type="button" class="fav-btn${saved ? " saved" : ""}" aria-pressed="${saved}"
    aria-label="${saved ? "Remove from favorites" : "Add to favorites"}">${saved ? "♥" : "♡"}</button>`;
}

// Collect the recipe info shown on a card, so the Favorites view needs no API calls
function mealFromCard(card) {
  const tags = card.querySelectorAll(".tag"); // tags are shown in the order: category, area
  return {
    idMeal: card.dataset.id,
    strMeal: card.querySelector(".card-title").textContent,
    strMealThumb: card.querySelector("img").src.replace(/\/medium$/, ""), // displayRecipes adds "/medium" back
    strCategory: tags[0] ? tags[0].textContent : "",
    strArea: tags[1] ? tags[1].textContent : "",
  };
}

// Add or remove a recipe when its heart is clicked
function toggleFavorite(heart) {
  const card = heart.closest(".card");
  const id = card.dataset.id;

  if (isFavorite(id)) {
    favorites = favorites.filter((fav) => fav.idMeal !== id);
  } else {
    favorites.push(mealFromCard(card));
  }
  saveFavorites();

  // In the Favorites view, redraw so a removed recipe disappears straight away
  if (showingFavorites) {
    showFavorites();
    return;
  }

  // Otherwise just flip this heart
  const saved = isFavorite(id);
  heart.textContent = saved ? "♥" : "♡";
  heart.classList.toggle("saved", saved);
  heart.setAttribute("aria-pressed", saved);
  heart.setAttribute("aria-label", saved ? "Remove from favorites" : "Add to favorites");
}

// Heart clicks: this "capture" listener (the `true` at the end) runs BEFORE the card's
// popup listener. Stopping the event here means clicking the heart never opens the popup.
resultsEl.addEventListener(
  "click",
  (event) => {
    const heart = event.target.closest(".fav-btn");
    if (!heart) return;
    event.stopPropagation();
    toggleFavorite(heart);
  },
  true
);

// Same for the keyboard: pressing Enter on a focused heart must not open the popup.
// (The browser still turns that Enter into a click, so the heart still toggles.)
resultsEl.addEventListener(
  "keydown",
  (event) => {
    if (event.target.closest(".fav-btn")) event.stopPropagation();
  },
  true
);

// Show only the saved recipes
function showFavorites() {
  showingFavorites = true;
  favoritesBtn.classList.add("active");
  setActiveCategory(null); // clear the category highlight
  areaSelect.value = "";   // reset the country dropdown

  if (favorites.length === 0) {
    resultsEl.innerHTML = "";
    showStatus("No favorites yet — tap ♡ on any recipe to save it.");
    return;
  }

  showStatus(`Your ${favorites.length} favorite recipe${favorites.length > 1 ? "s" : ""}`);
  displayRecipes(favorites); // reuse the same cards as search results
}

favoritesBtn.addEventListener("click", showFavorites);

// Leave the Favorites view when the user searches, picks a category or picks a country
function leaveFavorites() {
  showingFavorites = false;
  favoritesBtn.classList.remove("active");
}

searchForm.addEventListener("submit", leaveFavorites);
categoriesEl.addEventListener("click", (event) => {
  if (event.target.closest(".category-btn")) leaveFavorites();
});
areaSelect.addEventListener("change", () => {
  if (areaSelect.value) leaveFavorites();
});

// Show the saved count as soon as the page opens
favoritesCountEl.textContent = favorites.length;

// ==========================================================
// FEATURE 9: Random recipes on page load
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
favoritesBtn.addEventListener("click", () => (userHasChosen = true)); // same for the Favorites view

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

// ==========================================================
// FEATURE 10: Scroll hints for the category row
// ==========================================================
const categoriesWrap = document.getElementById("categories-wrap");
const catArrowLeft = categoriesWrap.querySelector(".cat-arrow-left");
const catArrowRight = categoriesWrap.querySelector(".cat-arrow-right");

// Check if the row can scroll left/right, and tell the CSS by adding classes.
// The CSS then shows the matching arrow and the right-edge fade.
function updateCategoryHints() {
  const maxScroll = categoriesEl.scrollWidth - categoriesEl.clientWidth;
  // The "1" allows for tiny rounding differences in browser measurements
  categoriesWrap.classList.toggle("can-scroll-left", categoriesEl.scrollLeft > 1);
  categoriesWrap.classList.toggle("can-scroll-right", categoriesEl.scrollLeft < maxScroll - 1);
}

// Scroll the row by about 70% of its visible width (2–3 buttons)
function scrollCategories(direction) {
  categoriesEl.scrollBy({ left: direction * categoriesEl.clientWidth * 0.7, behavior: "smooth" });
}

catArrowLeft.addEventListener("click", () => scrollCategories(-1));
catArrowRight.addEventListener("click", () => scrollCategories(1));

// Update the hints whenever the row moves (swipe, mouse, arrows) or the screen size changes
categoriesEl.addEventListener("scroll", updateCategoryHints);
window.addEventListener("resize", updateCategoryHints);

// Check once now, and again after the web fonts load (they change the button widths)
updateCategoryHints();
document.fonts.ready.then(updateCategoryHints);

// ==========================================================
// FEATURE 11: Local Pakistani recipes (pakistani-recipes.json)
// Note: browsers only allow reading this file when the site runs on a
// server (e.g. VS Code Live Server or GitHub Pages), not from file:///
// ==========================================================
const LOCAL_RECIPES_FILE = "pakistani-recipes.json";

// Shown when a recipe has no image: peach background, 🍲 and "Image coming soon"
const PLACEHOLDER_IMG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#fde9df"/>
  <text x="200" y="150" font-size="64" text-anchor="middle">🍲</text>
  <text x="200" y="205" font-family="Poppins, sans-serif" font-size="20" fill="#c8431d" text-anchor="middle">Image coming soon</text>
</svg>`);

// Pick the right image for a recipe (used by the cards, the popup and Favorites)
function recipeImage(meal, size) {
  const src = meal.strMealThumb;
  if (!src) return PLACEHOLDER_IMG; // empty image -> placeholder

  // Only TheMealDB images have smaller versions like ".../photo.jpg/medium".
  // Local images (e.g. "images/nihari.jpg") and the placeholder are used as they are.
  const isMealDbImage = src.startsWith("https://www.themealdb.com/");
  return isMealDbImage && size ? `${src}/${size}` : src;
}

// "Pakistan" (from the dropdown) and "Pakistani" (in the file) mean the same thing
function isPakistan(name) {
  return ["pakistan", "pakistani"].includes(String(name || "").trim().toLowerCase());
}

// Local recipe ids start with "pk-" (TheMealDB ids are numbers)
function isLocalRecipe(id) {
  return String(id).startsWith("pk-");
}

// Read the JSON file once and remember it, so it isn't downloaded again
let localRecipesPromise = null;

function loadLocalRecipes() {
  if (!localRecipesPromise) {
    localRecipesPromise = fetch(LOCAL_RECIPES_FILE)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not read ${LOCAL_RECIPES_FILE}: ${response.status}`);
        return response.json();
      })
      .then((data) => data.meals || []);

    // If it fails, forget the failed attempt so the next click can try again
    localRecipesPromise.catch(() => (localRecipesPromise = null));
  }
  return localRecipesPromise;
}

// Find one local recipe for the popup (returns a list, just like fetchMeals)
async function findLocalRecipe(id) {
  const recipes = await loadLocalRecipes();
  const meal = recipes.find((recipe) => recipe.idMeal === id);
  return meal ? [meal] : null;
}

// Show the local recipes for Pakistan as cards (called by filterByArea)
async function showLocalAreaRecipes(country) {
  showStatus(`Loading recipes from ${country}...`);
  resultsEl.innerHTML = ""; // clear old results

  try {
    const recipes = await loadLocalRecipes();
    const meals = recipes.filter((meal) => isPakistan(meal.strArea));

    if (meals.length === 0) {
      showStatus(`No recipes found for ${country} yet.`);
      return;
    }

    showStatus(`Found ${meals.length} recipe${meals.length > 1 ? "s" : ""} from ${country}`);
    displayRecipes(meals); // reuse the same cards as search results
  } catch (error) {
    console.error(error);
    showStatus(
      "Couldn't load the Pakistani recipes. Open the site through a local server (e.g. VS Code Live Server).",
      true
    );
  }
}
