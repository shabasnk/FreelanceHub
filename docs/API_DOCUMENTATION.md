FreelanceHub API Documentation
Document status: Initial API contract / implementation blueprint
API version: v1
Base path: /api/v1
Backend: Node.js + Express
Database: MongoDB + Mongoose
Format: JSON over HTTPS, except payment-provider webhooks
Last updated: 2026-11-01

This document defines the planned HTTP API for FreelanceHub, a freelance marketplace connecting clients and freelancers. It is the contract between the React frontend and the Express backend.

Important: These endpoints describe the intended API. An endpoint is not implemented merely because it appears here. Update this document when implementation decisions change.
1. Product overview
FreelanceHub supports four account/access categories:
Role	Main capabilities
Guest	Browse public jobs and public freelancer profiles
Freelancer	Manage profile, browse jobs, submit proposals, work on contracts, message clients, receive payments, review eligible clients
Client	Manage client profile, publish jobs, review proposals, hire freelancers, manage contracts and milestones, pay for work, review eligible freelancers
Admin	Moderate platform content and users, review reports/disputes, access authorized administrative tools


Main user journey
1. A user registers and signs in.
2. The user completes a client or freelancer profile.
3. A client publishes a job.
4. A freelancer browses jobs and submits a proposal.
5. The client reviews proposals and accepts one.
6. The platform creates a contract for the client and freelancer.
7. The participants manage milestones and deliverables.
8. The client pays through the configured payment provider.
9. The platform records verified payment events.
10. The contract is completed and eligible participants can leave reviews.
2. Base URL and versioning
Local development:
http://localhost:4000/api/v1
Production example:
https://api.your-domain.com/api/v1
All application endpoints in this document are relative to /api/v1, unless explicitly identified as a webhook or external provider callback.

Use /api/v1 for all new application endpoints. Breaking API changes should be introduced under a new version rather than silently changing an existing contract.
3. General conventions
3.1 HTTP methods
Method	Purpose
GET	Read data; should not modify server state
POST	Create a resource or perform an explicit action
PATCH	Partially update a resource
PUT	Replace a resource where full replacement is intended
DELETE	Delete or deactivate a resource where permitted


3.2 Content type
Normal API requests and responses use:
Content-Type: application/json
Accept: application/json
File uploads may use multipart/form-data only on endpoints that explicitly support it. Payment-provider webhooks use the provider's required content type and raw-body signature verification.
3.3 IDs and timestamps
- MongoDB document IDs are represented as strings in JSON, usually 24-character ObjectId strings.
- Dates and timestamps are returned as ISO 8601 UTC strings.
- The API should not expose Mongoose internals such as __v.
- The API should return only fields the requesting user is allowed to see.
Example:
{
  "id": "6720a1b2c3d4e5f678901234",
  "createdAt": "2026-11-01T12:30:00.000Z",
  "updatedAt": "2026-11-01T12:30:00.000Z"
}
3.4 Naming
- JSON fields use camelCase.
- URL paths use lowercase plural nouns where practical.
- Use explicit action endpoints for state changes such as /close, /accept, /withdraw, /approve, and /cancel.
- Do not rely on the frontend to calculate authoritative prices, permissions, or state transitions.
3.5 Filtering, sorting and pagination
List endpoints should use pagination. Example:
GET /api/v1/jobs?page=1&limit=12&search=react&skills=React,Node.js&sortBy=createdAt&sortOrder=desc
Common query parameters:
Parameter	Type	Description
page	integer	Page number, starting at 1
limit	integer	Number of results; server enforces a maximum (recommended 100)
search	string	Search phrase
sortBy	string	Allowlisted sort field
sortOrder	asc or desc	Sort direction


Feature-specific filters are documented with their endpoints. The server must validate and allowlist filter and sort fields; never pass arbitrary client query objects directly into MongoDB.

Standard paginated response:
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
For large or frequently changing collections, cursor pagination may be introduced later. Do not mix cursor and page pagination in one endpoint without documenting it.
4. Authentication and authorization
4.1 Authentication strategy
For the browser application, the recommended implementation is an HTTP-only cookie-based session or a carefully implemented access/refresh-token cookie strategy.

The exact strategy must be selected during Phase 2 and implemented consistently. This document assumes the browser sends the authentication cookie automatically.

Example request:
GET /api/v1/auth/me
Cookie: accessToken=<http-only-cookie>
The frontend must not be able to read an HTTP-only cookie through JavaScript. Configure Axios with credentials when using cross-origin cookies:
axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true
});
The backend must configure CORS with the exact frontend origin and credentials enabled. Do not use wildcard origins with credentialed requests.

If cookie authentication is used:
- Set HttpOnly, Secure in production, and an appropriate SameSite policy.
- Implement CSRF protection for state-changing requests where required by the cookie/origin setup.
- Rotate or renew credentials according to the chosen session/token design.
- Clear the cookie using matching cookie options on logout.
If a bearer-token strategy is selected instead, document its storage, refresh, expiry and revocation rules before implementation. Never put secrets in VITE_ environment variables.
4.2 Roles
guest
client
freelancer
admin
The role is assigned and controlled by the backend. A normal user must never be able to promote their account to admin by editing a request body.
4.3 Authorization rules
- Public endpoints may be accessed without authentication.
- Protected endpoints require a valid authenticated user.
- Role-specific endpoints require the correct role.
- Ownership-sensitive endpoints must verify the authenticated user's relationship to the resource.
- Contract and conversation endpoints must verify that the user is a participant.
- Admin endpoints require server-side admin authorization.
- Frontend route guards are for user experience only; backend authorization is mandatory.
5. Standard response format
5.1 Successful response
Single-resource response:
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "id": "6720a1b2c3d4e5f678901234",
    "title": "Build a React dashboard",
    "status": "open"
  }
}
List response: use the paginated response format in Section 3.5.

