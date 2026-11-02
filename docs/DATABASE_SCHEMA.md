# FreelanceHub — Database Schema Documentation

## 1. Introduction

FreelanceHub uses MongoDB as its primary database and Mongoose as its Object Data Modeling (ODM) library.

The database stores information about users, jobs, proposals, contracts, milestones, messages, payments, reviews, notifications, disputes, and other application features.

This document defines:

- Database collections.
- Document fields and data types.
- Relationships between collections.
- Mongoose schema design.
- Required and optional fields.
- Enumerated values.
- Validation rules.
- Database indexes.
- Data security considerations.
- Recommended model implementation order.

The purpose of this document is to maintain a consistent database structure throughout development.

---

## 2. Database Technology

| Component | Technology |
|---|---|
| Database | MongoDB |
| ODM | Mongoose |
| Backend | Node.js |
| Framework | Express.js |
| Language | JavaScript |
| Database Connection | Mongoose Connection |
| Primary Identifier | MongoDB ObjectId |

### Database Name

Suggested database name:

```text
freelancehub
```

### Database Connection

The MongoDB connection string should be stored in the backend environment file.

```env
MONGO_URI=your_mongodb_connection_string
```

Example database connection:

```javascript
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
```

---

## 3. Database Design Overview

FreelanceHub uses separate collections for major application entities.

### Main Collections

| Collection | Purpose |
|---|---|
| users | Stores client, freelancer, and admin accounts |
| jobs | Stores jobs created by clients |
| proposals | Stores freelancer applications |
| contracts | Stores accepted agreements |
| milestones | Stores contract work stages |
| conversations | Stores conversation participants |
| messages | Stores individual messages |
| notifications | Stores user notifications |
| payments | Stores payment transaction records |
| reviews | Stores client and freelancer reviews |
| disputes | Stores contract-related disputes |
| reports | Stores user and content reports |
| aiInteractions | Stores optional AI assistance history |

MongoDB automatically creates an `_id` field for each document.

Relationships between major collections use MongoDB ObjectId references.

---

## 4. Relationship Architecture

### Main Database Relationship Diagram

```text
                         USERS
                           |
            +--------------+--------------+
            |              |              |
            v              v              v
           JOBS         PROFILES       CONVERSATIONS
            |                             |
            v                             v
        PROPOSALS                       MESSAGES
            |
            v
        CONTRACTS
            |
       +----+----+
       |         |
       v         v
   MILESTONES  PAYMENTS
       |
       v
   DELIVERABLES
   (embedded)

USERS
  |
  +---- NOTIFICATIONS
  |
  +---- REVIEWS
  |
  +---- REPORTS
  |
  +---- DISPUTES
  |
  +---- AI INTERACTIONS
```

### Relationship Explanation

1. One user can create multiple jobs.
2. One job can receive multiple proposals.
3. One freelancer can submit multiple proposals.
4. One accepted proposal can create a contract.
5. One contract belongs to one client and one freelancer.
6. One contract can contain multiple milestones.
7. One milestone can have multiple deliverable submissions.
8. One contract can have multiple payment records.
9. One conversation can contain multiple messages.
10. One user can participate in multiple conversations.
11. One user can receive multiple notifications.
12. One user can write multiple reviews.
13. One user can receive multiple reviews.
14. One contract can be associated with reviews and disputes.

---

# 5. User Collection

Collection name:

```text
users
```

The User collection stores all registered FreelanceHub accounts.

The same User model supports three roles:

- client
- freelancer
- admin

### User Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Unique user ID |
| name | String | Yes | User's full name |
| email | String | Yes | Unique email address |
| password | String | Yes | Hashed password |
| role | String | Yes | client, freelancer, admin |
| avatar | String | No | Profile image URL |
| bio | String | No | User description |
| phone | String | No | Contact number |
| location | Object | No | Country, city, timezone |
| skills | Array of Strings | No | Freelancer skills |
| hourlyRate | Number | No | Freelancer hourly rate |
| experienceLevel | String | No | Freelancer experience level |
| languages | Array | No | Languages known |
| portfolio | Array | No | Portfolio entries |
| isEmailVerified | Boolean | Yes | Email verification status |
| status | String | Yes | Account status |
| createdAt | Date | Auto | Account creation date |
| updatedAt | Date | Auto | Last update date |

