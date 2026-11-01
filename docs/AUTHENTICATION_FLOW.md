# FreelanceHub — Authentication Flow

## 1. Introduction

Authentication is one of the most important parts of FreelanceHub.

It ensures that users can securely create accounts, log in, access protected features, and perform actions based on their roles.

FreelanceHub supports three user roles:

1. Client
2. Freelancer
3. Admin

The authentication system is built using:

- React.js — Frontend authentication interface.
- Node.js — Backend runtime.
- Express.js — Authentication API routes.
- MongoDB — User account storage.
- Mongoose — Database models.
- bcrypt — Password hashing.
- JSON Web Token (JWT) — Authentication token.
- HTTP-only Cookies — Secure token storage and transport.
- Axios — Frontend API communication.

### Main Authentication Features

- User registration.
- User login.
- User logout.
- User profile retrieval.
- Authentication persistence.
- Role-based authorization.
- Protected routes.
- Email verification.
- Forgot password.
- Reset password.
- Account status management.

---

## 2. Authentication Architecture

FreelanceHub uses a frontend-backend authentication architecture.

The React frontend collects user information and sends authentication requests to the Express backend.

The backend validates credentials, communicates with MongoDB, generates authentication tokens, and sends appropriate responses.

### Authentication Architecture Diagram

```text
             USER
               |
               v
        REACT FRONTEND
               |
               |
        AXIOS API REQUEST
               |
               v
        EXPRESS BACKEND
               |
               v
       AUTHENTICATION ROUTES
               |
               v
       AUTHENTICATION CONTROLLER
               |
               v
        USER MODEL / MONGODB
               |
               v
       VERIFY USER CREDENTIALS
               |
               v
         GENERATE JWT TOKEN
               |
               v
       SET HTTP-ONLY COOKIE
               |
               v
       SEND RESPONSE TO FRONTEND
               |
               v
       UPDATE AUTHENTICATION STATE
```

---

## 3. User Roles

FreelanceHub has three main user roles.

### 3.1 Client

A client is a user who wants to hire freelancers.

Client permissions:

- Create and manage jobs.
- Browse freelancer profiles.
- View proposals received for their jobs.
- Accept or reject proposals.
- Create and manage contracts.
- Manage milestones.
- Communicate with hired freelancers.
- Make payments.
- Submit reviews.
- Raise disputes when permitted.

### 3.2 Freelancer

A freelancer is a user who provides services.

Freelancer permissions:

- Create and manage a professional profile.
- Add skills and portfolio items.
- Browse available jobs.
- Submit proposals.
- Manage submitted proposals.
- Communicate with clients.
- View contracts.
- Complete milestones.
- Submit deliverables.
- Track payments and payouts.
- Review clients.
- Raise disputes when permitted.

### 3.3 Admin

An admin manages the platform.

Admin permissions:

- View users.
- Manage user accounts.
- Moderate jobs.
- Review reports.
- Manage disputes.
- Monitor platform activity.
- Suspend or deactivate accounts when authorized.

Admin accounts must not be created through ordinary public registration. They should be provisioned through a secure administrative process.

---

## 4. User Registration Flow

Registration allows a new client or freelancer to create an account.

### Registration Steps

1. User opens the registration page.
2. User enters their name, email, password, and account role.
3. Frontend validates the form.
4. Frontend sends the registration request to the backend.
5. Backend validates the submitted information.
6. Backend checks whether the email already exists.
7. Backend hashes the password.
8. Backend creates a new user in MongoDB.
9. Backend sends a successful registration response.
10. If email verification is enabled, the user receives a verification email.
11. The user verifies their email.
12. The user can log in according to the account verification policy.

### Registration Flow Diagram

```text
          USER
            |
            v
      REGISTER PAGE
            |
            v
      ENTER DETAILS
            |
            v
      FRONTEND VALIDATION
            |
            v
      POST /auth/register
            |
            v
      BACKEND VALIDATION
            |
            v
      CHECK EXISTING EMAIL
            |
            v
      HASH PASSWORD
            |
            v
      CREATE USER IN MONGODB
            |
            v
      SEND REGISTRATION RESPONSE
            |
            v
      EMAIL VERIFICATION
            |
            v
      ACCOUNT READY FOR LOGIN
```

