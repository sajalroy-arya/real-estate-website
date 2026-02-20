const http = require('http');
const fs = require('fs');
const path = require('path');
const root = 'c:\\Users\\sajal\\Your Real Estate Web';
const mime = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.webp':'image/webp'};
http.createServer((req,res)=>{
  let p = path.join(root, req.url==='/'?'index.html':req.url);
  if(!fs.existsSync(p)){res.writeHead(404);res.end('Not found');return;}
  const ext = path.extname(p);
  res.writeHead(200,{'Content-Type':mime[ext]||'text/plain'});
  fs.createReadStream(p).pipe(res);
}).listen(3000,()=>console.log('Server running at http://localhost:3000'));