### Suggested Enums

Role:

```text
client
freelancer
admin
```

Status:

```text
active
suspended
deactivated
pending_verification
```

Experience level:

```text
entry
intermediate
expert
```

### Embedded Location Example

```json
{
  "country": "India",
  "city": "Thiruvananthapuram",
  "timezone": "Asia/Kolkata"
}
```

### Embedded Portfolio Example

```json
{
  "title": "E-commerce Website",
  "description": "A responsive e-commerce application",
  "projectUrl": "https://example.com",
  "imageUrl": "https://example.com/image.jpg",
  "skills": ["React", "Node.js", "MongoDB"]
}
```

Portfolio entries should be embedded in the User document because they are generally small pieces of information owned by the freelancer.

### User Indexes

- Unique index on email.
- Index on role.
- Index on status.
- Optional text or dedicated search indexes for skills and profile discovery.

### Important Rules

- Email must be unique.
- Password must be hashed before storage.
- Admin role must not be publicly selectable during registration.
- Password must never appear in normal API responses.
- Private account information must not be exposed publicly.

---

# 6. Job Collection

Collection name:

```text
jobs
```

The Job collection stores jobs created by clients.

### Job Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Job ID |
| client | ObjectId | Yes | Reference to User |
| title | String | Yes | Job title |
| description | String | Yes | Job description |
| category | String | Yes | Job category |
| skills | Array of Strings | Yes | Required skills |
| budget | Object | Yes | Budget details |
| experienceLevel | String | No | Required experience |
| jobType | String | Yes | fixed or hourly |
| deadline | Date | No | Expected completion date |
| attachments | Array | No | Job attachments |
| status | String | Yes | Job status |
| proposalCount | Number | No | Cached proposal count |
| createdAt | Date | Auto | Creation date |
| updatedAt | Date | Auto | Update date |

### Budget Object

```json
{
  "type": "fixed",
  "amount": 500,
  "currency": "USD"
}
```

For hourly jobs:

```json
{
  "type": "hourly",
  "minRate": 15,
  "maxRate": 30,
  "currency": "USD"
}
```

The exact budget fields should be validated according to the selected job type.

### Job Types

```text
fixed
hourly
```

### Job Status

```text
draft
open
in_progress
completed
closed
cancelled
```

### Job Attachment Example

```json
{
  "fileName": "project-requirements.pdf",
  "fileUrl": "https://example.com/file.pdf",
  "fileType": "application/pdf"
}
```

### Job Indexes

- Index on client.
- Index on status.
- Index on category.
- Index on skills.
- Index on createdAt.
- Compound indexes for common job browsing filters.

### Important Rules

- Only clients can create jobs.
- A job must belong to its creating client.
- Closed jobs should not accept new proposals.
- Job deletion or archival must consider existing proposals and contracts.
- A client must not be able to edit another client's job.

---

# 7. Proposal Collection

Collection name:

```text
proposals
```

The Proposal collection stores applications submitted by freelancers for jobs.

### Proposal Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Proposal ID |
| job | ObjectId | Yes | Reference to Job |
| freelancer | ObjectId | Yes | Reference to User |
| coverLetter | String | Yes | Proposal description |
| proposedBudget | Object | Yes | Freelancer's proposed price |
| estimatedDuration | String | No | Estimated completion time |
| attachments | Array | No | Supporting files |
| status | String | Yes | Proposal status |
| createdAt | Date | Auto | Submission date |
| updatedAt | Date | Auto | Last update date |

### Proposed Budget Example

```json
{
  "amount": 450,
  "currency": "USD",
  "type": "fixed"
}
```

### Proposal Status

```text
pending
accepted
rejected
withdrawn
```

### Proposal Indexes

