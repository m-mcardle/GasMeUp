import fs from 'fs';
const SR=44100, DUR=22.4, N=Math.round(SR*DUR);
const L=new Float32Array(N), R=new Float32Array(N);       // dry music
const FL=new Float32Array(N), FR=new Float32Array(N);     // reverb send
const mtof=m=>440*Math.pow(2,(m-69)/12);
const BPM=120, BEAT=60/BPM;
let seed=1; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647*2-1;};
function add(t0,len,fn,gain=1,pan=0,send=0){
  const s0=Math.round(t0*SR), n=Math.round(len*SR);
  const gl=gain*Math.cos((pan+1)*Math.PI/4), gr=gain*Math.sin((pan+1)*Math.PI/4);
  for(let i=0;i<n;i++){const j=s0+i; if(j<0||j>=N)continue; const v=fn(i/SR);
    L[j]+=v*gl; R[j]+=v*gr; if(send){FL[j]+=v*gl*send; FR[j]+=v*gr*send;}}
}
// soft saw via limited harmonics
const saw=(f,t,h=8)=>{let s=0;for(let k=1;k<=h;k++)s+=Math.sin(2*Math.PI*f*k*t)/k;return s*.55;};
const env=(t,a,d,len)=>t<a?t/a:(t<len?1:Math.max(0,1-(t-len)/d));

// chords (F major): F, Dm, Bb, C — one per bar (2s)
const chords=[[53,57,60,65],[50,57,62,65],[46,58,62,65],[48,55,60,64]];
const roots=[41,38,46,36];
const END_DRUMS=18.0, BARS=11;
const outroHit=18.0;
for(let b=0;b<BARS;b++){
  const t0=b*2, c=chords[b%4];
  const isOutro=t0>=outroHit;
  const ch=isOutro?[53,57,60,65,69]:c;
  const len=isOutro?3.0:2.0;
  // pad
  ch.forEach((m,k)=>{const f=mtof(m);
    add(t0,len+1.2,t=>saw(f*(1+.0025*(k%2?1:-1)),t,6)*env(t,.35,1.1,len)*(.9+.1*Math.sin(t*3)),.068,k%2?.35:-.35,.5);
  });
  if(isOutro) break;
}
// final outro chord (sustain until fade)
[53,57,60,65,69,72].forEach((m,k)=>{const f=mtof(m);
  add(outroHit,4.4,t=>saw(f*(1+.003*(k%2?1:-1)),t,7)*env(t,.02,1.6,2.6)*(1+.4*Math.exp(-t*3)),.06,k%2?.4:-.4,.6);});
// bass: offbeat-ish pattern per beat
for(let b=0;b<36;b++){const t0=b*BEAT; if(t0>=outroHit)break; const r=roots[Math.floor(t0/2)%4];
  const f=mtof(r+12);
  add(t0+BEAT/2,BEAT*.48,t=>(Math.sin(2*Math.PI*f*t)+.25*Math.sin(4*Math.PI*f*t))*env(t,.005,.06,BEAT*.35),.22,0,0);
}
add(outroHit,4.2,t=>Math.sin(2*Math.PI*mtof(29)*t)*env(t,.01,2.2,1.5),.3,0,0);
// kick
for(let b=0;b<36;b++){const t0=b*BEAT; if(t0>=END_DRUMS)break;
  add(t0,.35,t=>{const f=45+90*Math.exp(-t*28);return Math.sin(2*Math.PI*f*t+ (1-Math.exp(-t*28))*2)*Math.exp(-t*9);},.42,0,0);}
add(outroHit,.9,t=>{const f=38+70*Math.exp(-t*18);return Math.sin(2*Math.PI*f*t)*Math.exp(-t*3.5);},.6,0,.2);
// hats (offbeats), clap on 2 & 4 from bar 2
let hp=0;
for(let b=0;b<44;b++){const t0=b*BEAT+BEAT/2; if(t0>=20.0)break;
  const g=t0>=outroHit?.03:.05;
  add(t0,.06,t=>{const x=rnd();const y=x-hp;hp=x;return y*Math.exp(-t*70);},g,.25,.1);}
for(let b=4;b<36;b++){ if(b%2===0)continue; const t0=b*BEAT; if(t0>=END_DRUMS)break;
  add(t0,.18,t=>rnd()*Math.exp(-t*22)*(.6+.4*Math.sin(2*Math.PI*1200*t)),.06,-.1,.5);}
// arp plucks in highlights (eighths) 6.5 → 17.5
for(let i=0;;i++){const t0=6.5+i*BEAT/2; if(t0>=17.5)break; const c=chords[Math.floor(t0/2)%4];
  const m=c[[0,2,1,3,2,1,3,2][i%8]]+12; const f=mtof(m);
  add(t0,.5,t=>(Math.sin(2*Math.PI*f*t)+.3*Math.sin(4*Math.PI*f*t))*Math.exp(-t*9),.05,(i%2?.4:-.4),.6);}

