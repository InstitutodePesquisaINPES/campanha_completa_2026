const fs=require('fs');
const path=require('path');
function walk(dir){
  let results=[];
  const list=fs.readdirSync(dir);
  list.forEach(file=>{
    file=path.resolve(dir,file);
    const stat=fs.statSync(file);
    if(stat&&stat.isDirectory()){
      results=results.concat(walk(file));
    }else if(file.endsWith('.tsx')||file.endsWith('.ts')){
      results.push(file);
    }
  });
  return results;
}
const files=walk('./src');
files.forEach(f=>{
  const content=fs.readFileSync(f,'utf8');
  if(content.includes('useState(')){
    const hasImport=/import.*\{[^}]*useState[^}]*\}.*from\s+['"]react['"]/.test(content);
    const usesReactUseState=content.includes('React.useState');
    if(!hasImport&&!usesReactUseState){
      console.log(f);
    }
  }
});