- Index on job.
- Index on freelancer.
- Index on status.
- Compound index on job and freelancer.

A unique compound index on `{ job, freelancer }` is recommended if the business rule allows only one active proposal per freelancer per job. If withdrawn proposals may be resubmitted, the implementation must account for that rule rather than blindly enforcing permanent uniqueness.

### Important Rules

- Only freelancers can submit proposals.
- A freelancer cannot apply to their own job.
- A freelancer should not submit duplicate active proposals for the same job.
- Only the job owner can accept or reject proposals.
- Proposal acceptance must be handled safely to prevent multiple contracts being created for one job.

---

# 8. Contract Collection

Collection name:

```text
contracts
```

A Contract is created when a client accepts a freelancer's proposal.

It stores the agreement between both parties.

### Contract Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Contract ID |
| job | ObjectId | Yes | Reference to Job |
| proposal | ObjectId | Yes | Reference to Proposal |
| client | ObjectId | Yes | Reference to User |
| freelancer | ObjectId | Yes | Reference to User |
| title | String | Yes | Contract title |
| description | String | No | Contract description |
| totalAmount | Number | Yes | Agreed amount |
| currency | String | Yes | Contract currency |
| paymentType | String | Yes | fixed or hourly |
| startDate | Date | No | Contract start date |
| endDate | Date | No | Expected end date |
| status | String | Yes | Contract status |
| completedAt | Date | No | Completion date |
| createdAt | Date | Auto | Creation date |
| updatedAt | Date | Auto | Update date |

### Contract Status

```text
pending
active
completed
cancelled
disputed
```

Additional states can be introduced when contract acceptance and cancellation workflows are finalized.

### Contract Indexes

- Index on client.
- Index on freelancer.
- Index on job.
- Index on status.
- Index on createdAt.

### Important Rules

- A contract must reference a valid accepted proposal.
- The client and freelancer must match the proposal and job participants.
- Contract ownership must be checked before modification.
- A completed contract should not be modified without an authorized correction process.
- Contract creation and proposal acceptance should be performed atomically where possible.

---

# 9. Milestone Collection

Collection name:

```text
milestones
```

Milestones divide a contract into smaller work stages.

### Milestone Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Milestone ID |
| contract | ObjectId | Yes | Reference to Contract |
| title | String | Yes | Milestone title |
| description | String | No | Work description |
| amount | Number | Yes | Milestone amount |
| currency | String | Yes | Currency |
| dueDate | Date | No | Due date |
| status | String | Yes | Milestone status |
| submissions | Array | No | Deliverable submissions |
| approvedAt | Date | No | Approval date |
| createdAt | Date | Auto | Creation date |
| updatedAt | Date | Auto | Update date |

### Milestone Status

```text
pending
in_progress
submitted
revision_requested
approved
cancelled
```

### Embedded Submission Example

```json
{
  "submittedBy": "USER_OBJECT_ID",
  "message": "The work is completed.",
  "files": [
    {
      "fileName": "final-design.zip",
      "fileUrl": "https://example.com/final-design.zip"
    }
  ],
  "submittedAt": "2026-10-15T10:00:00.000Z"
}
```

Submissions are embedded because they belong to a specific milestone and are normally accessed with that milestone.

If submission history becomes large, it can be moved to a separate collection.

### Milestone Indexes

- Index on contract.
- Index on status.
- Index on dueDate.

### Important Rules

- Total milestone amounts should match the agreed contract amount when the contract uses milestone-based fixed pricing.
- Only the assigned freelancer can submit work.
- Only the authorized client can approve or request revisions.
- Approval and payment processing must be separate, explicitly controlled operations.
- A milestone should not be approved without a valid submission when submission is required.

---

# 10. Conversation Collection

Collection name:

```text
conversations
```

The Conversation collection stores messaging relationships between users.

### Conversation Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Conversation ID |
| participants | Array of ObjectIds | Yes | User references |
| contract | ObjectId | No | Related Contract |
| job | ObjectId | No | Related Job |
| lastMessage | ObjectId | No | Reference to Message |
| lastMessageAt | Date | No | Latest message date |
| createdAt | Date | Auto | Creation date |
| updatedAt | Date | Auto | Update date |

