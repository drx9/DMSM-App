import os
import pandas as pd
import requests
import time

# Use provided API key and cx
GOOGLE_API_KEY = 'AIzaSyDxIJneZ8qgkgKLsffP46EENI-EGOdnCEU'
GOOGLE_CSE_ID = '26096b0432aad4d65'

DEFAULT_IMAGE_URL = "https://via.placeholder.com/400x400?text=No+Image"
INPUT_FILE = '../data/products.xlsx'  # Change to your input file
OUTPUT_FILE = '../data/products_with_images_google.xlsx'
REVIEW_FILE = '../data/products_images_manual_review.csv'

# Google Custom Search API endpoint
SEARCH_URL = "https://www.googleapis.com/customsearch/v1"

# Automatically detect the header row containing 'Product Name'
preview = pd.read_excel(INPUT_FILE, header=None, nrows=20)
header_row_idx = None
for i, row in preview.iterrows():
    if any(isinstance(cell, str) and 'Product Name' in cell for cell in row):
        header_row_idx = i
        break
if header_row_idx is None:
    raise Exception('Could not find a header row containing "Product Name".')

# Read the file using the detected header row
print(f"Detected header row at Excel row {header_row_idx+1}")
df = pd.read_excel(INPUT_FILE, header=header_row_idx)
if 'Product Name' not in df.columns:
    raise Exception('Input file must have a "Product Name" column for product names.')


def fetch_image_url(query):
    params = {
        'q': query,
        'cx': GOOGLE_CSE_ID,
        'key': GOOGLE_API_KEY,
        'searchType': 'image',
        'num': 1,
        'imgType': 'photo',
        'safe': 'medium',
    }
    try:
        resp = requests.get(SEARCH_URL, params=params)
        if resp.status_code == 200:
            data = resp.json()
            items = data.get('items', [])
            if items:
                return items[0]['link']
        else:
            print(f"Google API error for '{query}': {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"Error fetching image for '{query}': {e}")
    return None


image_urls = []
image_sources = []
for idx, row in df.iterrows():
    product_name = str(row['Product Name'])
    image_url = fetch_image_url(product_name)
    if image_url:
        image_urls.append([image_url])
        image_sources.append('google')
    else:
        image_urls.append([DEFAULT_IMAGE_URL])
        image_sources.append('fallback')
    # Respect Google API rate limits
    time.sleep(1)

df['images'] = image_urls
df['image_source'] = image_sources

dataset_count = image_sources.count('google')
fallback_count = image_sources.count('fallback')
print(f"Products with Google images: {dataset_count}")
print(f"Products with fallback images: {fallback_count}")

# Save enriched file
print(f"Saving enriched file to {OUTPUT_FILE}")
df.to_excel(OUTPUT_FILE, index=False)

# Save manual review file for fallback images
review_df = df[df['image_source'] == 'fallback'][['Product Name', 'images']]
review_df.to_csv(REVIEW_FILE, index=False)
print(f"Saved manual review file to {REVIEW_FILE}")

print("Done!") 
