import type { User } from 'firebase/auth';
import type { DocumentData } from 'firebase/firestore';

// The Firestore `Users` doc is the source of truth for a user's name (it is what friends
// see). Auth `displayName` is only set at sign-up and can be missing, so it is a fallback.
export function getDisplayName(user?: User | null, userDocument?: DocumentData) {
  const docName = [userDocument?.firstName, userDocument?.lastName]
    .filter((part) => part && part !== 'Unknown')
    .join(' ');
  return docName || user?.displayName || user?.email || '';
}

export default { getDisplayName };
