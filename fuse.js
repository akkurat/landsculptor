const { FuseBox, WebIndexPlugin, LESSPlugin, CSSPlugin } = require("fuse-box");
console.log(__dirname)
const path = require('path')
const fuse = FuseBox.init({
  sourceMaps: true,
  homeDir: "src",
  target: "browser@es2019",
  output: "dist/$name.js",
  plugins: [
    [LESSPlugin({
      // relativeUrls: true, 
      // paths: [path.resolve(path.join(__dirname,'styles'))],
    }),
    CSSPlugin({
    })],
    WebIndexPlugin({
      target: 'index.html',
      template: 'pages/index.html',
      bundles: ['basedeps', 'base']
    }),
    WebIndexPlugin({
      template: 'pages/refinement.html',
      target: 'refinement.html',
      bundles: ['refinement'],
    
    }),
  ],
});
fuse.dev(); // launch http server
fuse.bundle("basedeps").instructions("~ main.ts")
// For some reason the order of bundle construction matters
fuse.bundle("base").instructions("> [main.ts]").hmr().watch()
fuse.bundle("refinement").instructions("> refinement.ts").hmr().watch()

fuse.run();