### Registration API

```http
POST /api/v1/auth/register
```

Example request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword123!",
  "role": "freelancer"
}
```

Example successful response:

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "id": "USER_ID",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "freelancer",
      "isEmailVerified": false
    }
  }
}
```

The password must never be included in the response.

The backend must also prevent users from registering themselves as admins.

---

## 5. Password Hashing

Passwords must never be stored in plain text.

FreelanceHub uses bcrypt to hash passwords before storing them in MongoDB.

### Password Hashing Flow

```text
USER PASSWORD
      |
      v
BACKEND RECEIVES PASSWORD
      |
      v
BCRYPT HASHING
      |
      v
HASHED PASSWORD
      |
      v
SAVE IN MONGODB
```

Example:

```javascript
import bcrypt from "bcrypt";

const saltRounds = 12;

const hashedPassword = await bcrypt.hash(
  password,
  saltRounds
);
```

During login, the backend compares the submitted password with the stored hash.

```javascript
const isPasswordValid = await bcrypt.compare(
  enteredPassword,
  user.password
);
```

The original password is never retrieved from the hash.

---

## 6. User Login Flow

Login allows an existing user to access their account.

### Login Steps

1. User opens the login page.
2. User enters their email and password.
3. Frontend validates the form.
4. Frontend sends a login request.
5. Backend finds the user using their email.
6. Backend checks account status and verification requirements.
7. Backend compares the submitted password with the stored password hash.
8. Backend generates an authentication token.
9. Backend sets the token in a secure HTTP-only cookie.
10. Backend sends user information to the frontend.
11. Frontend updates authentication state.
12. User is redirected to the appropriate dashboard.

### Login Flow Diagram

```text
          USER
            |
            v
        LOGIN PAGE
            |
            v
      ENTER EMAIL AND PASSWORD
            |
            v
      POST /auth/login
            |
            v
      FIND USER IN MONGODB
            |
            v
      CHECK ACCOUNT STATUS
            |
            v
      VERIFY PASSWORD
            |
            v
      GENERATE JWT TOKEN
            |
            v
      SET SECURE HTTP-ONLY COOKIE
            |
            v
      RETURN USER INFORMATION
            |
            v
      UPDATE AUTH CONTEXT
            |
            v
      REDIRECT TO DASHBOARD
```

### Login API

```http
POST /api/v1/auth/login
```

Example request:

```json
{
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```

Example successful response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "USER_ID",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "freelancer"
    }
  }
}
```

The JWT token is sent using the HTTP-only cookie and is not exposed in the JSON response.

---

## 7. JWT Authentication

JWT stands for JSON Web Token.

It is used to identify an authenticated user when making protected API requests.

### JWT Structure

A JWT consists of three parts:

1. Header
2. Payload
3. Signature

### Example JWT Payload

```json
{
  "sub": "USER_ID",
  "role": "freelancer",
  "iat": 1700000000,
  "exp": 1700003600
}
```

The payload should contain only necessary information.

Never store passwords, payment details, or sensitive personal information inside a JWT.

### Token Generation Example

```javascript
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );
};
```

The token expiration and refresh strategy must be configured consistently with the chosen authentication implementation.

---

## 8. Secure Cookie Storage

FreelanceHub uses HTTP-only cookies to transport authentication tokens.

The browser stores the cookie, but frontend JavaScript cannot directly read an HTTP-only cookie.

### Cookie Configuration

Example:

```javascript
res.cookie("accessToken", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 1000,
  path: "/"
});
```

Important cookie settings:

| Setting | Purpose |
|---|---|
| httpOnly | Prevents JavaScript from reading the cookie |
| secure | Sends the cookie only over HTTPS in production |
| sameSite | Helps control cross-site cookie requests |
| maxAge | Defines the cookie lifetime |
| path | Defines the cookie path |

If the frontend and backend are deployed on different sites, cookie configuration may require `SameSite=None` and `Secure=true`, along with appropriate CSRF protection.

Cookie settings must match the deployment environment.

---

## 9. Authentication Middleware

Authentication middleware protects private API endpoints.

Whenever a user requests a protected resource, the middleware checks the authentication cookie and verifies the JWT.

### Authentication Middleware Flow

```text
       API REQUEST
            |
            v
       AUTH MIDDLEWARE
            |
            v
       READ AUTH COOKIE
            |
            v
       VERIFY JWT
            |
            v
       FIND USER IN DATABASE
            |
            v
       CHECK ACCOUNT STATUS
            |
            v
       ATTACH USER TO REQUEST
            |
            v
       CONTINUE TO CONTROLLER
