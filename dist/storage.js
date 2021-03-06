import { InjectionToken } from '@angular/core';
import LocalForage from 'localforage';
import CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
/**
 * Storage is an easy way to store key/value pairs and JSON objects.
 * Storage uses a variety of storage engines underneath, picking the best one available
 * depending on the platform.
 *
 * When running in a native app context, Storage will prioritize using SQLite, as it's one of
 * the most stable and widely used file-based databases, and avoids some of the
 * pitfalls of things like localstorage and IndexedDB, such as the OS deciding to clear out such
 * data in low disk-space situations.
 *
 * When running in the web or as a Progressive Web App, Storage will attempt to use
 * IndexedDB, WebSQL, and localstorage, in that order.
 *
 * @usage
 * First, if you'd like to use SQLite, install the cordova-sqlite-storage plugin:
 * ```bash
 * ionic cordova plugin add cordova-sqlite-storage
 * ```
 *
 * Next, install the package (comes by default for Ionic apps > Ionic V1):
 * ```bash
 * npm install --save @ionic/storage
 * ```
 *
 * Next, add it to the imports list in your `NgModule` declaration (for example, in `src/app/app.module.ts`):
 *
 * ```typescript
 * import { IonicStorageModule } from '@ionic/storage';
 *
 * @NgModule({
 *   declarations: [
 *     // ...
 *   ],
 *   imports: [
 *     BrowserModule,
 *     IonicModule.forRoot(MyApp),
 *     IonicStorageModule.forRoot()
 *   ],
 *   bootstrap: [IonicApp],
 *   entryComponents: [
 *     // ...
 *   ],
 *   providers: [
 *     // ...
 *   ]
 * })
 * export class AppModule {}
 *```
 *
 * Finally, inject it into any of your components or pages:
 * ```typescript
 * import { Storage } from '@ionic/storage';

 * export class MyApp {
 *   constructor(private storage: Storage) { }
 *
 *   ...
 *
 *   // set a key/value
 *   storage.set('name', 'Max');
 *
 *   // Or to get a key/value pair
 *   storage.get('age').then((val) => {
 *     console.log('Your age is', val);
 *   });
 * }
 * ```
 *
 *
 * ### Configuring Storage
 *
 * The Storage engine can be configured both with specific storage engine priorities, or custom configuration
 * options to pass to localForage. See the localForage config docs for possible options: https://github.com/localForage/localForage#configuration
 *
 * Note: Any custom configurations will be merged with the default configuration
 *
 * ```typescript
 * import { IonicStorageModule } from '@ionic/storage';
 *
 * @NgModule({
 *   declarations: [...],
 *   imports: [
 *     IonicStorageModule.forRoot({
 *       name: '__mydb',
         driverOrder: ['indexeddb', 'sqlite', 'websql']
 *     })
 *   ],
 *   bootstrap: [...],
 *   entryComponents: [...],
 *    providers: [...]
 * })
 * export class AppModule { }
 * ```
 */
var Storage = (function () {
    /**
     * Create a new Storage instance using the order of drivers and any additional config
     * options to pass to LocalForage.
     *
     * Possible driver options are: ['sqlite', 'indexeddb', 'websql', 'localstorage'] and the
     * default is that exact ordering.
     */
    function Storage(config) {
        var _this = this;
        this._driver = null;
        this._dbPromise = new Promise(function (resolve, reject) {
            var db;
            var defaultConfig = getDefaultConfig();
            var actualConfig = Object.assign(defaultConfig, config || {});
            LocalForage.defineDriver(CordovaSQLiteDriver).then(function () {
                db = LocalForage.createInstance(actualConfig);
            })
                .then(function () { return db.setDriver(_this._getDriverOrder(actualConfig.driverOrder)); })
                .then(function () {
                _this._driver = db.driver();
                resolve(db);
            })
                .catch(function (reason) { return reject(reason); });
        });
    }
    Object.defineProperty(Storage.prototype, "driver", {
        /**
         * Get the name of the driver being used.
         * @returns {string | null} Name of the driver
         */
        get: function () {
            return this._driver;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Reflect the readiness of the store.
     * @returns {Promise<LocalForage>} Returns a promise that resolves when the store is ready
     */
    Storage.prototype.ready = function () {
        return this._dbPromise;
    };
    Storage.prototype._getDriverOrder = function (driverOrder) {
        return driverOrder.map(function (driver) {
            switch (driver) {
                case 'sqlite':
                    return CordovaSQLiteDriver._driver;
                case 'indexeddb':
                    return LocalForage.INDEXEDDB;
                case 'websql':
                    return LocalForage.WEBSQL;
                case 'localstorage':
                    return LocalForage.LOCALSTORAGE;
            }
        });
    };
    /**
     * Get the value associated with the given key.
     * @param {any} key the key to identify this value
     * @returns {Promise} Returns a promise with the value of the given key
     */
    Storage.prototype.get = function (key) {
        return this._dbPromise.then(function (db) { return db.getItem(key); });
    };
    /**
     * Set the value for the given key.
     * @param {any} key the key to identify this value
     * @param {any} value the value for this key
     * @returns {Promise} Returns a promise that resolves when the key and value are set
     */
    Storage.prototype.set = function (key, value) {
        return this._dbPromise.then(function (db) { return db.setItem(key, value); });
    };
    /**
     * Remove any value associated with this key.
     * @param {any} key the key to identify this value
     * @returns {Promise} Returns a promise that resolves when the value is removed
     */
    Storage.prototype.remove = function (key) {
        return this._dbPromise.then(function (db) { return db.removeItem(key); });
    };
    /**
     * Clear the entire key value store. WARNING: HOT!
     * @returns {Promise} Returns a promise that resolves when the store is cleared
     */
    Storage.prototype.clear = function () {
        return this._dbPromise.then(function (db) { return db.clear(); });
    };
    /**
     * @returns {Promise} Returns a promise that resolves with the number of keys stored.
     */
    Storage.prototype.length = function () {
        return this._dbPromise.then(function (db) { return db.length(); });
    };
    /**
     * @returns {Promise} Returns a promise that resolves with the keys in the store.
     */
    Storage.prototype.keys = function () {
        return this._dbPromise.then(function (db) { return db.keys(); });
    };
    /**
     * Iterate through each key,value pair.
     * @param {any} iteratorCallback a callback of the form (value, key, iterationNumber)
     * @returns {Promise} Returns a promise that resolves when the iteration has finished.
     */
    Storage.prototype.forEach = function (iteratorCallback) {
        return this._dbPromise.then(function (db) { return db.iterate(iteratorCallback); });
    };
    return Storage;
}());
export { Storage };
/** @hidden */
export function getDefaultConfig() {
    return {
        name: '_ionicstorage',
        storeName: '_ionickv',
        driverOrder: ['sqlite', 'indexeddb', 'websql', 'localstorage']
    };
}
;
/** @hidden */
export var StorageConfigToken = new InjectionToken('STORAGE_CONFIG_TOKEN');
/** @hidden */
export function provideStorage(storageConfig) {
    var config = !!storageConfig ? storageConfig : getDefaultConfig();
    return new Storage(config);
}
