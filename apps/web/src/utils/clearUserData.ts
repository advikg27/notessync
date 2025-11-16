/**
 * Utility to completely clear all user data from the browser
 * This ensures no data leakage between different user sessions
 */

export function clearAllUserData() {
  console.log('🧹 Clearing all user data...');
  
  // 1. Clear all localStorage keys
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Failed to clear localStorage key:', key, e);
      }
    });
    localStorage.clear();
    console.log('✅ localStorage cleared');
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
  
  // 2. Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
  } catch (e) {
    console.error('Failed to clear sessionStorage:', e);
  }
  
  // 3. Clear React Query cache
  try {
    if ((window as any).queryClient) {
      (window as any).queryClient.clear();
      console.log('✅ React Query cache cleared');
    }
  } catch (e) {
    console.error('Failed to clear query cache:', e);
  }
  
  // 4. Clear any IndexedDB data (if used in future)
  try {
    if (window.indexedDB) {
      // This is a more aggressive approach for future-proofing
      // Currently we don't use IndexedDB, but this ensures it's clean
      indexedDB.databases?.().then((databases) => {
        databases.forEach((db) => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
  } catch (e) {
    console.error('Failed to clear IndexedDB:', e);
  }
  
  console.log('✨ All user data cleared successfully');
}

/**
 * Clear only React Query cache (for lighter operations like logout)
 */
export function clearQueryCache() {
  try {
    if ((window as any).queryClient) {
      (window as any).queryClient.clear();
      console.log('✅ React Query cache cleared');
    }
  } catch (e) {
    console.error('Failed to clear query cache:', e);
  }
}

