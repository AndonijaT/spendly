import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "./firebaseConfig"; // using the existing file

export async function inviteUserToSharedAccount(inviteeEmail: string) {
  // finding the user by their email
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", inviteeEmail));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("User not found");
  }

  // getting their UID
  const inviteeDoc = querySnapshot.docs[0];
  const inviteeUID = inviteeDoc.id;

  // getting the current user
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Not authenticated");

  // adding the invitee’s UID to the current user’s `sharedWith` array
  const currentUserRef = doc(db, "users", currentUser.uid);
  await updateDoc(currentUserRef, {
    sharedWith: arrayUnion(inviteeUID),
  });

  return inviteeUID;
}
