// Generated file from ./compileJavascriptRunner.mjs
export const javascriptLibrary = `const javascriptSendMessageAwaitingResponse=async message=>new Promise(resolve=>{self.onmessage=event=>resolve(event.data),self.postMessage(message)}),getCells=async(x0,y0,x1,y1,sheetName)=>await javascriptSendMessageAwaitingResponse({type:"getCells",x0,y0,x1,y1,sheetName}),getCell=async(x,y,sheetName)=>(await getCells(x,y,x,y,sheetName))?.[0]?.[0],c=getCell,pos=()=>({x:0,y:0}),relCell=async(deltaX,deltaY)=>{const p=pos();return await getCell(deltaX+p.x,deltaY+p.y)},rc=relCell,TAB="  ";class JavascriptConsole{oldConsoleLog;logs=[];constructor(){this.oldConsoleLog=console.log,console.log=this.consoleMap,console.warn=this.consoleMap}log(...args){this.oldConsoleLog(args)}consoleMap=(...args)=>{args=args.map(a=>this.mapArgument(a)),this.logs.push(...args)};reset(){this.logs=[]}push(s){Array.isArray(s)?this.logs.push(...s):this.logs.push(s)}output(){return this.logs.length?this.logs.join("\\n"):null}tab=n=>Array(n).fill(TAB).join("");mapArgument(a,level=0){if(Array.isArray(a)){if(a.length===0)return"Array: []\\n";let s="Array: [\\n";for(let i=0;i<a.length;i++)s+=this.tab(level+1)+i+": "+this.mapArgument(a[i],level+2);return s+this.tab(level)+"]\\n"}else{if(a===null)return"null\\n";if(typeof a=="bigint")return a.toString()+"n\\n";if(a instanceof Date)return a.toString()+"\\n";if(typeof a=="object"){let s="Object: { \\n";for(const key in a)s+=this.tab(level+1)+key+": "+this.mapArgument(a[key],level+1);return s+this.tab(level)+"}\\n"}else return typeof a=="string"?"'"+a+"'\\n":a===void 0?"undefined\\n":a+"\\n"}}}const javascriptConsole=new JavascriptConsole;export{c,getCell,getCells,javascriptConsole,pos,rc,relCell};
`;
export const javascriptLibraryLines = javascriptLibrary.split("\n").length;