Some endpoints, such as logout or webhook acknowledgements, may return a smaller response where appropriate. Keep the success and message conventions consistent.
5.2 Error response
All normal API errors should use a consistent shape:
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
In production, do not expose stack traces, database internals, secrets, provider credentials, or sensitive implementation details.
5.3 HTTP status codes
Status	Meaning	Typical use
200 OK	Request succeeded	Read, update, action completed
201 Created	Resource created	Register, create job, submit proposal
202 Accepted	Work accepted for asynchronous processing	Queued processing
204 No Content	Succeeded with no response body	Delete where appropriate
400 Bad Request	Invalid request format or parameters	Malformed input
401 Unauthorized	Authentication missing or invalid	Not logged in
403 Forbidden	Authenticated but not permitted	Wrong role or insufficient permission
404 Not Found	Resource not found or intentionally hidden	Unknown resource
409 Conflict	Request conflicts with current state	Duplicate proposal, already accepted
413 Payload Too Large	Request/file too large	Upload limit exceeded
415 Unsupported Media Type	Unsupported content type	Invalid upload type
422 Unprocessable Entity	Well-formed request fails business validation	Invalid state transition
429 Too Many Requests	Rate limit exceeded	Too many login/AI requests
500 Internal Server Error	Unexpected server error	Unhandled failure
503 Service Unavailable	Temporary dependency/service outage	Database/provider unavailable


5.4 Common error codes
Code	Meaning
VALIDATION_ERROR	Request fields failed validation
AUTH_REQUIRED	Authentication is required
INVALID_CREDENTIALS	Login details are incorrect
TOKEN_EXPIRED	Authentication credential expired
FORBIDDEN	User does not have permission
RESOURCE_NOT_FOUND	Resource does not exist or is not visible
DUPLICATE_RESOURCE	Resource already exists
INVALID_STATE_TRANSITION	Requested action is not allowed in the current state
RATE_LIMIT_EXCEEDED	Too many requests
PAYMENT_FAILED	Payment operation failed
INTERNAL_ERROR	Unexpected server error


6. API endpoint catalogue
The following sections define the planned endpoints by feature.
6.1 Health
Method	Endpoint	Auth	Description
GET	/health	Public	Check API health


Example:
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-11-01T12:30:00.000Z"
  }
}
The health endpoint should not reveal secrets, environment variables, database credentials or detailed infrastructure information. A separate internal readiness check may verify dependencies.
6.2 Authentication
Base path: /auth
Method	Endpoint	Auth	Role	Description
POST	/auth/register	Public	—	Register a client or freelancer
POST	/auth/login	Public	—	Sign in
POST	/auth/logout	Required	Any	Sign out and clear/revoke credentials
GET	/auth/me	Required	Any	Get current authenticated user
POST	/auth/forgot-password	Public	—	Request password reset
POST	/auth/reset-password	Public + reset token	—	Set a new password
POST	/auth/verify-email	Public + verification token	—	Verify email address
POST	/auth/resend-verification	Required	Any	Resend verification email


Register
POST /auth/register

Request:
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "password": "StrongPassword123!",
  "role": "freelancer"
}
Validation:
- name is required and length-limited.
- email must be valid, normalized and unique.
- password must meet the password policy.
- role may be client or freelancer; never admin.
- Password is hashed before storage.
- Do not return the password or password hash.
Response: 201 Created
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "6720a1b2c3d4e5f678901234",
      "name": "Alex Morgan",
      "email": "alex@example.com",
      "role": "freelancer",
      "isEmailVerified": false,
      "profileCompleted": false
    }
  }
}
Login
POST /auth/login

Request:
{
  "email": "alex@example.com",
  "password": "StrongPassword123!"
}
Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "6720a1b2c3d4e5f678901234",
      "name": "Alex Morgan",
      "email": "alex@example.com",
      "role": "freelancer",
      "profileCompleted": false
    }
  }
}
The authentication credential is set using the chosen secure cookie/session mechanism; it should not be exposed in the JSON response when using HTTP-only cookies.
Logout
POST /auth/logout

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
The server invalidates/revokes the session or refresh credential as applicable and clears the cookie.
Current user
GET /auth/me

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "6720a1b2c3d4e5f678901234",
      "name": "Alex Morgan",
      "email": "alex@example.com",
      "role": "freelancer",
      "isEmailVerified": true,
      "profileCompleted": true
    }
  }
}
Forgot password
POST /auth/forgot-password

Request:
{
  "email": "alex@example.com"
}
Return a generic success message whether or not the account exists, to reduce account enumeration.
Reset password
POST /auth/reset-password

Request:
{
  "token": "single-use-reset-token",
  "newPassword": "NewStrongPassword123!"
}
The token must be single-use, expire, and be stored safely (preferably as a hash).
6.3 Users and profiles
Base path: /users
Method	Endpoint	Auth	Role	Description
GET	/users/me	Required	Any	Get own account/profile summary
PATCH	/users/me	Required	Any	Update permitted own profile fields
GET	/users/:userId	Public	—	Get public profile
GET	/users/freelancers	Public	—	Browse public freelancer profiles


