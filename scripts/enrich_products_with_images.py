import os
import pandas as pd
import requests
import re
try:
    from rapidfuzz import process, fuzz
except ImportError:
    from rapidfuzz import fuzz, process

# Paths
PRODUCTS_XLSX = os.path.join('..', 'data', 'products.xlsx')
ENRICHED_XLSX = os.path.join('..', 'data', 'products_enriched.xlsx')
DATASET_CSV = os.path.join('..', 'data', 'external_grocery_dataset.csv')

# 1. Download dataset if not present (Open Food Facts India subset as example)
DATASET_URL = 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv'

# Backend upload config
BACKEND_URL = 'http://localhost:5000/api/products/bulk-upload'
PRODUCTS_API_URL = 'http://localhost:5000/api/products?limit=2000'
ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImExYjJjM2Q0LWU1ZjYtNzg5MC0xMjM0LTU2Nzg5MGFiY2RlZiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MDU4MTQ1OSwiZXhwIjoxNzUzMTczNDU5fQ.UHkxXsuZ01xW0X65XAt73DXBzYGLAEfKVFk8YlcMyM8'

# Backend-required columns
REQUIRED_COLS = [
    'name', 'description', 'price', 'discount', 'stock', 'images',
    'is_out_of_stock', 'is_active', 'category_id', 'created_by'
]

# Add this at the top of the script
DEFAULT_IMAGE_URL = "https://via.placeholder.com/400x400?text=No+Image"


def check_prerequisites():
    print('Checking prerequisites...')
    # Check data folder
    if not os.path.exists('../data'):
        raise FileNotFoundError('Missing ../data folder')
    # Check products.xlsx
    if not os.path.exists(PRODUCTS_XLSX):
        raise FileNotFoundError(f'Missing {PRODUCTS_XLSX}')
    print('All required files/folders are present.')
    # Check backend server
    try:
        r = requests.get('http://localhost:5000', timeout=5)
        print('Backend server is up.')
    except Exception as e:
        raise RuntimeError('Backend server is not reachable at http://localhost:5000')
    # Check bulk-upload endpoint
    try:
        r = requests.options(BACKEND_URL, timeout=5)
        if r.status_code in (200, 204, 400, 401):
            print('/api/products/bulk-upload endpoint is reachable.')
        else:
            raise RuntimeError('Bulk upload endpoint returned unexpected status code:', r.status_code)
    except Exception as e:
        raise RuntimeError('/api/products/bulk-upload endpoint is not reachable.')


