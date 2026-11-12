import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Post } from '../types';
import { INITIAL_GOVT_POSTS } from '../data/seedData';

const POSTS_COLLECTION = 'posts';

export const postService = {
  // Live listener for real-time updates across all users and admin actions
  subscribeToPosts(
    onData: (posts: Post[]) => void,
    onError?: (err: unknown) => void
  ): Unsubscribe {
    const q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'));
    
    return onSnapshot(
      q,
      (snapshot) => {
        const posts: Post[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          posts.push({
            id: docSnap.id,
            title: data.title || '',
            category: data.category || 'latest-jobs',
            department: data.department || '',
            shortDescription: data.shortDescription || '',
            fullDescription: data.fullDescription || '',
            totalVacancies: data.totalVacancies || '',
            qualification: data.qualification || '',
            ageLimit: data.ageLimit || '',
            startDate: data.startDate || '',
            lastDate: data.lastDate || '',
            examDate: data.examDate || '',
            applicationFee: data.applicationFee || '',
            applyOnlineUrl: data.applyOnlineUrl || '',
            notificationPdfUrl: data.notificationPdfUrl || '',
            officialWebsiteUrl: data.officialWebsiteUrl || '',
            thumbnailUrl: data.thumbnailUrl || 'default',
            isFeatured: Boolean(data.isFeatured),
            isUrgent: Boolean(data.isUrgent),
            authorEmail: data.authorEmail || '',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        });
        onData(posts);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, POSTS_COLLECTION);
      }
    );
  },

  // Fetch all posts once
  async getPosts(): Promise<Post[]> {
    try {
      const q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const posts: Post[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        posts.push({
          id: docSnap.id,
          title: data.title || '',
          category: data.category || 'latest-jobs',
          department: data.department || '',
          shortDescription: data.shortDescription || '',
          fullDescription: data.fullDescription || '',
          totalVacancies: data.totalVacancies || '',
          qualification: data.qualification || '',
          ageLimit: data.ageLimit || '',
          startDate: data.startDate || '',
          lastDate: data.lastDate || '',
          examDate: data.examDate || '',
          applicationFee: data.applicationFee || '',
          applyOnlineUrl: data.applyOnlineUrl || '',
          notificationPdfUrl: data.notificationPdfUrl || '',
          officialWebsiteUrl: data.officialWebsiteUrl || '',
          thumbnailUrl: data.thumbnailUrl || 'default',
          isFeatured: Boolean(data.isFeatured),
          isUrgent: Boolean(data.isUrgent),
          authorEmail: data.authorEmail || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      });
      return posts;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, POSTS_COLLECTION);
    }
  },

  // Create new government notification post
  async createPost(postData: Omit<Post, 'id'>): Promise<string> {
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const postRef = doc(db, POSTS_COLLECTION, postId);
    
    try {
      const cleanData = {
        title: postData.title,
        category: postData.category,
        department: postData.department,
        shortDescription: postData.shortDescription,
        fullDescription: postData.fullDescription,
        totalVacancies: postData.totalVacancies || '',
        qualification: postData.qualification || '',
        ageLimit: postData.ageLimit || '',
        startDate: postData.startDate || '',
        lastDate: postData.lastDate || '',
        examDate: postData.examDate || '',
        applicationFee: postData.applicationFee || '',
        applyOnlineUrl: postData.applyOnlineUrl || '',
        notificationPdfUrl: postData.notificationPdfUrl || '',
        officialWebsiteUrl: postData.officialWebsiteUrl,
        thumbnailUrl: postData.thumbnailUrl || 'default',
        isFeatured: Boolean(postData.isFeatured),
        isUrgent: Boolean(postData.isUrgent),
        authorEmail: postData.authorEmail || '',
        createdAt: postData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(postRef, cleanData);
      return postId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${POSTS_COLLECTION}/${postId}`);
    }
  },

  // Update existing post
  async updatePost(id: string, updates: Partial<Post>): Promise<void> {
    const postRef = doc(db, POSTS_COLLECTION, id);
    try {
      const cleanUpdates: Record<string, unknown> = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      // Don't modify the ID itself in fields
      delete cleanUpdates.id;

      await updateDoc(postRef, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${POSTS_COLLECTION}/${id}`);
    }
  },

  // Delete post
  async deletePost(id: string): Promise<void> {
    const postRef = doc(db, POSTS_COLLECTION, id);
    try {
      await deleteDoc(postRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${POSTS_COLLECTION}/${id}`);
    }
  },

  // Seed authentic initial posts if Firestore is newly initialized
  async seedInitialPosts(): Promise<number> {
    try {
      let count = 0;
      for (const item of INITIAL_GOVT_POSTS) {
        const postId = `seed_${Date.now()}_${count}_${Math.random().toString(36).substring(2, 6)}`;
        const postRef = doc(db, POSTS_COLLECTION, postId);
        await setDoc(postRef, {
          ...item,
          createdAt: new Date(Date.now() - count * 3600000).toISOString(),
          updatedAt: new Date().toISOString()
        });
        count++;
      }
      return count;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, POSTS_COLLECTION);
    }
  }
};
