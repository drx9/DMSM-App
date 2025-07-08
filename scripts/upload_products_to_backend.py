import requests
import pandas as pd
import time
import math
# import openpyxl  # Only needed if used elsewhere in the script
import sys
import os

BACKEND_URL = 'http://localhost:5000/api/products/bulk-upload'
GET_PRODUCTS_URL = 'http://localhost:5000/api/products'
DELETE_PRODUCT_URL = 'http://localhost:5000/api/products/{}'
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN')  # Set your admin token as env variable
FILE_PATH = '../data/products.xlsx'
DROPPED_FILE = '../data/products_dropped_missing_name_or_category.xlsx'
DEFAULT_CATEGORY_ID = '11111111-1111-1111-1111-111111111111'
FALLBACK_IMAGE = 'https://via.placeholder.com/400x400?text=No+Image'

headers = {'Authorization': f'Bearer {ADMIN_TOKEN}'} if ADMIN_TOKEN else {}

# Clean Excel file: fill NaN in required fields
print('Cleaning Excel file...')
df = pd.read_excel(FILE_PATH)
if 'Current Stock' in df.columns:
    df['Current Stock'] = df['Current Stock'].fillna(0).astype(int)
if 'Sales Price' in df.columns:
    df['Sales Price'] = df['Sales Price'].fillna(0).astype(float)
if 'discount' in df.columns:
    df['discount'] = df['discount'].fillna(0).astype(float)

# Ensure 'name' column exists and is filled from 'Product Name' if needed
if 'name' not in df.columns and 'Product Name' in df.columns:
    df['name'] = df['Product Name']

# Drop rows where 'name' is missing or blank
if 'name' in df.columns:
    before = len(df)
    dropped_name = df[df['name'].isna() | (df['name'].astype(str).str.strip() == '')]
    df = df[~(df['name'].isna() | (df['name'].astype(str).str.strip() == ''))]
    after = len(df)
    print(f"Dropped {before - after} rows with missing/blank name.")
else:
    print("Warning: 'name' column not found!")
    dropped_name = pd.DataFrame()

# Ensure 'category_id' column exists and fill missing/blank with default
if 'category_id' not in df.columns:
    print("'category_id' column not found, adding with default value.")
    df['category_id'] = DEFAULT_CATEGORY_ID
else:
    missing_cat = df['category_id'].isna() | (df['category_id'].astype(str).str.strip() == '')
    num_missing = missing_cat.sum()
    if num_missing > 0:
        print(f"Filling {num_missing} missing/blank category_id values with default.")
        df.loc[missing_cat, 'category_id'] = DEFAULT_CATEGORY_ID

# Ensure 'images' column is a comma-separated string and skip fallback/empty images
if 'images' in df.columns:

    def images_to_str(x):
        if isinstance(x, list):
            urls = [str(i) for i in x if pd.notna(i) and i != FALLBACK_IMAGE and i.strip() != '']
            return ','.join(urls)
        if pd.isna(x):
            return ''
        # If it's a string representation of a list, try to eval safely
        if isinstance(x, str) and x.startswith('[') and x.endswith(']'):
            try:
                import ast
                l = ast.literal_eval(x)
                if isinstance(l, list):
                    urls = [str(i) for i in l if pd.notna(i) and i != FALLBACK_IMAGE and i.strip() != '']
                    return ','.join(urls)
            except Exception:
                pass
        # If it's a comma-separated string, filter out fallback/empty
        urls = [i for i in str(x).split(',') if i.strip() != '' and i != FALLBACK_IMAGE]
        return ','.join(urls)

    df['images'] = df['images'].apply(images_to_str)

    # Print a sample of the images column
    sample_images = df['images'][df['images'].str.strip() != ''].head(10)
    print('\nSample of non-empty images column:')
    print(sample_images.to_string(index=False))
    if sample_images.empty:
        print('\nWARNING: All images are empty or fallback. No real image URLs will be uploaded.')
else:
    print("Warning: 'images' column not found!")

# Save dropped rows for review (only those with missing/blank name)
if not dropped_name.empty:
    dropped_name.to_excel(DROPPED_FILE, index=False)
    print(f"Saved dropped rows to {DROPPED_FILE}")

df.to_excel(FILE_PATH, index=False)


def delete_all_products():
    print('Fetching all products to delete...')
    page = 1
    while True:
        resp = requests.get(GET_PRODUCTS_URL, headers=headers, params={'page': page, 'limit': 100})
        if resp.status_code != 200:
            print(f'Failed to fetch products on page {page}:', resp.status_code, resp.text)
            break
        data = resp.json()
        products = data.get('products', [])
        if not products:
            break
        for prod in products:
            prod_id = prod.get('id')
            if prod_id:
                del_resp = requests.delete(DELETE_PRODUCT_URL.format(prod_id), headers=headers)
                if del_resp.status_code == 200:
                    print(f"Deleted product {prod['name']} (id={prod_id})")
                else:
                    print(f"Failed to delete product {prod['name']} (id={prod_id}): {del_resp.text}")
        if len(products) < 100:
            break
        page += 1
    print('All products deleted.')


