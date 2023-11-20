const { Client } = require("memjs");

const { Mutex } = require("async-mutex");

class BifrostPrinterStorage {
  constructor(timeExpires) {
    this.memcached = Client.create();
    this.timeExpires = timeExpires;
    this.enqueueMutex = new Mutex();
    this.dequeueMutex = new Mutex();
    this.on_queue = () => { };
  }

  async enqueue(namespace, dataToPrint) {
    return this.enqueueMutex.runExclusive(async () => {
      const queue = await this.getQueue(namespace);
      const created_at = Date.now();
      const register = {
        tickets: JSON.stringify(dataToPrint),
        created_at: new Date(created_at).toString(),
        namespace,
      };
      const memObject = {};
      memObject[`${created_at}`] = JSON.stringify(register);
      //devuelve true si almaceno correctamente la data
      const success = await this.memcached.set(
        namespace,
        JSON.stringify({ ...queue, ...memObject }),
        { expires: this.timeExpires }
      );
      this.on_queue(memObject);
      return { success, key: created_at, memObject };
    });
  }

  async dequeue(namespace, created_at) {
    return this.dequeueMutex.runExclusive(async () => {
      const queue = await this.getQueue(namespace);
      const existsForDelete = queue.hasOwnProperty(created_at);
      if (existsForDelete) {
        delete queue[created_at];
        await this.memcached.set(namespace, JSON.stringify({ ...queue }), {
          expires: this.timeExpires,
        });
      }
      return existsForDelete;
    });
  }

  async getQueue(namespace) {
    let queue = {};
    const memData = await this.memcached.get(namespace);
    if (memData.value) queue = JSON.parse(memData.value.toString());
    return queue;
  }

  async numberItemsInQueue(namespace) {
    const queue = await this.getQueue(namespace);
    return Object.keys(queue).length;
  }

  async emptyPrintQueue(namespace) {
    return await this.memcached.delete(namespace);
  }

  setOnQueue(on_queue) {
    this.on_queue = on_queue;
  }
}

module.exports = { BifrostPrinterStorage };