### Participants Example

```json
{
  "participants": [
    "CLIENT_OBJECT_ID",
    "FREELANCER_OBJECT_ID"
  ]
}
```

### Conversation Indexes

- Index on participants.
- Index on lastMessageAt.
- Index on contract.

### Important Rules

- Only authorized users can join a conversation.
- Conversation participants must be verified by the backend.
- A user must not access another user's private conversations.
- Conversation creation should avoid unnecessary duplicates for the same intended participants and context.

---

# 11. Message Collection

Collection name:

```text
messages
```

The Message collection stores individual chat messages.

Messages are stored separately from conversations because conversations may contain a large number of messages.

### Message Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Message ID |
| conversation | ObjectId | Yes | Reference to Conversation |
| sender | ObjectId | Yes | Reference to User |
| content | String | Conditional | Message text |
| attachments | Array | No | Attached files |
| messageType | String | Yes | text, file, image |
| readBy | Array | No | User references and read dates |
| createdAt | Date | Auto | Message date |
| updatedAt | Date | Auto | Update date |

### Message Types

```text
text
file
image
```

### Attachment Example

```json
{
  "fileName": "document.pdf",
  "fileUrl": "https://example.com/document.pdf",
  "mimeType": "application/pdf",
  "size": 102400
}
```

### Message Indexes

- Compound index on conversation and createdAt.
- Index on sender.

### Important Rules

- Sender must be a conversation participant.
- Message content must be validated.
- Private files must be protected.
- Messages must be stored in MongoDB before being reported as successfully sent.
- Socket.IO must not bypass message authorization.

---

# 12. Notification Collection

Collection name:

```text
notifications
```

Notifications inform users about important application events.

### Notification Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Notification ID |
| recipient | ObjectId | Yes | Reference to User |
| sender | ObjectId | No | Reference to User |
| type | String | Yes | Notification type |
| title | String | Yes | Notification title |
| message | String | Yes | Notification content |
| relatedEntityType | String | No | Related resource type |
| relatedEntityId | ObjectId | No | Related resource ID |
| isRead | Boolean | Yes | Read status |
| readAt | Date | No | Read date |
| createdAt | Date | Auto | Creation date |

### Notification Types

```text
new_proposal
proposal_accepted
proposal_rejected
new_message
contract_created
milestone_submitted
milestone_approved
payment_completed
payment_failed
review_received
dispute_created
```

### Notification Indexes

- Compound index on recipient and createdAt.
- Compound index on recipient and isRead.

### Important Rules

- A notification belongs to a recipient.
- Users can only view their own notifications.
- Notifications should not contain sensitive payment information.
- Notification delivery and notification storage are separate concerns.

---

# 13. Payment Collection

Collection name:

```text
payments
```

The Payment collection stores payment-related transaction records.

Payments are processed through an external payment provider.

MongoDB stores transaction metadata and payment status, not raw card details.

### Payment Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Payment ID |
| contract | ObjectId | Yes | Reference to Contract |
| milestone | ObjectId | No | Reference to Milestone |
| client | ObjectId | Yes | Reference to User |
| freelancer | ObjectId | Yes | Reference to User |
| provider | String | Yes | Payment provider |
| providerPaymentId | String | No | Provider transaction ID |
| amount | Number | Yes | Payment amount |
| currency | String | Yes | Currency |
| platformFee | Number | No | Platform fee |
| freelancerAmount | Number | No | Intended freelancer amount |
| status | String | Yes | Payment status |
| paymentType | String | Yes | Payment category |
| idempotencyKey | String | No | Unique request identifier |
| paidAt | Date | No | Successful payment date |
| createdAt | Date | Auto | Creation date |
| updatedAt | Date | Auto | Update date |

### Payment Status

```text
pending
processing
succeeded
failed
cancelled
refunded
partially_refunded
```

### Payment Types

```text
milestone
refund
adjustment
```