Update own profile
PATCH /users/me

Example freelancer request:
{
  "name": "Alex Morgan",
  "headline": "Full-stack JavaScript Developer",
  "bio": "I build responsive web applications.",
  "location": "Thiruvananthapuram, India",
  "skills": ["React", "Node.js", "MongoDB"],
  "hourlyRate": 25,
  "currency": "USD",
  "portfolio": [
    {
      "title": "Task Manager",
      "description": "A task management application",
      "url": "https://example.com/project"
    }
  ]
}
Rules:
- Users can update only their own allowed profile fields.
- The backend ignores/rejects protected fields such as role, passwordHash, account status and payment account verification.
- Validate all URLs, text lengths, skills and numeric ranges.
- Public profile responses must omit private account fields.
Public profile
GET /users/:userId

Response example:
{
  "success": true,
  "data": {
    "user": {
      "id": "6720a1b2c3d4e5f678901234",
      "name": "Alex Morgan",
      "role": "freelancer",
      "headline": "Full-stack JavaScript Developer",
      "bio": "I build responsive web applications.",
      "location": "Thiruvananthapuram, India",
      "skills": ["React", "Node.js", "MongoDB"],
      "hourlyRate": 25,
      "currency": "USD",
      "rating": 4.8,
      "completedContracts": 12
    }
  }
}
The example rating and completed-contract count are derived values; calculate them from trusted records or a maintained aggregate, not arbitrary profile input.
Browse freelancers
GET /users/freelancers?page=1&limit=12&skills=React,Node.js&search=frontend&sortBy=rating&sortOrder=desc

Returns public freelancer profiles with pagination.
6.4 Jobs marketplace
Base path: /jobs
Job fields
A job may contain:
{
  "id": "6720a1b2c3d4e5f678901234",
  "clientId": "6720a1b2c3d4e5f678901235",
  "title": "Build a React dashboard",
  "description": "Create a responsive dashboard for a SaaS product.",
  "category": "Web Development",
  "skills": ["React", "JavaScript", "CSS"],
  "budgetType": "fixed",
  "budgetMin": 500,
  "budgetMax": 1000,
  "currency": "USD",
  "experienceLevel": "intermediate",
  "duration": "1-2 months",
  "status": "open",
  "createdAt": "2026-11-01T12:30:00.000Z"
}
Endpoints
Method	Endpoint	Auth	Role	Description
GET	/jobs	Public	—	Browse/search open jobs
GET	/jobs/:jobId	Public	—	Get job details
POST	/jobs	Required	Client	Create a job
PATCH	/jobs/:jobId	Required	Owner client	Edit a job
POST	/jobs/:jobId/close	Required	Owner client	Close a job
GET	/clients/me/jobs	Required	Client	List own jobs


Browse jobs
GET /jobs?page=1&limit=12&search=dashboard&skills=React,Node.js&category=Web%20Development&budgetType=fixed&experienceLevel=intermediate&sortBy=createdAt&sortOrder=desc

Supported filters should be allowlisted and documented in implementation. Return only jobs that are publicly browseable, normally open jobs.
Create job
POST /jobs

Request:
{
  "title": "Build a React dashboard",
  "description": "Create a responsive dashboard for a SaaS product.",
  "category": "Web Development",
  "skills": ["React", "JavaScript", "CSS"],
  "budgetType": "fixed",
  "budgetMin": 500,
  "budgetMax": 1000,
  "currency": "USD",
  "experienceLevel": "intermediate",
  "duration": "1-2 months"
}
The server derives clientId from the authenticated user. Do not accept an arbitrary client ID from the request body.

Response: 201 Created, with the created job.
Update job
PATCH /jobs/:jobId

Accept only editable fields. Only the owning client can edit the job. Define which fields become locked after proposals or hiring exist.
Close job
POST /jobs/:jobId/close

The backend checks ownership and current job state. Closing a job must not silently cancel an active contract.
6.5 Proposals
Base path: /proposals
Proposal fields
{
  "id": "6720a1b2c3d4e5f678901236",
  "jobId": "6720a1b2c3d4e5f678901234",
  "freelancerId": "6720a1b2c3d4e5f678901237",
  "coverLetter": "I have experience building React dashboards...",
  "bidAmount": 800,
  "currency": "USD",
  "estimatedDuration": "3 weeks",
  "status": "submitted",
  "createdAt": "2026-11-01T12:30:00.000Z"
}
Endpoints
Method	Endpoint	Auth	Role	Description
POST	/proposals/jobs/:jobId	Required	Freelancer	Submit proposal to a job
GET	/proposals/me	Required	Freelancer	List own proposals
GET	/jobs/:jobId/proposals	Required	Owning client	List proposals for a job
GET	/proposals/:proposalId	Required	Authorized participant	Get proposal details
POST	/proposals/:proposalId/withdraw	Required	Owning freelancer	Withdraw proposal
POST	/proposals/:proposalId/accept	Required	Owning client	Accept proposal and create contract
POST	/proposals/:proposalId/reject	Required	Owning client	Reject proposal


Submit proposal
POST /proposals/jobs/:jobId

Request:
{
  "coverLetter": "I have experience building React dashboards and can deliver this project.",
  "bidAmount": 800,
  "currency": "USD",
  "estimatedDuration": "3 weeks"
}
Rules:
- Only freelancers can submit proposals.
- The job must exist and be open.
- The freelancer cannot submit more than one active proposal to the same job.
- Enforce uniqueness in the database, not only in application code.
- The backend derives freelancerId from the authenticated user.
- The server validates bid and currency values.
List proposals for a job
GET /jobs/:jobId/proposals?page=1&limit=10

