# WebSocket API for Real-Time Data Streams

## 1. Overview

Welcome to the real-time data streaming API. This API uses the WebSocket protocol to push low-latency market data and system metrics directly to your client applications. It is designed for high-frequency trading bots, real-time charting applications, data analysis platforms, and any service requiring immediate updates from the market.

Our WebSocket API provides a persistent, full-duplex communication channel over a single TCP connection, enabling the server to send data to the client without the client having to poll for it.

**Key Features:**

*   **Low Latency:** Data is pushed directly from our matching engine and metric systems.
*   **High Throughput:** Built to handle massive volumes of data across thousands of concurrent connections.
*   **Rich Data Channels:** Subscribe to a wide variety of data streams, including trades, order books, tickers, and candlesticks.
*   **Secure:** Connections are encrypted using TLS (WSS), and authentication is required for private channels.
*   **Reliable:** Features a heartbeat mechanism and sequence numbers to ensure connection health and data integrity.

## 2. Connection

### 2.1. Endpoint URL

The primary WebSocket endpoint for our production environment is:

`wss://api.example.com/v1/stream`

### 2.2. Connection Lifecycle

1.  **Establish Connection:** Your client initiates a WebSocket connection to the endpoint URL.
2.  **Authenticate (Optional but Recommended):** For access to private channels (e.g., account-specific data), send an `auth` message immediately after the connection is established. Public channels do not require authentication.
3.  **Subscribe:** Send `subscribe` messages to specify which data channels and symbols you are interested in.
4.  **Receive Data:** The server will start pushing event messages for your subscribed channels.
5.  **Maintain Connection:** Respond to server `ping` messages with a `pong` message to keep the connection alive.
6.  **Unsubscribe:** Send `unsubscribe` messages to stop receiving data from specific channels.
7.  **Disconnect:** Close the WebSocket connection when you are finished.

## 3. Message Format

All messages exchanged between the client and server are UTF-8 encoded JSON objects.

### 3.1. Client-to-Server Message (Commands)

Clients send commands to the server to manage subscriptions and the connection itself.

**General Structure:**

```json
{
  "op": "operation_name",
  "args": [ ... ],
  "req_id": "optional_request_id"
}
```

*   `op`: (String, Required) The operation to perform (e.g., `subscribe`, `unsubscribe`, `auth`, `pong`).
*   `args`: (Array, Required) An array of arguments for the operation. The structure depends on the `op`.
*   `req_id`: (String, Optional) A unique identifier for the request. The server will include this ID in its response message, allowing you to correlate responses with requests.

### 3.2. Server-to-Client Message (Events)

The server sends event messages containing system status updates or market data.

**General Structure:**

```json
{
  "event": "event_type",
  "channel": "channel_name",
  "data": { ... } or [ ... ],
  "req_id": "optional_request_id",
  "sequence": 123456789
}
```

*   `event`: (String, Required) The type of event (e.g., `update`, `snapshot`, `subscribed`, `error`).
*   `channel`: (String, Optional) The channel the message pertains to.
*   `data`: (Object or Array, Optional) The payload of the message.
*   `req_id`: (String, Optional) The request ID from the client's command, if this message is a direct response.
*   `sequence`: (Integer, Optional) A monotonically increasing sequence number for data messages on a specific channel. Use this to detect message loss.

## 4. Authentication

Authentication is required to access private data streams, such as user-specific orders, trades, and account metrics.

### 4.1. Auth Command

To authenticate, send an `auth` message immediately after connecting.

**Request:**

```json
{
  "op": "auth",
  "args": [
    "YOUR_API_KEY",
    "TIMESTAMP",
    "SIGNATURE"
  ],
  "req_id": "auth-123"
}
```

*   `args[0]`: Your public API Key.
*   `args[1]`: A UTC timestamp in milliseconds (e.g., `1672531200000`). The request is valid for 30 seconds from this timestamp.
*   `args[2]`: The signature. This is a HMAC-SHA256 hash of the string `timestamp + op` (e.g., `1672531200000auth`) using your API Secret as the key.

### 4.2. Auth Responses

**Success:**

The server will respond with an `auth` event indicating success.

```json
{
  "event": "auth",
  "status": "ok",
  "req_id": "auth-123"
}
```

**Failure:**

```json
{
  "event": "error",
  "message": "Authentication failed: Invalid signature",
  "code": 1001,
  "req_id": "auth-123"
}
```

## 5. Connection Management

### 5.1. Ping/Pong Heartbeat

The server will periodically send a `ping` message to check if the connection is still active. Your client must respond with a `pong` message as soon as possible. If a `pong` is not received within the timeout period (10 seconds), the server will terminate the connection.

**Server `ping`:**

```json
{
  "event": "ping",
  "timestamp": 1672531205000
}
```

**Client `pong` Response:**

```json
{
  "op": "pong",
  "args": [1672531205000]
}
```

The `args` array should contain the timestamp received in the `ping` message.

## 6. Public Data Channels

These channels provide public market data and do not require authentication.

### 6.1. Subscribing and Unsubscribing

**Subscribe Request:**

To subscribe, specify the `subscribe` operation and a list of channel strings in the `args`. A single request can subscribe to multiple channels.

```json
{
  "op": "subscribe",
  "args": [
    "trades:BTC-USD",
    "ticker:ETH-USD",
    "l2_orderbook:BTC-USD"
  ],
  "req_id": "sub-001"
}
```

**Unsubscribe Request:**

```json
{
  "op": "unsubscribe",
  "args": [
    "trades:BTC-USD"
  ],
  "req_id": "unsub-001"
}
```

**Subscription Response (Success):**

The server confirms each subscription individually.

