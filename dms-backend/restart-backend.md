# Backend Restart and Test Guide

## Issues Fixed

1. **UUID Validation Errors** - Added proper UUID format validation to prevent database crashes
2. **Route Parameter Validation** - Added middleware to validate UUID format before processing requests
3. **Enhanced Error Handling** - Added specific error handling for UUID validation errors
4. **Better Logging** - Added detailed logging to track invalid requests

## Changes Made

### 1. Order Routes (`src/routes/orderRoutes.js`)
- Added UUID validation middleware before `/:id` route
- Prevents invalid UUIDs from reaching the database

### 2. Product Routes (`src/routes/productRoutes.js`)
- Added UUID validation middleware before `/:id` route
- Prevents invalid UUIDs from reaching the database

### 3. Controllers
- Enhanced `orderController.getOrderById()` with additional UUID validation
- Enhanced `productController.getProductById()` with additional UUID validation

### 4. Error Handler (`src/middleware/errorHandler.js`)
- Added specific handling for UUID validation errors
- Returns proper error messages instead of crashing

## Steps to Restart and Test

### 1. Restart the Backend
```bash
# If using Railway
railway up

# If using local development
cd dms-backend
npm start
```

### 2. Test the Fixes

#### Test Invalid UUID Requests:
```bash
# Test invalid order ID
curl -X GET "https://your-backend-url/api/orders/stats"
# Should return: {"message":"Invalid order ID format. Expected UUID format.","received":"stats"}

# Test invalid product ID
curl -X GET "https://your-backend-url/api/products/stats"
# Should return: {"message":"Invalid product ID format. Expected UUID format.","received":"stats"}
```

#### Test Valid UUID Requests:
```bash
# Test with a valid UUID (replace with actual UUID)
curl -X GET "https://your-backend-url/api/orders/123e4567-e89b-12d3-a456-426614174000"
# Should return order data or 404 if not found

curl -X GET "https://your-backend-url/api/products/123e4567-e89b-12d3-a456-426614174000"
# Should return product data or 404 if not found
```

### 3. Monitor Logs
```bash
# Check Railway logs
railway logs

# Or check your deployment platform logs
```

## Expected Behavior

### Before Fix:
- Invalid requests like `/api/orders/stats` would crash the database
- Error: `invalid input syntax for type uuid: "stats"`

### After Fix:
- Invalid requests return proper error messages
- Database remains stable
- Valid requests work normally

## What to Look For

### In Logs:
- Look for: `[getOrderById] Invalid UUID format: stats`
- Look for: `[getProductById] Invalid UUID format: stats`
- No more database crashes

### In Responses:
- Invalid UUIDs: 400 status with clear error message
- Valid UUIDs: Normal responses (200 or 404)

## If Issues Persist

1. **Check Route Ordering**: Ensure specific routes come before parameterized routes
2. **Verify Middleware**: Ensure UUID validation middleware is properly applied
3. **Database Connection**: Ensure database is properly connected
4. **Environment Variables**: Verify all required env vars are set

## Common Issues

1. **Route Conflicts**: Make sure `/stats` routes are defined before `/:id` routes
2. **Middleware Order**: Ensure validation middleware runs before controllers
3. **Database Permissions**: Ensure the database user has proper permissions

## Testing Checklist

- [ ] Invalid UUID requests return 400 status
- [ ] Valid UUID requests work normally
- [ ] No database crashes in logs
- [ ] Error messages are clear and helpful
- [ ] Frontend apps can still access valid endpoints

## Contact Support

If the backend still crashes after these fixes:
1. Check the exact error message in logs
2. Verify the request URL that's causing the issue
3. Ensure all environment variables are set correctly
4. Check if there are any other route conflicts 