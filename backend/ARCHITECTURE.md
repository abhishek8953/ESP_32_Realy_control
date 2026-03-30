# Backend Architecture Documentation

## Overview
The backend has been reorganized into a modular, maintainable structure following industry best practices (MVC pattern with separation of concerns).

## Folder Structure

```
backend/
├── config/                 # Configuration files
│   └── firebase.js        # Firebase Admin SDK initialization
│
├── routes/                # API Route definitions
│   ├── auth.routes.js     # Authentication endpoints
│   ├── button.routes.js   # Button management endpoints
│   ├── relay.routes.js    # Relay control endpoints
│   └── cron.routes.js     # Cron job scheduling endpoints
│
├── controllers/           # Business logic & request handlers
│   ├── authController.js  # Auth logic (signup, login, token refresh, etc.)
│   ├── buttonController.js # Button management logic
│   ├── relayController.js # Relay control logic
│   └── cronController.js  # Cron job management logic
│
├── services/              # Services for complex operations
│   └── cronService.js     # Cron job scheduling & execution service
│
├── models/                # Database models (MongoDB)
│   ├── user.model.js
│   ├── buttonName.model.js
│   └── cronJob.model.js
│
├── middlewares/           # Custom middleware
│   └── auth.middleware.js # JWT verification middleware
│
├── utils/                 # Utility functions
│   ├── ApiError.js        # Custom API error class
│   ├── ApiResponse.js     # Standardized API response wrapper
│   └── AsyncHandler.js    # Async error handling wrapper
│
├── constants/             # Application constants
│   └── constants.js       # Enum values, default states, etc.
│
├── db/                    # Database connections
│   └── index.js           # MongoDB connection setup
│
├── app.js                 # Express app setup & route mounting
├── server.js              # Server entry point
└── package.json
```

## Key Components

### 1. **Config** (firebase.js)
- Initializes Firebase Admin SDK
- Exports `db` instance for Firebase Realtime Database access
- Centralized configuration management

### 2. **Routes**
Each route file handles specific features:

- **auth.routes.js**
  - `POST /v2/auth/sign-up` - User registration
  - `POST /v2/auth/log-in` - User login
  - `GET /v2/auth/refresh-token` - Refresh access token
  - `GET /v2/auth/current-user` (Protected) - Get current user
  - `POST /v2/auth/change-password` (Protected) - Change password
  - `GET /v2/auth/log-out` (Protected) - Logout

- **button.routes.js**
  - `POST /v2/buttons/set` (Protected) - Set button names
  - `GET /v2/buttons/get` (Protected) - Get button names

- **relay.routes.js**
  - `GET /v2/relays/health` - Get relay health status
  - `POST /v2/relays/update` - Update relay states

- **cron.routes.js**
  - `POST /v2/cron/create` - Create new cron job
  - `GET /v2/cron/:userId` - Get user's cron jobs
  - `PUT /v2/cron/:id` - Update cron job
  - `DELETE /v2/cron/:id` - Delete cron job

### 3. **Controllers**
Each controller contains the business logic for its feature:

- **authController.js** - User authentication logic
- **buttonController.js** - Button management logic
- **relayController.js** - Relay control logic
- **cronController.js** - Cron job CRUD operations

### 4. **Services**
Reusable service functions:

- **cronService.js**
  - `scheduleJob()` - Schedule a cron job
  - `deleteJob()` - Stop and delete a cron job
  - `loadJobsFromDB()` - Load all jobs on server startup
  - `executePin()` - Execute relay pin actions

### 5. **Utilities**
- **AsyncHandler** - Wraps async functions to catch errors automatically
- **ApiError** - Custom error class with status codes
- **ApiResponse** - Standardized response format

### 6. **Constants**
- `RELAY_STATES` - Default relay state values
- `BUTTON_TEMPLATE` - Default button structure

## Data Flow Example

### Authentication Flow:
```
Request → auth.routes.js → authController.js → User.model.js → Database
                         ↓
                Response (with tokens)
```

### Button Management Flow:
```
Request → button.routes.js → buttonController.js → UserButtonName.model.js → Database
                            ↓
                  Response (button data)
```

### Relay Control Flow:
```
Request → relay.routes.js → relayController.js → Firebase Realtime DB
                          ↓
                 Response (status)
```

### Cron Job Flow:
```
Request → cron.routes.js → cronController.js → cronService.js → CronJob.model.js
            ↓                                    ↓
         Database                      Node-cron scheduler
         
On Schedule → Execute Pin → Update Firebase
```

## How to Add a New Feature

1. **Create Route Handler** (`routes/featureName.routes.js`)
2. **Create Controller** (`controllers/featureNameController.js`)
3. **Create Service** if needed (`services/featureNameService.js`)
4. **Create/Update Model** (`models/featureName.model.js`)
5. **Import Route** in `app.js`: `app.use("/featureName", featureNameRoutes);`

## Error Handling

All endpoints use `asyncHandler` wrapper which automatically catches errors and passes them to Express error middleware. Errors are thrown using `ApiError` class:

```javascript
throw new ApiError(statusCode, message);
```

## Response Format

All successful responses follow this format:
```javascript
{
  statusCode: 200,
  data: {},
  message: "Success message",
  success: true
}
```

## Database Schema

### User
- fullName
- email (unique)
- password (hashed)
- macAddress
- refreshToken
- timestamps

### UserButtonName
- userId (reference to User)
- buttonName (array of button objects)

### CronJob
- userId (reference to User)
- pin (1-8)
- state ("ON" / "OFF")
- cronExpression (cron syntax)
- timestamps

## Environment Variables Required

```
project_id=<firebase-project-id>
private_key=<firebase-private-key>
client_email=<firebase-service-account-email>
databaseURL=<firebase-database-url>
REFRESH_TOKEN_SECRET=<secret-key>
MONGODB_URI=<mongodb-connection-string>
```

## Migration Notes

- All old inline routes have been moved to dedicated route files
- All old inline controllers have been moved to controller files
- Firebase configuration has been centralized in `config/firebase.js`
- Cron job logic has been moved to `services/cronService.js`
- Server initialization has been improved in `server.js`

## Benefits of This Structure

✅ **Maintainability** - Each feature is isolated and easy to find
✅ **Scalability** - Easy to add new features without cluttering existing code
✅ **Testability** - Controllers, services, and routes can be tested independently
✅ **Reusability** - Services can be shared across multiple routes
✅ **Organization** - Clear separation of concerns (Routes → Controllers → Services → Models)
✅ **Documentation** - Self-documenting code structure

