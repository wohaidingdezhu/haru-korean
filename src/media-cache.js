// Media belongs to this browser and account; blobs never enter progress JSON or cloud sync.
export const mediaCacheKey = (userId, songId) => JSON.stringify([userId || 'local', songId]);

export class MediaCache {
  constructor(database = globalThis.indexedDB) { this.database = database; this.connection = null; }
  async open() {
    if (!this.database) throw Error('当前浏览器不支持保存本机音频。');
    if (!this.connection) this.connection = new Promise((resolve, reject) => {
      const request = this.database.open('haru-local-media', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('media');
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error('请关闭旧的学习页面后再试。'));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); this.connection = null; };
        resolve(db);
      };
    }).catch(error => { this.connection = null; throw error; });
    return this.connection;
  }
  async operation(mode, action) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('media', mode);
      const request = action(transaction.objectStore('media'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error || request.error);
      transaction.onabort = () => reject(transaction.error || Error('音频保存中断。'));
    });
  }
  read(key) { return this.operation('readonly', store => store.get(key)); }
  write(key, file) { return this.operation('readwrite', store => store.put({blob:file,name:file.name || '本地音频',savedAt:new Date().toISOString()}, key)); }
  remove(key) { return this.operation('readwrite', store => store.delete(key)); }
}
