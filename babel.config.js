const fs = require('fs');
const path = require('path');

const settings = {
  "presets": [
    [
      "@babel/env",
      {
        "targets": {
          "node": "6.9.5"
        },
        "corejs": "3.6.5",
        "useBuiltIns": "usage"
      }
    ]
  ]
};

module.exports = settings;