```json
{
  "event": "subscribed",
  "channel": "trades:BTC-USD",
  "req_id": "sub-001"
}
```

**Subscription Response (Error):**

```json
{
  "event": "error",
  "message": "Subscription failed: Unknown channel 'foo:bar'",
  "code": 2001,
  "req_id": "sub-001"
}
```

### 6.2. Trades Channel

Streams real-time executed trades for a specific trading pair.

*   **Channel String:** `trades:{symbol}` (e.g., `trades:BTC-USD`)
*   **Events:** `update`

**Example `update` Message:**

```json
{
  "event": "update",
  "channel": "trades:BTC-USD",
  "sequence": 98765,
  "data": [
    {
      "trade_id": "t-a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
      "timestamp": "2023-10-27T10:00:05.123Z",
      "symbol": "BTC-USD",
      "side": "buy",
      "price": "34100.50",
      "size": "0.5"
    }
  ]
}
```

### 6.3. Ticker Channel

Provides 24-hour rolling window statistics for a trading pair. Updates are pushed every second.

*   **Channel String:** `ticker:{symbol}` (e.g., `ticker:ETH-USD`)
*   **Events:** `update`

**Example `update` Message:**

```json
{
  "event": "update",
  "channel": "ticker:ETH-USD",
  "sequence": 12345,
  "data": {
    "symbol": "ETH-USD",
    "timestamp": "2023-10-27T10:00:06.000Z",
    "last_price": "1785.22",
    "high_24h": "1805.00",
    "low_24h": "1750.10",
    "open_24h": "1765.45",
    "volume_24h": "150320.54",
    "price_change_24h": "19.77",
    "price_change_percent_24h": "1.12"
  }
}
```

### 6.4. Level 2 Order Book Channel

Provides a full view of the order book, streaming updates in real-time.

*   **Channel String:** `l2_orderbook:{symbol}` (e.g., `l2_orderbook:BTC-USD`)
*   **Events:** `snapshot`, `update`

Upon first subscribing, you will receive a `snapshot` event containing the current state of the order book. Subsequent messages will be `update` events, which contain only the price levels that have changed.

**Example `snapshot` Message:**

```json
{
  "event": "snapshot",
  "channel": "l2_orderbook:BTC-USD",
  "sequence": 55501,
  "data": {
    "symbol": "BTC-USD",
    "bids": [
      ["34000.50", "1.5"],
      ["34000.00", "2.0"]
    ],
    "asks": [
      ["34001.00", "0.8"],
      ["34001.50", "3.2"]
    ]
  }
}
```

**Example `update` Message:**

An update where the quantity at a price level changes. If the quantity becomes "0", the level should be removed from your local order book.

```json
{
  "event": "update",
  "channel": "l2_orderbook:BTC-USD",
  "sequence": 55502,
  "data": {
    "symbol": "BTC-USD",
    "bids": [
      ["34000.50", "1.2"],
      ["33999.50", "0.5"]
    ],
    "asks": [
      ["34001.00", "0.0"]
    ]
  }
}
```

### 6.5. Kline/Candlestick Channel

Streams candlestick data for various time intervals.

*   **Channel String:** `kline_{interval}:{symbol}` (e.g., `kline_1m:BTC-USD`)
*   **Supported Intervals:** `1m`, `5m`, `15m`, `1h`, `4h`, `1d`
*   **Events:** `update`

A message is sent at the end of each interval for the completed candlestick, and for the currently active candlestick with each new trade.

**Example `update` Message:**

```json
{
  "event": "update",
  "channel": "kline_1m:BTC-USD",
  "sequence": 8888,
  "data": {
    "start_time": "2023-10-27T10:01:00.000Z",
    "end_time": "2023-10-27T10:01:59.999Z",
    "symbol": "BTC-USD",
    "interval": "1m",
    "open": "34100.50",
    "high": "34115.00",
    "low": "34098.75",
    "close": "34112.25",
    "volume": "12.543",
    "is_final": false
  }
}
```
*   `is_final`: `false` if the candle is still active, `true` if it has closed.

## 7. Private Data Channels

These channels require authentication and provide user-specific data.

### 7.1. User Orders Channel

Streams updates about your own orders.

*   **Channel String:** `user_orders:{symbol}` or `user_orders:*` for all symbols.
*   **Events:** `update`

**Example `update` Message:**

```json
{
  "event": "update",
  "channel": "user_orders:BTC-USD",
  "data": {
    "order_id": "o-z9y8x7w6-v5u4-3210-t9s8-r7q6p5o4n3m2",
    "client_order_id": "my-btc-buy-001",
    "symbol": "BTC-USD",
    "side": "buy",
    "type": "limit",
    "status": "filled",
    "price": "34050.00",
    "size": "0.1",
    "filled_size": "0.1",
    "average_fill_price": "34049.80",
    "created_at": "2023-10-27T10:15:00.123Z",
    "updated_at": "2023-10-27T10:15:02.456Z"
  }
}
```

## 8. Best Practices

*   **Reconnection Logic:** Network issues can occur. Implement a robust client with automatic reconnection logic, preferably with an exponential backoff strategy to avoid spamming the server.
*   **Sequence Numbers:** For channels that provide them (`l2_orderbook`, `trades`, etc.), buffer incoming messages and check for gaps in the `sequence` number. If a gap is detected, you may need to re-fetch the state via the REST API or re-subscribe to get a fresh snapshot.
*   **Subscription Management:** Only subscribe to the channels you need. Maintaining subscriptions to unused channels consumes both client and server resources.
*   **Rate Limits:** There is a limit of 5 concurrent WebSocket connections per API key and 1000 total subscriptions across all connections for that key. Exceeding these limits will result in connection termination or subscription rejection.