Payouts should be modeled separately if the chosen payment provider and marketplace flow require detailed payout tracking.

### Payment Indexes

- Index on contract.
- Index on milestone.
- Index on client.
- Index on freelancer.
- Index on status.
- Unique index on provider and providerPaymentId when the provider ID is present.
- Unique index on idempotencyKey when applicable.

### Important Rules

- Payment status must be verified with the payment provider.
- Never trust frontend payment success messages.
- Verify webhook signatures.
- Use idempotency to prevent duplicate processing.
- Store monetary values consistently using integer minor units or another explicitly defined decimal-safe strategy.
- Do not use floating-point arithmetic for financial calculations.
- Never store raw card numbers, CVVs, or payment credentials.
- Refunds should be tracked as explicit transactions or provider-linked refund records.

The final payment and payout structure depends on the selected payment provider and supported marketplace features.

---

# 14. Review Collection

Collection name:

```text
reviews
```

Reviews allow clients and freelancers to rate each other after a completed contract.

### Review Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Review ID |
| contract | ObjectId | Yes | Reference to Contract |
| reviewer | ObjectId | Yes | User writing review |
| reviewee | ObjectId | Yes | User receiving review |
| rating | Number | Yes | Rating from 1 to 5 |
| comment | String | No | Written feedback |
| createdAt | Date | Auto | Review date |
| updatedAt | Date | Auto | Update date |

### Review Indexes

- Index on reviewee.
- Index on reviewer.
- Unique compound index on contract and reviewer.

### Important Rules

- Only participants of the contract can review each other.
- The contract must meet the completion requirements.
- Rating must be between 1 and 5.
- A reviewer should not submit duplicate reviews for the same contract.
- Users must not review themselves.

---

# 15. Dispute Collection

Collection name:

```text
disputes
```

Disputes allow clients and freelancers to report problems associated with a contract.

### Dispute Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Dispute ID |
| contract | ObjectId | Yes | Reference to Contract |
| milestone | ObjectId | No | Related Milestone |
| raisedBy | ObjectId | Yes | User creating dispute |
| againstUser | ObjectId | Yes | Other participant |
| reason | String | Yes | Dispute reason |
| description | String | Yes | Detailed explanation |
| evidence | Array | No | Supporting files |
| status | String | Yes | Dispute status |
| assignedAdmin | ObjectId | No | Admin reference |
| resolution | String | No | Resolution details |
| resolvedAt | Date | No | Resolution date |
| createdAt | Date | Auto | Creation date |
| updatedAt | Date | Auto | Update date |

### Dispute Status

```text
open
under_review
resolved
rejected
closed
```

### Dispute Indexes

- Index on contract.
- Index on raisedBy.
- Index on status.
- Index on assignedAdmin.

### Important Rules

- A dispute must be associated with an eligible contract.
- Only authorized contract participants can create disputes.
- Only authorized administrators can manage dispute resolutions.
- Evidence files must be protected.
- Important dispute actions should be recorded for auditing.

---

# 16. Report Collection

Collection name:

```text
reports
```

Reports allow users to report inappropriate behavior, suspicious activity, or content.

### Report Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Report ID |
| reportedBy | ObjectId | Yes | User submitting report |
| targetType | String | Yes | user, job, message |
| targetId | ObjectId | Yes | Reported resource ID |
| reason | String | Yes | Report reason |
| description | String | No | Additional details |
| status | String | Yes | Report status |
| assignedAdmin | ObjectId | No | Admin reference |
| adminNotes | String | No | Internal notes |
| resolvedAt | Date | No | Resolution date |
| createdAt | Date | Auto | Report date |
| updatedAt | Date | Auto | Update date |

### Report Status

```text
pending
under_review
resolved
rejected
```

### Report Indexes

- Index on reportedBy.
- Index on targetType and targetId.
- Index on status.
- Index on createdAt.

### Important Rules

- A user cannot submit reports as another user.
- Reports must be accessible only to authorized users and administrators.
- Admin notes should not be exposed to ordinary users.
- Report resolution should be recorded.

