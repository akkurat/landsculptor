const { FuseBox, WebIndexPlugin, LESSPlugin, CSSPlugin } = require("fuse-box");
const path = require('path')
const fuse = FuseBox.init({
  homeDir: "src",
  target: "browser@es2019",
  output: "dist/$name.js",
  plugins: [
    WebIndexPlugin({
      target: 'index.html',
      template: 'pages/index.html',
      bundles: ['basedeps', 'base']
    }),
    WebIndexPlugin({
      template: 'pages/refinement.html',
      target: 'refinement.html',
      bundles: ['refinement']
    }),
    LESSPlugin({
      relativeUrls: true, 
      paths: [path.resolve(__dirname, "node_modules")],
    }),
    CSSPlugin()
  ],
});
fuse.dev(); // launch http server
fuse.bundle("base").instructions("> [base.ts]").hmr().watch()
fuse.bundle("basedeps").instructions("~ base.ts").hmr().watch()
fuse.bundle("refinement").instructions("> refinement.ts").hmr().watch()

fuse.run();
