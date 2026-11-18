// Ejecutar en Linux. No conecta a Docker ni a una base reales: usa comandos simulados.
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const cp=require('node:child_process');const assert=require('node:assert/strict');
const source=fs.readFileSync(process.argv[2] || path.resolve(__dirname,'../../../scripts/deploy-production.sh'),'utf8');
const sha='a'.repeat(40);
const fakeDocker=`#!/usr/bin/env node
const fs=require('node:fs');const cp=require('node:child_process');const a=process.argv.slice(2);fs.appendFileSync(process.env.NEXOPOS_MOCK_LOG,JSON.stringify(a)+'\\n');
if(a[0]==='inspect'){const f=a[a.indexOf('--format')+1];if(f.includes('State.Running'))console.log('true');else if(f.includes('Labels'))console.log('nexopos-test');else if(f.includes('NetworkSettings.Ports'))console.log(JSON.stringify({'80/tcp':[{HostIp:'127.0.0.1',HostPort:'3000'}]}));else if(f.includes('.Image'))console.log('sha256:previous');process.exit(0)}
if(a[0]==='image')process.exit(0);
if(a[0]==='compose'){
 if(a.includes('config')){console.log(JSON.stringify({services:{api:{environment:{}},web:{ports:[{host_ip:'127.0.0.1',published:'3000',target:80,protocol:'tcp'}]}}}));process.exit(0)}
 if(a.includes('build')&&a.at(-1)==='web'&&process.env.NEXOPOS_CASE==='build-failure')process.exit(1);
 process.exit(0);
}
if(a[0]==='exec'){
 if(a.includes('nexopos_postgres')){console.log('PRIVATE_TEST_DATABASE_DUMP');process.exit(0)}
 const env={...process.env};for(let i=0;i<a.length;i++)if(a[i]==='-e'&&a[i+1].includes('=')){const p=a[i+1].indexOf('=');env[a[i+1].slice(0,p)]=a[i+1].slice(p+1)}
 if(a.includes('-i')){const p=a.indexOf('node');const r=cp.spawnSync(process.execPath,a.slice(p+1),{env,stdio:'inherit'});process.exit(r.status || 0)}
 if(a.includes('nexopos_web')&&process.env.NEXOPOS_CASE==='web-failure')process.exit(1);
 process.exit(0);
}
console.error('Unexpected mock Docker command');process.exit(2);
`;
for(const scenario of ['success','build-failure','web-failure']){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nexopos-deploy-check-'));const app=path.join(dir,'app');const bin=path.join(dir,'bin');fs.mkdirSync(path.join(app,'scripts'),{recursive:true});fs.mkdirSync(bin);
 fs.writeFileSync(path.join(app,'scripts/deploy-production.sh'),source);const log=path.join(dir,'commands.jsonl');
 fs.writeFileSync(path.join(bin,'docker'),fakeDocker,{mode:0o755});fs.writeFileSync(path.join(bin,'git'),'#!/bin/sh\nif [ "$1" = rev-parse ]; then printf "%s\\n" "$NEXOPOS_MOCK_SHA"; fi\n',{mode:0o755});fs.writeFileSync(path.join(bin,'sleep'),'#!/bin/sh\nexit 0\n',{mode:0o755});
 const run=cp.spawnSync('sh',[path.join(app,'scripts/deploy-production.sh'),sha,'b'.repeat(40)],{env:{...process.env,PATH:bin+path.delimiter+process.env.PATH,NEXOPOS_MOCK_LOG:log,NEXOPOS_MOCK_SHA:sha,NEXOPOS_CASE:scenario},encoding:'utf8',timeout:30000});
 const calls=fs.readFileSync(log,'utf8').trim().split('\n').map(JSON.parse);const up=calls.filter(a=>a[0]==='compose'&&a.includes('up'));const rollback=up.filter(a=>a.some(x=>x.endsWith('/rollback.yml')));
 if(scenario==='success'){
  assert.equal(run.status,0,run.stderr);assert(run.stdout.includes('DEPLOYED_SHA='+sha));assert.equal(up.length,2);assert.equal(rollback.length,0);
  const firstUp=calls.findIndex(a=>a[0]==='compose'&&a.includes('up'));const builds=calls.map((a,i)=>({a,i})).filter(x=>x.a[0]==='compose'&&x.a.includes('build'));assert.equal(builds.length,2);assert(builds.every(x=>x.i<firstUp));
  const backups=fs.readdirSync(path.join(dir,'deploy-backups'));const dump=path.join(dir,'deploy-backups',backups[0],'database.dump');assert(fs.statSync(dump).size>0);assert.equal(fs.statSync(dump).mode & 0o077,0);
 }else if(scenario==='build-failure'){assert.notEqual(run.status,0);assert.equal(up.length,0);}
 else{assert.notEqual(run.status,0);assert.equal(rollback.length,1);assert(rollback[0].includes('api')&&rollback[0].includes('web'));}
 console.log('PASS: deployment '+scenario);
}