Only the client who owns the job can access its applicant list.
Accept proposal
POST /proposals/:proposalId/accept

Request body: none required.

Response: 201 Created or 200 OK according to the implementation's resource/action convention. The response includes the accepted proposal and newly created contract.

Acceptance is a critical multi-document operation. The backend must ensure:
- The authenticated client owns the related job.
- The job is still open.
- The proposal is still eligible for acceptance.
- Only one proposal can win the job.
- Other proposals are moved to the appropriate terminal state according to product rules.
- Exactly one contract is created.
- Concurrent acceptance attempts cannot create multiple contracts.
Use a MongoDB transaction where supported, appropriate conditional updates/unique indexes, and idempotent handling.
Withdraw proposal
POST /proposals/:proposalId/withdraw

Only the proposal-owning freelancer can withdraw it, and only while the proposal is in a withdrawable state.
6.6 Contracts
Base path: /contracts
Contract fields
{
  "id": "6720a1b2c3d4e5f678901238",
  "jobId": "6720a1b2c3d4e5f678901234",
  "proposalId": "6720a1b2c3d4e5f678901236",
  "clientId": "6720a1b2c3d4e5f678901235",
  "freelancerId": "6720a1b2c3d4e5f678901237",
  "title": "Build a React dashboard",
  "agreedAmount": 800,
  "currency": "USD",
  "status": "active",
  "startDate": "2026-11-02T00:00:00.000Z",
  "createdAt": "2026-11-01T12:30:00.000Z"
}
Endpoints
Method	Endpoint	Auth	Role	Description
GET	/contracts	Required	Participant	List own contracts
GET	/contracts/:contractId	Required	Participant	Get contract details
POST	/contracts/:contractId/cancel	Required	Participant, subject to rules	Request/carry out cancellation
POST	/contracts/:contractId/complete	Required	Participant, subject to rules	Request completion


The server must verify that the current user is the contract's client or freelancer. Cancellation and completion should follow explicit business rules and may require the other participant's action or admin review.

Contract status values should be finalized before implementation. Suggested initial values:
active
submitted
revision_requested
completed
cancelled
disputed
Do not allow arbitrary status changes through a generic PATCH endpoint.
6.7 Milestones and deliverables
Base path: /contracts/:contractId/milestones and /milestones
Milestone fields
{
  "id": "6720a1b2c3d4e5f678901239",
  "contractId": "6720a1b2c3d4e5f678901238",
  "title": "Dashboard wireframe",
  "description": "Complete the initial dashboard layout.",
  "amount": 200,
  "currency": "USD",
  "dueDate": "2026-11-10T00:00:00.000Z",
  "status": "pending",
  "deliverables": [],
  "createdAt": "2026-11-01T12:30:00.000Z"
}
Endpoints
Method	Endpoint	Auth	Role	Description
GET	/contracts/:contractId/milestones	Required	Participant	List contract milestones
POST	/contracts/:contractId/milestones	Required	As permitted by contract	Create milestone
GET	/milestones/:milestoneId	Required	Participant	Get milestone details
PATCH	/milestones/:milestoneId	Required	Authorized participant	Edit permitted milestone fields
POST	/milestones/:milestoneId/submit	Required	Freelancer	Submit milestone work
POST	/milestones/:milestoneId/approve	Required	Client	Approve submitted work
POST	/milestones/:milestoneId/request-revision	Required	Client	Request changes
POST	/milestones/:milestoneId/cancel	Required	As permitted by contract	Cancel milestone if allowed


Submit milestone
POST /milestones/:milestoneId/submit

Request:
{
  "message": "The dashboard implementation is ready for review.",
  "deliverableFileIds": ["6720a1b2c3d4e5f678901240"]
}
The server verifies freelancer participation, file ownership/access and milestone state.
Approve milestone
POST /milestones/:milestoneId/approve

Request body: none required unless an optional client comment is supported.

Only the contract's client can approve submitted work. Approval may trigger a payment release workflow, but it must not mark money as paid unless the payment provider confirms it.
Request revision
POST /milestones/:milestoneId/request-revision

Request:
{
  "message": "Please adjust the mobile navigation spacing."
}
Use explicit status-transition rules, for example:
pending -> in_progress
in_progress -> submitted
submitted -> revision_requested
revision_requested -> submitted
submitted -> approved
The exact state machine should be agreed before coding.
6.8 Conversations and messaging
Base path: /conversations

REST is used to create/list conversations and load persisted message history. Socket.IO is used for live delivery, typing indicators and read events.
Endpoints
Method	Endpoint	Auth	Description
GET	/conversations	Required	List conversations for current user
POST	/conversations	Required	Create/find an authorized conversation
GET	/conversations/:conversationId	Required participant	Get conversation details
GET	/conversations/:conversationId/messages	Required participant	Load paginated message history
POST	/conversations/:conversationId/messages	Required participant	Send and persist a message
POST	/conversations/:conversationId/read	Required participant	Mark messages as read


Create/find conversation
POST /conversations

Request:
{
  "contractId": "6720a1b2c3d4e5f678901238",
  "participantId": "6720a1b2c3d4e5f678901237"
}
The backend validates that the caller and other participant are allowed to communicate under the platform's rules. Prefer linking a conversation to a contract or another valid platform context. The backend derives the caller's ID; never trust a caller-supplied sender ID.
Load messages
GET /conversations/:conversationId/messages?page=1&limit=30

