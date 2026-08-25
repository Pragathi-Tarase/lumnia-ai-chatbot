# Security Specification for Lumina AI Chat

## 1. Data Invariants
- **Owner-Exclusive Isolation**: Only the authenticated user whose `UID` matches the `{userId}` wildcard in path `/users/{userId}` or `/users/{userId}/messages/{messageId}` can read or write documents.
- **Identity Integrity**: For profile and messages created, the `id` field must strictly match the `{userId}` or be under their subcollection.
- **Timestamp Veracity**: Message and profile timestamps can only be updated to `request.time` (server timestamp) or match valid date formats.
- **Immutable Historical Metadata**: Sentiment or tone computed metrics cannot be modified after creation by normal users.
- **Strict Keys**: No unlisted keys (ghost fields) can be written to firestore documents to prevent schema spoofing.

---

## 2. The "Dirty Dozen" Spoof Payloads

1. **Spoofed User Registration**: Attempting to create user custom profiles for userid `bob` with `request.auth.uid` as `alice`.
2. **Shadow Field Injection (User)**: Writing user profile with additional unmapped fields: `isAdmin: true`.
3. **Ghost Status Promotion**: Promoting user status to `premium_unlimited` by writing unauthorized keys of user profile.
4. **Altered Message Author**: Attempting to write a message with fake role or other users' credentials.
5. **No-Verification Read**: Attempting to list users or read another user's messages without an active authenticated session.
6. **Malicious Message ID Characters**: Sending `/users/{userId}/messages/malicious-$$$--###` consisting of non-alphanumeric unicode string.
7. **Size Attack (Poisoning)**: Writing a message with `text` content of size 10MB to crash standard Firestore client budgets.
8. **Spoofed Creation Timestamp**: Setting `createdAt` of user record to a future date (e.g., 2029) or past date rather than `request.time`.
9. **Sentiment Override**: User updating existing AI-generated message results or changing sentiment score from negative to positive.
10. **Role Spoofing on Create**: Specifying `isAdmin: true` inside a new user account profile registration document.
11. **Email Spoofing (Unverified Email)**: Authenticating as an unverified user and writing profile records.
12. **Bypassing Invariant Path Variables**: Attempting to access subcollection endpoint of other users.

---

## 3. The Rules Audit Runner Configuration
Below is a verification blueprint for checking compliance:

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Test Bob accessing Alice's storage blocks inside Firestore Rules Unit Tests
describe('Lumina Firebase Rules Unit Test', () => {
  it('prevents Bob from reading Alice\'s messages', async () => {
    // ... tests the deny block ...
  });
});
```