```

If authentication fails, the backend returns an unauthorized response.

### Example Authentication Middleware

```javascript
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.sub)
      .select("-password");

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive account"
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication"
    });
  }
};
```

This is an illustrative implementation. The actual middleware should match the final User schema, token strategy, and account status fields.

---

## 10. Role-Based Authorization

Authentication verifies who the user is.

Authorization verifies what the user is allowed to do.

FreelanceHub uses role-based access control.

### Role-Based Authorization Flow

```text
       AUTHENTICATED USER
               |
               v
       ROLE MIDDLEWARE
               |
               v
       CHECK USER ROLE
               |
       +-------+-------+
       |       |       |
       v       v       v
     CLIENT FREELANCER ADMIN
       |       |       |
       v       v       v
    CLIENT   FREELANCER ADMIN
    ROUTES   ROUTES   ROUTES
```

### Example Role Middleware

```javascript
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission"
      });
    }

    next();
  };
};
```

### Example Usage

Only clients can create jobs:

```javascript
router.post(
  "/",
  protect,
  authorize("client"),
  createJob
);
```

Only admins can access administrative operations:

```javascript
router.get(
  "/users",
  protect,
  authorize("admin"),
  getAllUsers
);
```

Both authentication and authorization are required for protected operations.

Resource ownership must also be checked. For example, a client must not be allowed to edit another client's job merely because they have the client role.

---

## 11. Frontend Authentication State

React needs to know whether the user is logged in and which role the user has.

FreelanceHub uses React Context API to manage authentication state.

### AuthContext Responsibilities

- Store the current user information.
- Track authentication loading state.
- Check the current login session.
- Handle login.
- Handle registration.
- Handle logout.
- Expose authentication information to components.

### Example AuthContext Structure

```javascript
{
  user: null,
  isAuthenticated: false,
  loading: true,
  login: function,
  register: function,
  logout: function,
  checkAuth: function
}
```

### Authentication Context Flow

```text
       REACT APPLICATION
               |
               v
          AUTH PROVIDER
               |
               v
       CHECK AUTHENTICATION
               |
               v
       GET /auth/me
               |
               v
       BACKEND VERIFIES COOKIE
               |
               v
       RETURN USER INFORMATION
               |
               v
       UPDATE AUTH CONTEXT
               |
               v
       DISPLAY AUTHENTICATED UI
```

The frontend should not treat a locally stored role or user object as proof of authentication. The backend remains the authority.

---

## 12. Check Current Logged-In User

When the application loads or refreshes, the frontend needs to check whether the user has a valid session.

FreelanceHub uses the following endpoint:

```http
GET /api/v1/auth/me
```

### Flow

1. User opens the application.
2. React initializes the authentication context.
3. Frontend requests `/auth/me`.
4. Browser automatically sends the authentication cookie when cookie settings permit.
5. Backend verifies the token.
6. Backend retrieves the user.
7. Backend returns safe user information.
8. React updates authentication state.

If the session is invalid or expired, the frontend displays the logged-out interface.

---

## 13. Protected Frontend Routes

Protected routes prevent unauthenticated users from accessing private pages.

### Example

A user must be authenticated to access the dashboard.

A freelancer must be a freelancer to access freelancer-specific pages.

### Protected Route Flow

```text
          USER OPENS PAGE
                 |
                 v
        CHECK AUTHENTICATION
                 |
          +------+------+
          |             |
          v             v
      LOGGED IN      NOT LOGGED IN
          |             |
          v             v
      CHECK ROLE     LOGIN PAGE
          |
     +----+----+
     |         |
     v         v
 ROLE MATCH  ROLE MISMATCH
     |         |
     v         v
 ALLOW PAGE  FORBIDDEN PAGE