def upload_products():
    print('Reading products from Excel...')
    df = pd.read_excel(FILE_PATH)
    # Map columns to required fields, skip images
    products = []
    for _, row in df.iterrows():
        product = {
            'name': row.get('name') or row.get('Product Name'),
            'description': row.get('description') or row.get('Description', ''),
            'price': float(row.get('price') or row.get('Price', 0)),
            'discount': float(row.get('discount') or row.get('Discount', 0)),
            'stock': int(row.get('stock') or row.get('Stock', 0)),
            'isOutOfStock': row.get('isOutOfStock') == True or str(row.get('isOutOfStock')).upper() == 'TRUE' or row.get('stock', 0) == 0 or row.get('Stock', 0) == 0,
            'isActive': row.get('isActive', True) != False and str(row.get('isActive', 'TRUE')).upper() != 'FALSE',
            'categoryId': row.get('categoryId') or row.get('category_id') or row.get('CategoryId'),
            'createdBy': row.get('createdBy') or row.get('created_by'),
            # 'images': []  # Skip images
        }
        products.append(product)
    print(f'Uploading {len(products)} products...')
    resp = requests.post(BACKEND_URL, json=products, headers=headers)
    if resp.status_code == 200:
        print('Products uploaded successfully.')
    else:
        print('Failed to upload products:', resp.status_code, resp.text)


def main():
    delete_all_products()
    upload_products()


if __name__ == '__main__':
    main()


def find_header_row_and_read_data(excel_path):
    # Use openpyxl to find the header row
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    ws = wb.active
    header_row_idx = None
    headers = []
    for i, row in enumerate(ws.iter_rows(values_only=True), 1):
        if row and any(str(cell).strip().lower() == 'product name' for cell in row):
            header_row_idx = i
            headers = [str(cell).strip() if cell else '' for cell in row]
            break
    if header_row_idx is None:
        raise ValueError('Header row with "Product Name" not found!')
    # Read data into DataFrame
    data = list(ws.iter_rows(min_row=header_row_idx + 1, values_only=True))
    df = pd.DataFrame(data, columns=headers)
    return df


def update_existing_product_price_discount(excel_path, backend_url, token):
    print(f"Updating price and discount for existing products using {excel_path}...")
    df = find_header_row_and_read_data(excel_path)
    df['name_clean'] = df['Product Name'].astype(str).str.strip().str.lower()
    name_to_data = {}
    for _, row in df.iterrows():
        name_clean = str(row['Product Name']).strip().lower()
        # Price logic: use Sales Price
        price = row.get('Sales Price')
        if pd.isna(price) or price == 0:
            price = row.get('M.R.P.')
        if pd.isna(price):
            price = 0
        # Discount logic
        mrp = row.get('M.R.P.')
        salesprice = row.get('Sales Price')
        try:
            if not pd.isna(mrp) and not pd.isna(salesprice) and mrp:
                discount = round(((mrp - salesprice) / mrp) * 100, 2)
            else:
                discount = 0
        except Exception:
            discount = 0
        name_to_data[name_clean] = {
            'price': float(price) if not pd.isna(price) else 0,
            'discount': float(discount) if not pd.isna(discount) else 0
        }
    resp = requests.get(f"{backend_url}/api/products", headers={"Authorization": f"Bearer {token}"})
    if resp.status_code == 401:
        print("ERROR: Invalid or expired token. Please update ADMIN_TOKEN.")
        return
    resp.raise_for_status()
    products = resp.json().get('products', resp.json())
    updated, skipped = 0, 0
    for prod in products:
        name_clean = prod['name'].strip().lower()
        prod_id = prod['id']
        if name_clean in name_to_data:
            data = name_to_data[name_clean]
            payload = {
                'price': data['price'],
                'discount': data['discount']
            }
            put_resp = requests.put(
                f"{backend_url}/api/products/{prod_id}",
                json=payload,
                headers={"Authorization": f"Bearer {token}"}
            )
            if put_resp.status_code == 200:
                updated += 1
            else:
                print(f"Failed to update product {prod['name']} (id={prod_id}): {put_resp.text}")
        else:
            skipped += 1
        time.sleep(0.05)
    print(f"Price/discount update complete. Updated: {updated}, Skipped: {skipped}")


def check_admin_token_valid(backend_url, token):
    """Check if the admin token is valid by calling a protected endpoint."""
    try:
        resp = requests.get(f"{backend_url}/api/products", headers={"Authorization": f"Bearer {token}"}, params={"limit": 1})
        if resp.status_code == 401:
            print("ERROR: Invalid or expired admin token. Please update ADMIN_TOKEN in the script.")
            sys.exit(1)
        elif resp.status_code != 200:
            print(f"WARNING: Unexpected response when checking token: {resp.status_code} {resp.text}")
        else:
            print("Admin token is valid.")
    except Exception as e:
        print(f"ERROR: Could not check admin token validity: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Check admin token validity before any authenticated actions
    check_admin_token_valid(backend_url="http://localhost:5000", token=ADMIN_TOKEN)
    # After upload, update price and discount for all products
    update_existing_product_price_discount(
        excel_path=FILE_PATH,
        backend_url="http://localhost:5000",
        token=ADMIN_TOKEN
    ) 