---

# 17. AI Interaction Collection

Collection name:

```text
aiInteractions
```

This collection is optional and can be introduced when AI features are implemented.

It can store user requests and generated AI assistance history.

### AI Interaction Schema

| Field | Type | Required | Description |
|---|---|---|---|
| _id | ObjectId | Auto | Interaction ID |
| user | ObjectId | Yes | Reference to User |
| featureType | String | Yes | AI feature used |
| input | String | Yes | User-provided input |
| output | String | No | Generated output |
| provider | String | No | AI provider |
| status | String | Yes | Processing status |
| createdAt | Date | Auto | Request date |
| updatedAt | Date | Auto | Update date |

### Feature Types

```text
job_matching
proposal_assistance
job_description_improvement
profile_assistance
```

### Status

```text
pending
completed
failed
```

### Important Rules

- Do not store unnecessary sensitive user information.
- Apply appropriate retention policies.
- Do not expose another user's AI interaction history.
- Protect AI provider credentials in backend environment variables.
- Validate AI-generated content before using it in important application operations.

---

# 18. Authentication-Related Data

Authentication uses the User collection and securely managed verification and reset tokens.

The following fields may be added to the User schema:

| Field | Type | Purpose |
|---|---|---|
| passwordResetTokenHash | String | Hashed reset token |
| passwordResetExpires | Date | Reset token expiration |
| emailVerificationTokenHash | String | Hashed verification token |
| emailVerificationExpires | Date | Verification expiration |
| passwordChangedAt | Date | Last password change |
| lastLoginAt | Date | Last successful login |

### Authentication Rules

- Passwords must be hashed using bcrypt or Argon2.
- Verification tokens must be cryptographically random.
- Store only token hashes.
- Reset and verification tokens must expire.
- Tokens must be single-use.
- Do not return authentication secrets in API responses.

If refresh tokens or persistent sessions are implemented, consider a separate Session collection to support session revocation and device management.

---

# 19. Embedded Documents vs Referenced Documents

MongoDB supports two main ways of connecting data:

1. Embedded documents.
2. Referenced documents.

FreelanceHub uses both approaches.

### Embedded Documents

Use embedded documents when data belongs to one parent document and is normally accessed together.

Recommended embedded data:

- User location.
- User portfolio entries.
- Job budget.
- Job attachments.
- Milestone submissions.
- Message attachments.
- Notification metadata.
- Dispute evidence metadata.

### Referenced Documents

Use references when data has an independent lifecycle or can grow significantly.

Recommended references:

- User to Job.
- Job to Proposal.
- Proposal to Contract.
- Contract to Milestone.
- Contract to Payment.
- Conversation to Message.
- User to Notification.
- User to Review.
- Contract to Dispute.

### Design Rule

Avoid embedding unlimited messages, notifications, payments, or proposals inside a single document.

Large collections should be stored separately and connected through ObjectId references.

---

# 20. Database Indexing Strategy

Indexes improve database query performance.

FreelanceHub should create indexes for frequently queried fields.

### Recommended Indexes

| Collection | Field | Purpose |
|---|---|---|
| users | email | Login and unique account lookup |
| users | role | Filter users by role |
| users | status | Account status filtering |
| jobs | client | Find jobs created by a client |
| jobs | status | Browse open jobs |
| jobs | category | Job category filtering |
| jobs | skills | Skill-based search |
| jobs | createdAt | Sort jobs by date |
| proposals | job | Find proposals for a job |
| proposals | freelancer | Find a freelancer's proposals |
| proposals | status | Filter proposals |
| contracts | client | Find client contracts |
| contracts | freelancer | Find freelancer contracts |
| contracts | status | Filter contracts |
| milestones | contract | Find contract milestones |
| milestones | status | Filter milestone status |
| conversations | participants | Find conversations |
| messages | conversation, createdAt | Retrieve conversation history |
| notifications | recipient, createdAt | Retrieve user notifications |
| payments | contract | Find contract payments |
| payments | status | Track payment status |
| reviews | reviewee | Retrieve received reviews |
| disputes | status | Admin dispute management |
| reports | status | Admin report management |