```

### Example Protected Route

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

Frontend route protection improves navigation and user experience.

It is not a replacement for backend authorization.

---

## 14. Dashboard Redirection

After successful login, users should be redirected according to their role.

### Role-Based Dashboard Flow

```text
         LOGIN SUCCESSFUL
                |
                v
          CHECK USER ROLE
                |
       +--------+--------+
       |        |        |
       v        v        v
     CLIENT FREELANCER  ADMIN
       |        |        |
       v        v        v
   CLIENT   FREELANCER  ADMIN
 DASHBOARD  DASHBOARD  DASHBOARD
```

Example:

```javascript
const getDashboardPath = (role) => {
  switch (role) {
    case "client":
      return "/client/dashboard";

    case "freelancer":
      return "/freelancer/dashboard";

    case "admin":
      return "/admin/dashboard";

    default:
      return "/";
  }
};
```

The backend must still verify the user's permissions for all dashboard data requests.

---

## 15. Logout Flow

Logout terminates the user's authentication session.

### Logout Steps

1. User clicks the logout button.
2. Frontend sends a logout request.
3. Backend clears the authentication cookie.
4. Backend invalidates or revokes the session if the selected token strategy supports server-side revocation.
5. Frontend clears authentication state.
6. User is redirected to the login or home page.

### Logout Flow Diagram

```text
        USER CLICKS LOGOUT
                |
                v
       POST /auth/logout
                |
                v
       BACKEND CLEARS COOKIE
                |
                v
       REVOKE SESSION IF USED
                |
                v
       FRONTEND CLEARS USER STATE
                |
                v
       REDIRECT TO HOME PAGE
```

### Logout API

```http
POST /api/v1/auth/logout
```

Example response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

The backend must clear the cookie using the same relevant cookie path and attributes used when setting it.

---

## 16. Forgot Password Flow

If a user forgets their password, they can request a password reset.

### Steps

1. User opens the forgot password page.
2. User enters their registered email.
3. Frontend sends a request to the backend.
4. Backend generates a secure, random, single-use reset token.
5. Backend stores a hash of the reset token with an expiration time.
6. Backend sends a password reset link to the user's email.
7. User opens the link.
8. User enters a new password.
9. Backend verifies the reset token.
10. Backend hashes and saves the new password.
11. Backend invalidates the reset token.
12. User can log in with the new password.

### Forgot Password Flow Diagram

```text
          USER
            |
            v
     FORGOT PASSWORD PAGE
            |
            v
       ENTER EMAIL
            |
            v
    POST /auth/forgot-password
            |
            v
    GENERATE RESET TOKEN
            |
            v
    STORE TOKEN HASH
            |
            v
    SEND RESET EMAIL
            |
            v
    USER OPENS RESET LINK
            |
            v
    ENTER NEW PASSWORD
            |
            v
    VERIFY RESET TOKEN
            |
            v
    UPDATE PASSWORD HASH
            |
            v
    INVALIDATE RESET TOKEN
            |
            v
       LOGIN AGAIN
