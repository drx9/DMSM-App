# Delivery App API Endpoints

## Base URL
```
https://dmsm-app-production-a35d.up.railway.app/api
```

## Authentication
All delivery endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Available Endpoints

### 1. Get Assigned Orders
**GET** `/delivery/orders`

Returns all orders assigned to the authenticated delivery boy.

**Response:**
```json
[
  {
    "id": "uuid",
    "status": "processing",
    "paymentStatus": "paid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "customer": {
      "name": "John Doe",
      "phoneNumber": "1234567890"
    },
    "shippingAddress": {
      "line1": "123 Main St",
      "line2": "Apt 4B",
      "city": "Nalbari",
      "state": "Assam",
      "pincode": "781301"
    },
    "products": [
      {
        "name": "Product Name",
        "quantity": 2,
        "image": "image_url"
      }
    ],
    "totalAmount": 299.99
  }
]
```

### 2. Get Order Details
**GET** `/delivery/orders/:orderId`

Returns detailed information about a specific order assigned to the delivery boy.

**Response:** Same structure as above, but for a single order.

### 3. Update Order Status
**PUT** `/delivery/orders/:orderId/status`

Updates the status of an assigned order.

**Request Body:**
```json
{
  "status": "out_for_delivery"
}
```

**Available Statuses:**
- `pending` - Order is pending
- `processing` - Order is being processed
- `packed` - Order is packed and ready
- `out_for_delivery` - Order is out for delivery
- `delivered` - Order has been delivered
- `cancelled` - Order has been cancelled

**Response:**
```json
{
  "message": "Order status updated",
  "status": "out_for_delivery"
}
```

### 4. Get Delivery History
**GET** `/delivery/orders/history?period=<period>`

Returns delivery history with statistics for the authenticated delivery boy.

**Query Parameters:**
- `period`: `today`, `week`, `month`, or `all` (default: `week`)

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "status": "delivered",
      "totalAmount": 299.99,
      "shippingAddress": {...},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "stats": {
    "totalOrders": 25,
    "totalEarnings": 7499.75,
    "averageDeliveryTime": 30
  }
}
```

### 5. Get Delivery Metrics
**GET** `/delivery/metrics`

Returns performance metrics for the authenticated delivery boy.

**Response:**
```json
{
  "totalOrders": 25,
  "totalKms": 150.5,
  "payout": 1250
}
```

## Real-time Updates

The app uses WebSocket connections for real-time updates:

**Socket URL:** `https://dmsm-app-production-a35d.up.railway.app`

**Events:**
- `assigned_order` - New order assigned
- `order_status_update` - Order status changed

**Room:** `user_<deliveryBoyId>`

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "message": "Error description"
}
```

## Usage Examples

### Fetching Orders
```typescript
const response = await axios.get(`${API_URL}/delivery/orders`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Updating Order Status
```typescript
const response = await axios.put(
  `${API_URL}/delivery/orders/${orderId}/status`,
  { status: 'out_for_delivery' },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Getting History
```typescript
const response = await axios.get(
  `${API_URL}/delivery/orders/history?period=week`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

## Notes

1. **Coordinates**: If shipping address doesn't have coordinates, the app defaults to Nalbari coordinates (26.1833, 91.7333)
2. **Distance Calculation**: Uses Haversine formula for calculating distances between coordinates
3. **Status Flow**: Orders follow a specific status progression: pending → processing → packed → out_for_delivery → delivered
4. **Authentication**: Token is obtained during login and stored in AsyncStorage
5. **Real-time**: WebSocket connections are automatically managed for live updates