Indexes should be added based on actual query patterns and checked using MongoDB query explain plans.

Avoid creating unnecessary indexes because every index increases storage use and write overhead.

---

# 21. Data Validation Rules

Every collection must validate important data before saving it.

### User Validation

- Name is required.
- Email is required and unique.
- Password is required during account creation.
- Role must be an allowed role.
- Hourly rate must be non-negative when provided.
- Email must have a valid format.

### Job Validation

- Title is required.
- Description is required.
- Client reference must be valid.
- Budget must be valid for the selected job type.
- Skills must contain valid entries.
- Job status must be an allowed value.

### Proposal Validation

- Job reference is required.
- Freelancer reference is required.
- Cover letter is required.
- Proposed amount must be valid.
- Proposal status must be allowed.

### Contract Validation

- Job reference is required.
- Proposal reference is required.
- Client and freelancer references are required.
- Total amount must be valid.
- Contract status must be allowed.

### Milestone Validation

- Contract reference is required.
- Title is required.
- Amount must be non-negative.
- Milestone status must be allowed.

### Payment Validation

- Contract reference is required.
- Amount must be positive where required.
- Currency is required.
- Payment status must be allowed.
- Provider identifiers must follow provider-specific rules.

### Review Validation

- Rating must be between 1 and 5.
- Reviewer and reviewee must be different users.
- Contract reference is required.

### General Validation Rules

- Validate ObjectId references.
- Validate strings and lengths.
- Validate numeric ranges.
- Validate dates.
- Validate enum values.
- Validate ownership and permissions in backend business logic.

Mongoose schema validation is important, but it does not replace application-level authorization or transaction rules.

---

# 22. Important Business Rules and Data Integrity

Some rules involve multiple collections and must be enforced by backend services.

### Job and Proposal Rules

1. Only clients can create jobs.
2. Freelancers can submit proposals to open jobs.
3. Clients cannot submit proposals to their own jobs.
4. A proposal must reference an existing job.
5. Accepting a proposal must update the job and proposal consistently.
6. Only one proposal should be accepted for a job unless the product explicitly supports multiple hires.

### Contract Rules

1. Contracts must be created from valid accepted proposals.
2. Contract participants must match the job and proposal.
3. Only authorized participants can access contract details.
4. Contract status transitions must be validated.
5. Completed contracts should not be reopened without an authorized process.

### Milestone Rules

1. Milestones must belong to a valid contract.
2. Milestone amounts must be consistent with the contract pricing model.
3. Only the freelancer can submit deliverables.
4. Only the client can approve deliverables.
5. Payment status must not be inferred from milestone approval alone.

### Payment Rules

1. Payment transactions must be verified with the provider.
2. Webhook events must be verified and processed idempotently.
3. Duplicate payment processing must be prevented.
4. Payment records must not be silently overwritten.
5. Refunds must be recorded and reconciled.

### Review Rules

1. Reviews must be linked to eligible completed contracts.
2. Only contract participants can review each other.
3. Duplicate reviews must be prevented.

### Data Integrity

For operations that update multiple related documents, use MongoDB transactions when supported by the deployment configuration.

For example, accepting a proposal may require:

- Updating the proposal status.
- Updating the job status.
- Creating a contract.
- Rejecting or closing competing active proposals.

These changes should succeed or fail together.

---

# 23. Suggested Mongoose Model File Structure

The models folder should contain one model file per major collection.

```text
server/
│
└── models/
    │
    ├── User.js
    ├── Job.js
    ├── Proposal.js
    ├── Contract.js
    ├── Milestone.js
    ├── Conversation.js
    ├── Message.js
    ├── Notification.js
    ├── Payment.js
    ├── Review.js
    ├── Dispute.js
    ├── Report.js
    └── AIInteraction.js
```

Each model file should:

1. Import Mongoose.
2. Define a schema.
3. Define required fields.
4. Define field types.
5. Add validation.
6. Add enums where necessary.
7. Add indexes.
8. Enable timestamps.
9. Export the model.