Only conversation participants can read messages.
Send message
POST /conversations/:conversationId/messages

Request:
{
  "body": "I have uploaded the first milestone for review."
}
Response: 201 Created

The server verifies membership, validates content, persists the message, then emits the live event to authorized recipients. A socket event must not be treated as persisted merely because the browser emitted it.
Socket.IO event contract
Connection:
- Authenticate the socket using the same trusted identity/session strategy.
- Reject unauthenticated connections.
- Do not let clients join arbitrary conversation rooms.
Suggested client-to-server events:
Event	Payload	Purpose
conversation:join	{ "conversationId": "..." }	Request access to a conversation room
message:send	{ "conversationId": "...", "body": "..." }	Send message if using socket send path
typing:start	{ "conversationId": "..." }	Indicate typing
typing:stop	{ "conversationId": "..." }	Stop typing indicator
message:read	{ "conversationId": "...", "messageId": "..." }	Mark message read


Suggested server-to-client events:
Event	Payload	Purpose
message:new	Persisted message object	New message received
message:read	Read-state update	Message/read receipt changed
typing:update	{ "userId": "...", "isTyping": true }	Typing indicator
notification:new	Notification object	New notification


For a beginner implementation, it is acceptable to send messages over REST first and add socket events after persisted messaging works.
6.9 Notifications
Base path: /notifications
Method	Endpoint	Auth	Description
GET	/notifications	Required	List current user's notifications
GET	/notifications/unread-count	Required	Get unread count
POST	/notifications/:notificationId/read	Required	Mark one notification read
POST	/notifications/read-all	Required	Mark all current user's notifications read
DELETE	/notifications/:notificationId	Required	Delete/dismiss own notification if supported


Example notification:
{
  "id": "6720a1b2c3d4e5f678901241",
  "type": "proposal_accepted",
  "title": "Your proposal was accepted",
  "body": "The client accepted your proposal for Build a React dashboard.",
  "resource": {
    "type": "contract",
    "id": "6720a1b2c3d4e5f678901238"
  },
  "isRead": false,
  "createdAt": "2026-11-01T12:30:00.000Z"
}
Users can access only notifications addressed to them. Notification creation should be triggered by trusted backend business events, not by arbitrary browser requests.
6.10 File uploads
Base path: /uploads

The initial implementation may use Cloudinary or another managed object-storage provider. Decide whether uploads are server-mediated or signed direct uploads and document the selected flow.
Method	Endpoint	Auth	Description
POST	/uploads	Required	Upload an allowed file
POST	/uploads/signature	Required	Request signed upload parameters, if using direct uploads
POST	/uploads/confirm	Required	Confirm a direct upload and store metadata, if applicable
GET	/uploads/:fileId	Required/visibility policy	Get file metadata or authorized access URL
DELETE	/uploads/:fileId	Required owner	Delete own file where allowed


Example multipart request:
POST /api/v1/uploads
Content-Type: multipart/form-data
Form field:
file=<binary file>
purpose=portfolio
Possible purposes:
avatar
portfolio
milestone_deliverable
dispute_evidence
The server enforces:
- Allowed MIME types and file extensions.
- Maximum file size.
- Ownership and purpose-specific permissions.
- Safe file naming and provider metadata.
- Private or signed access for confidential files.
Do not store large file binaries in normal MongoDB documents. Store provider IDs, URLs/access metadata, owner ID, purpose, MIME type, size and timestamps.
6.11 Payments, refunds and payouts
Base path: /payments
Payment capabilities depend on the selected provider, country, currency, business model and provider approval. Verify the provider's marketplace/connected-account capabilities before promising escrow, split payments or payouts.

Method	Endpoint	Auth	Description
POST	/payments/checkout	Required	Create checkout/payment intent for an eligible milestone
GET	/payments	Required	List current user's permitted payment records
GET	/payments/:paymentId	Required participant	Get payment details
POST	/payments/:paymentId/refund	Required + permission	Request/process refund under policy
GET	/payments/payouts	Required freelancer	List own payout records
POST	/payments/onboarding	Required freelancer	Start provider payout-account onboarding
GET	/payments/onboarding/status	Required freelancer	Get payout onboarding status


Create checkout
POST /payments/checkout

Request:
{
  "milestoneId": "6720a1b2c3d4e5f678901239"
}
The backend:
1. Authenticates the user.
2. Checks the user is permitted to pay for the milestone.
3. Loads the authoritative amount and currency from the database.
4. Checks the milestone/payment state.
5. Creates a provider payment/checkout session.
6. Stores a local pending payment record and provider reference.
7. Returns only the checkout information the frontend needs.
Do not accept the amount, platform fee or recipient payout as authoritative values from the browser.

