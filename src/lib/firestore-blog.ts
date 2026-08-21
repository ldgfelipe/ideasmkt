import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

export interface FirestorePost {
  id?: string;
  title: string;
  description: string;
  content: string;
  pubDate: Timestamp | null;
  author: string;
  tags: string[];
  readingTime: string;
  coverUrl: string;
  coverPath: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COLLECTION = 'posts';

export async function getAllPosts(): Promise<FirestorePost[]> {
  const q = query(collection(db, COLLECTION), orderBy('pubDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as FirestorePost[];
}

export async function getPostById(id: string): Promise<FirestorePost | null> {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FirestorePost;
}

export async function createPost(
  post: Omit<FirestorePost, 'id' | 'createdAt' | 'updatedAt'>,
  coverFile?: File
): Promise<string> {
  let coverUrl = post.coverUrl || '';
  let coverPath = post.coverPath || '';

  if (coverFile) {
    const result = await uploadCoverImage(coverFile);
    coverUrl = result.url;
    coverPath = result.path;
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...post,
    coverUrl,
    coverPath,
    pubDate: post.pubDate || serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

export async function updatePost(
  id: string,
  post: Partial<Omit<FirestorePost, 'id' | 'createdAt'>>,
  coverFile?: File
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  const updateData: Record<string, unknown> = {
    ...post,
    updatedAt: serverTimestamp()
  };

  if (coverFile) {
    const existingPost = await getPostById(id);
    if (existingPost?.coverPath) {
      await deleteCoverImage(existingPost.coverPath);
    }
    const result = await uploadCoverImage(coverFile);
    updateData.coverUrl = result.url;
    updateData.coverPath = result.path;
  }

  await updateDoc(docRef, updateData);
}

export async function deletePost(id: string): Promise<void> {
  const post = await getPostById(id);
  if (post?.coverPath) {
    await deleteCoverImage(post.coverPath);
  }
  await deleteDoc(doc(db, COLLECTION, id));
}

async function uploadCoverImage(file: File): Promise<{ url: string; path: string }> {
  const path = `blog-covers/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

async function deleteCoverImage(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch {
    // Image may not exist
  }
}
