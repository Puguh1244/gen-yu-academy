import {readFile,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
const result=await build({entryPoints:['public/js/portal/app.js'],bundle:true,format:'iife',platform:'browser',target:'es2022',write:false,minify:true,legalComments:'eof'});
const css=(await readFile('public/css/site.css','utf8'))+'\n'+(await readFile('public/css/portal.css','utf8'));
const logo='data:image/webp;base64,'+(await readFile('public/assets/gen-yu-academy-logo.webp')).toString('base64');
const html=(await readFile('templates/portal.html','utf8')).replaceAll('__LOGO__',logo).replace('__CSS__',()=>css).replace('__BUNDLE__',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
await writeFile('public/portal.html',html);
console.log('Built self-contained portal UI: CSS, logo and application embedded.');
