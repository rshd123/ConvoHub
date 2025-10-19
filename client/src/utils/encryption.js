// Encryption utilities for file handling
export class EncryptionManager {
  static async generateEncryptionKey() {
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
    return key;
  }

  static async exportKey(key) {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  static async importKey(keyString) {
    const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
    return await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static generateIV() {
    return window.crypto.getRandomValues(new Uint8Array(12));
  }

  static async encryptFile(file, encryptionKey) {
    try {
      const fileBuffer = await file.arrayBuffer();
      const iv = this.generateIV();
      
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        encryptionKey,
        fileBuffer
      );

      return {
        encryptedData: new Uint8Array(encryptedData),
        iv: Array.from(iv),
        originalName: file.name,
        originalType: file.type,
        originalSize: file.size,
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('File encryption failed');
    }
  }

  static async decryptFile(encryptedData, iv, encryptionKey, originalType) {
    try {
      console.log('🔓 Starting decryption...');
      console.log('  - Encrypted data type:', encryptedData?.constructor?.name);
      console.log('  - Encrypted data length:', encryptedData?.byteLength || encryptedData?.length);
      console.log('  - IV:', iv);
      console.log('  - IV type:', typeof iv, Array.isArray(iv) ? 'Array' : '');
      console.log('  - IV length:', iv?.length);
      console.log('  - Encryption key:', encryptionKey);
      console.log('  - Original type:', originalType);

      // Convert encryptedData to Uint8Array if it's an ArrayBuffer
      const data = encryptedData instanceof ArrayBuffer
        ? new Uint8Array(encryptedData)
        : new Uint8Array(encryptedData);

      console.log('  - Converted data length:', data.length);
      console.log('  - IV as Uint8Array:', new Uint8Array(iv));

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv),
        },
        encryptionKey,
        data
      );

      console.log('✅ Decryption successful, buffer size:', decryptedBuffer.byteLength);
      return new Blob([decryptedBuffer], { type: originalType || 'application/octet-stream' });
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw new Error('File decryption failed: ' + error.message);
    }
  }
}