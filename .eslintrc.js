
module.exports = {
  "extends": "airbnb",
  "env": {
    "browser": true,
    "node": true
  },
  "plugins": [
    "react",
    "jsx-a11y",
    "import"
  ],
  "settings": {
    "import/resolver": {
      "webpack": {
        "config": "webpack.config.js"
      }
    }
  },
  "rules": {
    "react/prefer-stateless-function": [
      "off",
      {
        "ignorePureComponents": true
      }
    ],
    "import/no-extraneous-dependencies": ["off", {devDependencies: true}],
    "comma-dangle": "off",
    "no-console": "off"
  }
};