Example response:
{
  "success": true,
  "data": {
    "paymentId": "6720a1b2c3d4e5f678901242",
    "checkoutUrl": "https://payment-provider.example/checkout/session"
  }
}
The checkout URL above is illustrative. The real URL must come from the configured payment provider.
Payment webhook
Provider webhook path (outside /api/v1 if required by provider configuration):
POST /webhooks/payments/provider
Webhook requirements:
- Use the raw request body if required for signature verification.
- Verify the provider signature before trusting the event.
- Store/track provider event IDs to prevent duplicate processing.
- Process events idempotently.
- Update payment records only from verified provider events or trusted provider API reconciliation.
- Never mark a payment successful based only on a frontend redirect.
- Return the provider's expected acknowledgement response.
- Do not expose this endpoint as a normal user action.
Suggested payment statuses:
pending
requires_action
processing
succeeded
failed
cancelled
partially_refunded
refunded
disputed
The exact statuses should map to the selected provider and internal business rules.
Refunds and payouts
Refund and payout operations require explicit policy, authorization, audit history and provider support. Do not implement a generic endpoint that lets users choose arbitrary amounts or recipients without server-side checks.
6.12 Reviews
Base path: /reviews
Method	Endpoint	Auth	Description
POST	/reviews	Required participant	Create eligible contract review
GET	/users/:userId/reviews	Public	List public reviews for a user
GET	/reviews/me	Required	List reviews written by current user


Create review:

POST /reviews

Request:
{
  "contractId": "6720a1b2c3d4e5f678901238",
  "rating": 5,
  "comment": "Great communication and a successful project."
}
Rules:
- Contract must meet the platform's review eligibility rule, normally completed.
- Reviewer must be a contract participant.
- Reviewer can review the other participant, not themselves.
- Enforce one review per reviewer/contract/target as appropriate with a unique index.
- Validate rating range and comment length.
- Prevent review editing/deletion except under a documented policy or admin moderation.
6.13 Disputes and reports
Base path: /disputes and /reports
Method	Endpoint	Auth	Description
POST	/disputes	Required contract participant	Open a dispute
GET	/disputes/me	Required	List own disputes
GET	/disputes/:disputeId	Required participant/admin	Get dispute details
POST	/disputes/:disputeId/messages	Required participant/admin	Add dispute message/evidence note
POST	/disputes/:disputeId/close	Required + permission	Close/resolve dispute according to policy
POST	/reports	Required	Report a user, job or other content


Open dispute:

POST /disputes

Request:
{
  "contractId": "6720a1b2c3d4e5f678901238",
  "reason": "work_not_as_described",
  "description": "The submitted deliverable does not match the agreed requirements.",
  "evidenceFileIds": ["6720a1b2c3d4e5f678901240"]
}
Dispute access must be restricted to the relevant participants and authorized administrators. Evidence files must use appropriate private access controls. Define dispute status transitions and refund/payment consequences before implementing resolution actions.
6.14 Admin
Base path: /admin

All endpoints require authenticated admin role and should be audited.
Method	Endpoint	Auth	Description
GET	/admin/dashboard	Admin	Platform summary metrics
GET	/admin/users	Admin	Search/list users
GET	/admin/users/:userId	Admin	Get user moderation details
PATCH	/admin/users/:userId/status	Admin	Suspend/restore account under policy
GET	/admin/jobs	Admin	List/moderate jobs
POST	/admin/jobs/:jobId/hide	Admin	Hide a job
POST	/admin/jobs/:jobId/restore	Admin	Restore a job
GET	/admin/disputes	Admin	List disputes
POST	/admin/disputes/:disputeId/resolve	Admin	Resolve dispute under policy
GET	/admin/reports	Admin	List user/content reports
GET	/admin/payments	Admin	View authorized payment records


Admin actions must:
- Be checked on the backend.
- Be validated against the current resource state.
- Be recorded in an audit log with actor, action, target, timestamp and relevant metadata.
- Avoid storing secrets or unnecessary personal data in logs.
- Follow least-privilege access.
6.15 AI features
Base path: /ai

AI is an assistive feature. The normal marketplace must continue to work if the AI provider is unavailable.
Method	Endpoint	Auth	Description
GET	/ai/job-recommendations	Required	Get recommended jobs for current freelancer
POST	/ai/proposal-assistance	Required freelancer	Generate/edit a proposal draft
POST	/ai/job-description-assistance	Required client	Assist with a job description


Job recommendations
GET /ai/job-recommendations?page=1&limit=10

The backend loads the authenticated freelancer's relevant profile and eligible open jobs, then returns ranked results. Start with transparent skill matching; add embeddings or model-based ranking only when useful.

Example response:
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "job": {
          "id": "6720a1b2c3d4e5f678901234",
          "title": "Build a React dashboard"
        },
        "matchScore": 0.87,
        "reasons": ["Matches React skill", "Matches JavaScript skill"]
      }
    ]
  }
}
A match score is a ranking signal, not a guarantee of suitability.
Proposal assistance
POST /ai/proposal-assistance

Request:
{
  "jobId": "6720a1b2c3d4e5f678901234",
  "additionalContext": "I have built two analytics dashboards for small businesses.",
  "tone": "professional"
}
Response:
{
  "success": true,
  "data": {
    "draft": "Hello, I would be happy to help build your React dashboard..."
  }
}
Rules:
- Keep AI provider credentials on the server.
- Authenticate and rate-limit requests.
- Limit input size and cost.
- Do not send unnecessary private information to the AI provider.
- Treat generated output as untrusted draft text.
- The user must review and explicitly submit a proposal through the normal proposal endpoint.
- AI must not accept jobs, sign contracts or trigger payments automatically.
7. Database resource relationships
This section is a logical API-level view, not a complete Mongoose schema definition.
User
 ├── has one profile (or profile fields stored on User)
 ├── creates many Jobs                  [client]
 ├── submits many Proposals              [freelancer]
 ├── participates in many Contracts
 ├── participates in Conversations
 ├── receives many Notifications
 ├── owns many Upload records
 ├── writes and receives Reviews
 └── may open Reports / Disputes

Job
 ├── belongs to one Client (User)
 ├── has many Proposals
 └── may result in one Contract

