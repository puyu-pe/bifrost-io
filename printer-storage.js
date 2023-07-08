const { Client } = require('memjs');


class BifrostPrinterStorage {

  constructor(timeExpires) {
    this.memcached = Client.create();
    this.timeExpires = timeExpires;
  }

  async enqueue(namespace, dataToPrint) {
    const queue = await this.getQueue(namespace);
    const created_at = Date.now();
    const register = {
      tickets: JSON.stringify(dataToPrint),
      created_at: new Date(created_at).toString(),
      namespace,
    }
    const memObject = {};
    memObject[`${created_at}`] = JSON.stringify(register);
    //devuelve true si almaceno correctamente la data
    const success = await this.memcached.set(namespace, JSON.stringify({ ...queue, ...memObject }), { expires: this.timeExpires });
    return { success, memObject };
  }

  async dequeue(namespace, created_at) {
    const queue = await this.getQueue(namespace);
    const memObject = queue[created_at];
    delete queue[created_at];
    return memObject && await this.memcached.set(namespace, JSON.stringify({ ...queue }), { expires: this.timeExpires });
  }

  async getQueue(namespace) {
    let queue = {};
    const memData = await this.memcached.get(namespace);
    if (memData.value)
      queue = JSON.parse(memData.value.toString());
    return queue;
  }

  async emptyPrintQueue(namespace) {
    return await this.memcached.delete(namespace);
  }

}

module.exports = { BifrostPrinterStorage };