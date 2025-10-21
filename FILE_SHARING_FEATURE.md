# Encrypted File Sharing – ConvoHub

## Overview
ConvoHub uses **AES-256-GCM symmetric encryption** to secure file sharing between users.  
All files are **encrypted directly in the browser (client-side)** before being uploaded.  
This ensures that **no plaintext data or keys ever leave the user’s device**.

- **What’s encrypted:** Files.  
- **Encryption type:** **Symmetric Encryption (AES-256-GCM)**  
- **Shared key:** One “conversation key” known to all users in a chat.  
- **IV (Initialization Vector):** A fresh random 12-byte IV is created per file.  
- **Storage:** Only ciphertext (the encrypted data) is stored in **Amazon S3**.  
- **Decryption:** The same shared key + IV is used to unlock the file in the browser.  
- **Download:** Files are served securely via `/download/:key` (backend proxy) to prevent direct S3 access and avoid CORS issues.

---

## 🧠 How AES-256-GCM Works

**AES-256-GCM** stands for:
- **AES (Advanced Encryption Standard):** A strong, industry-standard cipher.
- **256-bit key:** Extremely secure — the “conversation key” is 256 bits long.
- **GCM (Galois/Counter Mode):** Provides both  
  - *Encryption (confidentiality)* and  
  - *Integrity (tamper protection)* via an authentication tag.

It’s called **symmetric encryption** because the **same key** is used to lock and unlock files — similar to a password-protected ZIP file.

---

## 🔑 Key Concept

- All users in the same conversation share one secret key (the “conversation key”).  
- Example:
  ```js
  // Everyone in the chat has the same key
  const conversationKey = "ABC123";