Proposal
 ├── belongs to one Job
 ├── belongs to one Freelancer (User)
 └── may create one Contract when accepted

Contract
 ├── belongs to one Job
 ├── references one accepted Proposal
 ├── has one Client and one Freelancer
 ├── has many Milestones
 ├── may have one or more Payments
 ├── may have a Conversation
 ├── may have Reviews
 └── may have a Dispute

Milestone
 ├── belongs to one Contract
 ├── may reference Deliverable Uploads
 └── may have Payment records

Conversation
 ├── has authorized Participants
 └── has many Messages

Payment
 ├── references Contract / Milestone
 ├── references provider payment identifiers
 └── may have Refund / Payout records
Suggested collections (some may be embedded or combined depending on implementation):
users
jobs
proposals
contracts
milestones
conversations
messages
notifications
uploads
payments
refunds
payouts
reviews
disputes
reports
auditlogs
idempotencykeys
Important indexes/constraints to consider:
- Unique normalized user email.
- Unique { jobId, freelancerId } for proposals, if the product allows only one proposal per freelancer per job.
- Unique accepted contract relationship for a job, if one hire per job is the rule.
- Index jobs by status and created date for marketplace browsing.
- Index proposals by job, freelancer and status.
- Index contracts by client, freelancer and status.
- Index messages by conversation and created date.
- Index notifications by recipient and read status.
- Unique provider event ID for webhook idempotency.
- Unique review constraint matching the chosen review policy.
Use MongoDB transactions for workflows that must update multiple documents atomically, provided the deployment supports transactions. Otherwise design explicit consistency and recovery handling.
8. State machines and business rules
State transitions must be enforced by backend services. Do not allow a frontend to PATCH any status it chooses.

Suggested initial job states:
draft -> open -> in_progress -> completed
                  |
                  +-> closed
Suggested proposal states:
submitted -> shortlisted -> accepted
     |             |
     +-> rejected  +-> rejected
     |
     +-> withdrawn
Suggested contract states:
active -> submitted -> completed
   ^          |
   |          +-> revision_requested -> submitted
   |
   +---- (only if the agreed workflow permits resumption)

active/submitted -> disputed
active/submitted -> cancelled (subject to cancellation policy)
Suggested milestone states:
pending -> in_progress -> submitted -> approved
                              |
                              +-> revision_requested -> submitted
Suggested payment states:
pending -> requires_action -> processing -> succeeded
   |             |               |
   +-> failed    +-> cancelled   +-> failed

succeeded -> partially_refunded -> refunded
succeeded -> disputed
These are starting proposals. Finalize the exact state machine and who may trigger each transition before implementing the related feature.
9. Security requirements
Apply these requirements across the API:
1. Validate every request on the server, even if React validates the same form.
2. Authenticate protected requests and authorize both role and resource ownership.
3. Never trust userId, clientId, freelancerId, price, fee, role, status or payment state supplied by the browser when the server can derive it.
4. Hash passwords with a suitable password-hashing algorithm and safe parameters.
5. Keep secrets in server environment variables or a secret manager.
6. Use HTTPS in production.
7. Configure CORS for known frontend origins.
8. Use CSRF protection where cookie authentication requires it.
9. Rate-limit login, password reset, verification, messaging and AI endpoints as appropriate.
10. Validate upload size, MIME type, extension, purpose and ownership.
11. Verify payment webhook signatures and process events idempotently.
12. Avoid MongoDB operator injection by validating/allowlisting query fields and operators.
13. Do not expose private fields in public profile or job responses.
14. Log security-relevant events without logging passwords, tokens, payment secrets or unnecessary personal data.
15. Use generic authentication/reset errors where revealing account existence would create risk.
16. Add request timeouts and safe handling for external provider failures.
10. Environment variables
Example only. Actual values belong in local .env files or the deployment secret manager. Never commit real secrets.

Backend .env.example:
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/freelancehub

# Authentication: names depend on the selected session/token design
SESSION_SECRET=replace_with_a_long_random_secret
ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
REFRESH_TOKEN_SECRET=replace_with_a_long_random_secret

# Email provider (optional until email verification/reset is implemented)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

# File storage provider (optional until uploads phase)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Payment provider (optional until payment phase)
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=

# AI provider (optional until AI phase)
AI_API_KEY=
Do not add unused secrets just because they appear in this example. Choose one authentication design and remove irrelevant variables.

Frontend .env.example:
VITE_API_BASE_URL=http://localhost:4000/api/v1
Only values intended to be public may use the VITE_ prefix. Never put database URLs, JWT secrets, payment secret keys, Cloudinary secret keys or AI provider keys in the frontend environment.
11. Frontend integration pattern
Suggested shared API client:
// client/src/services/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export default apiClient;
Example feature service:
// client/src/features/jobs/services/jobService.js
import apiClient from "../../../services/apiClient";

export const getJobs = async (params = {}) => {
  const response = await apiClient.get("/jobs", { params });
  return response.data;
};

export const getJobById = async (jobId) => {
  const response = await apiClient.get(`/jobs/${jobId}`);
  return response.data;
};

export const createJob = async (jobData) => {
  const response = await apiClient.post("/jobs", jobData);
  return response.data;
};

export const updateJob = async (jobId, updates) => {
  const response = await apiClient.patch(`/jobs/${jobId}`, updates);
  return response.data;
};
Keep API calls in feature service files rather than scattering raw Axios calls throughout components. If you use TanStack Query, feature hooks should call these service functions and manage loading, error, caching and invalidation.
12. Backend request flow
A normal Express request should follow this structure:
HTTP Request
    |
    v