```

### Forgot Password API

```http
POST /api/v1/auth/forgot-password
```

Example request:

```json
{
  "email": "john@example.com"
}
```

### Reset Password API

```http
POST /api/v1/auth/reset-password
```

Example request:

```json
{
  "token": "RESET_TOKEN",
  "password": "NewStrongPassword123!"
}
```

Security requirements:

- Reset tokens must be cryptographically random.
- Store only token hashes.
- Reset tokens must expire.
- Reset tokens must be single-use.
- Return a generic response that does not reveal whether an email exists.
- Rate-limit reset requests.

---

## 17. Email Verification Flow

Email verification helps confirm that a user controls the email address used during registration.

### Steps

1. User registers.
2. Backend generates an email verification token.
3. Backend stores a secure token hash and expiration.
4. Backend sends a verification link.
5. User opens the link.
6. Backend verifies the token.
7. Backend marks the email as verified.
8. Verification token is invalidated.

### Verification API

```http
POST /api/v1/auth/verify-email
```

Example request:

```json
{
  "token": "EMAIL_VERIFICATION_TOKEN"
}
```

### Resend Verification API

```http
POST /api/v1/auth/resend-verification
```

Email verification should have an expiration policy and rate limiting.

---

## 18. Account Status Management

A user account may have different statuses.

Suggested statuses:

| Status | Meaning |
|---|---|
| active | Account is active |
| suspended | Account is temporarily restricted |
| deactivated | Account has been deactivated |
| pending_verification | Email verification is incomplete |

The backend must check account status before allowing protected operations.

An inactive or suspended user should not be able to access restricted application features.

Admin account actions should be logged for auditing.

---

## 19. Frontend Authentication File Structure

Suggested frontend files:

```text
client/
│
└── src/
    │
    ├── components/
    │   └── common/
    │       └── ProtectedRoute.jsx
    │
    ├── pages/
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── ForgotPassword.jsx
    │   ├── ResetPassword.jsx
    │   └── VerifyEmail.jsx
    │
    ├── context/
    │   └── AuthContext.jsx
    │
    ├── hooks/
    │   └── useAuth.js
    │
    ├── services/
    │   ├── api.js
    │   └── authService.js
    │
    └── routes/
        └── AppRoutes.jsx
```

### Frontend File Responsibilities

| File | Responsibility |
|---|---|
| Login.jsx | Login interface |
| Register.jsx | Registration interface |
| ForgotPassword.jsx | Request password reset |
| ResetPassword.jsx | Set a new password |
| VerifyEmail.jsx | Verify email address |
| AuthContext.jsx | Manage authentication state |
| useAuth.js | Access authentication context |
| ProtectedRoute.jsx | Protect private pages |
| api.js | Configure Axios |
| authService.js | Handle authentication API calls |
| AppRoutes.jsx | Define frontend routes |

---

## 20. Backend Authentication File Structure

Suggested backend files:

```text
server/
│
├── controllers/
│   └── authController.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
│
├── models/
│   └── User.js
│
├── routes/
│   └── authRoutes.js
│
├── services/
│   ├── authService.js
│   └── emailService.js
│
├── utils/
│   └── generateToken.js
│
└── config/
    └── db.js
```

### Backend File Responsibilities

| File | Responsibility |
|---|---|
| User.js | User database schema |
| authRoutes.js | Authentication API endpoints |
| authController.js | Handle authentication requests |
| authMiddleware.js | Verify authenticated users |
| roleMiddleware.js | Check user permissions |
| authService.js | Authentication business logic |
| emailService.js | Send verification and reset emails |
| generateToken.js | Generate authentication tokens |
| db.js | Database connection |

---

## 21. Authentication API Endpoints

The authentication module uses the following endpoints.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/v1/auth/register | Register a new user |
| POST | /api/v1/auth/login | Log in |
| POST | /api/v1/auth/logout | Log out |
| GET | /api/v1/auth/me | Get current user |
| POST | /api/v1/auth/forgot-password | Request password reset |
| POST | /api/v1/auth/reset-password | Reset password |
| POST | /api/v1/auth/verify-email | Verify email |
| POST | /api/v1/auth/resend-verification | Resend verification email |

The detailed request bodies, responses, and status codes are maintained in API_DOCUMENTATION.md.

---

## 22. Axios Configuration

The frontend uses Axios to communicate with the backend.

### api.js

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;
```

`withCredentials: true` allows the browser to send and receive cookies for cross-origin requests when the server and cookie policies permit it.

The backend must configure CORS with the exact trusted frontend origin and credentials support.

For cookie-based authentication, implement appropriate CSRF protection for state-changing requests.

---

## 23. Security Best Practices

Authentication must be implemented securely.

### Password Security