### Example Mongoose Model

Example User model:

```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["client", "freelancer", "admin"],
      default: "freelancer",
      required: true
    },

    avatar: {
      type: String,
      default: ""
    },

    bio: {
      type: String,
      default: ""
    },

    skills: {
      type: [String],
      default: []
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: [
        "active",
        "suspended",
        "deactivated",
        "pending_verification"
      ],
      default: "pending_verification"
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;
```

This is a starting example, not the complete final User model. Additional profile and authentication fields should be introduced as required.

---

# 24. Recommended Model Implementation Order

Create the database models in the following order.

### Phase 1: Core User System

1. User.js

The User model is required for authentication and most other database relationships.

### Phase 2: Job and Hiring System

2. Job.js
3. Proposal.js
4. Contract.js
5. Milestone.js

These models support the main freelance marketplace workflow.

### Phase 3: Communication System

6. Conversation.js
7. Message.js
8. Notification.js

These models support messaging and notifications.

### Phase 4: Financial System

9. Payment.js

This model supports payment transaction records.

### Phase 5: Trust and Moderation System

10. Review.js
11. Dispute.js
12. Report.js

These models support reputation, reporting, and dispute management.

### Phase 6: AI Features

13. AIInteraction.js

This model can be added when AI features are implemented.

---

# 25. Environment and Database Security

Database credentials must be stored in the backend environment file.

Example:

```env
MONGO_URI=your_mongodb_connection_string
```

Security requirements:

1. Never commit database credentials to GitHub.
2. Use environment variables.
3. Restrict database access to trusted services.
4. Use strong database credentials.
5. Avoid exposing internal database errors to users.
6. Validate all incoming data.
7. Do not expose password hashes.
8. Use appropriate database backups.
9. Use HTTPS in production.
10. Review database permissions regularly.

---

# 26. Data Retention and Deletion

FreelanceHub should define how long different types of data are retained.

Suggested policies:

- User accounts: retain according to account and legal requirements.
- Jobs: preserve records required for active and historical contracts.
- Proposals: retain relevant hiring history.
- Contracts: preserve financial and contractual records as required.
- Payments: retain transaction records according to applicable financial requirements.
- Messages: define retention and deletion policies.
- Notifications: old notifications may be deleted after an appropriate period.
- Disputes and reports: retain records needed for moderation and audit purposes.

Deleting a user should not automatically delete financial or contractual records that must be retained.

Use a controlled account deactivation or anonymization process where appropriate.

---

# 27. Future Database Improvements

Possible improvements as FreelanceHub grows:

- Advanced job search indexes.
- Search engine integration.
- Dedicated audit log collection.
- Session management collection.
- Separate payout collection.
- Separate refund collection.
- Dedicated file metadata collection.
- AI recommendation history.
- Analytics and reporting collections.
- Data archival strategies.

These improvements should be introduced only when the application requires them.

---

# 28. Related Documentation

| Document | Purpose |
|---|---|
| PROJECT_ROADMAP.md | Development phases and milestones |
| ARCHITECTURE.md | Overall application structure |
| API_DOCUMENTATION.md | API endpoints and request/response formats |
| AUTHENTICATION_FLOW.md | Authentication and authorization workflows |
| DATABASE_SCHEMA.md | Database collections and relationships |

All documents should remain consistent with the actual implementation.

---

# 29. Final Implementation Notes

This document defines the planned MongoDB database structure for FreelanceHub.

It is a design specification, not a statement that all models have already been implemented.

During development:

1. Follow this document when creating Mongoose models.
2. Keep API request and response structures consistent with API_DOCUMENTATION.md.
3. Follow AUTHENTICATION_FLOW.md for user and account security.
4. Follow ARCHITECTURE.md for application structure.
5. Update this document whenever the database design changes.

**The database is the foundation of FreelanceHub. A well-designed database will make the frontend, backend, authentication, job management, contracts, messaging, and payment modules easier to develop and maintain.**
