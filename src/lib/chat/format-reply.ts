// Keep model text readable in a narrow chat panel without rendering model HTML.
export function formatCareReply(reply:string){
 const lines=reply.split(/\r?\n/),result:string[]=[];
 const cells=(line:string)=>line.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
 for(let i=0;i<lines.length;i++){
  if(lines[i].trim().startsWith('|')&&/^\s*\|?[\s:|-]+\|\s*$/.test(lines[i+1]||'')){
   const headings=cells(lines[i]);i+=2;
   while(i<lines.length&&lines[i].trim().startsWith('|')){
    const row=cells(lines[i]);result.push(row[0]+' — '+row.slice(1).map((value,index)=>headings[index+1]+': '+value).join('; '));i++;
   }
   i--;continue;
  }
  result.push(lines[i]);
 }
 return result.join('\n').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/(?:https:\/\/(?:www\.)?plentovo\.com)?\/product\/[a-z0-9-]+/g,'the product card below');
}
