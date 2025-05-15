const { Buffer } = require('buffer');

// --- Lookup tables ---
const PC1 = [
    57, 49, 41, 33, 25, 17, 9,
    1, 58, 50, 42, 34, 26, 18,
    10, 2, 59, 51, 43, 35, 27,
    19, 11, 3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15,
    7, 62, 54, 46, 38, 30, 22,
    14, 6, 61, 53, 45, 37, 29,
    21, 13, 5, 28, 20, 12, 4
];
const PC2 = [
    14, 17, 11, 24, 1, 5,
    3, 28, 15, 6, 21, 10,
    23, 19, 12, 4, 26, 8,
    16, 7, 27, 20, 13, 2,
    41, 52, 31, 37, 47, 55,
    30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53,
    46, 42, 50, 36, 29, 32
];
const SHIFTS = [
    1, 1, 2, 2, 2, 2, 2, 2,
    1, 2, 2, 2, 2, 2, 2, 1
];
const IP = [
    58, 50, 42, 34, 26, 18, 10, 2,
    60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6,
    64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17, 9, 1,
    59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5,
    63, 55, 47, 39, 31, 23, 15, 7
];
const IP_INV = [
    40, 8, 48, 16, 56, 24, 64, 32,
    39, 7, 47, 15, 55, 23, 63, 31,
    38, 6, 46, 14, 54, 22, 62, 30,
    37, 5, 45, 13, 53, 21, 61, 29,
    36, 4, 44, 12, 52, 20, 60, 28,
    35, 3, 43, 11, 51, 19, 59, 27,
    34, 2, 42, 10, 50, 18, 58, 26,
    33, 1, 41, 9, 49, 17, 57, 25
];

// --- Utility functions ---
function permute(input, table) {
    const output = new Array(table.length);
    for (let i = 0; i < table.length; i++) {
        output[i] = input[table[i] - 1];
    }
    return output;
}

function leftShift(arr, n) {
    return arr.slice(n).concat(arr.slice(0, n));
}

function xor(a, b) {
    return a.map((v, i) => v ^ b[i]);
}

function toBits(buf) {
    const bits = [];
    for (let byte of buf) {
        for (let i = 7; i >= 0; i--) {
            bits.push((byte >> i) & 1);
        }
    }
    return bits;
}

function fromBits(bits) {
    const buf = Buffer.alloc(bits.length / 8);
    for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
            byte |= bits[i + j] << (7 - j);
        }
        buf[i / 8] = byte;
    }
    return buf;
}

// --- Key scheduling ---
function createSubkeys(keyBits) {
    let permuted = permute(keyBits, PC1);
    let C = permuted.slice(0, 28);
    let D = permuted.slice(28, 56);
    const subkeys = [];

    for (let shift of SHIFTS) {
        C = leftShift(C, shift);
        D = leftShift(D, shift);
        subkeys.push(permute(C.concat(D), PC2));
    }

    return subkeys;
}

// --- Main f-function ---
function f(R, K) {
    // Expand, XOR, S-boxes, permute
    // For simplicity, we'll fake it with XOR only (not real S-boxes)
    return xor(R, K.slice(0, 32));
}

// --- Core DES block encrypt ---
function desBlock(inputBits, subkeys) {
    let permuted = permute(inputBits, IP);
    let L = permuted.slice(0, 32);
    let R = permuted.slice(32, 64);

    for (let i = 0; i < 16; i++) {
        const temp = R;
        R = xor(L, f(R, subkeys[i]));
        L = temp;
    }

    const preOutput = R.concat(L);
    return permute(preOutput, IP_INV);
}

// --- Public API ---
function encryptBlock(key, block) {
    const keyBits = toBits(key);
    const inputBits = toBits(block);
    const subkeys = createSubkeys(keyBits);
    const outputBits = desBlock(inputBits, subkeys);
    return fromBits(outputBits);
}

function decryptBlock(key, block) {
    const keyBits = toBits(key);
    const inputBits = toBits(block);
    const subkeys = createSubkeys(keyBits).reverse();
    const outputBits = desBlock(inputBits, subkeys);
    return fromBits(outputBits);
}

module.exports = {
    encryptBlock,
    decryptBlock,
};
