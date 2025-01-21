const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    "flows4apex.viewer": [path.resolve(__dirname, "index.js")],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].min.js",
    library: "bpmnViewer",
    libraryTarget: "var",
    libraryExport: "default",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["css-loader"],
      },
      {
        test: /\.ttf$/,
        use: ["file-loader"],
      },
    ],
  },
};
