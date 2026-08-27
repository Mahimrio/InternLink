const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      processDir(full);
    } else if (f.name.endsWith('.js') && !f.name.endsWith('.d.ts')) {
      const mjs = full.slice(0, -3) + '.mjs';
      try {
        const mod = require(full);
        const keys = Object.keys(mod);
        const namedExports = keys.filter(k => k !== 'default' && k !== '__esModule');
        const lines = [
          `import * as cjs from './${f.name}';`
        ];
        for (const k of namedExports) {
          lines.push(`export const ${k} = cjs.${k} !== undefined ? cjs.${k} : cjs.default?.${k};`);
        }
        lines.push(`export default cjs.default || cjs;`);
        fs.writeFileSync(mjs, lines.join('\n'));
      } catch (e) {}
    }
  }
}

const baseDir = path.join(__dirname, 'node_modules/@base-ui/react');
if (fs.existsSync(baseDir)) {
  processDir(baseDir);
  console.log('Successfully generated ESM bridge files for @base-ui/react');
}
