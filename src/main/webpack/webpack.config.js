const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  entry: ['./webpack.index.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'grapheditor',
    libraryTarget: 'umd',
    filename: 'grapheditor.js',
    umdNamedDefine: true,
    globalObject: 'this',
  },
  module: {
    rules: [
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Graph Editor - Draw.io',
      template: './index.html'
    }),
    getCopyConfig([{
      from: 'mxgraph',
      to: 'mxgraph',
      isJsInclude: true
    }, {
      from: 'js/grapheditor',
      to: 'mxgraph/grapheditor',
      isJsInclude: true
    }, {
      from: 'js/deflate',
      to: 'mxgraph/grapheditor/deflate',
      isJsInclude: true
    }, {
      from: 'js/sanitizer',
      to: 'mxgraph/grapheditor/sanitizer',
      isJsInclude: true
    }, {
      from: 'js/jscolor',
      to: 'mxgraph/grapheditor/jscolor',
      isJsInclude: true
    }, {
      from: 'resources',
      to: 'mxgraph/resources',
      isJsInclude: true
    }, {
      from: 'styles',
      to: 'mxgraph/styles',
      isJsInclude: true
    }, {
      from: 'stencils',
      to: 'mxgraph/stencils',
      isJsInclude: true
    }, {
      from: 'shapes',
      to: 'mxgraph/shapes',
      isJsInclude: true
    }])
  ]
};

function getCopyConfig(copyItems) {
  let patterns = []

  copyItems.forEach(element => {
    patterns.push({
      from: element.from,
      to: element.to,
      // _to: "assets/" + element.to,
      context: "../webapp",
      globOptions: {
        dot: true,
        gitignore: true,
        ignore: [(element.isJsInclude ? "**/*.jss" : ''), "**/*.html", "**/ignored-directory/**"]
      }
    })
  });
  return new CopyPlugin({
    patterns: patterns
  })
}

// {
//   from: "mxgraph",
//   to: "assets/mxgraph",
//   context: "../webapp",
//   globOptions: {
//     dot: true,
//     gitignore: true,
//     ignore: ["**/*.jss", "**/*.html", "**/ignored-directory/**"]
//   }
// },
// {
//   from: "js/grapheditor",
//   to: "assets/mxgraph/grapheditor",
//   context: "../webapp",
//   globOptions: {
//     dot: true,
//     gitignore: true,
//     ignore: ["**/*.html", "**/ignored-directory/**"]
//   }
// }