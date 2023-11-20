const { BifrostPrinterStorage } = require(".");


class BifrostManagerStorage {
  constructor(timeExpires) {
    this.storeSet = new Map();
    this.memcachedTimeExpires = timeExpires;
  }

  provideStorage(nameStorage) {
    if (!this.storeSet.has(nameStorage)) {
      this.storeSet.set(nameStorage, {
        storage: new BifrostPrinterStorage(this.memcachedTimeExpires),
        instances: 0,
      });
    }
    const store = this.storeSet.get(nameStorage);
    store.instances += 1;
    if(store.instances > 2){
      store.instances = 2;
    }
    return store.storage;
  }

  tryDetach(nameStorage) {
    if (!this.storeSet.has(nameStorage)) return;
    const store = this.storeSet.get(nameStorage);
    if (store.instances - 1 === 0) {
      this.storeSet.delete(nameStorage);
    }
    store.instances -= 1;
    return store.instances;
  }
}

module.exports = {
  BifrostManagerStorage,
};
