const { Buffer } = require('buffer');
const des = require('./des-ecb');

// --- CBC Mode wrapper ---
function encrypt(key, iv, plaintext) {
    if (plaintext.length % 8 !== 0) {
        throw new Error('DES plaintext must be multiple of 8 bytes');
    }

    let prevBlock = Buffer.from(iv);
    let out = Buffer.alloc(plaintext.length);

    for (let i = 0; i < plaintext.length; i += 8) {
        const block = Buffer.alloc(8);
        for (let j = 0; j < 8; j++) {
            block[j] = plaintext[i + j] ^ prevBlock[j];
        }

        const encryptedBlock = des.encryptBlock(key, block);

        encryptedBlock.copy(out, i);
        prevBlock = encryptedBlock;
    }

    return out;
}

function decrypt(key, iv, ciphertext) {
    if (ciphertext.length % 8 !== 0) {
        throw new Error('DES ciphertext must be multiple of 8 bytes');
    }

    let prevBlock = Buffer.from(iv);
    let out = Buffer.alloc(ciphertext.length);

    for (let i = 0; i < ciphertext.length; i += 8) {
        const block = ciphertext.slice(i, i + 8);
        const decryptedBlock = des.decryptBlock(key, block);

        for (let j = 0; j < 8; j++) {
            out[i + j] = decryptedBlock[j] ^ prevBlock[j];
        }

        prevBlock = block;
    }

    return out;
}

module.exports = {
    encrypt,
    decrypt,
};