server.js / Express app
    |
    v
Global middleware
(CORS, security headers, JSON parser, request logging)
    |
    v
routes/index.js
    |
    v
Feature route
    |
    v
Authentication middleware (if protected)
    |
    v
Role / ownership authorization
    |
    v
Request validation
    |
    v
Controller
    |
    v
Service (business rules)
    |
    v
Repository / Mongoose Model
    |
    v
MongoDB
    |
    v
Controller sends JSON response
    |
    v
Central error handler handles failures
Responsibilities:
- Route: URL, HTTP method and middleware order.
- Middleware: cross-cutting checks such as authentication, role checks and validation.
- Controller: translates HTTP request into a service call and formats the response.
- Service: business rules and workflow coordination.
- Repository: optional database access abstraction for complex or reusable queries.
- Model: schema, field constraints and indexes.
- Error handler: consistent error response.
Do not put all business logic in route files or React components.
13. Recommended backend project structure
This is a target structure to grow into. Create files when the relevant phase begins; do not create empty files for every future feature on day one.
server/
├── package.json
├── .env.example
├── server.js
└── src/
    ├── app.js
    ├── config/
    │   ├── env.js
    │   ├── database.js
    │   ├── cloudinary.js
    │   ├── paymentProvider.js
    │   └── aiProvider.js
    ├── routes/
    │   └── index.js
    ├── middleware/
    │   ├── authenticate.js
    │   ├── authorizeRole.js
    │   ├── validateRequest.js
    │   ├── notFound.js
    │   ├── errorHandler.js
    │   ├── rateLimiter.js
    │   └── uploadMiddleware.js
    ├── utils/
    │   ├── ApiError.js
    │   ├── ApiResponse.js
    │   └── asyncHandler.js
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── jobs/
    │   ├── proposals/
    │   ├── contracts/
    │   ├── milestones/
    │   ├── conversations/
    │   ├── messages/
    │   ├── notifications/
    │   ├── uploads/
    │   ├── payments/
    │   ├── reviews/
    │   ├── disputes/
    │   ├── reports/
    │   ├── admin/
    │   └── ai/
    ├── sockets/
    ├── jobs/
    ├── services/
    └── tests/
A feature module may contain:
jobs/
├── job.model.js
├── job.routes.js
├── job.controller.js
├── job.service.js
├── job.repository.js
├── job.validation.js
└── job.policy.js
Use a repository only where it adds value. A small project does not need an abstraction layer for every simple database operation.
14. Recommended frontend project structure
client/
├── package.json
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── app/
    │   ├── router.jsx
    │   └── AppProviders.jsx
    ├── config/
    │   └── env.js
    ├── services/
    │   ├── apiClient.js
    │   └── socketClient.js
    ├── components/
    │   ├── layout/
    │   └── common/
    ├── routes/
    │   └── ProtectedRoute.jsx
    ├── pages/
    │   ├── public/
    │   ├── auth/
    │   ├── onboarding/
    │   ├── client/
    │   ├── freelancer/
    │   ├── contracts/
    │   ├── messages/
    │   ├── payments/
    │   └── admin/
    ├── features/
    │   ├── auth/
    │   ├── users/
    │   ├── jobs/
    │   ├── proposals/
    │   ├── contracts/
    │   ├── milestones/
    │   ├── messages/
    │   ├── notifications/
    │   ├── uploads/
    │   ├── payments/
    │   ├── reviews/
    │   └── ai/
    ├── hooks/
    ├── utils/
    └── styles/
Feature folder example:
features/jobs/
├── components/
│   ├── JobCard.jsx
│   ├── JobForm.jsx
│   └── JobFilters.jsx
├── hooks/
│   ├── useJobs.js
│   └── useJobDetails.js
├── services/
│   └── jobService.js
└── schemas/
    └── jobSchema.js
15. API documentation and implementation checklist
For every endpoint, record or verify:
- [ ] HTTP method and URL are correct.
- [ ] Authentication requirement is documented.
- [ ] Required role and resource ownership rules are documented.
- [ ] Query parameters, path parameters and request body are validated.
- [ ] Success status and response JSON are documented.
- [ ] Expected error statuses and error codes are documented.
- [ ] Sensitive fields are excluded from responses.
- [ ] Duplicate requests and concurrent state changes are handled.
- [ ] Automated tests cover success, validation failure and unauthorized access.
- [ ] Frontend service calls the documented endpoint.
- [ ] API documentation matches the actual implementation.
Suggested implementation order
Implement and test these groups in order:
1. Health and server foundation.
2. Authentication.
3. Users and profiles.
4. Jobs marketplace.
5. Proposals and hiring.
6. Contracts and milestones.
7. Conversations and notifications.
8. Uploads.
9. Payments and refunds.
10. Reviews, reports, disputes and admin.
11. AI features.
12. Production hardening and deployment.
The MVP should be usable before advanced payment, AI, dispute and admin workflows are expanded.
16. Future API documentation improvements
When the API becomes more stable, consider adding:
- An OpenAPI 3.1 specification (openapi.yaml).
- Swagger UI for interactive endpoint exploration.
- Generated request/response validation from shared schemas where practical.
- API integration tests for every protected workflow.
- A changelog for endpoint and response changes.
This Markdown file is the human-readable starting contract. Keep it aligned with the actual code as the project evolves.