def download_dataset():
    if not os.path.exists(DATASET_CSV):
        print('Downloading external grocery dataset...')
        r = requests.get(DATASET_URL, stream=True)
        with open(DATASET_CSV, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print('Download complete.')
    else:
        print('External dataset already present.')


def load_external_dataset():
    print('Loading external dataset...')
    df = pd.read_csv(DATASET_CSV, sep='\t', low_memory=False)
    # Use only relevant columns
    df = df[['product_name', 'image_url']].dropna(subset=['product_name', 'image_url'])
    return df


def map_columns(df):
    col_map = {}
    for required in REQUIRED_COLS:
        match, score, idx = process.extractOne(required, df.columns, scorer=fuzz.token_sort_ratio)
        if score > 80:
            col_map[required] = match
    return col_map


def load_products():
    print('Loading your products...')
    import openpyxl
    wb = openpyxl.load_workbook(PRODUCTS_XLSX)
    ws = wb.active
    print('First 10 rows of products.xlsx:')
    header_row = None
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        print(i, row)
        row_strs = [str(cell).strip().lower() if cell else '' for cell in row]
        if any('product name' in col or 'name' == col for col in row_strs):
            header_row = i
            break
        if i >= 9:
            break
    if header_row is None:
        raise ValueError('Could not find a header row with "Product Name" or similar in products.xlsx')
    print(f'Auto-detected header row: {header_row}')
    df = pd.read_excel(PRODUCTS_XLSX, header=header_row)
    # Remove sub-header rows (e.g., where Product Name is null or equals "Deal")
    df = df[df[df.columns[1]].notnull() & (df[df.columns[1]].astype(str).str.lower() != 'deal')]
    # Robust mapping for your columns
    # Name: Prefer 'Product Name', fallback to 'Code'
    if 'Product Name' in df.columns:
        df['name'] = df['Product Name']
    elif 'Code' in df.columns:
        df['name'] = df['Code']
    else:
        raise ValueError('No suitable column for product name found.')
    # Stock
    if 'Current Stock' in df.columns:
        df['stock'] = df['Current Stock']
    else:
        df['stock'] = 0
    # Price: Prefer 'Sales Price', fallback to 'M.R.P.', then 'Purchase Price'
    if 'Sales Price' in df.columns:
        df['price'] = df['Sales Price']
    elif 'M.R.P.' in df.columns:
        df['price'] = df['M.R.P.']
    elif 'Purchase Price' in df.columns:
        df['price'] = df['Purchase Price']
    else:
        df['price'] = 0.0
    # Description: Combine 'Company' and 'Manufacturer' if available, row-wise
    if 'Company' in df.columns and 'Manufacturer' in df.columns:
        df['description'] = df['Company'].astype(str) + ' | ' + df['Manufacturer'].astype(str)
    elif 'Company' in df.columns:
        df['description'] = df['Company'].astype(str)
    elif 'Manufacturer' in df.columns:
        df['description'] = df['Manufacturer'].astype(str)
    else:
        df['description'] = ''
    # Discount
    if 'Sales Scheme' in df.columns:
        df['discount'] = df['Sales Scheme']
    else:
        df['discount'] = 0.0
    # Images
    if 'images' not in df.columns:
        df['images'] = ''
    df['is_out_of_stock'] = df['stock'].astype(float) == 0
    df['is_active'] = True
    # category_id and created_by must be set by user or default
    DEFAULT_CATEGORY_ID = '11111111-1111-1111-1111-111111111111'
    DEFAULT_CREATED_BY = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
    if 'category_id' not in df.columns:
        df['category_id'] = DEFAULT_CATEGORY_ID
    if 'created_by' not in df.columns:
        df['created_by'] = DEFAULT_CREATED_BY
    print('Column mapping (robust): name, stock, price, description, discount, images, is_out_of_stock, is_active, category_id, created_by')
    return df


def enrich_products(products_df, external_df):
    print('Fuzzy matching and enriching...')
    external_names = external_df['product_name'].tolist()
    image_urls = []
    match_scores = []
    match_names = []
    low_confidence_rows = []
    for idx, row in products_df.iterrows():
        name = str(row.get('name') or row.get('Name') or '').strip()
        if not name:
            image_urls.append([])
            match_scores.append(0)
            match_names.append('')
            print(f'[NO NAME] Row {idx} skipped.')
            continue
        match, score, match_idx = process.extractOne(
            name, external_names, scorer=fuzz.token_sort_ratio
        )
        image_url = external_df.iloc[match_idx]['image_url']
        # Only assign if image_url is not invalid
        if '/invalid/' in str(image_url) or not str(image_url).strip():
            image_urls.append([])
            print(f'[NO VALID IMAGE] {name} → {match} (score: {score}) | Image: {image_url}')
        else:
            image_urls.append([image_url])
            print(f'[MATCH] {name} → {match} (score: {score}) | Image: {image_url}')
        match_scores.append(score)
        match_names.append(match)
        if score < 60 or '/invalid/' in str(image_url) or not str(image_url).strip():
            low_confidence_rows.append({
                'name': name,
                'matched_name': match,
                'score': score,
                'image_url': image_url
            })
    products_df['images'] = image_urls
    products_df['image_match_score'] = match_scores
    products_df['image_match_name'] = match_names
    # Output low-confidence matches for manual review
    if low_confidence_rows:
        import csv
        with open('../data/low_confidence_image_matches.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['name', 'matched_name', 'score', 'image_url'])
            writer.writeheader()
            writer.writerows(low_confidence_rows)
        print(f'Wrote low-confidence matches to ../data/low_confidence_image_matches.csv')

    # Instead of skipping low-confidence or invalid images, do:
    assigned_image = None
    if match_scores and match_scores[0] > 0:
        image_url = image_urls[0][0] if image_urls[0] else DEFAULT_IMAGE_URL
        if image_url and '/invalid/' not in image_url and image_url.strip() != '':
            assigned_image = image_url
    if assigned_image:
        products_df.at[idx, 'images'] = [assigned_image]
        products_df.at[idx, 'image_source'] = 'dataset'
    else:
        products_df.at[idx, 'images'] = [DEFAULT_IMAGE_URL]
        products_df.at[idx, 'image_source'] = 'fallback'

    # After enrichment, print a summary:
    dataset_count = (products_df['image_source'] == 'dataset').sum()
    fallback_count = (products_df['image_source'] == 'fallback').sum()
    print(f"Products with dataset images: {dataset_count}")
    print(f"Products with fallback images: {fallback_count}")

    return products_df


def is_valid_uuid(val):
    if not isinstance(val, str):
        return False
    return bool(re.match(r'^[0-9a-fA-F-]{36}$', val))


def save_enriched(products_df):
    # Try to find the name column (case-insensitive, common variants)
    possible_names = ['name', 'Name', 'product_name', 'Product Name', 'product', 'Product']
    found = None
    for col in products_df.columns:
        if col in possible_names or col.lower() in [n.lower() for n in possible_names]:
            found = col
            break
    if not found:
        raise ValueError(f"Could not find a product name column in your file. Columns: {list(products_df.columns)}")
    products_df['name'] = products_df[found]
    # Remove rows with missing or blank name
    products_df = products_df[products_df['name'].notnull() & (products_df['name'].astype(str).str.strip() != '')]

    # Data validation and cleaning
    required_fields = ['name', 'description', 'price', 'stock', 'category_id', 'created_by']
    before = len(products_df)
    for field in required_fields:
        if field not in products_df.columns:
            raise ValueError(f"Missing required field: {field}")
        products_df = products_df[products_df[field].notnull() & (products_df[field].astype(str).str.strip() != '')]
    # Convert price and stock to numeric
    products_df['price'] = pd.to_numeric(products_df['price'], errors='coerce')
    products_df['stock'] = pd.to_numeric(products_df['stock'], errors='coerce').fillna(0).round().astype(int)
    products_df['discount'] = pd.to_numeric(products_df['discount'], errors='coerce').fillna(0.0)
    products_df = products_df[products_df['price'].notnull() & products_df['stock'].notnull()]
    # Validate UUIDs
    products_df = products_df[products_df['category_id'].apply(is_valid_uuid)]
    products_df = products_df[products_df['created_by'].apply(is_valid_uuid)]
    after = len(products_df)
    print(f"Filtered out {before - after} rows due to missing/invalid required fields.")
    print('Sample row for upload:')
    print(products_df.head(1).to_dict())

    # Only keep columns expected by backend (excluding 'id' to let backend auto-generate)
    expected_cols = ['name', 'description', 'price', 'discount', 'stock', 'images', 'is_out_of_stock', 'is_active', 'category_id', 'created_by']
    products_df = products_df[[col for col in expected_cols if col in products_df.columns]]

    # Enforce correct types for backend
    if 'is_out_of_stock' in products_df.columns:
        products_df['is_out_of_stock'] = products_df['is_out_of_stock'].apply(lambda x: bool(int(x)) if str(x).isdigit() else bool(x))
    if 'is_active' in products_df.columns:
        products_df['is_active'] = products_df['is_active'].apply(lambda x: bool(int(x)) if str(x).isdigit() else bool(x))
    if 'price' in products_df.columns:
        products_df['price'] = products_df['price'].astype(float)
    if 'discount' in products_df.columns:
        products_df['discount'] = products_df['discount'].astype(float)
    if 'stock' in products_df.columns:
        products_df['stock'] = products_df['stock'].astype(int)

    print('Column types:')
    print(products_df.dtypes)
    if 'is_out_of_stock' in products_df.columns:
        print('Unique values for is_out_of_stock:', products_df['is_out_of_stock'].unique())
    if 'is_active' in products_df.columns:
        print('Unique values for is_active:', products_df['is_active'].unique())

    print(f'Saving enriched file to {ENRICHED_XLSX}')
    products_df.to_excel(ENRICHED_XLSX, index=False)
    print('Done!')

    # Save a single-row test file for manual backend testing if needed
    single_row_file = ENRICHED_XLSX.replace('.xlsx', '_single_row.xlsx')
    products_df.head(1).to_excel(single_row_file, index=False)
    print(f'Saved single-row test file to {single_row_file}')


def upload_to_backend():
    print(f'Uploading {ENRICHED_XLSX} to backend...')
    with open(ENRICHED_XLSX, 'rb') as f:
        files = {'file': (os.path.basename(ENRICHED_XLSX), f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        headers = {'Authorization': f'Bearer {ADMIN_TOKEN}'}
        response = requests.post(BACKEND_URL, files=files, headers=headers)
        print('Backend response:', response.status_code, response.text)
        if response.status_code != 200:
            raise RuntimeError('Bulk upload failed!')


def fetch_and_check_products(enriched_df):
    print('Fetching all products from backend for verification...')
    headers = {'Authorization': f'Bearer {ADMIN_TOKEN}'}
    r = requests.get(PRODUCTS_API_URL, headers=headers)
    if r.status_code != 200:
        print('Failed to fetch products from backend:', r.status_code, r.text)
        return
    backend_products = r.json().get('products', [])
    print(f'Fetched {len(backend_products)} products from backend.')
    # Build lookup by name (case-insensitive)
    backend_lookup = {str(p['name']).strip().lower(): p for p in backend_products}
    total = len(enriched_df)
    matched = 0
    image_matched = 0
    mismatches = []
    for idx, row in enriched_df.iterrows():
        name = str(row.get('name') or row.get('Name') or '').strip()
        images = row.get('images')
        if isinstance(images, list):
            img_url = images[0] if images else ''
        elif isinstance(images, str):
            img_url = images.split(',')[0] if images else ''
        else:
            img_url = ''
        backend = backend_lookup.get(name.lower())
        if backend:
            matched += 1
            backend_img = ''
            if isinstance(backend.get('images'), list):
                backend_img = backend['images'][0] if backend['images'] else ''
            elif isinstance(backend.get('images'), str):
                backend_img = backend['images'].split(',')[0] if backend['images'] else ''
            if img_url == backend_img:
                image_matched += 1
            else:
                mismatches.append({'name': name, 'expected': img_url, 'backend': backend_img})
        else:
            mismatches.append({'name': name, 'expected': img_url, 'backend': None})
    print(f'\nVerification Summary:')
    print(f'Total products in enriched file: {total}')
    print(f'Products found in backend: {matched}')
    print(f'Products with correct image: {image_matched}')
    print(f'Products with image mismatch or not found: {len(mismatches)}')
    if mismatches:
        print('\nSample mismatches:')
        for m in mismatches[:10]:
            print(m)
    print('\nAll checks complete.')


def main():
    check_prerequisites()
    download_dataset()
    external_df = load_external_dataset()
    products_df = load_products()
    enriched_df = enrich_products(products_df, external_df)
    save_enriched(enriched_df)
    upload_to_backend()
    fetch_and_check_products(enriched_df)


if __name__ == '__main__':
    main() 
