
import { db } from '../firebase';
import { HistoryItem } from '../types';
import firebase from 'firebase/compat/app';

const COLLECTION = 'history';

// Firestore has a 1MB limit. We set a safe threshold of ~900KB.
const MAX_DOC_SIZE_BYTES = 900 * 1024; 

const getStringSizeInBytes = (str: string) => {
  // Rough estimation for base64 string size in bytes
  return Math.ceil((str.length * 3) / 4);
};

const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 800; // Max width/height for history thumbnail
      let width = img.width;
      let height = img.height;

      // Scale down
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG 0.6 quality
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressed);
      } else {
          resolve(base64Str); // Fallback if context fails
      }
    };

    img.onerror = () => {
      resolve(base64Str); // Fallback on error
    };
  });
};

export const saveToHistory = async (userId: string, item: Omit<HistoryItem, 'id' | 'userId' | 'createdAt'>) => {
  if (!userId) return;
  
  try {
    let finalItem = { ...item };

    // Check for large image URL
    if (finalItem.imageUrl && finalItem.imageUrl.length > 1000) {
        const size = getStringSizeInBytes(finalItem.imageUrl);
        
        if (size > MAX_DOC_SIZE_BYTES) {
            console.log(`[History] Image too large (${Math.round(size/1024)}KB). Compressing...`);
            
            // Try to compress
            try {
                const compressedUrl = await compressImage(finalItem.imageUrl);
                const newSize = getStringSizeInBytes(compressedUrl);
                
                if (newSize < MAX_DOC_SIZE_BYTES) {
                    finalItem.imageUrl = compressedUrl;
                    console.log(`[History] Compressed to ${Math.round(newSize/1024)}KB.`);
                } else {
                    console.warn(`[History] Image still too large (${Math.round(newSize/1024)}KB) after compression. Removing image data.`);
                    delete finalItem.imageUrl; // Remove image to prevent crash, keep prompt
                }
            } catch (e) {
                console.warn("[History] Compression failed, removing image data.");
                delete finalItem.imageUrl;
            }
        }
    }

    await db.collection('users').doc(userId).collection(COLLECTION).add({
      ...finalItem,
      userId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving history:", error);
  }
};

export const clearUserHistory = async (userId: string) => {
  if (!userId) return;
  
  try {
    const snapshot = await db.collection('users').doc(userId).collection(COLLECTION).get();
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error("Error clearing history:", error);
    throw error;
  }
};

export const deleteHistoryItem = async (userId: string, itemId: string) => {
  if (!userId || !itemId) return;
  try {
    await db.collection('users').doc(userId).collection(COLLECTION).doc(itemId).delete();
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
};

export const subscribeToHistory = (userId: string, type: 'photo' | 'design' | 'contract' | 'video' | 'all', callback: (items: HistoryItem[]) => void) => {
  if (!userId) return () => {};
  
  return db.collection('users')
    .doc(userId)
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .onSnapshot((snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HistoryItem[];
      
      const filtered = type === 'all' ? items : items.filter(item => item.type === type);
      callback(filtered);
    });
};