// ---------- SFX (in F major, same reverb) ----------
const pluck=(t0,m,g=.12,pan=0)=>{const f=mtof(m);add(t0,.9,t=>(Math.sin(2*Math.PI*f*t)+.35*Math.sin(4*Math.PI*f*t)+.12*Math.sin(6*Math.PI*f*t))*Math.exp(-t*7)*Math.min(1,t/.003),g,pan,.7);};
const tick=(t0,g=.04)=>{const f=mtof(84);add(t0,.05,t=>Math.sin(2*Math.PI*f*t)*Math.exp(-t*90),g,.1,.3);};
const key=(t0)=>{let lp=0;add(t0,.03,t=>{lp+=.5*(rnd()-lp);return lp*Math.exp(-t*160);},.05,.2,.15);};
const whoosh=(t0,len=.55,g=.1,pan=0)=>{let lp=0;add(t0,len,t=>{const x=t/len;const c=.03+.25*Math.sin(Math.PI*x);lp+=c*(rnd()-lp);return lp*Math.sin(Math.PI*x)**2;},g,pan,.5);};
// hook word ticks (soft, in key)
[[.05,72],[.22,72],[.5,76],[.64,76],[.78,77],[1.05,72],[1.15,74],[1.25,76],[1.35,77],[1.45,81]].forEach(([t,m])=>pluck(t,m,.035,.2));
whoosh(2.65,.7,.14,.3);
for(let i=0;i<7;i++)key(3.55+i*.07); for(let i=0;i<5;i++)key(4.72+i*.07);
[3.42,4.35,5.3,10.25,12.1,12.85].forEach(t=>tick(t));
// loading shimmer riser 5.4→7.5
add(5.4,2.1,t=>{const x=t/2.1;const f=mtof(77)*(1+x*.0);return (Math.sin(2*Math.PI*f*t)*.4+Math.sin(2*Math.PI*f*1.5*t)*.3)*Math.sin(2*Math.PI*(4+x*10)*t)**2*x*x;},.06,0,.8);
{let lp=0;add(5.6,1.9,t=>{const x=t/1.9;lp+=(.02+.3*x)*(rnd()-lp);return lp*x*x;},.12,0,.6);}
// cost reveal stab 7.5
[65,69,72,77].forEach((m,k)=>pluck(7.5,m,.08,k%2?.3:-.3));
add(7.5,.6,t=>Math.sin(2*Math.PI*mtof(41)*t)*Math.exp(-t*5),.25,0,.2);
whoosh(10.3,.5,.1,-.2); whoosh(12.15,.45,.07,0); whoosh(14.05,.5,.08,.2); whoosh(14.85,.6,.09,-.3);
// checks
pluck(11.0,81,.1,.3); pluck(11.35,84,.1,.3); pluck(11.7,89,.1,.3);
pluck(13.45,77,.08); pluck(13.45,84,.06);
// notification chime (tri-tone style, in key)
[[15.52,84],[15.64,89],[15.76,93]].forEach(([t,m])=>{const f=mtof(m);add(t,1.4,tt=>(Math.sin(2*Math.PI*f*tt)+.5*Math.sin(2*Math.PI*f*2.01*tt)*Math.exp(-tt*6))*Math.exp(-tt*3.5)*Math.min(1,tt/.004),.09,.15,.7);});
whoosh(17.25,.75,.12,0);
[77,81,84,89].forEach((m,k)=>pluck(18.0,m,.07,k%2?.3:-.3));

// ---------- reverb (Schroeder) on send ----------
function reverb(inp,off){const out=new Float32Array(N);const combs=[1557,1617,1491,1422].map(d=>d+off);
  for(const d of combs){const buf=new Float32Array(d);let k=0,lp=0;for(let i=0;i<N;i++){const y=buf[k];lp=y*.7+lp*.3;buf[k]=inp[i]+lp*.8;out[i]+=y*.25;k=(k+1)%d;}}
  for(const d of [225,556].map(d=>d+off)){const buf=new Float32Array(d);let k=0;for(let i=0;i<N;i++){const b=buf[k];const y=-out[i]*.5+b;buf[k]=out[i]+b*.5;out[i]=y;k=(k+1)%d;}}
  return out;}
const rl=reverb(FL,0), rr=reverb(FR,23);
// mix + gentle fade + soft clip
const out=Buffer.alloc(N*4); let peak=0; const mix=new Float32Array(N*2);
for(let i=0;i<N;i++){const t=i/SR; const fade=t<21.2?1:Math.max(0,1-(t-21.2)/1.0);
  let l=(L[i]+rl[i]*.35)*fade, r=(R[i]+rr[i]*.35)*fade;
  l=Math.tanh(l*1.1); r=Math.tanh(r*1.1); mix[2*i]=l; mix[2*i+1]=r; peak=Math.max(peak,Math.abs(l),Math.abs(r));}
const g=.89/peak;
for(let i=0;i<N*2;i++)out.writeInt16LE(Math.round(mix[i]*g*32767),i*2);
const h=Buffer.alloc(44);h.write('RIFF',0);h.writeUInt32LE(36+out.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(SR,24);h.writeUInt32LE(SR*4,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(out.length,40);
fs.writeFileSync('music.wav',Buffer.concat([h,out]));console.log('peak',peak.toFixed(3));