- Hash passwords using bcrypt or Argon2.
- Never store plain-text passwords.
- Enforce reasonable password requirements.
- Never return password hashes in API responses.

### JWT Security

- Store signing secrets in environment variables.
- Use short-lived access tokens.
- Verify token signatures and expiration.
- Do not place sensitive data in token payloads.
- Consider token revocation or refresh-token rotation when implementing persistent sessions.

### Cookie Security

- Use HTTP-only cookies.
- Use Secure cookies in production.
- Configure SameSite appropriately.
- Implement CSRF protection.
- Clear cookies during logout.

### API Security

- Validate request bodies.
- Apply rate limiting to login and password-reset endpoints.
- Use generic login and password-reset error messages where appropriate.
- Check account status.
- Enforce role and resource ownership permissions.
- Use HTTPS in production.

### Database Security

- Protect database credentials.
- Avoid exposing private account fields.
- Use Mongoose validation.
- Apply appropriate indexes.
- Never store raw payment card information.

---

## 24. Authentication Development Order

Implement authentication in the following order.

### Phase 1: User Model

Create the User schema with:

- Name.
- Email.
- Password hash.
- Role.
- Email verification status.
- Account status.
- Timestamps.

### Phase 2: Registration

- Create registration route.
- Create registration controller.
- Validate user information.
- Check duplicate email.
- Hash password.
- Save user in MongoDB.

### Phase 3: Login

- Create login route.
- Find user by email.
- Compare password.
- Check account status.
- Generate JWT.
- Set authentication cookie.

### Phase 4: Authentication Middleware

- Read authentication cookie.
- Verify JWT.
- Find user.
- Attach user to request.
- Reject unauthorized requests.

### Phase 5: Role Authorization

- Create role middleware.
- Protect client routes.
- Protect freelancer routes.
- Protect admin routes.

### Phase 6: Frontend Integration

- Create login page.
- Create registration page.
- Configure Axios.
- Create AuthContext.
- Create useAuth hook.
- Create protected routes.
- Implement role-based dashboard redirection.

### Phase 7: Session Persistence

- Implement GET /auth/me.
- Check authentication when the app loads.
- Handle expired sessions.
- Handle logout.

### Phase 8: Email Features

- Implement email verification.
- Implement forgot password.
- Implement reset password.
- Implement resend verification.

### Phase 9: Testing

Test:

- Successful registration.
- Duplicate email registration.
- Invalid login.
- Successful login.
- Logout.
- Expired token.
- Missing token.
- Suspended account.
- Unauthorized role.
- Access to another user's resources.
- Password reset.
- Email verification.

---

## 25. Important Authentication Rules

1. Every user must have a unique email address.
2. Passwords must be hashed before database storage.
3. Admin registration must not be publicly available.
4. Authentication must be verified by the backend.
5. Frontend authentication state must not be treated as proof of authorization.
6. Protected endpoints must use authentication middleware.
7. Role-specific endpoints must use authorization middleware.
8. Users must not access resources belonging to other users without permission.
9. Authentication cookies must use secure configuration.
10. Password reset tokens must expire and be single-use.
11. Email verification tokens must expire and be single-use.
12. Suspended accounts must not access restricted features.
13. Authentication errors must be handled consistently.
14. Sensitive user information must never be exposed in API responses.

---

## 26. Related Documentation

| Document | Purpose |
|---|---|
| PROJECT_ROADMAP.md | Development phases |
| ARCHITECTURE.md | Overall application architecture |
| API_DOCUMENTATION.md | API endpoints and request/response formats |
| AUTHENTICATION_FLOW.md | Registration, login, authentication, and authorization |
| DATABASE_SCHEMA.md | Database collections and fields |

---

## 27. Final Note

This document describes the planned authentication system for FreelanceHub.

It is a development guide, not an indication that authentication has already been implemented.

All authentication-related frontend components, backend routes, middleware, controllers, services, and database models should follow this document.

Authentication should be completed and tested before developing features such as job posting, proposals, contracts, messaging, and payments.

**Security is a core requirement of FreelanceHub, not an optional feature.**