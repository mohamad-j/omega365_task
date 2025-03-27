/**
 * Truncates a given string to a given length, adding an ellipsis
 * if the string is longer than the given length.
 * @param {string} str - The string to truncate.
 * @param {number} [limit=20] - The maximum length of the string.
 * @returns {string} The truncated string.
 */
function truncateString(str = "", limit = 20) {
  if (str.length > limit) {
    return str.slice(0, limit) + "...";
  } else {
    return str;
  }
}

/**
 * Returns a new string with the first letter capitalized.
 * @param {string} string - The string to capitalize.
 * @returns {string} The capitalized string.
 */
function capitalizeFirstLetter(string = "") {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Displays a loader animation within the given jQuerycontainer. Must be manually removed.
 * @param {string} container - The jQuery selector for the container to display
 *   the loader in.
 */
function displayLoader(container) {
  const loaderHtml = `<div class="loader-container container-fluid text-center"><div class="loader"></div></div>`;
  $(container).html(loaderHtml);
}

/**
 * Returns an object with methods for interacting with an IndexedDB.
 * @returns {{init: function, addData: function, getDataById: function, getAllDAta: function, deleteItem: function, clearStore: function}}
 */
const useIDB = (() => {
  let db = null;
  let dbName = null;
  let storeName = null;

  /**
   * Initializes the IndexedDB by opening a connection with the specified database name and version.
   * If the specified object store does not exist, it creates the object store with an "id" keyPath
   * and an index on "postId". Resolves with the database instance upon successful connection.
   *
   * @param {string} _dbName - The name of the database to be opened or created.
   * @param {number} [version=1] - The version of the database. Defaults to 1.
   * @param {string} _storeName - The name of the object store to be used or created.
   * @returns {Promise<IDBDatabase>} A promise that resolves to the opened database instance.
   */

  async function init(_dbName, version = 1, _storeName) {
    dbName = _dbName;
    storeName = _storeName;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("postId", "postId", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        console.log(`[IndexedDB] ${dbName} opened successfully.`);
        resolve(db);
      };

      request.onerror = (event) => {
        console.error(
          `[IndexedDB] Error opening ${dbName}:`,
          event.target.errorCode
        );
        reject(event.target.errorCode);
      };
    });
  }

  async function addData(data) {
    if (!db || !storeName) {
      throw new Error("IndexedDB is not initialized.");
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      const item = {
        ...data,
        createdAt: new Date(),
      };

      const req = store.add(item);
      req.onsuccess = () => resolve(item);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function getDataByKey(keyName, key) {
    if (!keyName || key === undefined) {
      throw new Error("Both keyName and key are required.");
    }
    if (!db || !storeName) {
      throw new Error("IndexedDB is not initialized.");
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(keyName);
      const req = index.getAll(IDBKeyRange.only(key));

      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function getAllData() {
    if (!db || !storeName) {
      throw new Error("IndexedDB is not initialized.");
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function deleteItem(id) {
    if (!db || !storeName) {
      throw new Error("IndexedDB is not initialized.");
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function clearStore() {
    if (!db || !storeName) {
      throw new Error("IndexedDB is not initialized.");
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }

  return {
    init,
    addData,
    getDataByKey,
    getAllData,
    deleteItem,
    clearStore,
  };
})();
