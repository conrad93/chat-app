import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  secretKeyHex = "b44b34b77960d2f1fe66de2470fa82b9";

  constructor() { }

  async importKey(): Promise<CryptoKey> {
    const keyData = this.hexStringToArrayBuffer(this.secretKeyHex);
    return await window.crypto.subtle.importKey(
      'raw', // raw format of the key - the key is not encoded in any specific format
      keyData, // the key in ArrayBuffer format
      { name: 'AES-CBC', length: 128 }, // specifying the algorithm details
      true, // whether the key is extractable (i.e. can be exported and visible to the application)
      ['encrypt', 'decrypt']  // what this key can be used for
    );
  }

  async encryptMessage(message: string, key: CryptoKey): Promise<{ iv: string, encryptedData: string }> {
    const encodedMessage = new TextEncoder().encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(16));

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: iv
      },
      key,
      encodedMessage
    );

    return {
      iv: this.arrayBufferToHex(iv),
      encryptedData: this.arrayBufferToHex(encryptedData)
    };
  }

  async decryptData(encryptedData: string, ivHex: string) {
    const iv = this.hexStringToUint8Array(ivHex);
    const encrypted = this.hexStringToUint8Array(encryptedData);
    const keyBuffer = this.hexStringToArrayBuffer(this.secretKeyHex);

    const key = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-CBC', length: 128 },
      false, // whether the key is extractable (i.e. can be used in exportKey)
      ['decrypt'] // can "decrypt" using this key
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      encrypted
    );

    let response = JSON.parse(new TextDecoder().decode(new Uint8Array(decrypted)));
    return response;
  }

  private hexStringToUint8Array(hexString: string): Uint8Array {
    const result = new Uint8Array(hexString.length / 2);
    for (let i = 0, j = 0; i < hexString.length; i += 2, j++) {
      result[j] = parseInt(hexString.substring(i, i + 2), 16);
    }
    return result;
  }

  private hexStringToArrayBuffer(hexString: string): ArrayBuffer {
    return this.hexStringToUint8Array(hexString).buffer;
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.prototype.map.call(new Uint8Array(buffer), x => x.toString(16).padStart(2, '0')).join('');
  }
}
