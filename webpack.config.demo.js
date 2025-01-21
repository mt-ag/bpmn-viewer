const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    bundle: [path.resolve(__dirname, "index.js")],
  },
  output: {
    path: path.resolve(__dirname, "demo"),
    filename: "bundle.js",
    library: "bpmnViewer",
    libraryTarget: "var",
    libraryExport: "default",
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "demo.html"),
          to: "./index.html",
        },
        {
          from: path.resolve(__dirname, "assets/css/flows4apex.viewer.css"),
          to: "assets/css/flows4apex.viewer.css",
        },
        {
          from: path.resolve(__dirname, "diagrams"),
          to: "assets/diagrams",
        },
      ],
    }),
  ],
  devtool: "source-map",
  devServer: {
    compress: true,
    port: 8084,
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
