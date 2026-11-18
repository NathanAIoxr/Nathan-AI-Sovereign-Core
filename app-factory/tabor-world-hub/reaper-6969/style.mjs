export const css = `
:root{color-scheme:dark;--ink:#efece8;--dim:#b9b6b8;--accent:#ebaa78;--line:#3b3439;--surface:#201b21;--bg:#151216;--mint:#9fc6b5;--display:Georgia,serif}
*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--bg);font:16px/1.58 system-ui,sans-serif}
a{color:var(--accent);text-underline-offset:4px}a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--mint);outline-offset:4px}
.top{border-bottom:1px solid var(--line)}.top-inner,main,footer{width:min(1100px,calc(100% - 40px));margin:auto}
.top-inner{display:flex;gap:24px;align-items:center;justify-content:space-between;padding:18px 0;flex-wrap:wrap}
.brand{font-weight:750;text-decoration:none;color:var(--ink);font-size:.87rem;letter-spacing:.12em}
nav{display:flex;gap:7px 19px;flex-wrap:wrap}nav a{color:var(--dim);font-size:.9rem;text-decoration:none}
nav a[aria-current]{color:var(--accent);text-decoration:underline}
main{padding:36px 0 70px;min-height:68vh}h1,h2,h3{font-family:var(--display);font-weight:normal;line-height:1.13;color:var(--ink)}
h1{font-size:clamp(2.5rem,7.7vw,6.2rem);margin:.16em 0 .25em;letter-spacing:-.045em}h2{font-size:clamp(1.55rem,4vw,2.35rem);margin:1.3em 0 .5em}
h3{font-size:1.5rem;margin:0}.caption{color:var(--muted,var(--dim));font-size:.88rem}
.hero{padding:clamp(18px,6vw,70px) 0 40px;border-bottom:1px solid var(--line)}
.hero p{color:var(--dim);max-width:62ch}.credit{font:600 .78rem system-ui,sans-serif;letter-spacing:.17em;text-transform:uppercase;color:var(--mint)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr));gap:14px;margin:20px 0}
.card{border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:21px}.card p{color:var(--dim)}
.jump{margin:0 0 25px}.jump a{display:inline-block;margin:6px 18px 0 0}
.action,button{display:inline-block;background:var(--accent);color:#241a15;border:0;border-radius:5px;padding:10px 16px;font:700 .9rem system-ui,sans-serif;text-decoration:none;cursor:pointer}
.links{display:flex;gap:10px 18px;flex-wrap:wrap;align-items:center;margin-top:22px}
blockquote{border-left:3px solid var(--accent);padding:10px 18px;margin:23px 0;color:var(--ink);background:var(--surface)}
.table-wrap{overflow-x:auto;margin:15px 0}table{border-collapse:collapse;width:100%;font-size:.94rem}td,th{padding:12px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}th{color:var(--mint)}td:first-child{min-width:135px}.table-wrap td:nth-child(2){min-width:190px}
.fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px;margin:13px 0}
label{display:block;font-size:.84rem;color:var(--dim)}input{width:100%;padding:9px;font:inherit;color:var(--ink);background:var(--bg);border:1px solid #665760;border-radius:4px}
.results{margin-top:18px;border-top:1px solid var(--line);padding-top:10px}.error{color:#ffc9b7}.digest{font-family:monospace;overflow-wrap:anywhere}
footer{border-top:1px solid var(--line);padding:18px 0 35px;color:var(--dim);font-size:.84rem}
@media(max-width:580px){.top-inner,main,footer{width:calc(100% - 30px)}.card{padding:16px}.table-wrap td:nth-child(2){min-width:155px}}
`;
