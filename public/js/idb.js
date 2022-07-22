let db;
const request = indexedDB.open('budgetTracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('transaction', { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        syncDatabase();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['transaction'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('transaction');

    transactionObjectStore.add(record);
}

function syncDatabase() {
    // open a transaction on your pending db
    const transaction = db.transaction(['transaction'], 'readwrite');

    // access your pending object store
    const transactionObjectStore = transaction.objectStore('transaction');

    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(err => {
                    if (err.message) {
                        throw new Error(err);
                    }

                    const transaction = db.transaction(['transaction'], 'readwrite');
                    const transactionObjectStore = transaction.objectStore('transaction');
                    
                    transactionObjectStore.clear();
                    alert('User is back online. Database has been updated')
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

window.addEventListener('online', syncDatabase);