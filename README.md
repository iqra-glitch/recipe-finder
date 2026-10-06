# Recipe Finder

A simple recipe website. Search and browse recipes from [TheMealDB](https://www.themealdb.com/) free API, and explore 10 Pakistani recipes from my own Express API on Vercel.

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
- 10 Pakistani recipes with their own photos, served by my Node.js/Express API on Vercel and shown by the 🍛 Pakistani Food button or by choosing "Pakistan" in the country dropdown
- Loading, "no results" and error messages
- Mobile-friendly, compact header

## Built with

- HTML, CSS and JavaScript (no frameworks)
- [TheMealDB](https://www.themealdb.com/api.php) free API
- Google Fonts (Playfair Display and Poppins)
- Browser localStorage (for Favorites)
- My Node.js + Express API (`recipe-api`), hosted on [Vercel](https://recipe-api-three-cyan.vercel.app), for the Pakistani recipes

## Run locally

1. Download or clone this repository and open the folder in VS Code.
2. Install the **Live Server** extension, then right-click `index.html` and choose **Open with Live Server**.

Use Live Server rather than double-clicking `index.html`: the API only accepts requests from Live Server and the live demo, so a double-clicked page cannot load the Pakistani recipes.

If the API cannot be reached, the Pakistani recipes show "Couldn't reach the recipe server. Please try again later." (the rest of the site still works). The API address is set in `RECIPE_SERVER` at the top of `script.js`.

## Notes

- Pakistani recipes appear only through the 🍛 Pakistani Food button and the "Pakistan" country option, not in search or random recipes.
- Many countries in the dropdown have no recipes in TheMealDB yet.
- An internet connection is needed for the TheMealDB recipes.
- Favorites are saved only in the browser you use.
- The recipe server is hosted on Vercel (https://recipe-api-three-cyan.vercel.app), so the Pakistani recipes also work on the live demo.
