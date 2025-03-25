# Colocation Backend

## Technologies Used

- **Node.js**: Environnement d'exécution JavaScript
- **Express.js**: Framework web pour API RESTful
- **Firebase Admin SDK**: Services Firebase côté serveur
  - **Firestore**: Base de données NoSQL
  - **Auth**: Authentification
  - **Storage**: Stockage de fichiers
- **dotenv**: Pour la gestion des variables d'environnement

## Installation

```sh
# Clone the repository
git clone git@github.com:Colompykos/colocation-frontend.git

# Navigate to the project directory
cd colocation-backend

# Install dependencies
npm install

# Set up environment variables
# Download the required files from the following link:
# https://www.dropbox.com/scl/fo/5y5ehz5bc2788w7817bup/AMBi0MbA6eNgHFEu_1Jlumw?rlkey=etuica1ciyt4q3qvrbmn29m94&st=r3luonsd&dl=0
# - Place `serviceAccountKey.json` inside the `config` folder.
# - Place `.env` in the root directory of the backend.

# Run the development server
npm run dev

# For production
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Authenticate a user
- `GET /api/auth/verify` - Verify user token
- `POST /api/auth/admin/create` - Create admin user
- `GET /api/auth/logged-in` - Verify login status
- `GET /api/auth/check-status` - Check user account status

### Admin

- `GET /api/admin/check` - Verify admin status
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:userId/auth` - Delete user
- `POST /api/admin/users/:userId/toggle-block` - Block/unblock user
- `POST /api/admin/users/:userId/verify` - Verify user

### Listings

- `POST /api/listings` - Create a new listing
- `GET /api/listings` - Get all listings
- `GET /api/listings/:id` - Get a specific listing
- `PUT /api/listings/:id` - Update a listing
- `DELETE /api/listings/:id` - Delete a listing

### Users/Profiles

- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `POST /api/profile` - Create/update user profile
- `GET /api/users/:id` - Get a specific user's public profile

### Favorites

- `POST /api/favorites/toggle` - Toggle favorite status for a listing
- `GET /api/favorites/check/:listingId` - Check if listing is favorited
- `GET /api/favorites` - Get user's favorite listings
- `DELETE /api/favorites/:id` - Remove listing from favorites

### File Upload

- `POST /api/upload/profile` - Upload profile photo
- `POST /api/uploads` - Upload files (images) for listings

## Features

- **User Authentication**: Secure authentication using Firebase
- **User Verification**: Account verification system for listing privileges
- **Listing Management**: Create, read, update, and delete property listings
- **File Upload**: Support for image uploads for listings and user profiles
- **User Profiles**: Customizable user profiles
- **Favorites System**: Allow users to save and manage favorite listings
- **Admin Controls**: Administrative routes for managing content and users
    - **User verification**
    - **User blocking/unblocking**
    - **User deletion**
    - **User listing management**
