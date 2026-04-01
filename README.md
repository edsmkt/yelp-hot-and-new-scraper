# Yelp Hot & New Scraper

An Apify Actor that scrapes Yelp search results, including business details, ratings, reviews, and contact info. Uses [Scrape.do](https://scrape.do) as a proxy.

## Prerequisites

- An [Apify](https://apify.com) account
- A [Scrape.do](https://scrape.do) API key

## Installation

### Option 1: Deploy from GitHub

1. Go to [Apify Console](https://console.apify.com) and create a new Actor
2. In the **Source** tab, select **Git repository**
3. Paste this repo URL: `https://github.com/edsmkt/yelp-hot-and-new-scraper.git`
4. Click **Build** to build the Actor

### Option 2: Deploy via ZIP URL

1. Go to [Apify Console](https://console.apify.com)
2. Click **My Actors** in the top right, then click **Develop new**
3. Click **Browse all templates** and select **Empty JavaScript Project**
4. Name your Actor
5. Go to the **Code** tab, under **Source**
6. Change **Source type** to **Zip file**
7. Paste this URL in the **Zip file URL** input:
   ```
   https://github.com/edsmkt/yelp-hot-and-new-scraper/archive/refs/heads/main.zip
   ```
8. Click **Save** and then **Build**

### Option 3: Deploy via Apify CLI

```bash
git clone https://github.com/edsmkt/yelp-hot-and-new-scraper.git
cd yelp-hot-and-new-scraper
npm install
apify login
apify push
```

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `yelpUrl` | string | Yes | Full Yelp search URL |
| `scrapeDoApiKey` | string | Yes | Your Scrape.do API token |

### Example Input (Apify UI or JSON)

```json
{
  "yelpUrl": "https://www.yelp.com/search?find_desc=Head+Spa&find_loc=Ontario%2C+CA%2C+United+States&attrs=hottest_new_opening",
  "scrapeDoApiKey": "your-scrape-do-api-key"
}
```

### How to build the Yelp URL

1. Go to [yelp.com](https://www.yelp.com)
2. Search for a business type and location
3. Apply any filters (e.g. "Hot and New")
4. Copy the full URL from your browser's address bar

**Example URLs:**

- Hot & New spas in Ontario, CA: `https://www.yelp.com/search?find_desc=Head+Spa&find_loc=Ontario%2C+CA&attrs=hottest_new_opening`
- Plumbers in New York: `https://www.yelp.com/search?find_desc=plumber&find_loc=New+York`
- New restaurants in Austin: `https://www.yelp.com/search?find_desc=restaurants&find_loc=Austin%2C+TX&attrs=hottest_new_opening`

## Output

The Actor outputs an array of business objects to the default dataset.

### Output Fields

| Field | Type | Description |
|-------|------|-------------|
| `rank` | number | Position in search results |
| `name` | string | Business name |
| `alias` | string | Yelp business alias (URL slug) |
| `yelpUrl` | string | Full Yelp business page URL |
| `rating` | number | Star rating (1-5) |
| `reviewCount` | number | Total number of reviews |
| `priceRange` | string | Price range (e.g. "$", "$$", "$$$") |
| `categories` | string | Comma-separated business categories |
| `location` | string | Formatted address or neighborhood |
| `phone` | string | Phone number |
| `photoUrl` | string | URL of the first business photo |
| `reviewSnippet` | string | Short excerpt from a review |
| `isHotAndNew` | boolean | Whether the business has the "Hot and New" badge |
| `isSponsored` | boolean | Whether the listing is a paid ad |
| `responseTime` | string | Business response time (e.g. "Responds in about 10 minutes") |
| `recentRequests` | string | Recent request volume (e.g. "42 locals recently requested a quote") |
| `highlights` | string | Comma-separated business highlights |
| `badges` | string | Comma-separated badges (excluding Hot and New) |

### Example Output

```json
[
  {
    "rank": 1,
    "name": "Serenity Head Spa",
    "alias": "serenity-head-spa-ontario",
    "yelpUrl": "https://www.yelp.com/biz/serenity-head-spa-ontario",
    "rating": 4.5,
    "reviewCount": 23,
    "priceRange": "$$",
    "categories": "Head Spa, Massage",
    "location": "123 Main St, Ontario, CA 91764",
    "phone": "(909) 555-0123",
    "photoUrl": "https://s3-media0.fl.yelpcdn.com/bphoto/abc123/o.jpg",
    "reviewSnippet": "Amazing experience! The head spa treatment was so relaxing...",
    "isHotAndNew": true,
    "isSponsored": false,
    "responseTime": "Responds in about 10 minutes",
    "recentRequests": "42 locals recently requested a quote",
    "highlights": "Certified Professionals, Eco-Friendly Products",
    "badges": "Women-owned"
  }
]
```

## Running via API

```bash
curl -X POST "https://api.apify.com/v2/acts/YOUR_ACTOR_ID/runs?token=YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "yelpUrl": "https://www.yelp.com/search?find_desc=Head+Spa&find_loc=Ontario%2C+CA&attrs=hottest_new_opening",
    "scrapeDoApiKey": "your-scrape-do-api-key"
  }'
```

To fetch results after the run completes:

```bash
curl "https://api.apify.com/v2/acts/YOUR_ACTOR_ID/runs/last/dataset/items?token=YOUR_APIFY_TOKEN"
```

## Notes

- The scraper automatically paginates through all search results
- A 2-second delay is applied between pages to avoid rate limiting
- Sponsored/ad results are included but flagged with `isSponsored: true`
