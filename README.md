# Recipe Finder

A simple recipe website. Search and browse recipes from [TheMealDB](https://www.themealdb.com/) free API, and explore 10 local Pakistani recipes.

**Live demo:** https://iqra-glitch.github.io/recipe-finder/

## Features

- Search recipes by name or ingredient (Search button or Enter key)
- Random recipe ideas shown when the page opens
- Recipe cards with photo, name and category/country tags, in a responsive grid
- Details popup with ingredients, numbered steps, a YouTube link when available, and a Print button
- 8 category buttons: Chicken, Beef, Seafood, Pasta, Vegetarian, Vegan, Breakfast, Dessert
- Scrollable category row with arrows and an edge fade on small screens
- Country filter dropdown, with the country list loaded from TheMealDB
- Favorites: tap ♡ on a card to save it, and view saved recipes with the ♥ Favorites button (saved in the browser)
- 10 local Pakistani recipes with their own photos, shown by the 🍛 Pakistani Food button or by choosing "Pakistan" in the country dropdown
- Placeholder image for any recipe without a photo
- Loading, "no results" and error messages
- Mobile-friendly, compact header

## Built with

- HTML, CSS and JavaScript (no frameworks)
- [TheMealDB](https://www.themealdb.com/api.php) free API
- Google Fonts (Playfair Display and Poppins)
- Browser localStorage (for Favorites)

## Run locally

1. Download or clone this repository.
2. Open the folder in VS Code.
3. Install the **Live Server** extension.
4. Right-click `index.html` and choose **Open with Live Server**.

Do not open `index.html` by double-clicking it. Browsers block reading `pakistani-recipes.json` from a `file:///` page, so the Pakistani recipes will not load (the rest of the site still works).

## Notes

- Pakistani recipes appear only through the 🍛 Pakistani Food button and the "Pakistan" country option, not in search or random recipes.
- Many countries in the dropdown have no recipes in TheMealDB yet.
- An internet connection is needed for the TheMealDB recipes.
- Favorites are saved only in the browser you use.
