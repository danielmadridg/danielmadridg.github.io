# Implementation Plan: Friend Requests System & Username Uniqueness Fix

## Part 1: Fix Username Uniqueness Bug

### Problem
Users can create multiple accounts with the same username, which should be impossible.

### Root Cause
The `checkUsernameAvailability` Cloud Function is not properly enforcing uniqueness or there's a race condition.

### Solution
1. Verify the Cloud Function is working correctly
2. Add an additional client-side check during profile updates
3. Add a pre-signup validation to ensure username isn't already taken
4. Consider adding a database trigger or unique constraint at Firestore level

### Implementation Steps
1. Check if Cloud Function exists and is working properly
2. If not, document the issue and ensure the function validates against the `users` collection
3. Add database rules to prevent duplicate usernames at Firestore level

---

## Part 2: Friend Requests System

### Data Structure

#### New Collections/Documents
1. **`friendRequests/{requestId}`** - Document containing:
   - `from: string` (sender userId)
   - `to: string` (receiver userId)
   - `status: 'pending' | 'accepted' | 'rejected'` (default: pending)
   - `createdAt: string` (ISO timestamp)
   - `fromUsername: string` (cache for display)
   - `toUsername: string` (cache for display)

2. **`users/{userId}/friends`** (subcollection) - Array of friend userIds:
   - `friendId: string`
   - `friendUsername: string`
   - `addedAt: string` (ISO timestamp)

#### New Type in TypeScript
```typescript
export interface FriendRequest {
  id: string;
  from: string;
  to: string;
  fromUsername: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Friend {
  friendId: string;
  friendUsername: string;
  addedAt: string;
}
```

### UI Changes

#### Friends Page Updates
1. Add tabs/sections:
   - "Search & Add Friends" (existing search)
   - "Friend Requests" (pending requests)
   - "My Friends" (list of accepted friends)

2. Search Results:
   - Show "Add Friend" button if not already friends
   - Show "Request Sent" if request is pending
   - Show "Already Friends" if already friends

3. Friend Requests Section:
   - Show pending requests sent TO the current user
   - "Accept" and "Reject" buttons for each request
   - Show request sender's info

4. My Friends Section:
   - List all accepted friends
   - Option to unfriend or view profile

### Utility Functions (new file: `src/utils/friendRequests.ts`)

1. `sendFriendRequest(fromUserId: string, toUserId: string, fromUsername: string, toUsername: string): Promise<void>`
2. `acceptFriendRequest(requestId: string, fromUserId: string, toUserId: string): Promise<void>`
3. `rejectFriendRequest(requestId: string): Promise<void>`
4. `getPendingRequests(userId: string): Promise<FriendRequest[]>`
5. `getFriends(userId: string): Promise<Friend[]>`
6. `checkFriendshipStatus(userId1: string, userId2: string): Promise<'none' | 'pending' | 'friends'>`
7. `unfriend(userId1: string, userId2: string): Promise<void>`

### Context Updates

Update `StoreContext` or create new `FriendsContext` to:
- Store list of friends
- Store pending friend requests
- Provide functions to send/accept/reject requests

### Component Changes

1. **Friends.tsx** - Main refactor:
   - Add state for viewing different sections (search, requests, friends)
   - Add Friend Requests sub-section
   - Add My Friends sub-section
   - Update search results to show friend action buttons
   - Add logic to check friendship status for each search result

2. **New hooks** if needed for friend management

### Database Security Rules

Ensure Firestore rules:
- Only allow users to view their own friend requests
- Only allow accepting own friend requests
- Prevent duplicate friend requests
- Prevent self-friending
- Only allow modifying one's own friends list

---

## Implementation Order

1. **Fix Username Bug** - Debug and fix the username uniqueness issue
2. **Add Types** - Update `types/index.ts` with FriendRequest and Friend interfaces
3. **Create Utils** - Create `utils/friendRequests.ts` with all friend request functions
4. **Update Friends Page** - Refactor Friends.tsx to show requests and friends
5. **Test** - Test sending requests, accepting, rejecting, and viewing friends
6. **Polish UI** - Add loading states, error handling, empty states

---

## Files to Create/Modify

### Create:
- `src/utils/friendRequests.ts`

### Modify:
- `src/types/index.ts` (add FriendRequest, Friend interfaces)
- `src/pages/Friends.tsx` (major refactor)
- `src/locales/translations.ts` (add new translation keys)

### Database:
- Create Firestore collections: `friendRequests`, update `users` subcollections
- Update security rules

---

## Translation Keys Needed

- `friend_requests` - "Friend Requests"
- `my_friends` - "My Friends"
- `add_friend` - "Add Friend"
- `request_sent` - "Request Sent"
- `already_friends` - "Already Friends"
- `accept` - "Accept"
- `reject` - "Reject"
- `unfriend` - "Unfriend"
- `no_friend_requests` - "No pending friend requests"
- `no_friends` - "No friends yet"
- `sent_friend_request_to` - "Sent friend request to {username}"
- `accepted_friend_request_from` - "Accepted friend request from {username}"
- `rejected_friend_request_from` - "Rejected friend request from {username}"
